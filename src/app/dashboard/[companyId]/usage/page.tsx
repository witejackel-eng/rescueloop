// /dashboard/[companyId]/usage
//
// Real plan and consumption information. Uses computeEntitlement
// and getUsageSummary from the entitlement engine. Shows per-metric
// usage with warning levels, grace period info, and manage URL.
//
// If computeEntitlement/getUsageSummary throw (e.g. DB unavailable),
// shows an error state rather than crashing.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import { db } from "@/lib/db";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { computeEntitlement, getUsageSummary } from "@/lib/billing/entitlement-engine";
import type { MetricUsageSummary, WarningLevel } from "@/lib/billing/entitlement-engine";
import { METRIC_LABELS } from "@/lib/usage/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, AlertTriangle, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsagePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  let ctx;
  try {
    ctx = await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  const organizationId = ctx.organizationId;

  // ─── Fetch entitlement + usage summary ───────────────────────
  let entitlement, metrics;
  try {
    const summary = await getUsageSummary(organizationId);
    entitlement = summary.entitlement;
    metrics = summary.metrics;
  } catch {
    // Entitlement engine threw — show error state instead of crashing
    return (
      <div className="mx-auto max-w-5xl">
        <CompanyPageHeader
          title="Usage"
          description="Plan limits and consumption for this organisation."
        />
        <Card className="border-[var(--critical)]/30">
          <CardContent className="py-8 text-center text-[13px] text-[var(--ink-secondary)]">
            Unable to load usage data. The billing engine may be unavailable — please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Fetch org for billing details ───────────────────────────
  let org;
  try {
    org = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        billingGracePeriodEnds: true,
        billingManageUrl: true,
        entitlementState: true,
      },
    });
  } catch {
    // Non-fatal — org details are supplementary
  }

  const plan = entitlement.limits;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Usage"
        description="Plan limits and consumption for this organisation."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {entitlement.planTier}
        </Badge>
      </CompanyPageHeader>

      {/* Grace period warning */}
      {entitlement.state === "billing_error" && entitlement.gracePeriodEndsAt && (
        <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
          <AlertTriangle className="size-4 shrink-0 text-[var(--warning)]" />
          <p className="text-[13px] text-[var(--ink-primary)]">
            <span className="font-medium">Payment issue.</span>{" "}
            <span className="text-[var(--ink-secondary)]">
              Grace period ends {entitlement.gracePeriodEndsAt.toLocaleDateString()}.{" "}
              New operations will be blocked after that.
            </span>
          </p>
        </div>
      )}

      {/* Plan overview */}
      <Card className="mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Gauge className="size-4 text-[var(--ink-muted)]" />
            {plan.name} Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Row label="Tier" value={entitlement.planTier} mono />
          <Row label="State" value={
            <Badge variant="outline" className={`font-mono text-[11px] ${entitlementStateColor(entitlement.state)}`}>
              {entitlement.state}
            </Badge>
          } />
          {entitlement.isPilotOverride && (
            <Row label="Override" value="Pilot override active" mono />
          )}
          {entitlement.billingPeriodEnd && (
            <Row label="Period ends" value={entitlement.billingPeriodEnd.toLocaleDateString()} mono />
          )}
          {org?.billingManageUrl && (
            <a
              href={org.billingManageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--recovery-green)] hover:underline"
            >
              Manage subscription
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </CardContent>
      </Card>

      {/* Per-metric usage */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <MetricCard key={m.metric} metric={m} />
        ))}
      </div>
    </div>
  );
}

// ─── Metric card ───────────────────────────────────────────────

function MetricCard({ metric }: { metric: MetricUsageSummary }) {
  const label = METRIC_LABELS[metric.metric] ?? metric.metric;
  const pct = Math.round(metric.percentUsed);
  const isExceeded = metric.warningLevel === "exceeded";
  const isWarning = metric.warningLevel === "warning90" || metric.warningLevel === "warning70";

  return (
    <Card className={isExceeded ? "border-[var(--critical)]/30" : ""}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[12px] text-[var(--ink-secondary)]">{label}</span>
          {isExceeded && <AlertTriangle className="size-3.5 text-[var(--critical)]" />}
          {isWarning && !isExceeded && <AlertTriangle className="size-3.5 text-[var(--warning)]" />}
        </div>
        <div className="font-mono tabular-nums text-[20px] text-[var(--ink-primary)]">
          {metric.current.toLocaleString()}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-[11px] text-[var(--ink-muted)]">
            of {metric.limit === Infinity ? "∞" : metric.limit.toLocaleString()}
          </span>
          <span className={`font-mono text-[11px] ${warningColor(metric.warningLevel)}`}>
            {pct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-[var(--canvas-elevated)]">
          <div
            className={`h-full rounded-full ${warningBarColor(metric.warningLevel)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-[var(--ink-secondary)]">{label}</span>
      <span className={`text-[13px] text-[var(--ink-primary)] ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function entitlementStateColor(state: string): string {
  switch (state) {
    case "active": return "text-[#27966A] border-[#C7E6D5]";
    case "billing_error": return "text-[#D89222] border-[#F5E0C2]";
    case "inactive": return "text-[#C64D45] border-[#E8C9C5]";
    case "pilot_override": return "text-[#4C7ECF] border-[#C9DCF5]";
    default: return "";
  }
}

function warningColor(level: WarningLevel): string {
  switch (level) {
    case "exceeded": return "text-[var(--critical)]";
    case "warning90": return "text-[var(--warning)]";
    case "warning70": return "text-[var(--warning)]";
    default: return "text-[var(--ink-muted)]";
  }
}

function warningBarColor(level: WarningLevel): string {
  switch (level) {
    case "exceeded": return "bg-[var(--critical)]";
    case "warning90": return "bg-[var(--warning)]";
    case "warning70": return "bg-[var(--warning)]";
    default: return "bg-[var(--recovery-green)]";
  }
}
