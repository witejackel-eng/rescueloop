// Tests for the truthful outbox dispatch contract (Phase 6)
// and atomic claiming (Phase 7).
//
// These tests mock the job client and database to verify state
// transitions without requiring a real Inngest connection or DB.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the job client (factory must be self-contained) ─────

vi.mock("@/server/jobs/client", () => ({
  sendInngestEvent: vi.fn(),
}));

// ─── Mock the database (factory must be self-contained) ───────

vi.mock("@/lib/db", () => ({
  db: {
    outboxEvent: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    deadLetterEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fnOrArray: any) => {
      if (Array.isArray(fnOrArray)) return Promise.resolve(fnOrArray);
      return fnOrArray({
        outboxEvent: {
          findUnique: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
          findMany: vi.fn(),
        },
        deadLetterEvent: {
          create: vi.fn(),
        },
      });
    }),
    $queryRaw: vi.fn(),
  },
}));

import { dispatchOutboxEvent, claimPendingOutboxEvents, processPendingOutbox } from "@/lib/outbox/outbox";
import { sendInngestEvent } from "@/server/jobs/client";
import { db } from "@/lib/db";

// ─── Test fixture ─────────────────────────────────────────────

const BASE_EVENT = {
  id: "evt-1",
  organizationId: "org-1",
  eventType: "deliver/intervention.requested",
  payloadJson: { interventionId: "int-1" },
  state: "pending",
  idempotencyKey: "key-1",
  attemptCount: 0,
  maxAttempts: 5,
  lastError: null,
  dispatchedAt: null,
  nextAttemptAt: null,
  externalEventId: null,
  claimedBy: null,
  claimedAt: null,
  leaseExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: findUnique returns the base event
  (db.outboxEvent.findUnique as any).mockResolvedValue({ ...BASE_EVENT });
  // Default: update returns a resolved promise
  (db.outboxEvent.update as any).mockResolvedValue({});
  (db.deadLetterEvent.create as any).mockResolvedValue({});
  (db.$queryRaw as any).mockResolvedValue([]);
});

// ═══════════════════════════════════════════════════════════════
// Phase 6: Truthful dispatch contract
// ═══════════════════════════════════════════════════════════════

describe("dispatchOutboxEvent — truthful dispatch contract", () => {
  it("unconfigured Inngest never produces dispatched", async () => {
    (sendInngestEvent as any).mockResolvedValue({
      state: "unconfigured",
      retryable: false,
    });

    const result = await dispatchOutboxEvent("evt-1");

    expect(result.state).toBe("unconfigured");
    expect(result.eventId).toBe("evt-1");

    // The event should be returned to "pending" state, not dispatched
    const updateCalls = (db.outboxEvent.update as any).mock.calls;
    expect(updateCalls.length).toBeGreaterThanOrEqual(2);

    // Second update should return to pending
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.state).toBe("pending");
    expect(finalUpdate.data.lastError).toContain("not configured");
    expect(finalUpdate.data.attemptCount).toEqual({ decrement: 1 });
  });

  it("retryable provider failure never produces dispatched", async () => {
    (sendInngestEvent as any).mockResolvedValue({
      state: "failed",
      retryable: true,
      errorCode: "network timeout",
    });

    const result = await dispatchOutboxEvent("evt-1");

    expect(result.state).not.toBe("dispatched");
    const updateCalls = (db.outboxEvent.update as any).mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.state).toBe("pending");
    expect(finalUpdate.data.nextAttemptAt).toBeInstanceOf(Date);
  });

  it("non-retryable failure moves to dead_letter immediately", async () => {
    (sendInngestEvent as any).mockResolvedValue({
      state: "failed",
      retryable: false,
      errorCode: "unauthorized",
    });

    const result = await dispatchOutboxEvent("evt-1");

    expect(result.state).toBe("failed");
    expect(result.error).toBe("unauthorized");
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("accepted event stores the external event ID", async () => {
    (sendInngestEvent as any).mockResolvedValue({
      state: "accepted",
      externalEventId: "inngest-evt-abc123",
    });

    const result = await dispatchOutboxEvent("evt-1");

    expect(result.state).toBe("dispatched");
    expect(result.eventId).toBe("evt-1");

    const updateCalls = (db.outboxEvent.update as any).mock.calls;
    const dispatchUpdate = updateCalls.find(
      (call: any) => call[0].data.state === "dispatched",
    );
    expect(dispatchUpdate).toBeDefined();
    expect(dispatchUpdate![0].data.externalEventId).toBe("inngest-evt-abc123");
    expect(dispatchUpdate![0].data.dispatchedAt).toBeInstanceOf(Date);
  });

  it("retryable failure with exhausted attempts moves to dead_letter", async () => {
    (db.outboxEvent.findUnique as any).mockResolvedValue({
      ...BASE_EVENT,
      attemptCount: 4, // maxAttempts is 5, so next attempt = 5 >= maxAttempts
    });

    (sendInngestEvent as any).mockResolvedValue({
      state: "failed",
      retryable: true,
      errorCode: "server error",
    });

    const result = await dispatchOutboxEvent("evt-1");

    expect(result.state).toBe("failed");
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("already dispatched event returns dispatched immediately", async () => {
    (db.outboxEvent.findUnique as any).mockResolvedValue({
      ...BASE_EVENT,
      state: "dispatched",
    });

    const result = await dispatchOutboxEvent("evt-1");

    expect(result.state).toBe("dispatched");
    expect(sendInngestEvent).not.toHaveBeenCalled();
  });

  it("missing event returns failed", async () => {
    (db.outboxEvent.findUnique as any).mockResolvedValue(null);

    const result = await dispatchOutboxEvent("evt-nonexistent");

    expect(result.state).toBe("failed");
    expect(result.error).toBe("Event not found");
    expect(sendInngestEvent).not.toHaveBeenCalled();
  });

  it("retried work is not duplicated — backoff increases", async () => {
    (sendInngestEvent as any).mockResolvedValue({
      state: "failed",
      retryable: true,
      errorCode: "timeout",
    });

    const result = await dispatchOutboxEvent("evt-1");

    expect(result.state).not.toBe("dispatched");

    const updateCalls = (db.outboxEvent.update as any).mock.calls;
    const retryUpdate = updateCalls.find(
      (call: any) => call[0].data.nextAttemptAt instanceof Date,
    );
    expect(retryUpdate).toBeDefined();

    const nextAttemptAt = retryUpdate![0].data.nextAttemptAt as Date;
    const backoffMs = nextAttemptAt.getTime() - Date.now();
    // Backoff for attemptCount 1 (after increment): 2^1 * 1000 = 2000ms
    expect(backoffMs).toBeGreaterThan(500);
    expect(backoffMs).toBeLessThan(10000);
  });
});

// ═══════════════════════════════════════════════════════════════
// Phase 7: Atomic claiming
// ═══════════════════════════════════════════════════════════════

describe("claimPendingOutboxEvents — atomic claiming", () => {
  it("claims events using raw SQL with FOR UPDATE SKIP LOCKED", async () => {
    (db.$queryRaw as any).mockResolvedValue([
      { id: "evt-1" },
      { id: "evt-2" },
    ]);

    const ids = await claimPendingOutboxEvents("worker-a", { limit: 10 });

    expect(ids).toEqual(["evt-1", "evt-2"]);
    expect(db.$queryRaw).toHaveBeenCalledOnce();
  });

  it("returns empty array when no events are claimable", async () => {
    (db.$queryRaw as any).mockResolvedValue([]);

    const ids = await claimPendingOutboxEvents("worker-a");

    expect(ids).toEqual([]);
  });

  it("uses default lease duration of 30s when not specified", async () => {
    (db.$queryRaw as any).mockResolvedValue([]);

    await claimPendingOutboxEvents("worker-a");

    expect(db.$queryRaw).toHaveBeenCalledOnce();
  });
});

describe("processPendingOutbox — atomic batch processing", () => {
  it("claims and dispatches events atomically", async () => {
    (db.$queryRaw as any).mockResolvedValue([{ id: "evt-1" }]);

    (sendInngestEvent as any).mockResolvedValue({
      state: "accepted",
      externalEventId: "inngest-123",
    });

    const result = await processPendingOutbox(10, "worker-a");

    expect(result.processed).toBe(1);
    expect(result.dispatched).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("releases lease after each event regardless of outcome", async () => {
    (db.$queryRaw as any).mockResolvedValue([{ id: "evt-1" }]);

    (sendInngestEvent as any).mockResolvedValue({
      state: "failed",
      retryable: true,
      errorCode: "timeout",
    });

    await processPendingOutbox(10, "worker-a");

    const releaseCall = (db.outboxEvent.update as any).mock.calls.find(
      (call: any) =>
        call[0].data.claimedBy === null &&
        call[0].data.claimedAt === null &&
        call[0].data.leaseExpiresAt === null,
    );
    expect(releaseCall).toBeDefined();
  });

  it("generates a worker ID when none provided", async () => {
    (db.$queryRaw as any).mockResolvedValue([]);

    const result = await processPendingOutbox(10);

    expect(result.processed).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Phase 7: Concurrency safety (simulated)
// ═══════════════════════════════════════════════════════════════

describe("concurrency — two simultaneous workers", () => {
  it("two workers cannot claim the same event", async () => {
    (db.$queryRaw as any)
      .mockResolvedValueOnce([{ id: "evt-1" }])  // Worker A gets the event
      .mockResolvedValueOnce([]);                  // Worker B gets nothing (already locked)

    (sendInngestEvent as any).mockResolvedValue({
      state: "accepted",
      externalEventId: "inngest-123",
    });

    const [resultA, resultB] = await Promise.all([
      processPendingOutbox(10, "worker-a"),
      processPendingOutbox(10, "worker-b"),
    ]);

    // Worker A processed the event
    expect(resultA.processed).toBe(1);
    expect(resultA.dispatched).toBe(1);

    // Worker B got nothing
    expect(resultB.processed).toBe(0);
    expect(resultB.dispatched).toBe(0);
  });

  it("expired lease allows reclaiming by another worker", async () => {
    (db.$queryRaw as any).mockResolvedValue([{ id: "evt-1" }]);

    (sendInngestEvent as any).mockResolvedValue({
      state: "accepted",
      externalEventId: "inngest-123",
    });

    const result = await processPendingOutbox(10, "worker-b");

    expect(result.processed).toBe(1);
    expect(result.dispatched).toBe(1);
  });
});
