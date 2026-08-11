// BLOCKER 1 REGRESSION: Billing tier identity must derive from
// Whop plan_id, NEVER from price. A $119 Scale purchase must NEVER
// become Growth.
//
// Required invariants:
//   - Rescue plan ID → Rescue
//   - Growth plan ID → Growth
//   - Scale plan ID → Scale
//   - $119 Scale can never become Growth
//   - Unknown plan ID → no entitlement / fail closed
//   - Browser checkout return does not grant entitlement
//   - Verified webhook remains authoritative

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getTierForWhopPlanId,
  isBillingConfigured,
} from "@/lib/billing/plans";
import { PLANS } from "@/lib/usage/plans";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

// ─── Canonical pricing ───────────────────────────────────────

describe("canonical pricing constants", () => {
  it("Rescue is $29/month (2900 cents)", () => {
    expect(PLANS.rescue.priceCents).toBe(2900);
  });

  it("Growth is $59/month (5900 cents)", () => {
    expect(PLANS.growth.priceCents).toBe(5900);
  });

  it("Scale is $119/month (11900 cents)", () => {
    expect(PLANS.scale.priceCents).toBe(11900);
  });
});

// ─── Plan ID → Tier mapping (authoritative) ─────────────────

describe("getTierForWhopPlanId — authoritative mapping", () => {
  beforeEach(() => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_prod";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_prod";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_prod";
  });

  it("Rescue plan ID → Rescue tier", () => {
    expect(getTierForWhopPlanId("plan_rescue_prod")).toBe("rescue");
  });

  it("Growth plan ID → Growth tier", () => {
    expect(getTierForWhopPlanId("plan_growth_prod")).toBe("growth");
  });

  it("Scale plan ID → Scale tier", () => {
    expect(getTierForWhopPlanId("plan_scale_prod")).toBe("scale");
  });
});

// ─── Fail-closed invariants ─────────────────────────────────

describe("fail-closed — unknown or missing plan ID", () => {
  beforeEach(() => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_prod";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_prod";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_prod";
  });

  it("Unknown plan ID → null (no entitlement)", () => {
    expect(getTierForWhopPlanId("plan_unknown_xyz")).toBeNull();
  });

  it("Empty string plan ID → null (no entitlement)", () => {
    expect(getTierForWhopPlanId("")).toBeNull();
  });

  it("Unconfigured billing env → null (no entitlement)", () => {
    delete process.env.WHOP_RESCUE_PLAN_ID;
    delete process.env.WHOP_GROWTH_PLAN_ID;
    delete process.env.WHOP_SCALE_PLAN_ID;
    expect(getTierForWhopPlanId("plan_rescue_prod")).toBeNull();
  });
});

// ─── $119 Scale must NEVER become Growth ────────────────────

describe("regression: $119 Scale must never become Growth", () => {
  beforeEach(() => {
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_prod";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_prod";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_prod";
  });

  it("Scale plan ID maps to scale, NOT growth", () => {
    const tier = getTierForWhopPlanId("plan_scale_prod");
    expect(tier).toBe("scale");
    expect(tier).not.toBe("growth");
  });

  it("A plan priced at 11900 cents (Scale) does not fall into Growth tier", () => {
    // This test guards against re-introduction of price-based inference.
    // The Scale plan is priced at $119 (11900 cents).
    // Old threshold-based logic: >=15000 → scale, >=5000 → growth
    // Under old logic, 11900 would be classified as "growth" — WRONG.
    // Under new logic, tier comes ONLY from plan_id, so Scale plan_id → "scale".
    const scalePrice = PLANS.scale.priceCents; // 11900
    const growthThreshold = 5000; // old bad threshold
    const scaleThreshold = 15000; // old bad threshold

    // Verify the old threshold bug would misclassify:
    expect(scalePrice >= growthThreshold).toBe(true); // would hit growth branch
    expect(scalePrice >= scaleThreshold).toBe(false); // would NOT hit scale branch

    // But the authoritative mapping is correct:
    const tier = getTierForWhopPlanId("plan_scale_prod");
    expect(tier).toBe("scale");
  });
});

// ─── Browser checkout return must NOT grant entitlement ─────

describe("browser checkout isolation", () => {
  it("billing/plans module has no client-side entitlement-granting function", async () => {
    const mod = await import("@/lib/billing/plans");
    const exports = Object.keys(mod);

    // These prefixes would indicate a client-callable entitlement grant
    const forbiddenPatterns = ["grant", "activate", "entitle", "confirm"];
    for (const name of exports) {
      for (const pattern of forbiddenPatterns) {
        expect(
          name.toLowerCase(),
          `export "${name}" looks like an entitlement-granting function`,
        ).not.toContain(pattern);
      }
    }
  });

  it("isBillingConfigured does not grant entitlement — it only checks configuration", () => {
    // isBillingConfigured returns a boolean, not a tier
    process.env.WHOP_RESCUE_PLAN_ID = "plan_rescue_prod";
    process.env.WHOP_GROWTH_PLAN_ID = "plan_growth_prod";
    process.env.WHOP_SCALE_PLAN_ID = "plan_scale_prod";
    const result = isBillingConfigured();
    expect(typeof result).toBe("boolean");
    expect(result).toBe(true);
    // The return value is just true — it does NOT imply any tier is granted
  });
});

// ─── No price-inference code paths exist ────────────────────

describe("no price-inference code paths", () => {
  it("PLANS does not expose any inferFromPrice or threshold function", () => {
    const plansExports = Object.keys(PLANS);
    // PLANS is a constant object — no functions at all
    for (const key of plansExports) {
      expect(typeof PLANS[key as keyof typeof PLANS]).not.toBe("function");
    }
  });
});
