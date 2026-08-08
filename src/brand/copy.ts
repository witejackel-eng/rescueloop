/**
 * RescueLoop copy dictionary — source-controlled brand and product vocabulary.
 *
 * Derived from machine/copy_dictionary.json and machine/brand_contract.json.
 * Use these constants instead of hard-coded strings in production UI.
 */

export const copy = {
  eyebrow: "Activation rescue for Whop creators",
  hero: "Close the loop before they leave.",
  support: "Find who needs help. Approve the right message. See what changed.",
  primaryCTA: "Explore the interactive demo",
  secondaryCTA: "See the student experience",
  trustLine: "Nothing sends without your approval.",
  /** Micro trust strip — safety properties displayed in the hero. */
  microTrustStrip: "Manual approval · Quiet hours · Cooldowns · Student opt-out",
  /** Tertiary safety disclosure — appears below the micro trust strip. */
  tertiaryDisclosure: "Interactive demo · simulated workspace — No customer data is connected. Nothing is sent.",
  disclosure: "Interactive demonstration. No messages are sent and no customer data is connected.",

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
