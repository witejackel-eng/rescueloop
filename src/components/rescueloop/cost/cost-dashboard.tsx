"use client";

// ─────────────────────────────────────────────────────────────
// PX05 — Cost Dashboard
// Internal planning dashboard for per-tenant cost estimation.
// This is NOT accounting truth.
// ─────────────────────────────────────────────────────────────

import { useState, type FC } from "react";
import type { TenantCostEstimate, CostSummary, CostPlan } from "@/lib/types/cost";
import { PLAN_PRICING } from "@/lib/types/cost";
import { TenantCostRow } from "./tenant-cost-row";
import { MarginIndicator } from "./margin-indicator";
import { RateCardViewer } from "./rate-card-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, TrendingUp } from "lucide-react";

interface CostDashboardProps {
  estimates: TenantCostEstimate[];
  summary: CostSummary;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
          {label}
        </span>
      </div>
      <span className="font-mono text-[18px] font-semibold tabular-nums text-[var(--ink-primary)]">
        {value}
      </span>
    </div>
  );
}

export const CostDashboard: FC<CostDashboardProps> = ({ estimates, summary }) => {
  const [showRateCard, setShowRateCard] = useState(false);
  const sortedEstimates = [...estimates].sort((a, b) => b.mrr - a.mrr);
  const plans: CostPlan[] = ["rescue", "growth", "scale"];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
            Cost Guardrails
          </h1>
          <p className="mt-1.5 text-[12px] text-[var(--ink-muted)]">
            Internal planning estimates — not accounting truth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRateCard(!showRateCard)}
            className="rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
          >
            {showRateCard ? "Hide" : "Show"} Rate Card
          </button>
          {summary.alerts.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {summary.alerts.length} alert{summary.alerts.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </header>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Total MRR"
          value={`$${summary.totalMRR.toLocaleString()}`}
          icon={DollarSign}
          accent="text-[var(--recovery-green)]"
        />
        <MetricCard
          label="Total Est. Cost"
          value={`$${summary.totalCost.toFixed(0)}`}
          icon={TrendingUp}
          accent="text-[var(--warning)]"
        />
        <MetricCard
          label="Contribution Margin"
          value={`$${summary.totalContributionMargin.toFixed(0)}`}
          icon={DollarSign}
          accent="text-[var(--recovery-green)]"
        />
        <div className="flex flex-col gap-1 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[var(--recovery-green)]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Blended Margin
            </span>
          </div>
          <MarginIndicator marginPercent={summary.blendedMarginPercent} size="lg" />
        </div>
      </div>

      {/* By-plan breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {plans.map((plan) => {
          const data = summary.byPlan[plan];
          return (
            <div
              key={plan}
              className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--ink-secondary)]">
                  {PLAN_PRICING[plan].label}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                  {data.count} tenant{data.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-[var(--ink-muted)]">MRR</span>
                  <p className="font-mono text-[12px] tabular-nums font-medium">
                    ${data.totalMRR.toFixed(0)}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--ink-muted)]">Avg margin</span>
                  <div className="mt-0.5">
                    <MarginIndicator marginPercent={data.avgMargin} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tenant cost table */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                <th className="px-2 py-2.5 text-left font-medium">Tenant</th>
                <th className="px-2 py-2.5 text-left font-medium">Plan</th>
                <th className="px-2 py-2.5 text-right font-medium">MRR</th>
                <th className="px-2 py-2.5 text-right font-medium">Members</th>
                <th className="px-2 py-2.5 text-right font-medium">Events</th>
                <th className="px-2 py-2.5 text-right font-medium">Jobs</th>
                <th className="px-2 py-2.5 text-right font-medium">Calls</th>
                <th className="px-2 py-2.5 text-right font-medium">Est. Cost</th>
                <th className="px-2 py-2.5 text-right font-medium">Margin $</th>
                <th className="px-2 py-2.5 text-right font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {sortedEstimates.map((e) => (
                <TenantCostRow key={e.tenantId} estimate={e} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* High-cost alerts */}
      {summary.alerts.length > 0 && (
        <Card className="border-[var(--critical)] border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[13px]">
              <AlertTriangle className="h-4 w-4 text-[var(--critical)]" />
              High-Cost Tenant Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {summary.alerts.map((alert) => (
                <div
                  key={alert.tenantId}
                  className="flex items-center justify-between rounded-[6px] bg-[var(--critical-light)] px-3 py-2 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink-primary)]">
                      {alert.tenantName}
                    </span>
                    <Badge
                      variant={alert.alertType === "negative_margin" ? "destructive" : "secondary"}
                      className="text-[9px]"
                    >
                      {alert.alertType === "negative_margin" ? "Negative" : "Low"} margin
                    </Badge>
                  </div>
                  <span className="font-mono tabular-nums text-[var(--critical)]">
                    {alert.marginPercent.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] italic text-[var(--ink-muted)]">
              These estimates do NOT change customer entitlement. Internal planning only.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rate Card (toggle) */}
      {showRateCard && <RateCardViewer />}
    </div>
  );
};
