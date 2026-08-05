// Transactional outbox for durable job dispatch.
//
// When application state requires a job:
// 1. Write the domain mutation + OutboxEvent in the same DB transaction
// 2. Commit
// 3. Dispatcher reads pending events and dispatches to Inngest
// 4. Marks dispatched (or failed → dead-letter after retries)
//
// This ensures no job is silently lost even if Inngest is unavailable.
//
// Phase 6: The dispatch contract is truthful — only "accepted" from the
// job client transitions the event to "dispatched". Unconfigured and
// failed results keep the event pending or move it to dead-letter.

import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { sendInngestEvent, type JobDispatchResult } from "@/server/jobs/client";

export interface OutboxDispatchResult {
  state: "dispatched" | "stored_for_dispatch" | "unconfigured" | "failed";
  eventId: string;
  error?: string;
}

/** Bounded exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s cap */
function computeBackoffMs(attemptCount: number): number {
  return Math.min(1000 * Math.pow(2, attemptCount), 60_000);
}

/**
 * Create an outbox event within an existing transaction.
 * The caller is responsible for providing the transaction client.
 *
 * Usage:
 *   await db.$transaction(async (tx) => {
 *     await tx.intervention.update(...)
 *     await createOutboxEvent(tx, { ... })
 *   })
 */
export async function createOutboxEvent(
  tx: Parameters<Parameters<typeof db["$transaction"]>[0]>[0],
  params: {
    organizationId: string;
    eventType: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
  },
) {
  return tx.outboxEvent.create({
    data: {
      organizationId: params.organizationId,
      eventType: params.eventType,
      payloadJson: params.payload as Prisma.InputJsonValue,
      idempotencyKey: params.idempotencyKey,
      state: "pending",
    },
  });
}

/**
 * Dispatch a single outbox event to Inngest.
 *
 * Only transitions to "dispatched" when the job client returns
 * { state: "accepted" }. All other outcomes keep the event in a
 * safe, non-dispatched state.
 *
 * - accepted     → mark dispatched, store externalEventId
 * - unconfigured → keep pending, record config failure, do NOT increment
 *                   attemptCount forever, do NOT mark dispatched
 * - failed + retryable → return to pending, set nextAttemptAt, increment attempt
 * - failed + !retryable → move to dead letter (permanent failure)
 */
export async function dispatchOutboxEvent(eventId: string): Promise<OutboxDispatchResult> {
  const event = await db.outboxEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { state: "failed", eventId, error: "Event not found" };
  }

  if (event.state === "dispatched") {
    return { state: "dispatched", eventId };
  }

  // Mark as dispatching optimistically
  await db.outboxEvent.update({
    where: { id: eventId },
    data: {
      state: "dispatching",
      attemptCount: { increment: 1 },
      nextAttemptAt: null,
    },
  });

  let result: JobDispatchResult;
  try {
    result = await sendInngestEvent(event.eventType, event.payloadJson as Record<string, unknown>);
  } catch (error) {
    // Shouldn't happen — sendInngestEvent catches internally — but be safe.
    const errorCode = error instanceof Error ? error.message : "Unknown error";
    result = { state: "failed", retryable: true, errorCode };
  }

  // ─── Truthful state transitions ──────────────────────────────

  if (result.state === "accepted") {
    // The job provider accepted the event. Safe to mark dispatched.
    await db.outboxEvent.update({
      where: { id: eventId },
      data: {
        state: "dispatched",
        dispatchedAt: new Date(),
        externalEventId: result.externalEventId,
      },
    });
    return { state: "dispatched", eventId };
  }

  if (result.state === "unconfigured") {
    // Inngest is not configured. Keep the event pending so it can be
    // dispatched later when configuration is added. Record the failure
    // but do NOT increment attemptCount endlessly (already incremented
    // above, so we decrement back) and do NOT mark dispatched.
    await db.outboxEvent.update({
      where: { id: eventId },
      data: {
        state: "pending",
        lastError: "Inngest not configured — event held for later dispatch",
        attemptCount: { decrement: 1 },
      },
    });
    return { state: "unconfigured", eventId, error: "Inngest not configured" };
  }

  // result.state === "failed"
  const attemptCount = event.attemptCount + 1;

  if (!result.retryable) {
    // Permanent failure (auth, schema, etc.) → dead letter immediately
    await db.$transaction([
      db.outboxEvent.update({
        where: { id: eventId },
        data: {
          state: "dead_letter",
          lastError: result.errorCode,
        },
      }),
      db.deadLetterEvent.create({
        data: {
          organizationId: event.organizationId,
          outboxEventId: eventId,
          eventType: event.eventType,
          payloadJson: event.payloadJson as Prisma.InputJsonValue,
          errorMessage: result.errorCode,
          attemptCount,
        },
      }),
    ]);
    return { state: "failed", eventId, error: result.errorCode };
  }

  // Retryable failure
  if (attemptCount >= event.maxAttempts) {
    // Exhausted retries → dead letter
    await db.$transaction([
      db.outboxEvent.update({
        where: { id: eventId },
        data: {
          state: "dead_letter",
          lastError: result.errorCode,
        },
      }),
      db.deadLetterEvent.create({
        data: {
          organizationId: event.organizationId,
          outboxEventId: eventId,
          eventType: event.eventType,
          payloadJson: event.payloadJson as Prisma.InputJsonValue,
          errorMessage: result.errorCode,
          attemptCount,
        },
      }),
    ]);
    return { state: "failed", eventId, error: result.errorCode };
  }

  // Schedule retry with bounded exponential backoff
  const backoffMs = computeBackoffMs(attemptCount);
  const nextAttemptAt = new Date(Date.now() + backoffMs);

  await db.outboxEvent.update({
    where: { id: eventId },
    data: {
      state: "pending",
      lastError: result.errorCode,
      nextAttemptAt,
    },
  });

  return { state: "unconfigured", eventId, error: result.errorCode };
}

/**
 * Claim pending outbox events atomically for a specific worker.
 *
 * Uses PostgreSQL conditional update to ensure only one worker can
 * claim a given event. Events are claimable when:
 *   - state = pending AND
 *   - (claimedBy is NULL OR leaseExpiresAt < now)
 *   - (nextAttemptAt is NULL OR nextAttemptAt <= now)
 *
 * The claim sets a lease that expires after `leaseDurationMs`.
 */
export async function claimPendingOutboxEvents(
  workerId: string,
  options: {
    limit?: number;
    leaseDurationMs?: number;
  } = {},
): Promise<string[]> {
  const limit = options.limit ?? 50;
  const leaseDurationMs = options.leaseDurationMs ?? 30_000; // 30s default lease
  const now = new Date();
  const leaseExpiresAt = new Date(Date.now() + leaseDurationMs);

  // Atomic conditional update using raw SQL for PostgreSQL.
  // This is the only safe way to claim rows without race conditions.
  //
  // We use a CTE that first selects candidate IDs with FOR UPDATE SKIP LOCKED
  // (PostgreSQL advisory lock per row), then updates them in-place.
  const claimed = await db.$queryRaw<Array<{ id: string }>>`
    WITH candidates AS (
      SELECT id
      FROM outbox_events
      WHERE state = 'pending'
        AND ("claimedBy" IS NULL OR "leaseExpiresAt" < ${now})
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= ${now})
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE outbox_events
    SET "claimedBy"   = ${workerId},
        "claimedAt"   = ${now},
        "leaseExpiresAt" = ${leaseExpiresAt},
        state         = 'dispatching'
    FROM candidates
    WHERE outbox_events.id = candidates.id
    RETURNING outbox_events.id
  `;

  return claimed.map((row) => row.id);
}

/**
 * Release a lease on an event (e.g. after successful dispatch or
 * when giving up). Sets claimedBy/claimedAt/leaseExpiresAt to null.
 */
export async function releaseOutboxEventLease(eventId: string): Promise<void> {
  await db.outboxEvent.update({
    where: { id: eventId },
    data: {
      claimedBy: null,
      claimedAt: null,
      leaseExpiresAt: null,
    },
  });
}

/**
 * Process pending outbox events using atomic claiming.
 * Called by the dispatcher route or cron.
 *
 * Each invocation claims a batch of events exclusively for this
 * worker, dispatches them, and returns results.
 */
export async function processPendingOutbox(
  limit = 50,
  workerId?: string,
): Promise<{
  processed: number;
  dispatched: number;
  failed: number;
  unavailable: number;
}> {
  const wid = workerId ?? `worker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Atomically claim events for this worker
  const claimedIds = await claimPendingOutboxEvents(wid, { limit });

  let dispatched = 0;
  let failed = 0;
  let unavailable = 0;

  for (const eventId of claimedIds) {
    try {
      const result = await dispatchOutboxEvent(eventId);
      if (result.state === "dispatched") dispatched++;
      else if (result.state === "failed") failed++;
      else if (result.state === "unconfigured") unavailable++;
    } finally {
      // Always release the lease after processing
      await releaseOutboxEventLease(eventId);
    }
  }

  return {
    processed: claimedIds.length,
    dispatched,
    failed,
    unavailable,
  };
}
