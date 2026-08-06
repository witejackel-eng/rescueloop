/**
 * RescueLoop copy dictionary — source-controlled brand and product vocabulary.
 *
 * Derived from machine/copy_dictionary.json and machine/brand_contract.json.
 * Use these constants instead of hard-coded strings in production UI.
 */

export const copy = {
  eyebrow: "Activation rescue for Whop creators",
  hero: "Close the loop before they leave.",
  support: "RescueLoop finds paying members who never started, prepares respectful outreach for your approval, and shows what changed after you reached out.",
  primaryCTA: "Install on Whop",
  secondaryCTA: "Explore the interactive demo",
  trustLine: "Nothing sends without your approval.",

  features: {
    signals: "Know who needs attention before they disappear.",
    evidence: "See the exact activity, timing, and rule behind every recommendation.",
    draftReview: "Edit and approve each message in one calm workspace.",
    studentResponse: "Give members a respectful way to explain what blocked them.",
    outcomes: "See who returned, what they did, and how confidently value can be attributed.",
    courseInsight: "Turn repeated blockers into course improvements.",
  },

  /** Truthful state labels — use these instead of "delivered" for provider acceptance. */
  states: {
    queued: "queued",
    approved: "approved",
    scheduled: "scheduled",
    providerAccepted: "provider accepted",
    responded: "responded",
    returned: "returned",
    outcomeObserved: "outcome observed",
    failed: "failed",
    suppressed: "suppressed",
  },
} as const;
