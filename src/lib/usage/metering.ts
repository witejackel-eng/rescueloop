import "server-only";
// Usage metering service.
//
// Records immutable UsageEvent rows and increments per-period UsageCounter
// rows. The counter is the fast lookup path for enforcement; the event log
// is the durable audit trail.
//
// Period format: "YYYY-MM" (e.g. "2026-08"). Always computed in UTC so a
// billing period means the same thing regardless of where the server runs.

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { MetricKey } from "./plans";

export type { MetricKey } from "./plans";

/** Free-form JSON payload stored alongside a usage event. */
export type UsageEventMetadata = Record<string, unknown>;

/**
 * Returns the current billing period as "YYYY-MM" (UTC).
 * Pass an explicit `now` for deterministic tests.
 */
export function getCurrentPeriod(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Append a UsageEvent and atomically bump the per-period UsageCounter for the
 * current month. Both writes happen in a single transaction so the counter
 * and event log can never drift.
 *
 * `increment` defaults to 1. Negative values are allowed (e.g. when a member
 * is removed from monitoring) and will decrement the counter.
 *
 * `metadata` is optional free-form JSON attached to the event row only — it
 * is NOT stored on the counter.
 *
 * `idempotencyKey` is an optional stable key that prevents duplicate events.
 */
export async function recordUsageEvent(
  organizationId: string,
  metric: MetricKey,
  increment: number = 1,
  metadata?: UsageEventMetadata,
  idempotencyKey?: string,
): Promise<void> {
  const period = getCurrentPeriod();

  await db.$transaction(async (tx) => {
    await tx.usageEvent.create({
      data: {
        organizationId,
        metric,
        increment,
        idempotencyKey,
        metadataJson:
          metadata === undefined
            ? undefined
            : (metadata as Prisma.InputJsonValue),
      },
    });

    await tx.usageCounter.upsert({
      where: {
        organizationId_metric_period: { organizationId, metric, period },
      },
      create: {
        organizationId,
        metric,
        period,
        count: increment,
      },
      update: {
        count: { increment },
      },
    });
  });
}

/**
 * Return the recorded count for a single metric in a period
 * (defaults to the current month). Returns 0 if no events have been
 * recorded for that metric in that period.
 */
export async function getUsageCount(
  organizationId: string,
  metric: MetricKey,
  period: string = getCurrentPeriod(),
): Promise<number> {
  const counter = await db.usageCounter.findUnique({
    where: {
      organizationId_metric_period: { organizationId, metric, period },
    },
    select: { count: true },
  });
  return counter?.count ?? 0;
}

/**
 * Return the per-metric counts for an entire period (defaults to the current
 * month). Metrics with no recorded events are returned as 0 so callers can
 * rely on every key being present.
 */
export async function getUsageForPeriod(
  organizationId: string,
  period: string = getCurrentPeriod(),
): Promise<PeriodUsage> {
  const counters = await db.usageCounter.findMany({
    where: { organizationId, period },
    select: { metric: true, count: true },
  });

  const counts: Record<MetricKey, number> = {
    courses: 0,
    monitored_members: 0,
    active_campaigns: 0,
    team_members: 0,
    candidates_evaluated: 0,
    interventions_created: 0,
    notifications_accepted: 0,
    stored_events: 0,
    exports: 0,
  };

  for (const counter of counters) {
    const key = counter.metric as MetricKey;
    if (key in counts) {
      counts[key] = counter.count;
    }
  }

  return { period, counts };
}

export interface PeriodUsage {
  period: string;
  counts: Record<MetricKey, number>;
}
