import "server-only";
// Entitlement Engine — server-authoritative billing entitlement computation.
//
// This is the SINGLE source of truth for what an organization is allowed to do.
// The client checkout callback NEVER grants access — only Whop payment webhooks
// establish the authoritative entitlement.
//
// Entitlement is computed from:
//   1. Whop membership status (active/trialing/past_due/cancelling/cancelled)
//   2. Plan tier (rescue/growth/scale/internal/pilot)
//   3. Pilot overrides (audited server-side entitlement, NOT a Whop membership)
//
// Downgrade NEVER deletes historical data — it only restricts NEW use.
// Upgrade returns user to their interrupted task.

import type { PlanTier, EntitlementState } from "@prisma/client";
import { db } from "@/lib/db";
import { PLANS, type PlanDefinition, type MetricKey, planTierOrder } from "@/lib/usage/plans";
import { getUsageCount, getCurrentPeriod } from "@/lib/usage/metering";
import { checkLimit, type LimitCheck } from "@/lib/usage/enforcement";

// ─── Types ──────────────────────────────────────────────────────

/** The full computed entitlement for an organization. */
export interface ComputedEntitlement {
  /** Current entitlement state. */
  state: EntitlementState;
  /** The plan tier the organization is entitled to. */
  planTier: PlanTier;
  /** The full plan definition with all limits. */
  limits: PlanDefinition;
  /** When the current billing period ends (null for pilot/internal). */
  billingPeriodEnd: Date | null;
  /** When the grace period ends (set when in billing_error state). */
  gracePeriodEndsAt: Date | null;
  /** Whop membership manage URL for self-service billing. */
  manageUrl: string | null;
  /** Whether a pilot override is active. */
  isPilotOverride: boolean;
}

/** Usage warning levels for a single metric. */
export type WarningLevel = "none" | "warning70" | "warning90" | "exceeded";

/** Per-metric usage summary with warning level. */
export interface MetricUsageSummary {
  metric: MetricKey;
  current: number;
  limit: number;
  percentUsed: number;
  warningLevel: WarningLevel;
}

// ─── Grace period config ────────────────────────────────────────

/** Grace period in milliseconds after a payment failure before entitlement is revoked. */
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Main computation ──────────────────────────────────────────

/**
 * Compute the authoritative entitlement for an organization.
 *
 * This function is the single source of truth. It reads:
 *   1. The most recent SubscriptionEntitlement row
 *   2. Any active PilotOverride
 *   3. Falls back to pilot tier if nothing is found
 *
 * IMPORTANT: This function NEVER trusts client-side data. Only
 * Whop webhook handlers create/update SubscriptionEntitlement rows.
 */
export async function computeEntitlement(
  organizationId: string,
): Promise<ComputedEntitlement> {
  const now = new Date();

  // Check for an active pilot override first — it takes precedence
  const pilotOverride = await db.pilotOverride.findFirst({
    where: {
      organizationId,
      revokedAt: null,
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (pilotOverride) {
    const limits = PLANS[pilotOverride.planTier];
    return {
      state: "pilot_override",
      planTier: pilotOverride.planTier,
      limits,
      billingPeriodEnd: pilotOverride.expiresAt,
      gracePeriodEndsAt: null,
      manageUrl: null,
      isPilotOverride: true,
    };
  }

  // Find the most recent entitlement in the current billing window
  const entitlement = await db.subscriptionEntitlement.findFirst({
    where: {
      organizationId,
      billingPeriodStart: { lte: now },
      billingPeriodEnd: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!entitlement) {
    // No active entitlement — default to pilot tier
    return {
      state: "inactive",
      planTier: "pilot",
      limits: PLANS.pilot,
      billingPeriodEnd: null,
      gracePeriodEndsAt: null,
      manageUrl: null,
      isPilotOverride: false,
    };
  }

  const limits = PLANS[entitlement.planTier];
  let gracePeriodEndsAt: Date | null = null;

  // Compute effective state based on entitlement state
  let effectiveState: EntitlementState = entitlement.state as EntitlementState;

  if (effectiveState === "billing_error") {
    // Check if grace period has expired
    const graceEnd = new Date(entitlement.updatedAt.getTime() + GRACE_PERIOD_MS);
    if (now > graceEnd) {
      // Grace period expired — treat as inactive
      effectiveState = "inactive";
    } else {
      gracePeriodEndsAt = graceEnd;
    }
  }

  return {
    state: effectiveState,
    planTier: entitlement.planTier,
    limits,
    billingPeriodEnd: entitlement.billingPeriodEnd,
    gracePeriodEndsAt,
    manageUrl: entitlement.manageUrl,
    isPilotOverride: false,
  };
}

// ─── Limit enforcement ──────────────────────────────────────────

/**
 * Check and enforce a plan limit. Fails safely — if the limit is exceeded,
 * the operation is denied (no overage allowed).
 *
 * Returns the check result so callers can decide how to handle the denial.
 * This is the function that should be called before every mutation that
 * could exceed a plan limit.
 *
 * IMPORTANT: At 100% usage, the server fails safely — it does NOT
 * allow overage. Downgrade never deletes historical data, only
 * restricts new use.
 */
export async function checkAndEnforceLimit(
  organizationId: string,
  metric: MetricKey,
  amount: number = 1,
): Promise<LimitCheck> {
  const entitlement = await computeEntitlement(organizationId);

  // If entitlement is inactive or in billing_error past grace, deny everything
  if (
    entitlement.state === "inactive" ||
    (entitlement.state === "billing_error" && entitlement.gracePeriodEndsAt === null)
  ) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      metric,
    };
  }

  // Use the existing enforcement check which respects overrides
  const check = await checkLimit(organizationId, metric);

  // If amount > 1, also check that current + amount doesn't exceed limit
  if (amount > 1 && check.allowed) {
    const wouldExceed = check.current + amount > check.limit;
    if (wouldExceed) {
      return {
        allowed: false,
        current: check.current,
        limit: check.limit,
        metric,
      };
    }
  }

  return check;
}

// ─── Usage summary with warnings ───────────────────────────────

/**
 * Get a usage summary for all metrics with warning levels.
 *
 * Warning thresholds:
 *   - 70%: "warning70" — approaching limit
 *   - 90%: "warning90" — near limit
 *   - 100%+: "exceeded" — at or over limit
 */
export async function getUsageSummary(
  organizationId: string,
): Promise<{
  entitlement: ComputedEntitlement;
  metrics: MetricUsageSummary[];
}> {
  const entitlement = await computeEntitlement(organizationId);
  const period = getCurrentPeriod();

  const allMetrics: MetricKey[] = [
    "courses",
    "monitored_members",
    "active_campaigns",
    "team_members",
    "candidates_evaluated",
    "interventions_created",
    "notifications_accepted",
    "stored_events",
    "exports",
  ];

  const metrics: MetricUsageSummary[] = await Promise.all(
    allMetrics.map(async (metric) => {
      const current = await getUsageCount(organizationId, metric, period);
      const limit = getLimitForMetric(entitlement.limits, metric);
      const percentUsed = limit > 0 ? (current / limit) * 100 : 0;

      let warningLevel: WarningLevel = "none";
      if (percentUsed >= 100) {
        warningLevel = "exceeded";
      } else if (percentUsed >= 90) {
        warningLevel = "warning90";
      } else if (percentUsed >= 70) {
        warningLevel = "warning70";
      }

      return { metric, current, limit, percentUsed, warningLevel };
    }),
  );

  return { entitlement, metrics };
}

// ─── Helpers ───────────────────────────────────────────────────

/** Get the limit value for a metric from a PlanDefinition. */
export function getLimitForMetric(
  plan: PlanDefinition,
  metric: MetricKey,
): number {
  switch (metric) {
    case "courses":
      return plan.maxCourses;
    case "monitored_members":
      return plan.maxMonitoredMembers;
    case "active_campaigns":
      return plan.maxCampaigns;
    case "team_members":
      return plan.maxSeats;
    case "candidates_evaluated":
      return plan.maxCandidatesEvaluated;
    case "interventions_created":
      return plan.maxInterventionsCreated;
    case "notifications_accepted":
      return plan.maxNotificationsAccepted;
    case "stored_events":
      return plan.maxStoredEvents;
    case "exports":
      return plan.maxExports;
    default:
      return 0;
  }
}

/**
 * Determine if a plan change is an upgrade or downgrade.
 * Downgrades NEVER delete historical data — they only restrict new use.
 */
export function isUpgrade(
  currentTier: PlanTier,
  newTier: PlanTier,
): boolean {
  return planTierOrder(newTier) > planTierOrder(currentTier);
}

/**
 * Get the effective plan tier for an organization, taking into account
 * both SubscriptionEntitlement and PilotOverride.
 */
export async function getEffectivePlanTier(
  organizationId: string,
): Promise<PlanTier> {
  const entitlement = await computeEntitlement(organizationId);
  return entitlement.planTier;
}
