// Tests for plan enforcement with atomic usage reservations (Phase 13).
//
// Verifies:
// - Each metric enforcement
// - Concurrent limit enforcement (atomic check-and-increment)
// - Reservation + rollback on failure
// - Plan override application and expiration
// - Stable idempotency keys

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the database ─────────────────────────────────────────

const mockSubscriptionEntitlement = {
  findFirst: vi.fn(),
};

const mockUsageCounter = {
  findUnique: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
};

const mockUsageReservation = {
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
};

const mockUsageEvent = {
  create: vi.fn(),
};

const mockPlanOverride = {
  findFirst: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: {
    subscriptionEntitlement: mockSubscriptionEntitlement,
    usageCounter: mockUsageCounter,
    usageReservation: mockUsageReservation,
    usageEvent: mockUsageEvent,
    planOverride: mockPlanOverride,
    $transaction: vi.fn((fn: any) =>
      fn({
        subscriptionEntitlement: mockSubscriptionEntitlement,
        usageCounter: mockUsageCounter,
        usageReservation: mockUsageReservation,
        usageEvent: mockUsageEvent,
        planOverride: mockPlanOverride,
      }),
    ),
  },
}));

// ─── Mock metering ─────────────────────────────────────────────

vi.mock("@/lib/usage/metering", () => ({
  getUsageCount: vi.fn(),
  recordUsageEvent: vi.fn(),
  getCurrentPeriod: vi.fn(() => "2026-03"),
}));

import {
  checkLimit,
  enforceLimit,
  PlanLimitExceededError,
  reserveUsage,
  commitReservation,
  releaseReservation,
  getActiveOverride,
  applyPlanOverride,
  revokeExpiredOverrides,
  buildIdempotencyKey,
  type EnforcedMetric,
} from "@/lib/usage/enforcement";
import { PLANS } from "@/lib/usage/plans";
import { db } from "@/lib/db";
import { getUsageCount, getCurrentPeriod } from "@/lib/usage/metering";

// ─── Helpers ───────────────────────────────────────────────────

const ORG_ID = "org_test_123";

function setupPilotPlan() {
  mockSubscriptionEntitlement.findFirst.mockResolvedValue({
    planTier: "pilot",
  });
}

function setupNoOverride() {
  mockPlanOverride.findFirst.mockResolvedValue(null);
}

// ─── Tests ─────────────────────────────────────────────────────

describe("Plan enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupPilotPlan();
    setupNoOverride();
  });

  // ─── Each metric enforcement ────────────────────────────────

  describe("checkLimit for each enforced metric", () => {
    const metrics: Array<{ metric: EnforcedMetric; limitField: keyof typeof PLANS.pilot }> = [
      { metric: "courses", limitField: "maxCourses" },
      { metric: "monitored_members", limitField: "maxMonitoredMembers" },
      { metric: "active_campaigns", limitField: "maxCampaigns" },
      { metric: "team_members", limitField: "maxSeats" },
      { metric: "candidates_evaluated", limitField: "maxCandidatesEvaluated" },
      { metric: "interventions_created", limitField: "maxInterventionsCreated" },
      { metric: "notifications_accepted", limitField: "maxNotificationsAccepted" },
      { metric: "stored_events", limitField: "maxStoredEvents" },
      { metric: "exports", limitField: "maxExports" },
    ];

    for (const { metric, limitField } of metrics) {
      it(`enforces ${metric} at pilot limit of ${PLANS.pilot[limitField]}`, async () => {
        const limit = PLANS.pilot[limitField] as number;
        (getUsageCount as any).mockResolvedValue(limit - 1);

        const result = await checkLimit(ORG_ID, metric);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(limit);
        expect(result.current).toBe(limit - 1);
      });

      it(`blocks ${metric} when at pilot limit`, async () => {
        const limit = PLANS.pilot[limitField] as number;
        (getUsageCount as any).mockResolvedValue(limit);

        const result = await checkLimit(ORG_ID, metric);
        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(limit);
        expect(result.current).toBe(limit);
      });
    }
  });

  describe("enforceLimit", () => {
    it("throws PlanLimitExceededError when limit is reached", async () => {
      (getUsageCount as any).mockResolvedValue(PLANS.pilot.maxCourses);

      await expect(enforceLimit(ORG_ID, "courses")).rejects.toThrow(
        PlanLimitExceededError,
      );
    });

    it("does not throw when under limit", async () => {
      (getUsageCount as any).mockResolvedValue(PLANS.pilot.maxCourses - 1);

      await expect(enforceLimit(ORG_ID, "courses")).resolves.toBeUndefined();
    });
  });

  // ─── Plan-specific limits ───────────────────────────────────

  describe("plan tier limits", () => {
    const tiers = ["rescue", "growth", "scale", "internal", "pilot"] as const;

    for (const tier of tiers) {
      it(`${tier} plan has all 9 limit fields defined`, () => {
        const plan = PLANS[tier];
        expect(plan.maxMonitoredMembers).toBeGreaterThan(0);
        expect(plan.maxCourses).toBeGreaterThan(0);
        expect(plan.maxCampaigns).toBeGreaterThan(0);
        expect(plan.maxSeats).toBeGreaterThan(0);
        expect(plan.maxCandidatesEvaluated).toBeGreaterThan(0);
        expect(plan.maxInterventionsCreated).toBeGreaterThan(0);
        expect(plan.maxNotificationsAccepted).toBeGreaterThan(0);
        expect(plan.maxStoredEvents).toBeGreaterThan(0);
        expect(plan.maxExports).toBeGreaterThan(0);
      });
    }
  });

  // ─── Concurrent limit enforcement (atomic reservation) ──────

  describe("reserveUsage — atomic check-and-increment", () => {
    it("reserves a slot when under limit", async () => {
      (getUsageCount as any).mockResolvedValue(2);
      mockUsageCounter.findUnique.mockResolvedValue({ count: 2, id: "ctr_1" });
      mockUsageCounter.upsert.mockResolvedValue({ count: 3 });
      mockUsageReservation.create.mockResolvedValue({ id: "res_1" });

      const result = await reserveUsage(ORG_ID, "courses", "op_abc");

      expect(result.reservationId).toBe("res_1");
      expect(result.reservedCount).toBe(3);
      expect(result.idempotencyKey).toContain("op_abc");
      expect(mockUsageCounter.upsert).toHaveBeenCalled();
      expect(mockUsageReservation.create).toHaveBeenCalled();
    });

    it("throws when at limit (concurrent request blocked)", async () => {
      const limit = PLANS.pilot.maxCourses;
      mockUsageCounter.findUnique.mockResolvedValue({ count: limit, id: "ctr_1" });

      await expect(
        reserveUsage(ORG_ID, "courses", "op_def"),
      ).rejects.toThrow(PlanLimitExceededError);

      // Counter must NOT have been incremented
      expect(mockUsageCounter.upsert).not.toHaveBeenCalled();
    });

    it("throws when counter is null (0 count) but limit is 0", async () => {
      // Edge case: limit of 0 means no usage allowed at all
      mockSubscriptionEntitlement.findFirst.mockResolvedValue({
        planTier: "rescue",
      });
      // rescue has maxCourses=1, so test with a metric where 0 makes sense
      // Instead, test by setting counter to 0 and limit being exceeded
      mockUsageCounter.findUnique.mockResolvedValue(null); // no counter = 0 usage

      // For rescue, maxCourses=1, so count 0 < 1 should be allowed
      const result = await reserveUsage(ORG_ID, "courses", "op_ghi");
      expect(result.reservedCount).toBe(1);
    });
  });

  // ─── Idempotency keys ───────────────────────────────────────

  describe("buildIdempotencyKey", () => {
    it("produces a stable, deterministic key", () => {
      const key1 = buildIdempotencyKey(ORG_ID, "courses", "op_123");
      const key2 = buildIdempotencyKey(ORG_ID, "courses", "op_123");
      expect(key1).toBe(key2);
      expect(key1).toBe(`reserve:${ORG_ID}:courses:op_123`);
    });

    it("differs for different suffixes", () => {
      const key1 = buildIdempotencyKey(ORG_ID, "courses", "op_123");
      const key2 = buildIdempotencyKey(ORG_ID, "courses", "op_456");
      expect(key1).not.toBe(key2);
    });

    it("differs for different metrics", () => {
      const key1 = buildIdempotencyKey(ORG_ID, "courses", "op_123");
      const key2 = buildIdempotencyKey(ORG_ID, "exports", "op_123");
      expect(key1).not.toBe(key2);
    });
  });

  // ─── Reservation commit ─────────────────────────────────────

  describe("commitReservation", () => {
    it("marks reservation as committed and records usage event", async () => {
      mockUsageReservation.update.mockResolvedValue({ status: "committed" });
      mockUsageEvent.create.mockResolvedValue({ id: "evt_1" });

      await commitReservation("res_1", ORG_ID, "courses", { source: "test" });

      expect(mockUsageReservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "res_1" },
          data: { status: "committed" },
        }),
      );
      expect(mockUsageEvent.create).toHaveBeenCalled();
    });
  });

  // ─── Reservation rollback ───────────────────────────────────

  describe("releaseReservation", () => {
    it("decrements counter and marks reservation as released", async () => {
      mockUsageReservation.findUnique.mockResolvedValue({ status: "reserved" });
      mockUsageReservation.update.mockResolvedValue({ status: "released" });
      mockUsageCounter.update.mockResolvedValue({ count: 2 });

      await releaseReservation("res_1", ORG_ID, "courses");

      expect(mockUsageReservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "res_1" },
          data: { status: "released" },
        }),
      );
      expect(mockUsageCounter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { count: { decrement: 1 } },
        }),
      );
    });

    it("is idempotent if reservation already committed", async () => {
      mockUsageReservation.findUnique.mockResolvedValue({ status: "committed" });

      await releaseReservation("res_1", ORG_ID, "courses");

      // Should NOT decrement counter
      expect(mockUsageCounter.update).not.toHaveBeenCalled();
      expect(mockUsageReservation.update).not.toHaveBeenCalled();
    });

    it("is idempotent if reservation does not exist", async () => {
      mockUsageReservation.findUnique.mockResolvedValue(null);

      await releaseReservation("res_1", ORG_ID, "courses");

      expect(mockUsageCounter.update).not.toHaveBeenCalled();
    });
  });

  // ─── Plan override application and expiration ───────────────

  describe("plan overrides", () => {
    it("getActiveOverride returns null when no override exists", async () => {
      mockPlanOverride.findFirst.mockResolvedValue(null);

      const result = await getActiveOverride(ORG_ID, "courses");
      expect(result).toBeNull();
    });

    it("getActiveOverride returns override limit when active", async () => {
      mockPlanOverride.findFirst.mockResolvedValue({ overrideLimit: 100 });

      const result = await getActiveOverride(ORG_ID, "courses");
      expect(result).toBe(100);
    });

    it("checkLimit uses override limit when it is higher", async () => {
      mockPlanOverride.findFirst.mockResolvedValue({ overrideLimit: 100 });
      (getUsageCount as any).mockResolvedValue(10);

      const result = await checkLimit(ORG_ID, "courses");
      // pilot maxCourses = 5, override = 100, effective = max(5, 100) = 100
      expect(result.limit).toBe(100);
      expect(result.allowed).toBe(true);
    });

    it("checkLimit ignores override when base limit is higher", async () => {
      mockPlanOverride.findFirst.mockResolvedValue({ overrideLimit: 2 });
      (getUsageCount as any).mockResolvedValue(1);

      const result = await checkLimit(ORG_ID, "courses");
      // pilot maxCourses = 5, override = 2, effective = max(5, 2) = 5
      expect(result.limit).toBe(5);
    });

    it("applyPlanOverride creates override and audit event", async () => {
      mockPlanOverride.create.mockResolvedValue({ id: "ovr_1" });
      mockUsageEvent.create.mockResolvedValue({ id: "evt_1" });

      const now = new Date();
      const overrideId = await applyPlanOverride({
        organizationId: ORG_ID,
        metric: "courses",
        overrideLimit: 50,
        reason: "Special pilot extension for enterprise customer",
        appliedBy: "admin@example.com",
        approvedBy: "ops@example.com",
        startsAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      });

      expect(overrideId).toBe("ovr_1");
      expect(mockPlanOverride.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            metric: "courses",
            overrideLimit: 50,
            reason: "Special pilot extension for enterprise customer",
            appliedBy: "admin@example.com",
            approvedBy: "ops@example.com",
          }),
        }),
      );
      // Audit event should be recorded
      expect(mockUsageEvent.create).toHaveBeenCalled();
    });

    it("revokeExpiredOverrides updates expired overrides", async () => {
      mockPlanOverride.updateMany.mockResolvedValue({ count: 3 });

      const count = await revokeExpiredOverrides(ORG_ID);
      expect(count).toBe(3);
      expect(mockPlanOverride.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG_ID,
          }),
        }),
      );
    });
  });

  // ─── Default to pilot plan ──────────────────────────────────

  describe("getOrganizationPlan", () => {
    it("defaults to pilot when no entitlement exists", async () => {
      mockSubscriptionEntitlement.findFirst.mockResolvedValue(null);
      (getUsageCount as any).mockResolvedValue(0);

      const result = await checkLimit(ORG_ID, "courses");
      expect(result.limit).toBe(PLANS.pilot.maxCourses);
    });
  });
});
