"use client";

// ─────────────────────────────────────────────────────────────
// PX05 — Cost Breakdown Detail
// Expandable breakdown of cost line items for a tenant.
// ─────────────────────────────────────────────────────────────

import type { FC } from "react";
import type { CostLineItem } from "@/lib/types/cost";

interface CostBreakdownProps {
  breakdown: CostLineItem[];
  totalInfrastructure: number;
  totalPaymentProcessing: number;
  totalCost: number;
}

const CATEGORY_STYLES: Record<string, string> = {
  infrastructure: "text-[var(--ink-secondary)]",
  payment_processing: "text-[var(--info)]",
  support: "text-[var(--warning)]",
  other: "text-[var(--ink-muted)]",
};

const CATEGORY_ICONS: Record<string, string> = {
  infrastructure: "⬡",
  payment_processing: "💳",
  support: "🎧",
  other: "·",
};

export const CostBreakdown: FC<CostBreakdownProps> = ({
  breakdown,
  totalInfrastructure,
  totalPaymentProcessing,
  totalCost,
}) => {
  return (
    <div className="flex flex-col gap-1">
      {/* Line items */}
      {breakdown.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-1 text-[11px]"
        >
          <span className={`flex items-center gap-1.5 ${CATEGORY_STYLES[item.category] ?? ""}`}>
            <span className="text-[9px] opacity-60">
              {CATEGORY_ICONS[item.category] ?? "·"}
            </span>
            {item.label}
          </span>
          <span className="font-mono tabular-nums text-[var(--ink-primary)]">
            ${item.amount.toFixed(2)}
          </span>
        </div>
      ))}

      {/* Sub-totals */}
      <div className="mt-1 border-t border-[var(--hairline)] pt-1">
        <div className="flex items-center justify-between py-0.5 text-[11px]">
          <span className="text-[var(--ink-secondary)]">Infrastructure subtotal</span>
          <span className="font-mono tabular-nums">
            ${totalInfrastructure.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between py-0.5 text-[11px]">
          <span className="text-[var(--info)]">Payment processing subtotal</span>
          <span className="font-mono tabular-nums">
            ${totalPaymentProcessing.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Grand total */}
      <div className="flex items-center justify-between border-t border-[var(--hairline-strong)] pt-1.5 text-[11px] font-semibold">
        <span>Total estimated cost</span>
        <span className="font-mono tabular-nums">${totalCost.toFixed(2)}</span>
      </div>
    </div>
  );
};
