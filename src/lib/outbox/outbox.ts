// Transactional outbox for durable job dispatch.
//
// When application state requires a job:
// 1. Write the domain mutation + OutboxEvent in the same DB transaction
// 2. Commit
// 3. Dispatcher reads pending events and dispatches to Inngest
// 4. Marks dispatched (or failed → dead-letter after retries)
//
// This ensures no job is silently lost even if Inngest is unavailable.

import "server-only";
import { db } from "@/lib/db";
import { sendInngestEvent } from "@/server/jobs/client";

export interface OutboxDispatchResult {
  state: "dispatched" | "stored_for_dispatch" | "unavailable" | "failed";
  eventId: string;
  error?: string;
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
      payloadJson: params.payload as any,
      idempotencyKey: params.idempotencyKey,
      state: "pending",
    },
  });
}

/**
 * Dispatch a single outbox event to Inngest.
 * Updates the event state based on the result.
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

  // Mark as dispatching
  await db.outboxEvent.update({
    where: { id: eventId },
    data: {
      state: "dispatching",
      attemptCount: { increment: 1 },
      nextAttemptAt: null,
    },
  });

  try {
    await sendInngestEvent(event.eventType, event.payloadJson as Record<string, unknown>);

    await db.outboxEvent.update({
      where: { id: eventId },
      data: {
        state: "dispatched",
        dispatchedAt: new Date(),
      },
    });

    return { state: "dispatched", eventId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const attemptCount = event.attemptCount + 1;

    if (attemptCount >= event.maxAttempts) {
      // Move to dead letter
      await db.$transaction([
        db.outboxEvent.update({
          where: { id: eventId },
          data: {
            state: "dead_letter",
            lastError: errorMessage,
          },
        }),
        db.deadLetterEvent.create({
          data: {
            organizationId: event.organizationId,
            outboxEventId: eventId,
            eventType: event.eventType,
            payloadJson: event.payloadJson as any,
            errorMessage,
            attemptCount,
          },
        }),
      ]);

      return { state: "failed", eventId, error: errorMessage };
    }

    // Schedule retry with exponential backoff
    const backoffMs = Math.min(1000 * Math.pow(2, attemptCount), 60_000);
    const nextAttemptAt = new Date(Date.now() + backoffMs);

    await db.outboxEvent.update({
      where: { id: eventId },
      data: {
        state: "pending",
        lastError: errorMessage,
        nextAttemptAt,
      },
    });

    return { state: "unavailable", eventId, error: errorMessage };
  }
}

/**
 * Process pending outbox events. Called by the dispatcher route or cron.
 * Returns the number of events processed.
 */
export async function processPendingOutbox(limit = 50): Promise<{
  processed: number;
  dispatched: number;
  failed: number;
  unavailable: number;
}> {
  const pending = await db.outboxEvent.findMany({
    where: {
      state: "pending",
      OR: [
        { nextAttemptAt: null },
        { nextAttemptAt: { lte: new Date() } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let dispatched = 0;
  let failed = 0;
  let unavailable = 0;

  for (const event of pending) {
    const result = await dispatchOutboxEvent(event.id);
    if (result.state === "dispatched") dispatched++;
    else if (result.state === "failed") failed++;
    else if (result.state === "unavailable") unavailable++;
  }

  return {
    processed: pending.length,
    dispatched,
    failed,
    unavailable,
  };
}
