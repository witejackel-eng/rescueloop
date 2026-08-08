"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { KPIS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

/**
 * ROI panel — based on CONFIRMED value only (per the spec).
 * Shows:
 *   - Plan price: $29/month (mono)
 *   - Confirmed value this period: $0 (mono)
 *   - Confirmed value-to-cost: 0× (large, serif)
 *   - Break-even recoveries: "1 recovery covers 1 month" (since $79 > $29)
 *   - Methodology link (expandable)
 */
export function RoiPanel() {
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const planCost = KPIS.planCost;
  const confirmedValue = KPIS.confirmedRecoveredRevenue;
  const ratio = KPIS.confirmedValueToCost;

  // Proportional widths for the ratio bar.
  const total = planCost + confirmedValue;
  const costPct = Math.round((planCost / total) * 100);
  const valuePct = 100 - costPct;

  return (
    <div className="border border-[var(--hairline)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
          Return on plan cost
        </h2>
        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
          Confirmed value only
        </span>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
        {/* Left: headline ratio */}
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--hairline)] p-5 lg:col-span-2 lg:border-b-0 lg:border-r">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Confirmed value-to-cost
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-[64px] leading-none text-[var(--recovery-green)]">
                <AnimatedCounter value={ratio} decimals={1} />
                <span className="text-[40px]">×</span>
              </span>
            </div>
            <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
              ROI is calculated using confirmed value only. Estimated and strongly associated
              tiers are excluded.
            </p>
          </div>

          <div className="flex items-center gap-4 border-t border-[var(--hairline)] pt-3">
            <div>
              <p className="text-[11px] text-[var(--ink-muted)]">Plan cost</p>
              <p className="font-mono text-[15px] font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatCurrency(planCost)}
                <span className="ml-1 text-[11px] font-normal text-[var(--ink-muted)]">/month</span>
              </p>
            </div>
            <div className="h-6 w-px bg-[var(--hairline)]" />
            <div>
              <p className="text-[11px] text-[var(--ink-muted)]">Confirmed recovered</p>
              <p className="font-mono text-[15px] font-semibold tabular-nums text-[var(--ink-primary)]">
                <AnimatedCounter value={confirmedValue} prefix="$" />
              </p>
            </div>
          </div>
        </div>

        {/* Right: ratio bar + break-even + methodology */}
        <div className="flex flex-col gap-4 p-5 lg:col-span-3">
          {/* Ratio bar */}
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="text-[var(--ink-muted)]">Plan cost vs. confirmed value recovered</span>
              <span className="font-mono text-[var(--ink-muted)]">
                {formatCurrency(planCost)} → {formatCurrency(confirmedValue)}
              </span>
            </div>
            <div className="flex h-8 w-full overflow-hidden border border-[var(--hairline)]">
              <div
                className="flex items-center justify-center bg-[var(--hairline)] font-mono text-[10px] font-medium text-[var(--ink-secondary)]"
                style={{ width: `${costPct}%` }}
                title={`Plan cost: ${formatCurrency(planCost)}`}
              >
                {costPct >= 8 ? `${costPct}%` : null}
              </div>
              <div
                className="flex items-center justify-center bg-[var(--recovery-green)] font-mono text-[10px] font-semibold text-white"
                style={{ width: `${valuePct}%` }}
                title={`Confirmed value: ${formatCurrency(confirmedValue)}`}
              >
                {valuePct}%
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--ink-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 bg-[var(--hairline)]" />
                Plan cost
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 bg-[var(--recovery-green)]" />
                Confirmed value recovered
              </span>
            </div>
          </div>

          {/* Break-even */}
          <div className="border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Break-even
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-primary)]">
              <span className="font-semibold">1 recovery covers 1 month</span> of plan cost — a
              single retained member (${KPIS.planCost + 50}/mo) more than pays for RescueLoop.
            </p>
          </div>

          {/* Methodology expandable */}
          <div className="border-t border-[var(--hairline)] pt-3">
            <button
              type="button"
              onClick={() => setMethodologyOpen((o) => !o)}
              aria-expanded={methodologyOpen}
              className="flex w-full items-center justify-between text-[11px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            >
              <span>Methodology</span>
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  methodologyOpen && "rotate-180",
                )}
              />
            </button>
            {methodologyOpen && (
              <div className="mt-2 flex flex-col gap-2 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                <p>
                  <span className="font-medium text-[var(--ink-primary)]">Confirmed value</span>{" "}
                  is the sum of value events where evidence directly links an intervention to a
                  recovered payment (cancellation reversed, member activated, lesson completed
                  after contact within a verifiable window).
                </p>
                <p>
                  <span className="font-medium text-[var(--ink-primary)]">Strongly associated</span>{" "}
                  and <span className="font-medium text-[var(--ink-primary)]">estimated</span>{" "}
                  values are intentionally excluded from the ROI calculation.
                </p>
                <p>
                  Value-to-cost = confirmed value ÷ plan cost. Period is rolling 30 days.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
