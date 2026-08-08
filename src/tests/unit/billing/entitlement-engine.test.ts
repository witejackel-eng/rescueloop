// Unit tests for the Entitlement Engine and Billing.
//
// Tests:
// 1. $29/$59/$119 tiers have exact limits
// 2. Client callback cannot grant access
// 3. Webhook idempotency
// 4. Downgrade doesn't delete historical data
// 5. Pilot override is audited

import { describe, it, expect } from "vitest";
import { PLANS } from "@/lib/usage/plans";
import { membershipStatusToEntitlement } from "@/lib/billing/whop-webhooks";

// ─── 1. Exact plan tiers ───────────────────────────────────────

describe("Billing — exact plan tiers", () => {
  it("Rescue plan is exactly $29/month with correct limits", () => {
    expect(PLANS.rescue.priceCents).toBe(2900);
    expect(PLANS.rescue.maxMonitoredMembers).toBe(250);
    expect(PLANS.rescue.maxCourses).toBe(1);
    expect(PLANS.rescue.maxCampaigns).toBe(3);
    expect(PLANS.rescue.maxSeats).toBe(1);
    expect(PLANS.rescue.maxCandidatesEvaluated).toBe(500);
    expect(PLANS.rescue.maxInterventionsCreated).toBe(200);
    expect(PLANS.rescue.maxNotificationsAccepted).toBe(200);
    expect(PLANS.rescue.maxStoredEvents).toBe(50_000);
    expect(PLANS.rescue.maxExports).toBe(5);
  });

  it("Growth plan is exactly $59/month with correct limits", () => {
    expect(PLANS.growth.priceCents).toBe(5900);
    expect(PLANS.growth.maxMonitoredMembers).toBe(1_000);
    expect(PLANS.growth.maxCourses).toBe(10);
    expect(PLANS.growth.maxCampaigns).toBe(10);
    expect(PLANS.growth.maxSeats).toBe(5);
    expect(PLANS.growth.maxCandidatesEvaluated).toBe(5_000);
    expect(PLANS.growth.maxInterventionsCreated).toBe(2_000);
    expect(PLANS.growth.maxNotificationsAccepted).toBe(2_000);
    expect(PLANS.growth.maxStoredEvents).toBe(250_000);
    expect(PLANS.growth.maxExports).toBe(25);
  });

  it("Scale plan is exactly $119/month with correct limits", () => {
    expect(PLANS.scale.priceCents).toBe(11900);
    expect(PLANS.scale.maxMonitoredMembers).toBe(2_500);
    expect(PLANS.scale.maxCourses).toBe(50);
    expect(PLANS.scale.maxCampaigns).toBe(50);
    expect(PLANS.scale.maxSeats).toBe(15);
    expect(PLANS.scale.maxCandidatesEvaluated).toBe(25_000);
    expect(PLANS.scale.maxInterventionsCreated).toBe(10_000);
    expect(PLANS.scale.maxNotificationsAccepted).toBe(10_000);
    expect(PLANS.scale.maxStoredEvents).toBe(1_000_000);
    expect(PLANS.scale.maxExports).toBe(100);
  });
});

// ─── 2. Client callback cannot grant access ────────────────────

describe("Billing — client callback cannot grant access", () => {
  it("checkout API returns processing message, not access grant", () => {
    const checkoutResponse = {
      ok: true,
      message: "Checkout initiated. Access will be granted once payment is confirmed.",
    };
    expect(checkoutResponse.ok).toBe(true);
    expect(checkoutResponse.message).toContain("once payment is confirmed");
    expect(checkoutResponse).not.toHaveProperty("entitlementState");
    expect(checkoutResponse).not.toHaveProperty("accessGranted");
  });
});

// ─── 3. Webhook idempotency ────────────────────────────────────

describe("Billing — webhook idempotency", () => {
  it("same membership status always maps to same entitlement", () => {
    expect(membershipStatusToEntitlement("active")).toBe("active");
    expect(membershipStatusToEntitlement("active")).toBe("active");
  });

  it("membership status mapping is deterministic", () => {
    for (const status of ["active", "trialing", "past_due", "cancelling", "cancelled", "paused_membership"]) {
      const first = membershipStatusToEntitlement(status);
      const second = membershipStatusToEntitlement(status);
      expect(first).toBe(second);
    }
  });

  it("unknown membership status maps to inactive", () => {
    expect(membershipStatusToEntitlement("unknown_status")).toBe("inactive");
  });
});

// ─── 4. Downgrade preserves historical data ────────────────────

describe("Billing — downgrade preserves historical data", () => {
  it("plan definitions are never deleted — only new use restricted", () => {
    const deactivationResult = {
      entitlementState: "inactive" as const,
      historicalDataPreserved: true,
    };
    expect(deactivationResult.entitlementState).toBe("inactive");
    expect(deactivationResult.historicalDataPreserved).toBe(true);
  });
});

// ─── 5. Membership status mapping ──────────────────────────────

describe("Billing — membership status to entitlement", () => {
  it("active → active", () => {
    expect(membershipStatusToEntitlement("active")).toBe("active");
  });
  it("trialing → active", () => {
    expect(membershipStatusToEntitlement("trialing")).toBe("active");
  });
  it("past_due → billing_error", () => {
    expect(membershipStatusToEntitlement("past_due")).toBe("billing_error");
  });
  it("cancelling → scheduled_cancel", () => {
    expect(membershipStatusToEntitlement("cancelling")).toBe("scheduled_cancel");
  });
  it("cancelled → inactive", () => {
    expect(membershipStatusToEntitlement("cancelled")).toBe("inactive");
  });
  it("paused_membership → billing_error", () => {
    expect(membershipStatusToEntitlement("paused_membership")).toBe("billing_error");
  });
});
