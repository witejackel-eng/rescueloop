import "server-only";
// Plan enforcement.
//
// The single source of truth for "is this organisation allowed to do X" on
// the server. UI labels alone are NOT enforcement — every mutation that
// could exceed a plan limit MUST call `enforceLimit()` (or `checkLimit()`
// if it prefers to surface the result rather than throw).
//
// The mapping from MetricKey → plan limit field lives in
// `METRIC_TO_PLAN_LIMIT`. Metrics not present in that map are tracked but
// not enforced — `checkLimit` returns `allowed: true, limit: Infinity` for
// them so callers can still observe usage.

import type { PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { getUsageCount } from "./metering";
import { PLANS, type MetricKey } from "./plans";

export type { MetricKey } from "./plans";

/** Metrics that currently have a hard plan limit. */
export type EnforcedMetric = Extract<
  MetricKey,
  "monitored_members" | "team_members"
>;

/** Maps an enforced metric to the field on PlanDefinition that holds its limit. */
const METRIC_TO_PLAN_LIMIT: Record<
  EnforcedMetric,
  "maxMonitoredMembers" | "maxSeats"
> = {
  monitored_members: "maxMonitoredMembers",
  team_members: "maxSeats",
};

/**
 * Thrown by `enforceLimit` when the organisation has reached (or exceeded)
 * its plan limit for the given metric. Carries the offending numbers so the
 * caller (API route, job, etc.) can render a meaningful error.
 */
export class PlanLimitExceededError extends Error {
  readonly metric: MetricKey;
  readonly current: number;
  readonly limit: number;

  constructor(metric: MetricKey, current: number, limit: number) {
    super(
      `Plan limit exceeded for metric "${metric}": current=${current}, limit=${limit}`,
    );
    this.name = "PlanLimitExceededError";
    this.metric = metric;
    this.current = current;
    this.limit = limit;

    // Restore prototype chain after extending built-in Error.
    Object.setPrototypeOf(this, PlanLimitExceededError.prototype);
  }
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  metric: string;
}

/**
 * Returns the organisation's current plan tier. Looks up the most recent
 * SubscriptionEntitlement whose billing window covers `now`. If no
 * entitlement exists (or all have expired), defaults to `"pilot"`.
 */
export async function getOrganizationPlan(
  organizationId: string,
): Promise<PlanTier> {
  const now = new Date();

  const entitlement = await db.subscriptionEntitlement.findFirst({
    where: {
      organizationId,
      billingPeriodStart: { lte: now },
      billingPeriodEnd: { gte: now },
    },
    orderBy: { createdAt: "desc" },
    select: { planTier: true },
  });

  return entitlement?.planTier ?? "pilot";
}

/**
 * Looks up the limit field for a metric without TypeScript narrowing hacks.
 * Returns `null` for metrics that are tracked but not enforced.
 */
function getLimitField(
  metric: MetricKey,
): "maxMonitoredMembers" | "maxSeats" | null {
  switch (metric) {
    case "monitored_members":
      return "maxMonitoredMembers";
    case "team_members":
      return "maxSeats";
    default:
      return null;
  }
}

/**
 * Check whether an organisation is allowed to record one more unit of the
 * given metric against its current plan.
 *
 * - Enforced metrics: `allowed = current < limit`.
 * - Unenforced metrics: `allowed` is always `true`, `limit` is `Infinity`.
 *
 * `current` is read from the live UsageCounter for the current period.
 */
export async function checkLimit(
  organizationId: string,
  metric: MetricKey,
): Promise<LimitCheck> {
  const planTier = await getOrganizationPlan(organizationId);
  const plan = PLANS[planTier];
  const limitField = getLimitField(metric);

  const current = await getUsageCount(organizationId, metric);

  if (limitField === null) {
    return {
      allowed: true,
      current,
      limit: Number.POSITIVE_INFINITY,
      metric,
    };
  }

  const limit = plan[limitField];
  return {
    allowed: current < limit,
    current,
    limit,
    metric,
  };
}

/**
 * Throws `PlanLimitExceededError` if the organisation has reached its plan
 * limit for the given metric. Otherwise returns `void`.
 *
 * Use this as a guard at the start of any mutation that could push usage
 * past the limit, e.g.:
 *
 *   await enforceLimit(organizationId, "monitored_members");
 *   await recordUsageEvent(organizationId, "monitored_members");
 *   // ...create the membership...
 *
 * Note: the check and the record are not atomic — callers that need strict
 * enforcement under concurrency should add a row-level lock or unique
 * constraint at the point of mutation.
 */
export async function enforceLimit(
  organizationId: string,
  metric: MetricKey,
): Promise<void> {
  const check = await checkLimit(organizationId, metric);
  if (!check.allowed) {
    throw new PlanLimitExceededError(metric, check.current, check.limit);
  }
}
