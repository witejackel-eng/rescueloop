// Concurrency integration tests.
//
// Verifies that concurrent operations produce correct results under
// PostgreSQL's isolation guarantees — no double-claiming, no limit bypass.
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

describe.skipIf(skip)('Concurrency', () => {
  let orgId: string;

  beforeAll(async () => {
    const org = await createTestOrg({ name: 'Concurrency Org' });
    orgId = org.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ── Outbox event claiming ──────────────────────────────────

  it('Two workers claiming same outbox event → only one wins', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'concurrency/claim-test' });

    const now = new Date();
    const leaseExpiresAt = new Date(Date.now() + 30_000);

    const [claimedByA, claimedByB] = await Promise.all([
      db.$queryRaw<Array<{ id: string }>>`
        WITH candidates AS (
          SELECT id
          FROM outbox_events
          WHERE id = ${event.id}
            AND state = 'pending'
            AND ("claimedBy" IS NULL OR "leaseExpiresAt" < ${now})
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE outbox_events
        SET "claimedBy"   = 'worker-A',
            "claimedAt"   = ${now},
            "leaseExpiresAt" = ${leaseExpiresAt},
            state         = 'dispatching'
        FROM candidates
        WHERE outbox_events.id = candidates.id
        RETURNING outbox_events.id
      `,
      db.$queryRaw<Array<{ id: string }>>`
        WITH candidates AS (
          SELECT id
          FROM outbox_events
          WHERE id = ${event.id}
            AND state = 'pending'
            AND ("claimedBy" IS NULL OR "leaseExpiresAt" < ${now})
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE outbox_events
        SET "claimedBy"   = 'worker-B',
            "claimedAt"   = ${now},
            "leaseExpiresAt" = ${leaseExpiresAt},
            state         = 'dispatching'
        FROM candidates
        WHERE outbox_events.id = candidates.id
        RETURNING outbox_events.id
      `,
    ]);

    const totalClaimed = claimedByA.length + claimedByB.length;
    expect(totalClaimed).toBeLessThanOrEqual(1);

    const updated = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(updated!.state).toBe('dispatching');
    expect(['worker-A', 'worker-B']).toContain(updated!.claimedBy);
  });

  it('Claimed event cannot be re-claimed by a different worker before lease expires', async () => {
    const event = await createTestOutboxEvent(orgId, { eventType: 'concurrency/lease-test' });

    const now = new Date();
    const leaseExpiresAt = new Date(Date.now() + 60_000);

    const claimed = await db.$queryRaw<Array<{ id: string }>>`
      WITH candidates AS (
        SELECT id
        FROM outbox_events
        WHERE id = ${event.id}
          AND state = 'pending'
          AND ("claimedBy" IS NULL OR "leaseExpiresAt" < ${now})
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events
      SET "claimedBy"   = 'worker-A',
          "claimedAt"   = ${now},
          "leaseExpiresAt" = ${leaseExpiresAt},
          state         = 'dispatching'
      FROM candidates
      WHERE outbox_events.id = candidates.id
      RETURNING outbox_events.id
    `;
    expect(claimed.length).toBe(1);

    const reClaimed = await db.$queryRaw<Array<{ id: string }>>`
      WITH candidates AS (
        SELECT id
        FROM outbox_events
        WHERE id = ${event.id}
          AND state = 'pending'
          AND ("claimedBy" IS NULL OR "leaseExpiresAt" < ${now})
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events
      SET "claimedBy"   = 'worker-B',
          "claimedAt"   = ${now},
          "leaseExpiresAt" = ${leaseExpiresAt},
          state         = 'dispatching'
      FROM candidates
      WHERE outbox_events.id = candidates.id
      RETURNING outbox_events.id
    `;
    expect(reClaimed.length).toBe(0);

    const result = await db.outboxEvent.findUnique({ where: { id: event.id } });
    expect(result!.claimedBy).toBe('worker-A');
  });

  it('Multiple pending events: each claimed by at most one worker', async () => {
    // Create 5 pending events
    const events = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createTestOutboxEvent(orgId, { eventType: `concurrency/batch-${i}` })
      )
    );

    const now = new Date();
    const leaseExpiresAt = new Date(Date.now() + 30_000);

    // Claim events one by one per worker to avoid array IN() issues with Prisma raw queries.
    // Each worker tries to claim each event individually using SKIP LOCKED.
    // This tests that two concurrent claims on the same event don't both succeed.
    const workerAClaims: string[] = [];
    const workerBClaims: string[] = [];

    for (const event of events) {
      const [aResult, bResult] = await Promise.all([
        db.$queryRaw<Array<{ id: string }>>`
          WITH candidates AS (
            SELECT id
            FROM outbox_events
            WHERE id = ${event.id}
              AND state = 'pending'
              AND ("claimedBy" IS NULL OR "leaseExpiresAt" < ${now})
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          UPDATE outbox_events
          SET "claimedBy"   = 'worker-A',
              "claimedAt"   = ${now},
              "leaseExpiresAt" = ${leaseExpiresAt},
              state         = 'dispatching'
          FROM candidates
          WHERE outbox_events.id = candidates.id
          RETURNING outbox_events.id
        `,
        db.$queryRaw<Array<{ id: string }>>`
          WITH candidates AS (
            SELECT id
            FROM outbox_events
            WHERE id = ${event.id}
              AND state = 'pending'
              AND ("claimedBy" IS NULL OR "leaseExpiresAt" < ${now})
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          UPDATE outbox_events
          SET "claimedBy"   = 'worker-B',
              "claimedAt"   = ${now},
              "leaseExpiresAt" = ${leaseExpiresAt},
              state         = 'dispatching'
          FROM candidates
          WHERE outbox_events.id = candidates.id
          RETURNING outbox_events.id
        `,
      ]);
      workerAClaims.push(...aResult.map((r) => r.id));
      workerBClaims.push(...bResult.map((r) => r.id));
    }

    // No event should be claimed by both workers
    const aIds = new Set(workerAClaims);
    const bIds = new Set(workerBClaims);
    for (const id of aIds) {
      expect(bIds.has(id)).toBe(false);
    }

    // All events should be claimed by someone
    const totalClaimed = workerAClaims.length + workerBClaims.length;
    expect(totalClaimed).toBe(5);
  });

  // ── Plan enforcement with concurrent reservations ──────────

  it('Concurrent plan enforcement: hard limit never exceeded', async () => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await db.subscriptionEntitlement.upsert({
      where: { id: `test-entitlement-${orgId}` },
      create: {
        id: `test-entitlement-${orgId}`,
        organizationId: orgId,
        planTier: 'pilot',
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
      },
      update: {
        planTier: 'pilot',
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
      },
    });

    // Pilot plan: maxCourses = 5
    // Use pg_advisory_xact_lock to serialize the read-check-write cycle,
    // preventing concurrent transactions from exceeding the limit.
    const period = now.toISOString().slice(0, 7);
    const metric = 'courses';
    const limit = 5;

    const attempts = 8;
    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        db.$transaction(async (tx) => {
          // Acquire advisory lock to serialize plan checks
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(12345)`;

          const counter = await tx.usageCounter.findUnique({
            where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
            select: { count: true },
          });
          const currentCount = counter?.count ?? 0;

          if (currentCount >= limit) {
            throw new Error(`Plan limit exceeded: current=${currentCount}, limit=${limit}`);
          }

          await tx.usageCounter.upsert({
            where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
            create: { organizationId: orgId, metric, period, count: 1 },
            update: { count: { increment: 1 } },
          });

          return { success: true, reservedCount: currentCount + 1 };
        })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    expect(succeeded).toBeLessThanOrEqual(limit);
    expect(succeeded + failed).toBe(attempts);

    const finalCounter = await db.usageCounter.findUnique({
      where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
    });
    expect(finalCounter!.count).toBeLessThanOrEqual(limit);
  });

  it('Counter is consistent after concurrent increments', async () => {
    const period = new Date().toISOString().slice(0, 7);
    const metric = 'monitored_members';

    await db.usageCounter.deleteMany({
      where: { organizationId: orgId, metric, period },
    });

    const count = 10;
    await Promise.all(
      Array.from({ length: count }, () =>
        db.usageCounter.upsert({
          where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
          create: { organizationId: orgId, metric, period, count: 1 },
          update: { count: { increment: 1 } },
        })
      )
    );

    const counter = await db.usageCounter.findUnique({
      where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
    });
    expect(counter!.count).toBe(count);
  });

  it('Idempotent usage event: same idempotency key written twice → one event', async () => {
    const period = new Date().toISOString().slice(0, 7);
    const idemKey = `idem-concurrent-${Date.now()}`;

    await db.usageEvent.create({
      data: {
        organizationId: orgId,
        metric: 'interventions_created',
        increment: 1,
        idempotencyKey: idemKey,
      },
    });

    await expect(
      db.usageEvent.create({
        data: {
          organizationId: orgId,
          metric: 'interventions_created',
          increment: 1,
          idempotencyKey: idemKey,
        },
      })
    ).rejects.toThrow();

    const events = await db.usageEvent.findMany({
      where: { organizationId: orgId, idempotencyKey: idemKey },
    });
    expect(events.length).toBe(1);
  });

  it('Usage reservation: release decrements counter back', async () => {
    const period = new Date().toISOString().slice(0, 7);
    const metric = 'exports';
    const idemKey = `reserve-release-${Date.now()}`;

    const reservation = await db.$transaction(async (tx) => {
      await tx.usageCounter.upsert({
        where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
        create: { organizationId: orgId, metric, period, count: 1 },
        update: { count: { increment: 1 } },
      });

      return tx.usageReservation.create({
        data: {
          organizationId: orgId,
          metric,
          period,
          idempotencyKey: idemKey,
          status: 'reserved',
        },
      });
    });

    const before = await db.usageCounter.findUnique({
      where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
    });
    expect(before!.count).toBe(1);

    await db.$transaction(async (tx) => {
      await tx.usageReservation.update({
        where: { id: reservation.id },
        data: { status: 'released' },
      });
      await tx.usageCounter.update({
        where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
        data: { count: { decrement: 1 } },
      });
    });

    const after = await db.usageCounter.findUnique({
      where: { organizationId_metric_period: { organizationId: orgId, metric, period } },
    });
    expect(after!.count).toBe(0);
  });
});
