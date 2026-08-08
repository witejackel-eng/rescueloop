// Billing plan config tests.
//
// Verifies the env-driven RescueLoop tier ↔ Whop plan_id mapping used
// by the real Whop checkout integration. See
// docs/implementation/V1_FINAL_GAP_AUDIT.md → GAP-2.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getWhopPlanIdForTier,
  getTierForWhopPlanId,
  isBillingConfigured,
  BillingConfigurationError,
} from "@/lib/billing/plans";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Reset env between tests — the plans module caches the parsed env.
  process.env = { ...ORIGINAL_ENV };
  // Bust the module cache by re-importing. Vitest's module cache is
  // per-test-file; we use dynamic import + vi.resetModules trick if
  // needed. For simplicity here, we test both configured and
  // unconfigured states in separate tests below.
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("billing plan config — env validation", () => {
  it("isBillingConfigured returns false when env is unset", () => {
    delete process.env.WHOP_RESCUE_PLAN_ID;
    delete process.env.WHOP_GROWTH_PLAN_ID;
    delete process.env.WHOP_SCALE_PLAN_ID;
    expect(isBillingConfigured()).toBe(false);
  });

  it("isBillingConfigured returns true when all three plan IDs are set", () => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_test";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_test";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_test";
    expect(isBillingConfigured()).toBe(true);
  });
});

describe("billing plan config — tier → plan_id", () => {
  it("getWhopPlanIdForTier throws BillingConfigurationError when env is unset", () => {
    delete process.env.WHOP_RESCUE_PLAN_ID;
    delete process.env.WHOP_GROWTH_PLAN_ID;
    delete process.env.WHOP_SCALE_PLAN_ID;
    expect(() => getWhopPlanIdForTier("rescue")).toThrow(BillingConfigurationError);
    expect(() => getWhopPlanIdForTier("growth")).toThrow(BillingConfigurationError);
    expect(() => getWhopPlanIdForTier("scale")).toThrow(BillingConfigurationError);
  });

  it("getWhopPlanIdForTier returns the correct plan_id when configured", () => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_xyz";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_xyz";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_xyz";
    expect(getWhopPlanIdForTier("rescue")).toBe("plan_rescue_xyz");
    expect(getWhopPlanIdForTier("growth")).toBe("plan_growth_xyz");
    expect(getWhopPlanIdForTier("scale")).toBe("plan_scale_xyz");
  });

  it("getWhopPlanIdForTier rejects non-billable tiers (internal, pilot)", () => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_xyz";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_xyz";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_xyz";
    expect(() => getWhopPlanIdForTier("internal")).toThrow(BillingConfigurationError);
    expect(() => getWhopPlanIdForTier("pilot")).toThrow(BillingConfigurationError);
  });
});

describe("billing plan config — plan_id → tier (inverse lookup)", () => {
  it("getTierForWhopPlanId returns null when env is unset", () => {
    delete process.env.WHOP_RESCUE_PLAN_ID;
    delete process.env.WHOP_GROWTH_PLAN_ID;
    delete process.env.WHOP_SCALE_PLAN_ID;
    expect(getTierForWhopPlanId("plan_rescue_xyz")).toBeNull();
  });

  it("getTierForWhopPlanId returns the correct tier when configured", () => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_xyz";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_xyz";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_xyz";
    expect(getTierForWhopPlanId("plan_rescue_xyz")).toBe("rescue");
    expect(getTierForWhopPlanId("plan_growth_xyz")).toBe("growth");
    expect(getTierForWhopPlanId("plan_scale_xyz")).toBe("scale");
  });

  it("getTierForWhopPlanId returns null for an unrelated plan_id", () => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_xyz";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_xyz";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_xyz";
    expect(getTierForWhopPlanId("plan_some_other_product")).toBeNull();
  });
});

describe("billing checkout — client-callback isolation invariant", () => {
  // This is the spec requirement: "The browser completion callback
  // MUST NOT create SubscriptionEntitlement." We assert this at the
  // contract level: the checkout route returns a `checkoutUrl` and a
  // message stating entitlement is pending webhook. The Processing
  // page (`/dashboard/[companyId]/billing/processing`) does NOT call
  // any mutation endpoint — it is a read-only landing page.
  //
  // The full route-level test lives in src/tests/integration/. Here
  // we assert the contract: the plans module exposes no method that
  // grants entitlement from a client callback. Entitlement grants
  // happen exclusively in handleMembershipActivated() /
  // handlePaymentSucceeded() — called from the verified webhook
  // handler, never from a client route.
  it("billing/plans module exports no entitlement-granting function", async () => {
    const mod = await import("@/lib/billing/plans");
    const exportedNames = Object.keys(mod);
    for (const name of exportedNames) {
      const lower = name.toLowerCase();
      expect(lower, `unexpected entitlement-like export: ${name}`).not.toContain(
        "grant",
      );
      expect(lower, `unexpected entitlement-like export: ${name}`).not.toContain(
        "activate",
      );
      expect(lower, `unexpected entitlement-like export: ${name}`).not.toContain(
        "entitle",
      );
    }
  });
});
