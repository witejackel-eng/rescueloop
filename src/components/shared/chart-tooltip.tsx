"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * ChartTooltip — premium custom tooltip for recharts charts.
 *
 * Designed for use with Area, Bar, Pie, and Line charts. Provides:
 *  - Card with surface background, hairline border, enhanced shadow
 *  - Serif label at top (optional, via `label` / `labelFormatter`)
 *  - Each payload item with color dot, name, and value (mono tabular-nums)
 *  - Subtle pulse animation on the active data point dot
 *  - Optional comparison indicator (vs previous period)
 *  - Smooth entrance animation (scale from 0.95 → 1 + fade), respects
 *    prefers-reduced-motion
 *  - Dark mode compatible (uses CSS variables exclusively)
 *
 * Usage:
 *   <Tooltip content={<ChartTooltip />} />
 *   <Tooltip content={<ChartTooltip labelFormatter={(l) => `Week of ${l}`} />} />
 *   <Tooltip content={<ChartTooltip formatter={(v, name) => [`${v}%`, name]} />} />
 *
 * Props mirror recharts TooltipProps for active/payload/label. `formatter`
 * receives (value, name) and may return a [value, name] tuple or a ReactNode.
 * `labelFormatter` receives the raw label and returns a ReactNode.
 *
 * To show a comparison indicator, pass `comparisons` — a map from dataKey
 * (or name) to `{ value: number, label?: string }`. The tooltip will render
 * a delta arrow + percentage next to matching items.
 */

// Recharts payload item shape (subset we consume).
export interface ChartTooltipPayloadItem {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown> & {
    range?: string;
    color?: string;
    fill?: string;
    stroke?: string;
  };
}

export interface ComparisonValue {
  /** The comparison (previous period) value. */
  value: number;
  /** Optional label like "vs prev. period". Default: "vs prev." */
  label?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
  /** Format each payload value. Return [value, name] or a ReactNode. */
  formatter?: (
    value: number | string | Array<number | string> | undefined,
    name: string | number | undefined,
    item: ChartTooltipPayloadItem,
  ) => [React.ReactNode, React.ReactNode] | React.ReactNode;
  /** Format the label at the top of the tooltip. */
  labelFormatter?: (label: string | number | undefined) => React.ReactNode;
  /** Comparison data keyed by dataKey or name. */
  comparisons?: Record<string, ComparisonValue>;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) {
    return value.map((v) => formatValue(v)).join(" – ");
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value);
}

function ComparisonIndicator({
  current,
  comparison,
}: {
  current: number;
  comparison: ComparisonValue;
}) {
  if (comparison.value === 0) return null;
  const delta = current - comparison.value;
  const pct = ((delta / Math.abs(comparison.value)) * 100).toFixed(1);
  const isUp = delta > 0;
  const isFlat = delta === 0;

  if (isFlat) {
    return (
      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-[var(--ink-muted)]">
        <Minus className="size-2.5" />
        <span>0%</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "ml-1.5 inline-flex items-center gap-0.5 text-[10px]",
        isUp ? "text-[var(--recovery-green)]" : "text-[var(--critical)]",
      )}
    >
      {isUp ? (
        <TrendingUp className="size-2.5" />
      ) : (
        <TrendingDown className="size-2.5" />
      )}
      <span className="font-mono tabular-nums">
        {isUp ? "+" : ""}
        {pct}%
      </span>
      {comparison.label && (
        <span className="text-[var(--ink-muted)]"> {comparison.label}</span>
      )}
    </span>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  comparisons,
}: ChartTooltipProps) {
  const prefersReduced = useReducedMotion();

  if (!active || !payload || payload.length === 0) return null;

  const motionProps = prefersReduced
    ? { initial: false, animate: { opacity: 1, y: 0, scale: 1 } }
    : {
        initial: { opacity: 0, y: 4, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
      };

  const showLabel = label !== undefined && label !== null && label !== "";

  return (
    <motion.div
      {...motionProps}
      className="min-w-[10rem] max-w-[18rem] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 shadow-[0_8px_30px_-8px_rgba(17,17,15,0.22)] dark:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.55)]"
      role="tooltip"
    >
      {showLabel && (
        <p className="mb-1.5 font-serif text-[12px] leading-tight text-[var(--ink-primary)]">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item, idx) => {
          const dotColor =
            item.color ??
            item.payload?.color ??
            item.payload?.fill ??
            item.payload?.stroke ??
            "var(--ink-muted)";
          const rawName = item.name ?? item.dataKey ?? "value";
          const rawValue = item.value;

          let valueNode: React.ReactNode = formatValue(rawValue);
          let nameNode: React.ReactNode = String(rawName);

          if (formatter) {
            const result = formatter(rawValue, rawName, item);
            if (Array.isArray(result)) {
              [valueNode, nameNode] = result;
            } else if (result !== undefined) {
              valueNode = result;
            }
          }

          // Optional range label for pie/donut charts (payload.range).
          const rangeLabel =
            item.payload && typeof item.payload.range === "string"
              ? item.payload.range
              : null;

          // Comparison indicator
          const compKey = String(item.dataKey ?? rawName);
          const comp = comparisons?.[compKey];
          const numericValue =
            typeof rawValue === "number"
              ? rawValue
              : typeof rawValue === "string"
                ? parseFloat(rawValue)
                : undefined;

          return (
            <div
              key={`${String(item.dataKey ?? rawName)}-${idx}`}
              className="flex items-center gap-2 text-[12px] leading-tight"
            >
              <span
                aria-hidden
                className="relative size-2 shrink-0 rounded-full ring-1 ring-[var(--hairline-subtle)] chart-point-pulse"
                style={{
                  backgroundColor: dotColor,
                }}
              />
              <span className="min-w-0 flex-1 truncate text-[var(--ink-secondary)]">
                {nameNode}
                {rangeLabel && (
                  <span className="ml-1 text-[var(--ink-muted)]">
                    ({rangeLabel})
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono font-medium tabular-nums text-[var(--ink-primary)]">
                {valueNode}
              </span>
              {comp && numericValue !== undefined && !isNaN(numericValue) && (
                <ComparisonIndicator current={numericValue} comparison={comp} />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ChartTooltip;
