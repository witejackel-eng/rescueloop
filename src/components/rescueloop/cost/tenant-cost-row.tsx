"use client";

// ─────────────────────────────────────────────────────────────
// PX05 — Tenant Cost Row
// Per-tenant row in the cost dashboard table.
// ─────────────────────────────────────────────────────────────

import { useState, type FC } from "react";
import type { TenantCostEstimate } from "@/lib/types/cost";
import { PLAN_PRICING } from "@/lib/types/cost";
import { MarginIndicator } from "./margin-indicator";
import { CostBreakdown } from "./cost-breakdown";
import { ChevronRight } from "lucide-react";

interface TenantCostRowProps {
  estimate: TenantCostEstimate;
}

export const TenantCostRow: FC<TenantCostRowProps> = ({ estimate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="group cursor-pointer border-b border-[var(--hairline)] transition-colors hover:bg-[var(--surface-hover)]"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Tenant */}
        <td className="py-2.5 pr-2 text-[12px] font-medium text-[var(--ink-primary)]">
          <div className="flex items-center gap-1.5">
            <ChevronRight
              className={`h-3 w-3 text-[var(--ink-muted)] transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
            {estimate.tenantName}
          </div>
        </td>

        {/* Plan */}
        <td className="py-2.5 px-2 text-[11px]">
          <span className="inline-flex items-center rounded-[4px] bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-medium text-[var(--ink-secondary)]">
            {PLAN_PRICING[estimate.plan].label}
          </span>
        </td>

        {/* MRR */}
        <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
          ${estimate.mrr.toLocaleString()}
        </td>

        {/* Members */}
        <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
          {estimate.members}
        </td>

        {/* Events */}
        <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
          {estimate.events.toLocaleString()}
        </td>

        {/* Jobs */}
        <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
          {estimate.jobs.toLocaleString()}
        </td>

        {/* Provider Calls */}
        <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
          {estimate.providerCalls.toLocaleString()}
        </td>

        {/* Est. Cost */}
        <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
          ${estimate.totalCost.toFixed(2)}
        </td>

        {/* Contribution Margin */}
        <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
          ${estimate.contributionMargin.toFixed(2)}
        </td>

        {/* Margin % */}
        <td className="py-2.5 pl-2 text-right">
          <MarginIndicator marginPercent={estimate.marginPercent} size="sm" />
        </td>
      </tr>

      {/* Expanded breakdown */}
      {expanded && (
        <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
          <td colSpan={10} className="px-6 py-3">
            <CostBreakdown
              breakdown={estimate.costBreakdown}
              totalInfrastructure={estimate.totalInfrastructure}
              totalPaymentProcessing={estimate.totalPaymentProcessing}
              totalCost={estimate.totalCost}
            />
          </td>
        </tr>
      )}
    </>
  );
};
