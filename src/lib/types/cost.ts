// ─────────────────────────────────────────────────────────────
// PX05 — Cost Guardrails Types
// Per-tenant cost estimation with versioned rate card.
// This is internal planning info, NOT accounting truth.
// ─────────────────────────────────────────────────────────────

/** Subscription plan tiers */
export type CostPlan = "rescue" | "growth" | "scale";

/** Plan pricing configuration */
export interface PlanPricing {
  plan: CostPlan;
  label: string;
  mrr: number; // Monthly price in USD
}

/** Per-tenant usage counts driving cost */
export interface TenantUsage {
  tenantId: string;
  tenantName: string;
  plan: CostPlan;
  members: number;
  events: number;
  jobs: number;
  providerCalls: number;
}

/** Individual cost line item */
export interface CostLineItem {
  label: string;
  amount: number; // USD
  category: "infrastructure" | "payment_processing" | "support" | "other";
}

/** Full cost estimate for a tenant */
export interface TenantCostEstimate {
  tenantId: string;
  tenantName: string;
  plan: CostPlan;
  mrr: number;
  members: number;
  events: number;
  jobs: number;
  providerCalls: number;
  costBreakdown: CostLineItem[];
  totalInfrastructure: number;
  totalPaymentProcessing: number;
  totalCost: number;
  contributionMargin: number; // MRR - totalCost
  marginPercent: number; // contributionMargin / MRR * 100
  isHighCost: boolean; // flagged if margin < 20%
}

/** Rate card version entry */
export interface RateCardVersion {
  version: number;
  effectiveDate: string;
  description: string;
  rates: RateCardRates;
}

/** Configurable cost rates */
export interface RateCardRates {
  /** Cost per member per month (infrastructure) */
  costPerMember: number;
  /** Cost per 1,000 events */
  costPerThousandEvents: number;
  /** Cost per job execution */
  costPerJob: number;
  /** Cost per provider API call */
  costPerProviderCall: number;
  /** Payment processing rate (e.g. 0.029 for 2.9%) */
  paymentProcessingRate: number;
  /** Payment processing fixed fee per transaction (e.g. $0.30) */
  paymentProcessingFixed: number;
  /** Estimated number of payment transactions per month per tenant */
  estimatedTransactionsPerMonth: number;
  /** Base infrastructure cost per tenant (hosting, DB, etc.) */
  baseInfrastructureCost: number;
  /** Support cost per member per month */
  supportCostPerMember: number;
}

/** Rate card with versioning */
export interface RateCard {
  current: RateCardVersion;
  history: RateCardVersion[];
}

/** High-cost tenant alert */
export interface CostAlert {
  tenantId: string;
  tenantName: string;
  marginPercent: number;
  mrr: number;
  totalCost: number;
  alertType: "low_margin" | "negative_margin";
  timestamp: string;
}

/** Aggregate cost summary across all tenants */
export interface CostSummary {
  totalMRR: number;
  totalCost: number;
  totalContributionMargin: number;
  blendedMarginPercent: number;
  tenantCount: number;
  alerts: CostAlert[];
  byPlan: Record<CostPlan, {
    count: number;
    totalMRR: number;
    totalCost: number;
    avgMargin: number;
  }>;
}

/** Plan pricing lookup */
export const PLAN_PRICING: Record<CostPlan, PlanPricing> = {
  rescue: { plan: "rescue", label: "Rescue", mrr: 29 },
  growth: { plan: "growth", label: "Growth", mrr: 59 },
  scale:   { plan: "scale",   label: "Scale",   mrr: 119 },
};
