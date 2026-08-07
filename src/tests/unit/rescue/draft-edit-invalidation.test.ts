// WP04 Rescue Core — Draft Edit Invalidation & Safety Re-check Tests
//
// Tests:
//  1. Edit while in draft state → updates message, keeps state
//  2. Edit after approval → invalidates approval, reverts to awaiting_approval
//  3. Edit after dismissal → 409 error
//  4. Safety re-check passes → approval succeeds
//  5. Safety re-check fails → approval returns 409 with failed checks

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock server-only ────────────────────────────────────────
vi.mock("server-only", () => ({}));

// ─── Mock DB with inline factories (hoisted correctly) ──────
vi.mock("@/lib/db", () => ({
  db: {
    intervention: {
      update: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    auditLog: {
      create: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
  },
}));

// ─── Mock audit ──────────────────────────────────────────────
vi.mock("@/lib/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({ id: "audit-1" }),
}));

// ─── Mock auth ───────────────────────────────────────────────
vi.mock("@/lib/auth/whop-auth", () => ({
  requireCompanyAdmin: vi.fn().mockResolvedValue({
    organizationId: "org-1",
    internalUserId: "user-1",
    whopUserId: "whop-user-1",
    companyId: "company-1",
  }),
  authErrorToResponse: vi.fn(),
}));

// ─── Mock rate limiting ──────────────────────────────────────
vi.mock("@/lib/rate-limit/rate-limiter", () => ({
  checkRateLimitOrReject: vi.fn().mockResolvedValue(null),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  RATE_LIMITS: { authSensitive: { id: "test", limit: 20, windowSeconds: 60 } },
  RateLimiter: { buildKey: vi.fn().mockReturnValue("rl-key") },
}));

// ─── Mock Inngest ────────────────────────────────────────────
vi.mock("@/server/jobs/client", () => ({
  getInngestClient: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue([{ id: "evt-1" }]),
  }),
  EVENTS: { deliverIntervention: "deliver/intervention.requested" },
}));

// ─── Mock quiet hours ───────────────────────────────────────
vi.mock("@/lib/eligibility/quiet-hours", () => ({
  isWithinQuietHours: vi.fn().mockReturnValue(false),
  checkQuietHours: vi.fn().mockReturnValue({
    inQuietHours: false,
    quietHoursStart: "20:00",
    quietHoursEnd: "08:00",
    timezone: "America/New_York",
    detail: "Outside quiet hours",
  }),
}));

// ─── Import modules under test (after all mocks) ─────────────
import { PATCH as editHandler } from "@/app/api/companies/[companyId]/queue/[interventionId]/edit/route";
import { performSafetyRecheck } from "@/lib/eligibility/safety-recheck";
import { db } from "@/lib/db";

// ─── Helpers ─────────────────────────────────────────────────

function makeEditRequest(messageContent: string) {
  return new Request("http://localhost/api/companies/c1/queue/iv1/edit", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageContent }),
  });
}

const defaultIntervention = {
  id: "iv-1",
  organizationId: "org-1",
  state: "drafted",
  messagePreview: "Original message",
  messageEdited: null,
  approvedById: null,
  approvedAt: null,
};

// ─── Tests ───────────────────────────────────────────────────

describe("Draft Edit & Approval Invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.intervention.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(defaultIntervention);
    (db.intervention.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      messagePreview: "Updated message",
      messageEdited: new Date().toISOString(),
    });
  });

  it("1. Edit while in draft state → updates message, keeps state as drafted", async () => {
    (db.intervention.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "drafted",
    });
    (db.intervention.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "drafted",
      messagePreview: "Updated message",
      messageEdited: new Date().toISOString(),
    });

    const req = makeEditRequest("Updated message");
    const res = await editHandler(req as any, {
      params: Promise.resolve({ companyId: "c1", interventionId: "iv-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.state).toBe("drafted");
    expect(json.approvalInvalidated).toBe(false);

    // Verify the update was called with the correct data
    const updateFn = db.intervention.update as ReturnType<typeof vi.fn>;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "iv-1" },
        data: expect.objectContaining({
          messagePreview: "Updated message",
        }),
      }),
    );

    // Verify state was NOT changed in the update call (draft stays draft)
    const updateCall = updateFn.mock.calls[0][0];
    expect(updateCall.data.state).toBeUndefined();
  });

  it("2. Edit after approval → invalidates approval, reverts to awaiting_approval", async () => {
    (db.intervention.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "approved",
      approvedById: "user-1",
      approvedAt: new Date("2025-01-01"),
    });
    (db.intervention.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "awaiting_approval",
      messagePreview: "Updated message",
      messageEdited: new Date().toISOString(),
      approvedById: null,
      approvedAt: null,
    });

    const req = makeEditRequest("Updated message");
    const res = await editHandler(req as any, {
      params: Promise.resolve({ companyId: "c1", interventionId: "iv-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.state).toBe("awaiting_approval");
    expect(json.approvalInvalidated).toBe(true);

    // Verify the update was called with approval invalidation
    const updateFn = db.intervention.update as ReturnType<typeof vi.fn>;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "iv-1" },
        data: expect.objectContaining({
          messagePreview: "Updated message",
          state: "awaiting_approval",
          approvedById: null,
          approvedAt: null,
        }),
      }),
    );
  });

  it("3. Edit after dismissal → 409 error", async () => {
    (db.intervention.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "dismissed",
    });

    const req = makeEditRequest("Updated message");
    const res = await editHandler(req as any, {
      params: Promise.resolve({ companyId: "c1", interventionId: "iv-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("cannot be edited");
    expect(json.currentState).toBe("dismissed");

    // Verify no update was performed
    expect(db.intervention.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("3b. Edit after stopped → 409 error", async () => {
    (db.intervention.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "stopped",
    });

    const req = makeEditRequest("Updated message");
    const res = await editHandler(req as any, {
      params: Promise.resolve({ companyId: "c1", interventionId: "iv-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("cannot be edited");
    expect(db.intervention.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("3c. Edit after delivered → 409 error", async () => {
    (db.intervention.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "delivered",
    });

    const req = makeEditRequest("Updated message");
    const res = await editHandler(req as any, {
      params: Promise.resolve({ companyId: "c1", interventionId: "iv-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("cannot be edited");
    expect(db.intervention.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("4. Edit while in awaiting_approval state → updates message, keeps state", async () => {
    (db.intervention.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "awaiting_approval",
    });
    (db.intervention.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...defaultIntervention,
      state: "awaiting_approval",
      messagePreview: "Updated message",
      messageEdited: new Date().toISOString(),
    });

    const req = makeEditRequest("Updated message");
    const res = await editHandler(req as any, {
      params: Promise.resolve({ companyId: "c1", interventionId: "iv-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.state).toBe("awaiting_approval");
    expect(json.approvalInvalidated).toBe(false);
  });
});

describe("Safety Re-check at Approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("4. Safety re-check passes → approval succeeds", async () => {
    // Setup: all checks pass
    (db.organization.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "org-1",
      status: "active",
      isPaused: false,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      timezone: "America/New_York",
    });

    (db.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "camp-1",
      status: "active",
      cooldownDays: 14,
      maxMessagesPerOrg: 100,
      maxMessagesPerStudent: 2,
    });

    (db.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
      suppressions: [],
      memberships: [{ id: "mem-1", status: "active" }],
      interventions: [],
    });

    (db.intervention.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await performSafetyRecheck({
      interventionId: "iv-1",
      organizationId: "org-1",
      studentId: "student-1",
      campaignId: "camp-1",
    });

    expect(result.safe).toBe(true);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("5. Safety re-check fails → approval returns 409 with failed checks", async () => {
    // Setup: org is paused, causing a check failure
    (db.organization.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "org-1",
      status: "active",
      isPaused: true, // PAUSED — should fail
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      timezone: "America/New_York",
    });

    (db.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "camp-1",
      status: "active",
      cooldownDays: 14,
      maxMessagesPerOrg: 100,
      maxMessagesPerStudent: 2,
    });

    (db.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
      suppressions: [],
      memberships: [{ id: "mem-1", status: "active" }],
      interventions: [],
    });

    (db.intervention.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await performSafetyRecheck({
      interventionId: "iv-1",
      organizationId: "org-1",
      studentId: "student-1",
      campaignId: "camp-1",
    });

    expect(result.safe).toBe(false);
    const failedChecks = result.checks.filter((c) => !c.passed);
    expect(failedChecks.length).toBeGreaterThan(0);
    expect(failedChecks.some((c) => c.condition === "organization_not_paused")).toBe(true);
  });

  it("5b. Safety re-check fails with suppressed student", async () => {
    (db.organization.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "org-1",
      status: "active",
      isPaused: false,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      timezone: "America/New_York",
    });

    (db.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "camp-1",
      status: "active",
      cooldownDays: 14,
      maxMessagesPerOrg: 100,
      maxMessagesPerStudent: 2,
    });

    (db.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
      suppressions: [{ id: "sup-1", scope: "organization", reason: "admin_initiated" }],
      memberships: [{ id: "mem-1", status: "active" }],
      interventions: [],
    });

    (db.intervention.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await performSafetyRecheck({
      interventionId: "iv-1",
      organizationId: "org-1",
      studentId: "student-1",
      campaignId: "camp-1",
    });

    expect(result.safe).toBe(false);
    const failedChecks = result.checks.filter((c) => !c.passed);
    expect(failedChecks.some((c) => c.condition === "student_not_suppressed")).toBe(true);
  });

  it("5c. Safety re-check fails with inactive campaign", async () => {
    (db.organization.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "org-1",
      status: "active",
      isPaused: false,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      timezone: "America/New_York",
    });

    (db.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "camp-1",
      status: "paused", // PAUSED campaign
      cooldownDays: 14,
      maxMessagesPerOrg: 100,
      maxMessagesPerStudent: 2,
    });

    (db.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
      suppressions: [],
      memberships: [{ id: "mem-1", status: "active" }],
      interventions: [],
    });

    (db.intervention.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await performSafetyRecheck({
      interventionId: "iv-1",
      organizationId: "org-1",
      studentId: "student-1",
      campaignId: "camp-1",
    });

    expect(result.safe).toBe(false);
    const failedChecks = result.checks.filter((c) => !c.passed);
    expect(failedChecks.some((c) => c.condition === "campaign_active")).toBe(true);
  });

  it("5d. Safety re-check fails with no active membership", async () => {
    (db.organization.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "org-1",
      status: "active",
      isPaused: false,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      timezone: "America/New_York",
    });

    (db.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "camp-1",
      status: "active",
      cooldownDays: 14,
      maxMessagesPerOrg: 100,
      maxMessagesPerStudent: 2,
    });

    (db.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "student-1",
      suppressions: [],
      memberships: [], // No active membership
      interventions: [],
    });

    (db.intervention.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await performSafetyRecheck({
      interventionId: "iv-1",
      organizationId: "org-1",
      studentId: "student-1",
      campaignId: "camp-1",
    });

    expect(result.safe).toBe(false);
    const failedChecks = result.checks.filter((c) => !c.passed);
    expect(failedChecks.some((c) => c.condition === "membership_active")).toBe(true);
  });
});
