"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type TimeRange = "7d" | "30d" | "90d" | "all";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const RANGES: { key: TimeRange; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

/**
 * Segmented time-range pill selector.
 * Used on dashboard overview + other metric-heavy pages.
 */
export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas)] p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Time range"
    >
      {RANGES.map((r) => {
        const active = r.key === value;
        return (
          <button
            key={r.key}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(r.key)}
            className={cn(
              "relative rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
              active
                ? "bg-[var(--surface)] text-[var(--ink-primary)] shadow-[0_0_0_1px_var(--hairline)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]",
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
