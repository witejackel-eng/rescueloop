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
