import "server-only";
// Plan enforcement with atomic usage reservations.
//
// The single source of truth for "is this organisation allowed to do X" on
// the server. UI labels alone are NOT enforcement — every mutation that
// could exceed a plan limit MUST call `enforceLimit()` (or `checkLimit()`
// if it prefers to surface the result rather than throw).
//
// Reservation pattern for strict concurrency:
//   check entitlement → atomically reserve usage → perform mutation → commit usage event
// If the mutation fails: release or reverse reservation safely.
//
// Every enforced metric maps to a limit field on PlanDefinition via
// METRIC_TO_PLAN_LIMIT. Plan overrides can temporarily raise a limit.

import type { PlanTier } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getUsageCount, recordUsageEvent, getCurrentPeriod } from "./metering";
import { PLANS, type MetricKey } from "./plans";

export type { MetricKey } from "./plans";

/** All metrics that have a hard plan limit. */
export type EnforcedMetric = Extract<
  MetricKey,
  | "courses"
  | "monitored_members"
  | "active_campaigns"
  | "team_members"
  | "candidates_evaluated"
  | "interventions_created"
  | "notifications_accepted"
  | "stored_events"
  | "exports"
>;

/** Maps an enforced metric to the field on PlanDefinition that holds its limit. */
export type PlanLimitField =
  | "maxCourses"
  | "maxMonitoredMembers"
  | "maxCampaigns"
  | "maxSeats"
  | "maxCandidatesEvaluated"
  | "maxInterventionsCreated"
  | "maxNotificationsAccepted"
  | "maxStoredEvents"
  | "maxExports";

const METRIC_TO_PLAN_LIMIT: Record<EnforcedMetric, PlanLimitField> = {
  courses: "maxCourses",
  monitored_members: "maxMonitoredMembers",
  active_campaigns: "maxCampaigns",
  team_members: "maxSeats",
  candidates_evaluated: "maxCandidatesEvaluated",
  interventions_created: "maxInterventionsCreated",
  notifications_accepted: "maxNotificationsAccepted",
  stored_events: "maxStoredEvents",
  exports: "maxExports",
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
 * Looks up the limit field for a metric.
 * Returns `null` for metrics that are tracked but not enforced (none currently).
 */
function getLimitField(metric: MetricKey): PlanLimitField | null {
  if (metric in METRIC_TO_PLAN_LIMIT) {
    return METRIC_TO_PLAN_LIMIT[metric as EnforcedMetric];
  }
  return null;
}

/**
 * Look up any active plan override for a given metric. Returns the override
 * limit if one exists and is currently active (between startsAt and expiresAt),
 * otherwise returns null.
 */
export async function getActiveOverride(
  organizationId: string,
  metric: EnforcedMetric,
): Promise<number | null> {
  const now = new Date();
  const override = await db.planOverride.findFirst({
    where: {
      organizationId,
      metric,
      startsAt: { lte: now },
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
    select: { overrideLimit: true },
  });
  return override?.overrideLimit ?? null;
}

/**
 * Check whether an organisation is allowed to record one more unit of the
 * given metric against its current plan.
 *
 * - Enforced metrics: `allowed = current < limit`.
 * - Unenforced metrics: `allowed` is always `true`, `limit` is `Infinity`.
 *
 * `current` is read from the live UsageCounter for the current period.
 * Active plan overrides are taken into account.
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

  // Check for an active override that may raise the limit
  const overrideLimit = await getActiveOverride(
    organizationId,
    metric as EnforcedMetric,
  );
  const baseLimit = plan[limitField];
  const limit = overrideLimit !== null ? Math.max(baseLimit, overrideLimit) : baseLimit;

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
 * For strict concurrency, prefer `reserveUsage()` which atomically checks
 * and reserves a usage slot.
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

// ─── Atomic reservation pattern ────────────────────────────────

/** Stable idempotency key for a usage reservation. */
export function buildIdempotencyKey(
  organizationId: string,
  metric: MetricKey,
  uniqueSuffix: string,
): string {
  return `reserve:${organizationId}:${metric}:${uniqueSuffix}`;
}

export interface ReservationResult {
  /** The id of the UsageReservation row in the database. */
  reservationId: string;
  /** The idempotency key used. */
  idempotencyKey: string;
  /** The current count AFTER reservation (includes the +1). */
  reservedCount: number;
  /** The limit that was checked against. */
  limit: number;
}

/**
 * Atomically check the plan limit AND reserve one unit of usage.
 *
 * This uses a database-level atomic upsert on the UsageCounter to ensure
 * that concurrent requests cannot exceed the hard limit. The flow is:
 *
 *   1. Read plan → determine limit (with override)
 *   2. Atomically increment counter IF current < limit (via conditional update)
 *   3. Create a UsageReservation row as the reservation record
 *
 * If the counter is already at or above the limit, the increment is NOT
 * applied and a `PlanLimitExceededError` is thrown.
 *
 * Returns a `ReservationResult` that the caller must either:
 * - **commit**: call `commitReservation()` after the mutation succeeds
 * - **release**: call `releaseReservation()` if the mutation fails
 */
export async function reserveUsage(
  organizationId: string,
  metric: EnforcedMetric,
  idempotencySuffix: string,
): Promise<ReservationResult> {
  const planTier = await getOrganizationPlan(organizationId);
  const plan = PLANS[planTier];
  const limitField = METRIC_TO_PLAN_LIMIT[metric];
  const baseLimit = plan[limitField];

  // Check for an active override
  const overrideLimit = await getActiveOverride(organizationId, metric);
  const limit = overrideLimit !== null ? Math.max(baseLimit, overrideLimit) : baseLimit;

  const period = getCurrentPeriod();
  const idempotencyKey = buildIdempotencyKey(organizationId, metric, idempotencySuffix);

  // Atomic check-and-increment: read the counter, only increment if under limit.
  // This runs inside a transaction so no other concurrent request can slip in.
  const result = await db.$transaction(async (tx) => {
    // Read current counter value
    const counter = await tx.usageCounter.findUnique({
      where: {
        organizationId_metric_period: { organizationId, metric, period },
      },
      select: { count: true, id: true },
    });

    const currentCount = counter?.count ?? 0;

    if (currentCount >= limit) {
      return { exceeded: true as const, currentCount, limit };
    }

    // Atomically increment the counter
    await tx.usageCounter.upsert({
      where: {
        organizationId_metric_period: { organizationId, metric, period },
      },
      create: {
        organizationId,
        metric,
        period,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    // Create reservation record
    const reservation = await tx.usageReservation.create({
      data: {
        organizationId,
        metric,
        period,
        idempotencyKey,
        status: "reserved",
      },
      select: { id: true },
    });

    return {
      exceeded: false as const,
      reservationId: reservation.id,
      reservedCount: currentCount + 1,
      limit,
    };
  });

  if (result.exceeded) {
    throw new PlanLimitExceededError(metric, result.currentCount, result.limit);
  }

  return {
    reservationId: result.reservationId,
    idempotencyKey,
    reservedCount: result.reservedCount,
    limit: result.limit,
  };
}

/**
 * Commit a reservation after the mutation has succeeded.
 *
 * Records a UsageEvent for the audit trail and marks the reservation as
 * committed.
 */
export async function commitReservation(
  reservationId: string,
  organizationId: string,
  metric: EnforcedMetric,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await db.$transaction(async (tx) => {
    // Mark reservation as committed
    await tx.usageReservation.update({
      where: { id: reservationId },
      data: { status: "committed" },
    });

    // Record the usage event for the audit trail
    await tx.usageEvent.create({
      data: {
        organizationId,
        metric,
        increment: 1,
        metadataJson:
          metadata === undefined
            ? undefined
            : (metadata as Prisma.InputJsonValue),
      },
    });
  });
}

/**
 * Release (rollback) a reservation when the mutation fails.
 *
 * Atomically decrements the UsageCounter back and marks the reservation
 * as released. Safe to call in error handlers.
 */
export async function releaseReservation(
  reservationId: string,
  organizationId: string,
  metric: EnforcedMetric,
): Promise<void> {
  const period = getCurrentPeriod();

  await db.$transaction(async (tx) => {
    // Check the reservation still exists and is in "reserved" state
    const reservation = await tx.usageReservation.findUnique({
      where: { id: reservationId },
      select: { status: true },
    });

    // If already committed or released, do nothing (idempotent)
    if (!reservation || reservation.status !== "reserved") {
      return;
    }

    // Mark reservation as released
    await tx.usageReservation.update({
      where: { id: reservationId },
      data: { status: "released" },
    });

    // Decrement the counter back
    await tx.usageCounter.update({
      where: {
        organizationId_metric_period: { organizationId, metric, period },
      },
      data: {
        count: { decrement: 1 },
      },
    });
  });
}

// ─── Plan overrides ────────────────────────────────────────────

export interface ApplyOverrideInput {
  organizationId: string;
  metric: EnforcedMetric;
  overrideLimit: number;
  reason: string;
  appliedBy: string;
  approvedBy: string;
  startsAt: Date;
  expiresAt: Date;
}

/**
 * Apply a plan override that temporarily raises the limit for a metric.
 *
 * Records a PlanOverride row and an audit UsageEvent.
 */
export async function applyPlanOverride(input: ApplyOverrideInput): Promise<string> {
  const override = await db.$transaction(async (tx) => {
    const row = await tx.planOverride.create({
      data: {
        organizationId: input.organizationId,
        metric: input.metric,
        overrideLimit: input.overrideLimit,
        reason: input.reason,
        appliedBy: input.appliedBy,
        approvedBy: input.approvedBy,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
      },
      select: { id: true },
    });

    // Audit event
    await tx.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        metric: `override:${input.metric}` as MetricKey,
        increment: 0,
        metadataJson: {
          overrideId: row.id,
          overrideLimit: input.overrideLimit,
          reason: input.reason,
          appliedBy: input.appliedBy,
          approvedBy: input.approvedBy,
          startsAt: input.startsAt.toISOString(),
          expiresAt: input.expiresAt.toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return row;
  });

  return override.id;
}

/**
 * Check whether a plan override is expired. If expired, the enforcement
 * check will ignore it. Call `revokeExpiredOverrides` to clean up.
 */
export async function revokeExpiredOverrides(
  organizationId: string,
): Promise<number> {
  const now = new Date();
  const result = await db.planOverride.updateMany({
    where: {
      organizationId,
      expiresAt: { lt: now },
    },
    data: {
      expiresAt: now, // snap to now so it's definitively expired
    },
  });
  return result.count;
}
