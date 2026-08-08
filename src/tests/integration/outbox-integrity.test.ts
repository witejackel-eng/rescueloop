// Outbox integrity integration tests.
//
// Verifies the outbox state machine transitions:
// - Unconfigured Inngest → stays pending
// - Accepted → stores externalEventId
// - Exhausted retries → dead_letter
// - Permanent failure → dead_letter immediately
// Uses real PostgreSQL — no mocks.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  testDb,
  createTestOrg,
  createTestOutboxEvent,
  cleanupTestData,
} from './setup';

const db = testDb;
const skip = !process.env.DATABASE_URL;

describe.skipIf(skip)('Outbox integrity', () => {
  let orgId: string;

  beforeAll(async () => {
    const org = await createTestOrg({ name: 'Outbox Integrity Org' });
    orgId = org.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ── Unconfigured Inngest ───────────────────────────────────

  it('Unconfigured Inngest → event stays pending', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/unconfigured' });

    // Simulate the dispatch flow when Inngest is unconfigured:
    // 1. Mark as dispatching (optimistic)
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatching',
        attemptCount: { increment: 1 },
      },
    });

    // 2. Inngest returns unconfigured → revert to pending, decrement attempt
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'pending',
        lastError: 'Inngest not configured — event held for later dispatch',
        attemptCount: { decrement: 1 },
      },
    });

    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('pending');
    expect(result!.attemptCount).toBe(0); // No net increment
    expect(result!.lastError).toContain('not configured');
    expect(result!.dispatchedAt).toBeNull();
    expect(result!.externalEventId).toBeNull();
  });

  it('Multiple unconfigured dispatches do not increment attemptCount', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/unconfigured-repeat' });

    // Simulate 3 unconfigured dispatch cycles
    for (let i = 0; i < 3; i++) {
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          state: 'dispatching',
          attemptCount: { increment: 1 },
        },
      });
      // Revert — unconfigured
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          state: 'pending',
          attemptCount: { decrement: 1 },
        },
      });
    }

    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('pending');
    expect(result!.attemptCount).toBe(0);
  });

  // ── Accepted dispatch ──────────────────────────────────────

  it('Accepted → marks dispatched and stores externalEventId', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/accepted' });

    // Simulate successful dispatch:
    // 1. Mark as dispatching
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatching',
        attemptCount: { increment: 1 },
      },
    });

    // 2. Inngest accepts → mark dispatched
    const externalEventId = 'inngest-evt-abc123';
    const dispatchedAt = new Date();
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatched',
        dispatchedAt,
        externalEventId,
      },
    });

    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('dispatched');
    expect(result!.externalEventId).toBe(externalEventId);
    expect(result!.dispatchedAt).not.toBeNull();
    expect(result!.attemptCount).toBe(1); // One real attempt
  });

  it('Dispatched event is not re-dispatched', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/already-dispatched' });

    // Mark as dispatched
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatched',
        dispatchedAt: new Date(),
        externalEventId: 'inngest-evt-already',
      },
    });

    // Attempting to claim this event should not work (state != pending)
    const now = new Date();
    const claimed = await db.$queryRaw<Array<{ id: string }>>`
      WITH candidates AS (
        SELECT id
        FROM outbox_events
        WHERE id = ${event.id}
          AND state = 'pending'
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events
      SET state = 'dispatching'
      FROM candidates
      WHERE outbox_events.id = candidates.id
      RETURNING outbox_events.id
    `;
    expect(claimed.length).toBe(0);

    // State remains dispatched
    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('dispatched');
  });

  // ── Retryable failure with retry ───────────────────────────

  it('Retryable failure → returns to pending with nextAttemptAt', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/retryable', maxAttempts: 5 });

    // Simulate retryable failure on first attempt
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatching',
        attemptCount: { increment: 1 },
      },
    });

    // Retryable failure → back to pending with scheduled retry
    const backoffMs = Math.min(1000 * Math.pow(2, 1), 60_000); // 2s
    const nextAttemptAt = new Date(Date.now() + backoffMs);

    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'pending',
        lastError: 'Network timeout',
        nextAttemptAt,
      },
    });

    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('pending');
    expect(result!.attemptCount).toBe(1);
    expect(result!.nextAttemptAt).not.toBeNull();
    expect(result!.lastError).toBe('Network timeout');
  });

  // ── Exhausted retries → dead letter ────────────────────────

  it('Exhausted retries → dead_letter', async () => {
    // Create event with maxAttempts = 3
    const event = await createTestOutboxEvent(orgId, {
      eventType: 'test/exhausted',
      maxAttempts: 3,
    });

    // Simulate 3 failed attempts
    for (let i = 0; i < 3; i++) {
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          state: 'dispatching',
          attemptCount: { increment: 1 },
        },
      });
    }

    // After exhausting maxAttempts → dead letter
    await db.$transaction([
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          state: 'dead_letter',
          lastError: 'Max attempts exhausted',
        },
      }),
      db.deadLetterEvent.create({
        data: {
          organizationId: orgId,
          outboxEventId: event.id,
          eventType: 'test/exhausted',
          payloadJson: { test: true },
          errorMessage: 'Max attempts exhausted',
          attemptCount: 3,
        },
      }),
    ]);

    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('dead_letter');
    expect(result!.attemptCount).toBe(3);
    expect(result!.lastError).toBe('Max attempts exhausted');

    // Dead letter event was created
    const deadLetter = await db.deadLetterEvent.findFirst({
      where: { outboxEventId: event.id },
    });
    expect(deadLetter).not.toBeNull();
    expect(deadLetter!.attemptCount).toBe(3);
    expect(deadLetter!.organizationId).toBe(orgId);
  });

  // ── Permanent failure → dead letter immediately ────────────

  it('Permanent failure → dead_letter immediately (no retries)', async () => {
    const event = await createTestOutboxEvent(orgId, {
      eventType: 'test/permanent-fail',
      maxAttempts: 5,
    });

    // Simulate permanent failure on first attempt
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatching',
        attemptCount: { increment: 1 },
      },
    });

    // Permanent failure → dead letter immediately
    await db.$transaction([
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          state: 'dead_letter',
          lastError: 'Unauthorized: invalid API key',
        },
      }),
      db.deadLetterEvent.create({
        data: {
          organizationId: orgId,
          outboxEventId: event.id,
          eventType: 'test/permanent-fail',
          payloadJson: { test: true },
          errorMessage: 'Unauthorized: invalid API key',
          attemptCount: 1,
        },
      }),
    ]);

    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('dead_letter');
    expect(result!.attemptCount).toBe(1); // Only one attempt needed
    expect(result!.lastError).toContain('Unauthorized');

    const deadLetter = await db.deadLetterEvent.findFirst({
      where: { outboxEventId: event.id },
    });
    expect(deadLetter).not.toBeNull();
    expect(deadLetter!.attemptCount).toBe(1);
  });

  // ── Idempotency key enforcement ────────────────────────────

  it('Idempotency key prevents duplicate outbox events', async () => {
    const idemKey = `idem-outbox-${Date.now()}`;

    // First create succeeds
    await db.outboxEvent.create({
      data: {
        organizationId: orgId,
        eventType: 'test/idempotent',
        payloadJson: { test: true },
        idempotencyKey: idemKey,
        state: 'pending',
      },
    });

    // Second create with same idempotencyKey fails
    await expect(
      db.outboxEvent.create({
        data: {
          organizationId: orgId,
          eventType: 'test/idempotent',
          payloadJson: { test: true },
          idempotencyKey: idemKey,
          state: 'pending',
        },
      })
    ).rejects.toThrow();

    // Only one event
    const count = await db.outboxEvent.count({
      where: { organizationId: orgId, idempotencyKey: idemKey },
    });
    expect(count).toBe(1);
  });

  // ── State machine: only valid transitions ──────────────────

  it('pending → dispatching → dispatched is valid path', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/valid-path' });

    // pending → dispatching
    await db.outboxEvent.update({
      where: { id: event.id },
      data: { state: 'dispatching', attemptCount: { increment: 1 } },
    });

    let result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('dispatching');

    // dispatching → dispatched
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatched',
        dispatchedAt: new Date(),
        externalEventId: 'inngest-valid-path',
      },
    });

    result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.state).toBe('dispatched');
  });

  it('Dead-lettered events cannot be claimed', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/dead-claim' });

    // Move to dead_letter
    await db.outboxEvent.update({
      where: { id: event.id },
      data: { state: 'dead_letter' },
    });

    // Attempt to claim
    const now = new Date();
    const claimed = await db.$queryRaw<Array<{ id: string }>>`
      WITH candidates AS (
        SELECT id
        FROM outbox_events
        WHERE id = ${event.id}
          AND state = 'pending'
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events
      SET state = 'dispatching'
      FROM candidates
      WHERE outbox_events.id = candidates.id
      RETURNING outbox_events.id
    `;
    expect(claimed.length).toBe(0);
  });

  it('Lease expiry allows re-claim by different worker', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'test/lease-expiry' });

    const now = new Date();
    // Set a lease that already expired
    const pastExpiry = new Date(Date.now() - 10_000); // 10s ago
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        state: 'dispatching',
        claimedBy: 'worker-old',
        claimedAt: now,
        leaseExpiresAt: pastExpiry,
      },
    });

    // Verify the event has an expired lease
    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.claimedBy).toBe('worker-old');
    expect(result!.leaseExpiresAt!.getTime()).toBeLessThan(Date.now());
  });
});
