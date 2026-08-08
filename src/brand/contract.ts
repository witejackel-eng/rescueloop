/**
 * RescueLoop brand contract — single source of truth for brand identity.
 * Derived from machine/brand_contract.json in the WP-01 specification.
 */

export const BRAND = {
  name: "RescueLoop" as const,
  category: "Activation rescue for Whop creators" as const,
  centralPromise: "Close the loop before they leave." as const,
  functionalPromise: "Find who needs help. Approve the right message. See what changed." as const,
  brandIdea: "The Closing Signal" as const,
  pillars: ["Perceptive", "Respectful", "Controlled", "Evidenced", "Restorative"] as const,
  personality: ["Calm", "Precise", "Attentive", "Protective", "Human", "Quietly confident"] as const,
  canonicalTerms: [
    "RescueLoop", "Recovery Pulse", "Rescue Queue", "Signals", "Evidence",
    "Playbooks", "Interventions", "Responses", "Outcomes", "Value Ledger",
    "Activity", "Loop Notes",
  ] as const,
  reservedTerms: ["Loop Score"] as const,
  studentForbiddenTerms: [
    "risk", "churn", "revenue", "rescue target", "conversion",
    "cancellation probability", "evidence score", "recovered value",
  ] as const,
  truthfulDeliveryStates: [
    "queued", "approved", "scheduled", "provider accepted", "responded",
    "returned", "outcome observed", "failed", "suppressed",
  ] as const,
} as const;

export type BrandContract = typeof BRAND;
