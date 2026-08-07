// GET /api/dashboard/[companyId]/diagnostics
//
// Returns safe diagnostic info for this company. ALL secrets are redacted.
// This endpoint is for creator-facing diagnostics — never exposes internal
// cost/margin data or raw secrets.
//
// FAIL-CLOSED: Uses requireCompanyAccess() — never returns data without auth.

import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { db } from "@/lib/db";

// ─── Secret redaction ────────────────────────────────────────

const SECRET_PATTERNS = [
  /DATABASE_URL/i,
  /DIRECT_URL/i,
  /WHOP_API_KEY/i,
  /WHOP_WEBHOOK_SECRET/i,
  /STUDENT_LINK_SIGNING_SECRET/i,
  /CRON_SECRET/i,
  /JOB_PROVIDER_SECRET/i,
  /UPSTASH_REDIS_REST_TOKEN/i,
  /SENTRY_DSN/i,
  /SECRET/i,
  /TOKEN/i,
  /PASSWORD/i,
  /API_KEY/i,
  /PRIVATE/i,
  /ENCRYPTED/i,
];

function redactValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (SECRET_PATTERNS.some((p) => p.test(key))) return "[REDACTED]";
  // Also redact values that look like secrets (long base64, URLs with passwords)
  if (value.length > 64 && /^[A-Za-z0-9+/=_-]+$/.test(value)) return "[REDACTED]";
  if (value.includes("//") && value.includes("@") && value.includes(":")) {
    // URL with credentials: postgres://user:pass@host → postgres://[REDACTED]@host
    return value.replace(/\/\/[^@]+@/, "//[REDACTED]@");
  }
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>);
    } else {
      result[key] = redactValue(key, value);
    }
  }
  return result;
}

// ─── Diagnostic types ────────────────────────────────────────

export interface CompanyDiagnosticsResponse {
  companyId: string;
  organization: {
    id: string;
    name: string;
    status: string;
    planTier: string;
    isPaused: boolean;
    timezone: string;
  };
  installation: {
    status: string;
    grantedScopes: string[];
    installedAt: string | null;
  } | null;
  sync: {
    lastSyncState: string | null;
    lastSyncStartedAt: string | null;
    lastSyncCompletedAt: string | null;
    lastSyncError: string | null;
    totalSyncs: number;
  };
  billing: {
    entitlementState: string | null;
    planTier: string | null;
    billingPeriodEnd: string | null;
  };
  usage: {
    currentPeriod: string;
    metrics: Array<{ metric: string; count: number }>;
  };
  webhookHealth: {
    totalReceived: number;
    totalProcessed: number;
    totalFailed: number;
    totalDuplicate: number;
  };
  outboxHealth: {
    pending: number;
    dispatched: number;
    failed: number;
    deadLetter: number;
  };
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

  try {
    // ─── Organization info ────────────────────────────────────
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        status: true,
        planTier: true,
        isPaused: true,
        timezone: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // ─── Installation info ────────────────────────────────────
    const installation = await db.whopInstallation.findFirst({
      where: { organizationId: orgId },
      select: {
        status: true,
        grantedScopes: true,
        installedAt: true,
      },
    });

    // ─── Sync info ───────────────────────────────────────────
    const latestSync = await db.syncExecution.findFirst({
      where: { organizationId: orgId },
      orderBy: { startedAt: "desc" },
      select: {
        state: true,
        startedAt: true,
        completedAt: true,
        errorSummary: true,
      },
    });

    const totalSyncs = await db.syncExecution.count({
      where: { organizationId: orgId },
    });

    // ─── Billing / entitlement ────────────────────────────────
    const entitlement = await db.subscriptionEntitlement.findFirst({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        state: true,
        planTier: true,
        billingPeriodEnd: true,
      },
    });

    // ─── Usage counters ──────────────────────────────────────
    const currentPeriod = now.slice(0, 7);
    const counters = await db.usageCounter.findMany({
      where: { organizationId: orgId, period: currentPeriod },
      select: { metric: true, count: true },
    });

    // ─── Webhook health ──────────────────────────────────────
    const [
      webhooksReceived,
      webhooksProcessed,
      webhooksFailed,
      webhooksDuplicate,
    ] = await Promise.all([
      db.webhookReceipt.count({ where: { organizationId: orgId, status: "received" } }),
      db.webhookReceipt.count({ where: { organizationId: orgId, status: "processed" } }),
      db.webhookReceipt.count({ where: { organizationId: orgId, status: "failed" } }),
      db.webhookReceipt.count({ where: { organizationId: orgId, status: "duplicate" } }),
    ]);

    // ─── Outbox health ───────────────────────────────────────
    const [outboxPending, outboxDispatched, outboxFailed, outboxDeadLetter] =
      await Promise.all([
        db.outboxEvent.count({ where: { organizationId: orgId, state: "pending" } }),
        db.outboxEvent.count({ where: { organizationId: orgId, state: "dispatched" } }),
        db.outboxEvent.count({ where: { organizationId: orgId, state: "failed" } }),
        db.outboxEvent.count({ where: { organizationId: orgId, state: "dead_letter" } }),
      ]);

    // ─── Build response (redacted) ───────────────────────────
    const grantedScopes: string[] = installation
      ? (() => {
          try {
            return JSON.parse(installation.grantedScopes) as string[];
          } catch {
            return [];
          }
        })()
      : [];

    const response: CompanyDiagnosticsResponse = {
      companyId: context.companyId,
      organization: {
        id: org.id,
        name: org.name,
        status: org.status,
        planTier: org.planTier,
        isPaused: org.isPaused,
        timezone: org.timezone,
      },
      installation: installation
        ? {
            status: installation.status,
            grantedScopes,
            installedAt: installation.installedAt.toISOString(),
          }
        : null,
      sync: {
        lastSyncState: latestSync?.state ?? null,
        lastSyncStartedAt: latestSync?.startedAt.toISOString() ?? null,
        lastSyncCompletedAt: latestSync?.completedAt?.toISOString() ?? null,
        lastSyncError: latestSync?.errorSummary ?? null,
        totalSyncs,
      },
      billing: {
        entitlementState: entitlement?.state ?? null,
        planTier: entitlement?.planTier ?? null,
        billingPeriodEnd: entitlement?.billingPeriodEnd.toISOString() ?? null,
      },
      usage: {
        currentPeriod,
        metrics: counters.map((c) => ({ metric: c.metric, count: c.count })),
      },
      webhookHealth: {
        totalReceived: webhooksReceived,
        totalProcessed: webhooksProcessed,
        totalFailed: webhooksFailed,
        totalDuplicate: webhooksDuplicate,
      },
      outboxHealth: {
        pending: outboxPending,
        dispatched: outboxDispatched,
        failed: outboxFailed,
        deadLetter: outboxDeadLetter,
      },
      checkedAt: now,
    };

    // Apply redaction to the entire response as a safety net
    const redacted = redactObject(
      response as unknown as Record<string, unknown>,
    );

    return NextResponse.json(redacted);
  } catch (err) {
    console.error("[api/dashboard/diagnostics] DB error:", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
