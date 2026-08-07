// Attribution Policy Module — WP06
//
// Encodes the attribution policy as tested, versioned rules.
// This module is the single source of truth for:
//   - What each attribution level means
//   - What evidence is required for each level
//   - The policy version
//   - Whether a level is monetizable
//
// KEY RULES (must never be violated):
//   - observed: response, return, lesson progress, membership change → no monetary claim
//   - strongly_associated: observed course return/progress after intervention under
//     a documented timing/evidence rule → labelled as "strongly associated" not causal proof
//   - estimated: modelled commercial context for current candidates → labelled
//     "estimated opportunity" not recovered money
//   - confirmed: keep zero/hidden until a defensible auditable event rule exists —
//     ordinary payment after intervention is NOT automatically confirmed recovery

import type { AttributionState } from "@prisma/client";

// ─── Policy version ────────────────────────────────────────────

export const ATTRIBUTION_POLICY_VERSION = "2026-08-01";

// ─── Attribution window ────────────────────────────────────────

/** Maximum days after intervention delivery to consider activity as attributed. */
export const ATTRIBUTION_WINDOW_DAYS = 14;

// ─── Attribution level definitions ─────────────────────────────

export interface AttributionLevelDefinition {
  level: AttributionState;
  /** Human-readable label for UI display */
  label: string;
  /** Short label for compact display */
  shortLabel: string;
  /** Whether this level makes a monetary claim */
  monetizable: boolean;
  /** Whether this level claims causal proof */
  claimsCausation: boolean;
  /** Required evidence types for this level */
  requiredEvidence: string[];
  /** Human-readable description of what this level means */
  description: string;
  /** Methodology explanation for the methodology panel */
  methodology: string;
  /** UI sort order (lower = higher confidence) */
  sortOrder: number;
}

const LEVEL_DEFINITIONS: AttributionLevelDefinition[] = [
  {
    level: "confirmed",
    label: "Confirmed recovery",
    shortLabel: "Confirmed",
    monetizable: true,
    claimsCausation: true,
    requiredEvidence: [
      "intervention_delivered",
      "auditable_reversal_event",
      "subsequent_payment_after_reversal",
    ],
    description:
      "Directly attributable to a specific intervention with auditable, defensible evidence. Reserved for: failed payment recovered, cancellation explicitly reversed followed by successful renewal.",
    methodology:
      "Confirmed attribution requires an auditable reversal event (e.g., cancellation reversed, failed payment retried successfully) that is temporally linked to an intervention. Ordinary subscription payments after course activity do NOT qualify — they may have occurred regardless of the intervention.",
    sortOrder: 0,
  },
  {
    level: "strongly_associated",
    label: "Strongly associated",
    shortLabel: "Associated",
    monetizable: false,
    claimsCausation: false,
    requiredEvidence: [
      "intervention_delivered",
      "course_activity_within_window",
    ],
    description:
      "Intervention was delivered and the student resumed course activity within the attribution window. This is a strong temporal association — NOT causal proof. No monetary value is claimed.",
    methodology:
      `Strongly associated attribution requires: (1) the notification was API-accepted, (2) the student opened the rescue experience or chose Continue, and (3) course interaction occurred within ${ATTRIBUTION_WINDOW_DAYS} days of delivery. The formula produces $0 — no financial value is claimed. The association is evidence of engagement, not proof of causation.`,
    sortOrder: 1,
  },
  {
    level: "estimated",
    label: "Estimated opportunity",
    shortLabel: "Estimated",
    monetizable: false,
    claimsCausation: false,
    requiredEvidence: [
      "intervention_delivered",
      "course_activity_or_payment_observed",
    ],
    description:
      "Modelled commercial context for current candidates. The amount represents an estimated opportunity — NOT recovered money. Labelled explicitly to avoid misinterpretation.",
    methodology:
      "Estimated attribution models the commercial context of observed payments after course activity. The amount is recorded for visibility but classified as estimated — NOT confirmed. Ordinary subscription payments are not attributed as recovered revenue. The estimated tier is excluded from ROI calculations.",
    sortOrder: 2,
  },
  {
    level: "observed",
    label: "Observed outcome",
    shortLabel: "Observed",
    monetizable: false,
    claimsCausation: false,
    requiredEvidence: ["intervention_delivered", "student_response_or_activity"],
    description:
      "An outcome was observed after intervention delivery — response, return, lesson progress, or membership change. No monetary claim is made. This is the baseline evidence tier.",
    methodology:
      "Observed attribution records that an outcome occurred after intervention delivery. This is the weakest attribution level — it records correlation without any claim of causation or monetary value. Used for: student responded, course return observed, lesson progress observed, membership change detected.",
    sortOrder: 3,
  },
  {
    level: "unattributed",
    label: "Unattributed",
    shortLabel: "None",
    monetizable: false,
    claimsCausation: false,
    requiredEvidence: [],
    description:
      "No verifiable link between the intervention and any observed outcome. Either no activity occurred, or activity occurred outside the attribution window.",
    methodology:
      "No attribution is assigned when: no intervention was delivered, no course activity occurred after delivery, or activity occurred outside the policy window. This is the default state.",
    sortOrder: 4,
  },
  {
    level: "rejected",
    label: "Rejected",
    shortLabel: "Rejected",
    monetizable: false,
    claimsCausation: false,
    requiredEvidence: [],
    description:
      "Activity was observed but occurred outside the attribution window or fails other policy rules. Not counted in any value calculation.",
    methodology:
      "Rejected attribution applies when activity was observed but does not meet the policy criteria — typically because it occurred outside the attribution window. Rejected events are recorded for audit purposes but excluded from all value calculations.",
    sortOrder: 5,
  },
];

const LEVEL_MAP = new Map<AttributionState, AttributionLevelDefinition>(
  LEVEL_DEFINITIONS.map((d) => [d.level, d]),
);

// ─── classifyAttributionLevel ──────────────────────────────────

export type ClassifiableOutcome =
  | "response"
  | "course_return"
  | "lesson_progress"
  | "membership_change"
  | "payment_after_course_activity"
  | "cancellation_reversed_with_payment"
  | "failed_payment_recovered"
  | "no_change"
  | "activity_outside_window"
  | "no_intervention";

/**
 * Classify the attribution level for an observed outcome.
 *
 * This is a pure function — same inputs always produce the same output.
 * It encodes the policy rules that determine attribution level.
 *
 * IMPORTANT: Ordinary payments after intervention are NEVER confirmed.
 * Only specific auditable reversal events (cancellation reversed, failed
 * payment recovered) qualify for confirmed attribution.
 */
export function classifyAttributionLevel(
  outcome: ClassifiableOutcome,
): AttributionState {
  switch (outcome) {
    // ── Observed: no monetary claim ─────────────────────────────
    case "response":
    case "course_return":
    case "lesson_progress":
    case "membership_change":
      return "observed";

    // ── Strongly associated: temporal link, no causation claim ──
    // (Course return/progress after intervention is handled by the
    //  attribution engine's classifyActivationProgressOutcome which
    //  returns strongly_associated when within the policy window.)

    // ── Estimated: modelled opportunity, not recovered money ────
    case "payment_after_course_activity":
      return "estimated";

    // ── Confirmed: only auditable reversal events ──────────────
    case "cancellation_reversed_with_payment":
    case "failed_payment_recovered":
      return "confirmed";

    // ── Rejected / unattributed ────────────────────────────────
    case "activity_outside_window":
      return "rejected";
    case "no_change":
    case "no_intervention":
      return "unattributed";
  }
}

// ─── getAttributionLevelDefinition ─────────────────────────────

export function getAttributionLevelDefinition(
  level: AttributionState,
): AttributionLevelDefinition {
  const def = LEVEL_MAP.get(level);
  if (!def) {
    throw new Error(`Unknown attribution level: ${level}`);
  }
  return def;
}

// ─── getAttributionMethodology ─────────────────────────────────

export interface AttributionMethodology {
  policyVersion: string;
  windowDays: number;
  levels: AttributionLevelDefinition[];
  keyRules: string[];
  disclaimer: string;
}

/**
 * Get the full attribution methodology for display in the UI.
 * This is used by the methodology panel on the value page.
 */
export function getAttributionMethodology(): AttributionMethodology {
  return {
    policyVersion: ATTRIBUTION_POLICY_VERSION,
    windowDays: ATTRIBUTION_WINDOW_DAYS,
    levels: LEVEL_DEFINITIONS.filter(
      (d) =>
        d.level === "confirmed" ||
        d.level === "strongly_associated" ||
        d.level === "estimated" ||
        d.level === "observed",
    ),
    keyRules: [
      "Ordinary subscription payments after intervention are NOT confirmed recovery — they are estimated at most.",
      "Course progress after intervention is strongly_associated, not confirmed — temporal association is not causal proof.",
      "Estimated opportunity is a modelled projection — it is NOT recovered money.",
      "Confirmed attribution requires an auditable reversal event (cancellation reversed, failed payment recovered) — ordinary payments do not qualify.",
      "RescueLoop never combines attribution tiers into one number.",
      "All attribution decisions are versioned and auditable.",
    ],
    disclaimer:
      "Attribution is evidence-based and conservative. No financial claim is made without auditable, defensible evidence. The confirmed tier is reserved for specific reversal events with clear causal chains — ordinary subscription activity does not qualify.",
  };
}

// ─── isConfirmedAvailable ──────────────────────────────────────

/**
 * Check if confirmed attribution is available for a given outcome type.
 * For Activation Rescue, confirmed is NOT available for ordinary payments.
 */
export function isConfirmedAvailable(
  outcome: ClassifiableOutcome,
): boolean {
  return (
    outcome === "cancellation_reversed_with_payment" ||
    outcome === "failed_payment_recovered"
  );
}

// ─── isMonetizable ─────────────────────────────────────────────

/**
 * Check if an attribution level makes a monetary claim.
 * Only 'confirmed' is monetizable.
 */
export function isMonetizable(level: AttributionState): boolean {
  return getAttributionLevelDefinition(level).monetizable;
}
