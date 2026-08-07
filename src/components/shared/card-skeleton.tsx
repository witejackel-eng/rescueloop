"use client";

import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  className?: string;
  /** Show a label-style header shimmer at top. */
  showHeader?: boolean;
  /** Number of body rows to shimmer. */
  rows?: number;
}

/**
 * Lightweight loading placeholder that matches the RescueLoop card aesthetic
 * (square corners, hairline border, surface background, mono shimmer).
 */
export function CardSkeleton({ className, showHeader = true, rows = 3 }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5",
        className,
      )}
    >
      {showHeader && (
        <div className="mb-4 h-3.5 w-1/3 animate-pulse rounded-[3px] bg-[var(--hairline)]" />
      )}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 animate-pulse rounded-[2px] bg-[var(--hairline)]"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

interface MetricSkeletonProps {
  className?: string;
}

export function MetricSkeleton({ className }: MetricSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="size-3.5 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
        <div className="h-2.5 w-20 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
      </div>
      <div className="mt-3 h-7 w-16 animate-pulse rounded-[3px] bg-[var(--hairline)]" />
      <div className="mt-2 h-2 w-24 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
    </div>
  );
}

interface TableSkeletonProps {
  className?: string;
  /** Show a card header with title + action placeholder. */
  showHeader?: boolean;
  /** Number of data rows to shimmer. */
  rows?: number;
  /** Number of columns in the table. */
  columns?: number;
}

/**
 * Table-style skeleton for list/table-heavy pages (Rescue Queue, Members, Activity).
 * Matches the project's table aesthetic: hairline borders, surface background,
 * padded rows, and a column-header band.
 */
export function TableSkeleton({
  className,
  showHeader = true,
  rows = 5,
  columns = 4,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)]",
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3.5">
          <div className="h-3.5 w-36 animate-pulse rounded-[3px] bg-[var(--hairline)]" />
          <div className="h-6 w-20 animate-pulse rounded-[4px] bg-[var(--hairline)]" />
        </div>
      )}
      {/* Column header band */}
      <div
        className="grid gap-4 border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-2.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`col-${i}`}
            className="h-2.5 animate-pulse rounded-[2px] bg-[var(--hairline)]"
            style={{ width: `${Math.max(35, 80 - i * 12)}%` }}
          />
        ))}
      </div>
      {/* Data rows */}
      <div className="divide-y divide-[var(--hairline-subtle)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`row-${r}`}
            className="grid gap-4 px-5 py-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={`cell-${r}-${c}`}
                className="h-2.5 animate-pulse rounded-[2px] bg-[var(--hairline)]"
                style={{ width: `${Math.max(40, 90 - ((r + c) % 4) * 14)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartSkeletonProps {
  className?: string;
  /** Show a card header with title + legend placeholders. */
  showHeader?: boolean;
  /** Height of the chart area in px. */
  height?: number;
  /** Number of bars in the chart placeholder. */
  bars?: number;
}

/**
 * Chart-style skeleton for analytics-heavy pages (Analytics, Insights, Outcomes).
 * Renders a header band plus a faux bar-chart with x-axis labels.
 */
export function ChartSkeleton({
  className,
  showHeader = true,
  height = 240,
  bars = 12,
}: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5",
        className,
      )}
    >
      {showHeader && (
        <div className="mb-5 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3.5 w-36 animate-pulse rounded-[3px] bg-[var(--hairline)]" />
            <div className="h-2.5 w-24 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-12 animate-pulse rounded-[3px] bg-[var(--hairline)]" />
            <div className="h-5 w-12 animate-pulse rounded-[3px] bg-[var(--hairline)]" />
          </div>
        </div>
      )}
      {/* Faux bar chart */}
      <div className="relative" style={{ height }}>
        <div className="flex h-full items-end gap-1.5">
          {Array.from({ length: bars }).map((_, i) => {
            const pct = 38 + Math.sin(i * 0.9) * 22 + (i % 3) * 10;
            return (
              <div
                key={`bar-${i}`}
                className="flex-1 animate-pulse rounded-t-[2px] bg-[var(--hairline)]"
                style={{ height: `${Math.min(96, Math.max(20, pct))}%` }}
              />
            );
          })}
        </div>
      </div>
      {/* X-axis labels */}
      <div className="mt-3 flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`label-${i}`}
            className="h-2 w-10 animate-pulse rounded-[2px] bg-[var(--hairline)]"
          />
        ))}
      </div>
    </div>
  );
}
