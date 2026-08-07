"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * ChartTooltip — premium custom tooltip for recharts charts.
 *
 * Designed for use with Area, Bar, Pie, and Line charts. Provides:
 *  - Card with surface background, hairline border, soft shadow
 *  - Serif label at top (optional, via `label` / `labelFormatter`)
 *  - Each payload item with color dot, name, and value (mono tabular-nums)
 *  - Subtle entrance animation (fade + scale + slide-up), respects
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

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  const prefersReduced = useReducedMotion();

  if (!active || !payload || payload.length === 0) return null;

  const motionProps = prefersReduced
    ? { initial: false, animate: { opacity: 1, y: 0, scale: 1 } }
    : {
        initial: { opacity: 0, y: 4, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
      };

  const showLabel = label !== undefined && label !== null && label !== "";

  return (
    <motion.div
      {...motionProps}
      className="min-w-[10rem] max-w-[18rem] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 shadow-[0_8px_24px_-8px_rgba(17,17,15,0.18)] dark:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
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

          return (
            <div
              key={`${String(item.dataKey ?? rawName)}-${idx}`}
              className="flex items-center gap-2 text-[12px] leading-tight"
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full ring-1 ring-[var(--hairline-subtle)]"
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
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ChartTooltip;
