// ─────────────────────────────────────────────────────────────
// PX05 — Cost Calculator
// Per-tenant cost estimation logic.
// IMPORTANT: This is internal planning info, NOT accounting truth.
// Do NOT change customer entitlement because an estimate says
// margin is low.
// ─────────────────────────────────────────────────────────────

import type {
  CostPlan,
  TenantUsage,
  TenantCostEstimate,
  CostLineItem,
  CostSummary,
  CostAlert,
} from "@/lib/types/cost";
import { PLAN_PRICING } from "@/lib/types/cost";
import { getRatesForVersion } from "@/lib/cost/rate-card";

// ── Cost Calculation ────────────────────────────────────────

/** Calculate per-tenant cost estimate using the given rate card version */
export function calculateTenantCost(
  usage: TenantUsage,
  rateCardVersion?: number
): TenantCostEstimate {
  const rates = getRatesForVersion(rateCardVersion);
  const planPricing = PLAN_PRICING[usage.plan];
  const mrr = planPricing.mrr * usage.members;

  // Infrastructure costs
  const memberInfraCost = usage.members * rates.costPerMember;
  const eventsCost = (usage.events / 1000) * rates.costPerThousandEvents;
  const jobsCost = usage.jobs * rates.costPerJob;
  const providerCallCost = usage.providerCalls * rates.costPerProviderCall;
  const baseInfra = rates.baseInfrastructureCost;
  const supportCost = usage.members * rates.supportCostPerMember;

  const totalInfrastructure =
    memberInfraCost + eventsCost + jobsCost + providerCallCost + baseInfra + supportCost;

  // Payment processing
  const paymentProcessingCost =
    mrr * rates.paymentProcessingRate +
    rates.estimatedTransactionsPerMonth * rates.paymentProcessingFixed;

  const totalCost = totalInfrastructure + paymentProcessingCost;
  const contributionMargin = mrr - totalCost;
  const marginPercent = mrr > 0 ? (contributionMargin / mrr) * 100 : 0;

  const costBreakdown: CostLineItem[] = [
    { label: "Base infrastructure", amount: baseInfra, category: "infrastructure" },
    { label: "Member hosting", amount: memberInfraCost, category: "infrastructure" },
    { label: "Event processing", amount: eventsCost, category: "infrastructure" },
    { label: "Job execution", amount: jobsCost, category: "infrastructure" },
    { label: "Provider API calls", amount: providerCallCost, category: "infrastructure" },
    { label: "Support overhead", amount: supportCost, category: "support" },
    {
      label: "Payment processing",
      amount: paymentProcessingCost,
      category: "payment_processing",
    },
  ];

  return {
    tenantId: usage.tenantId,
    tenantName: usage.tenantName,
    plan: usage.plan,
    mrr,
    members: usage.members,
    events: usage.events,
    jobs: usage.jobs,
    providerCalls: usage.providerCalls,
    costBreakdown,
    totalInfrastructure,
    totalPaymentProcessing: paymentProcessingCost,
    totalCost,
    contributionMargin,
    marginPercent,
    isHighCost: marginPercent < 20,
  };
}

// ── Aggregate Summary ───────────────────────────────────────

/** Build aggregate cost summary across all tenants */
export function buildCostSummary(estimates: TenantCostEstimate[]): CostSummary {
  const totalMRR = estimates.reduce((s, e) => s + e.mrr, 0);
  const totalCost = estimates.reduce((s, e) => s + e.totalCost, 0);
  const totalContributionMargin = totalMRR - totalCost;
  const blendedMarginPercent = totalMRR > 0 ? (totalContributionMargin / totalMRR) * 100 : 0;

  const plans: CostPlan[] = ["rescue", "growth", "scale"];
  const byPlan = Object.fromEntries(
    plans.map((plan) => {
      const subset = estimates.filter((e) => e.plan === plan);
      const count = subset.length;
      const totalMRR = subset.reduce((s, e) => s + e.mrr, 0);
      const totalCost = subset.reduce((s, e) => s + e.totalCost, 0);
      const avgMargin =
        subset.length > 0
          ? subset.reduce((s, e) => s + e.marginPercent, 0) / subset.length
          : 0;
      return [plan, { count, totalMRR, totalCost, avgMargin }];
    })
  ) as CostSummary["byPlan"];

  const now = new Date().toISOString();
  const alerts: CostAlert[] = estimates
    .filter((e) => e.isHighCost)
    .map((e) => ({
      tenantId: e.tenantId,
      tenantName: e.tenantName,
      marginPercent: e.marginPercent,
      mrr: e.mrr,
      totalCost: e.totalCost,
      alertType: e.marginPercent < 0 ? "negative_margin" : "low_margin",
      timestamp: now,
    }));

  return {
    totalMRR,
    totalCost,
    totalContributionMargin,
    blendedMarginPercent,
    tenantCount: estimates.length,
    alerts,
    byPlan,
  };
}

// ── Demo Data ───────────────────────────────────────────────

export const DEMO_TENANT_USAGE: TenantUsage[] = [
  {
    tenantId: "ten_001",
    tenantName: "BrightPath Academy",
    plan: "scale",
    members: 8,
    events: 42000,
    jobs: 1800,
    providerCalls: 9500,
  },
  {
    tenantId: "ten_002",
    tenantName: "LearnVista",
    plan: "growth",
    members: 5,
    events: 22000,
    jobs: 800,
    providerCalls: 4200,
  },
  {
    tenantId: "ten_003",
    tenantName: "CourseForge",
    plan: "rescue",
    members: 2,
    events: 5500,
    jobs: 150,
    providerCalls: 600,
  },
  {
    tenantId: "ten_004",
    tenantName: "SkillBridge Institute",
    plan: "scale",
    members: 12,
    events: 68000,
    jobs: 3200,
    providerCalls: 15000,
  },
  {
    tenantId: "ten_005",
    tenantName: "EduLoop",
    plan: "growth",
    members: 4,
    events: 18000,
    jobs: 650,
    providerCalls: 3100,
  },
  {
    tenantId: "ten_006",
    tenantName: "NextStep Learning",
    plan: "rescue",
    members: 1,
    events: 2800,
    jobs: 80,
    providerCalls: 320,
  },
  {
    tenantId: "ten_007",
    tenantName: "Mastery Online",
    plan: "growth",
    members: 6,
    events: 31000,
    jobs: 1100,
    providerCalls: 5800,
  },
  {
    tenantId: "ten_008",
    tenantName: "PivotEd",
    plan: "rescue",
    members: 3,
    events: 9000,
    jobs: 300,
    providerCalls: 1400,
  },
];

/** Generate demo cost estimates */
export function getDemoCostEstimates(): TenantCostEstimate[] {
  return DEMO_TENANT_USAGE.map((u) => calculateTenantCost(u));
}

/** Generate demo cost summary */
export function getDemoCostSummary(): CostSummary {
  return buildCostSummary(getDemoCostEstimates());
}
