// Unit tests for the Attribution Policy Module (WP06).
//
// Key invariants tested:
//   - Payments do NOT auto-become confirmed recovery
//   - Observed progress → strongly_associated (not confirmed)
//   - Estimated opportunity is not recovered money
//   - Attribution policy version is tracked
//   - Confirmed attribution requires auditable reversal events
//   - Only confirmed level is monetizable

import { describe, it, expect } from "vitest";
import {
  ATTRIBUTION_POLICY_VERSION,
  ATTRIBUTION_WINDOW_DAYS,
  classifyAttributionLevel,
  getAttributionLevelDefinition,
  getAttributionMethodology,
  isConfirmedAvailable,
  isMonetizable,
} from "@/lib/attribution/policy";
import type { ClassifiableOutcome } from "@/lib/attribution/policy";

// ─── Policy Version ────────────────────────────────────────────

describe("attribution-policy: version tracking", () => {
  it("exports a valid policy version in YYYY-MM-DD format", () => {
    expect(ATTRIBUTION_POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("policy version is 2026-08-01", () => {
    expect(ATTRIBUTION_POLICY_VERSION).toBe("2026-08-01");
  });

  it("attribution window is 14 days", () => {
    expect(ATTRIBUTION_WINDOW_DAYS).toBe(14);
  });

  it("methodology includes the policy version", () => {
    const methodology = getAttributionMethodology();
    expect(methodology.policyVersion).toBe(ATTRIBUTION_POLICY_VERSION);
  });
});

// ─── classifyAttributionLevel ──────────────────────────────────

describe("attribution-policy: classifyAttributionLevel", () => {
  it("payments do NOT auto-become confirmed recovery", () => {
    // This is the KEY rule: ordinary payment after intervention is NOT confirmed.
    const result = classifyAttributionLevel("payment_after_course_activity");
    expect(result).toBe("estimated");
    expect(result).not.toBe("confirmed");
  });

  it("observed progress → strongly_associated only (not confirmed)", () => {
    // Lesson progress after intervention is observed, not confirmed.
    // (The engine classifyActivationProgressOutcome returns strongly_associated
    //  when within the policy window, which is correct — but this policy
    //  function maps the outcome type to the appropriate level.)
    const responseResult = classifyAttributionLevel("response");
    expect(responseResult).toBe("observed");
    expect(responseResult).not.toBe("confirmed");

    const returnResult = classifyAttributionLevel("course_return");
    expect(returnResult).toBe("observed");
    expect(returnResult).not.toBe("confirmed");

    const progressResult = classifyAttributionLevel("lesson_progress");
    expect(progressResult).toBe("observed");
    expect(progressResult).not.toBe("confirmed");
  });

  it("estimated opportunity is not recovered money", () => {
    const result = classifyAttributionLevel("payment_after_course_activity");
    expect(result).toBe("estimated");

    // The definition must clarify this is NOT recovered money
    const def = getAttributionLevelDefinition(result);
    expect(def.monetizable).toBe(false);
    expect(def.claimsCausation).toBe(false);
    expect(def.description).toContain("NOT recovered money");
  });

  it("response, return, progress, membership change → observed (no monetary claim)", () => {
    const outcomes: ClassifiableOutcome[] = [
      "response",
      "course_return",
      "lesson_progress",
      "membership_change",
    ];

    for (const outcome of outcomes) {
      const result = classifyAttributionLevel(outcome);
      expect(result).toBe("observed");

      const def = getAttributionLevelDefinition(result);
      expect(def.monetizable).toBe(false);
      expect(def.claimsCausation).toBe(false);
    }
  });

  it("cancellation reversed with payment → confirmed", () => {
    const result = classifyAttributionLevel("cancellation_reversed_with_payment");
    expect(result).toBe("confirmed");
  });

  it("failed payment recovered → confirmed", () => {
    const result = classifyAttributionLevel("failed_payment_recovered");
    expect(result).toBe("confirmed");
  });

  it("activity outside window → rejected", () => {
    const result = classifyAttributionLevel("activity_outside_window");
    expect(result).toBe("rejected");
  });

  it("no change → unattributed", () => {
    const result = classifyAttributionLevel("no_change");
    expect(result).toBe("unattributed");
  });

  it("no intervention → unattributed", () => {
    const result = classifyAttributionLevel("no_intervention");
    expect(result).toBe("unattributed");
  });
});

// ─── Confirmed availability ────────────────────────────────────

describe("attribution-policy: confirmed availability", () => {
  it("ordinary payment is NOT confirmed available", () => {
    expect(isConfirmedAvailable("payment_after_course_activity")).toBe(false);
  });

  it("course return is NOT confirmed available", () => {
    expect(isConfirmedAvailable("course_return")).toBe(false);
  });

  it("lesson progress is NOT confirmed available", () => {
    expect(isConfirmedAvailable("lesson_progress")).toBe(false);
  });

  it("cancellation reversed IS confirmed available", () => {
    expect(isConfirmedAvailable("cancellation_reversed_with_payment")).toBe(true);
  });

  it("failed payment recovered IS confirmed available", () => {
    expect(isConfirmedAvailable("failed_payment_recovered")).toBe(true);
  });
});

// ─── Monetizability ────────────────────────────────────────────

describe("attribution-policy: monetizability", () => {
  it("only confirmed level is monetizable", () => {
    expect(isMonetizable("confirmed")).toBe(true);
    expect(isMonetizable("strongly_associated")).toBe(false);
    expect(isMonetizable("estimated")).toBe(false);
    expect(isMonetizable("observed")).toBe(false);
    expect(isMonetizable("unattributed")).toBe(false);
    expect(isMonetizable("rejected")).toBe(false);
  });
});

// ─── Attribution level definitions ─────────────────────────────

describe("attribution-policy: level definitions", () => {
  it("confirmed requires auditable reversal evidence", () => {
    const def = getAttributionLevelDefinition("confirmed");
    expect(def.requiredEvidence).toContain("auditable_reversal_event");
    expect(def.claimsCausation).toBe(true);
    expect(def.monetizable).toBe(true);
  });

  it("strongly_associated does NOT claim causation", () => {
    const def = getAttributionLevelDefinition("strongly_associated");
    expect(def.claimsCausation).toBe(false);
    expect(def.monetizable).toBe(false);
  });

  it("estimated does NOT claim causation", () => {
    const def = getAttributionLevelDefinition("estimated");
    expect(def.claimsCausation).toBe(false);
    expect(def.monetizable).toBe(false);
  });

  it("observed does NOT claim causation", () => {
    const def = getAttributionLevelDefinition("observed");
    expect(def.claimsCausation).toBe(false);
    expect(def.monetizable).toBe(false);
  });

  it("all levels have required fields", () => {
    const levels = ["confirmed", "strongly_associated", "estimated", "observed", "unattributed", "rejected"] as const;
    for (const level of levels) {
      const def = getAttributionLevelDefinition(level);
      expect(def.label).toBeTruthy();
      expect(def.shortLabel).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.methodology).toBeTruthy();
      expect(typeof def.sortOrder).toBe("number");
    }
  });
});

// ─── Methodology ───────────────────────────────────────────────

describe("attribution-policy: methodology", () => {
  it("returns methodology with all required fields", () => {
    const methodology = getAttributionMethodology();
    expect(methodology.policyVersion).toBe(ATTRIBUTION_POLICY_VERSION);
    expect(methodology.windowDays).toBe(ATTRIBUTION_WINDOW_DAYS);
    expect(methodology.levels.length).toBeGreaterThan(0);
    expect(methodology.keyRules.length).toBeGreaterThan(0);
    expect(methodology.disclaimer).toBeTruthy();
  });

  it("methodology key rules include the no-auto-confirm rule", () => {
    const methodology = getAttributionMethodology();
    const hasNoAutoConfirm = methodology.keyRules.some((r) =>
      r.includes("NOT confirmed") || r.includes("not confirmed"),
    );
    expect(hasNoAutoConfirm).toBe(true);
  });

  it("methodology key rules include the no-combine rule", () => {
    const methodology = getAttributionMethodology();
    const hasNoCombine = methodology.keyRules.some((r) =>
      r.includes("never combines"),
    );
    expect(hasNoCombine).toBe(true);
  });

  it("methodology levels are sorted by confidence", () => {
    const methodology = getAttributionMethodology();
    const sortOrders = methodology.levels.map((l) => l.sortOrder);
    for (let i = 1; i < sortOrders.length; i++) {
      expect(sortOrders[i]).toBeGreaterThan(sortOrders[i - 1]);
    }
  });

  it("methodology includes confirmed, strongly_associated, estimated, observed levels", () => {
    const methodology = getAttributionMethodology();
    const levelNames = methodology.levels.map((l) => l.level);
    expect(levelNames).toContain("confirmed");
    expect(levelNames).toContain("strongly_associated");
    expect(levelNames).toContain("estimated");
    expect(levelNames).toContain("observed");
  });
});
