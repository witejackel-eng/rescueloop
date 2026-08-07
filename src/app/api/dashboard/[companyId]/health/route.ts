// GET /api/dashboard/[companyId]/health
//
// Returns real health signals derived from DB state for this company.
// Checks: WhopInstallation, SyncExecution, WebhookReceipt, OutboxEvent,
//          SubscriptionEntitlement, UsageCounter.
//
// FAIL-CLOSED: Uses requireCompanyAccess() — never returns data without auth.

import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { db } from "@/lib/db";

// ─── Health signal types ─────────────────────────────────────

export interface HealthSignal {
  id: string;
  source: string;
  status: "healthy" | "degraded" | "critical" | "unknown";
  message: string;
  lastCheckedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CompanyHealthResponse {
  companyId: string;
  overallStatus: "healthy" | "degraded" | "critical";
  signals: HealthSignal[];
  checkedAt: string;
}

// ─── Route handler ───────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  let context;
  try {
    context = await requireCompanyAccess(companyId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const orgId = context.organizationId;
  const now = new Date().toISOString();
  const signals: HealthSignal[] = [];

  try {
    // ─── 1. WhopInstallation status ───────────────────────────
    const installation = await db.whopInstallation.findFirst({
      where: { organizationId: orgId },
      select: { status: true, updatedAt: true },
    });

    if (!installation) {
      signals.push({
        id: "installation",
        source: "WhopInstallation",
        status: "critical",
        message: "No Whop installation found for this organization.",
        lastCheckedAt: now,
      });
    } else if (installation.status === "active") {
      signals.push({
        id: "installation",
        source: "WhopInstallation",
        status: "healthy",
        message: "Whop installation is active.",
        lastCheckedAt: now,
        metadata: { status: installation.status },
      });
    } else {
      signals.push({
        id: "installation",
        source: "WhopInstallation",
        status: "degraded",
        message: `Whop installation is ${installation.status}.`,
        lastCheckedAt: now,
        metadata: { status: installation.status },
      });
    }

    // ─── 2. Latest SyncExecution status ──────────────────────
    const latestSync = await db.syncExecution.findFirst({
      where: { organizationId: orgId },
      orderBy: { startedAt: "desc" },
      select: {
        state: true,
        startedAt: true,
        completedAt: true,
        errorSummary: true,
        trigger: true,
      },
    });

    if (!latestSync) {
      signals.push({
        id: "sync",
        source: "SyncExecution",
        status: "unknown",
        message: "No sync executions recorded yet.",
        lastCheckedAt: now,
      });
    } else if (latestSync.state === "completed") {
      signals.push({
        id: "sync",
        source: "SyncExecution",
        status: "healthy",
        message: "Last sync completed successfully.",
        lastCheckedAt: now,
        metadata: {
          state: latestSync.state,
          trigger: latestSync.trigger,
          startedAt: latestSync.startedAt.toISOString(),
          completedAt: latestSync.completedAt?.toISOString() ?? null,
        },
      });
    } else if (latestSync.state === "failed") {
      signals.push({
        id: "sync",
        source: "SyncExecution",
        status: "critical",
        message: `Last sync failed: ${latestSync.errorSummary ?? "unknown error"}`,
        lastCheckedAt: now,
        metadata: {
          state: latestSync.state,
          errorSummary: latestSync.errorSummary,
        },
      });
    } else {
      // pending or running or cancelled
      signals.push({
        id: "sync",
        source: "SyncExecution",
        status: "degraded",
        message: `Sync is currently ${latestSync.state}.`,
        lastCheckedAt: now,
        metadata: { state: latestSync.state },
      });
    }

    // ─── 3. WebhookReceipt failures ──────────────────────────
    const failedWebhookCount = await db.webhookReceipt.count({
      where: { organizationId: orgId, status: "failed" },
    });

    const recentFailedWebhooks = await db.webhookReceipt.findMany({
      where: { organizationId: orgId, status: "failed" },
      orderBy: { receivedAt: "desc" },
      take: 5,
      select: { id: true, eventType: true, lastError: true, receivedAt: true },
    });

    signals.push({
      id: "webhooks",
      source: "WebhookReceipt",
      status: failedWebhookCount === 0 ? "healthy" : failedWebhookCount > 5 ? "critical" : "degraded",
      message:
        failedWebhookCount === 0
          ? "No failed webhooks."
          : `${failedWebhookCount} failed webhook(s).`,
      lastCheckedAt: now,
      metadata: {
        failedCount: failedWebhookCount,
        recentFailures: recentFailedWebhooks.map((w) => ({
          eventType: w.eventType,
          lastError: w.lastError,
          receivedAt: w.receivedAt.toISOString(),
        })),
      },
    });

    // ─── 4. OutboxEvent failures ─────────────────────────────
    const failedOutboxCount = await db.outboxEvent.count({
      where: { organizationId: orgId, state: "failed" },
    });

    const deadLetterCount = await db.outboxEvent.count({
      where: { organizationId: orgId, state: "dead_letter" },
    });

    signals.push({
      id: "outbox",
      source: "OutboxEvent",
      status:
        failedOutboxCount === 0 && deadLetterCount === 0
          ? "healthy"
          : failedOutboxCount > 3 || deadLetterCount > 0
            ? "critical"
            : "degraded",
      message:
        failedOutboxCount === 0 && deadLetterCount === 0
          ? "No failed or dead-lettered outbox events."
          : `${failedOutboxCount} failed, ${deadLetterCount} dead-lettered outbox event(s).`,
      lastCheckedAt: now,
      metadata: { failedCount: failedOutboxCount, deadLetterCount },
    });

    // ─── 5. SubscriptionEntitlement state ────────────────────
    const entitlement = await db.subscriptionEntitlement.findFirst({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        state: true,
        planTier: true,
        billingPeriodEnd: true,
        updatedAt: true,
      },
    });

    if (!entitlement) {
      signals.push({
        id: "entitlement",
        source: "SubscriptionEntitlement",
        status: "unknown",
        message: "No subscription entitlement found.",
        lastCheckedAt: now,
      });
    } else if (entitlement.state === "active") {
      signals.push({
        id: "entitlement",
        source: "SubscriptionEntitlement",
        status: "healthy",
        message: "Subscription is active.",
        lastCheckedAt: now,
        metadata: {
          planTier: entitlement.planTier,
          billingPeriodEnd: entitlement.billingPeriodEnd.toISOString(),
        },
      });
    } else if (entitlement.state === "billing_error" || entitlement.state === "inactive") {
      signals.push({
        id: "entitlement",
        source: "SubscriptionEntitlement",
        status: "critical",
        message: `Subscription is ${entitlement.state}.`,
        lastCheckedAt: now,
        metadata: { state: entitlement.state, planTier: entitlement.planTier },
      });
    } else {
      signals.push({
        id: "entitlement",
        source: "SubscriptionEntitlement",
        status: "degraded",
        message: `Subscription is ${entitlement.state}.`,
        lastCheckedAt: now,
        metadata: { state: entitlement.state, planTier: entitlement.planTier },
      });
    }

    // ─── 6. UsageCounter freshness ───────────────────────────
    const currentPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const currentCounters = await db.usageCounter.findMany({
      where: { organizationId: orgId, period: currentPeriod },
      select: { metric: true, count: true, updatedAt: true },
    });

    const staleThresholdMs = 24 * 60 * 60 * 1000; // 24 hours
    const staleCounters = currentCounters.filter(
      (c) => Date.now() - c.updatedAt.getTime() > staleThresholdMs,
    );

    signals.push({
      id: "usage_counters",
      source: "UsageCounter",
      status:
        currentCounters.length === 0
          ? "unknown"
          : staleCounters.length > 0
            ? "degraded"
            : "healthy",
      message:
        currentCounters.length === 0
          ? "No usage counters for the current period."
          : staleCounters.length > 0
            ? `${staleCounters.length} usage counter(s) are stale (>24h since update).`
            : "Usage counters are fresh.",
      lastCheckedAt: now,
      metadata: {
        period: currentPeriod,
        counterCount: currentCounters.length,
        staleCount: staleCounters.length,
        metrics: currentCounters.map((c) => ({ metric: c.metric, count: c.count })),
      },
    });
  } catch (err) {
    console.error("[api/dashboard/health] DB error:", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // ─── Compute overall status ─────────────────────────────────
  const hasCritical = signals.some((s) => s.status === "critical");
  const hasDegraded = signals.some((s) => s.status === "degraded");
  const overallStatus: "healthy" | "degraded" | "critical" = hasCritical
    ? "critical"
    : hasDegraded
      ? "degraded"
      : "healthy";

  const response: CompanyHealthResponse = {
    companyId: context.companyId,
    overallStatus,
    signals,
    checkedAt: now,
  };

  return NextResponse.json(response);
}
