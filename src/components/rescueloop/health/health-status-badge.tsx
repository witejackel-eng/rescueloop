"use client";

// ─────────────────────────────────────────────────────────────
// PX02 — Health Status Badge
// Visual indicator for a health domain's status.
// ─────────────────────────────────────────────────────────────

import type { HealthStatus } from "@/lib/types/health";
import { cn } from "@/lib/utils";

interface HealthStatusBadgeProps {
  status: HealthStatus;
  /** Show label text alongside the dot */
  showLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  HealthStatus,
  {
    label: string;
    dotClass: string;
    labelClass: string;
    ringClass: string;
  }
> = {
  healthy: {
    label: "Healthy",
    dotClass: "bg-[var(--recovery-green)]",
    labelClass: "text-[var(--recovery-green)]",
    ringClass: "ring-[var(--recovery-light)]",
  },
  degraded: {
    label: "Degraded",
    dotClass: "bg-[var(--warning)]",
    labelClass: "text-[var(--warning)]",
    ringClass: "ring-[var(--warning-light)]",
  },
  unhealthy: {
    label: "Unhealthy",
    dotClass: "bg-[var(--critical)]",
    labelClass: "text-[var(--critical)]",
    ringClass: "ring-[var(--critical-light)]",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-[var(--ink-muted)]",
    labelClass: "text-[var(--ink-muted)]",
    ringClass: "ring-[var(--hairline-subtle)]",
  },
};

export function HealthStatusBadge({
  status,
  showLabel = true,
  size = "md",
}: HealthStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const dotSize = size === "sm" ? "size-1.5" : "size-2";
  const textSize = size === "sm" ? "text-[11px]" : "text-[12px]";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "shrink-0 rounded-full ring-2",
          dotSize,
          config.dotClass,
          config.ringClass,
          // Pulse animation for non-healthy
          status !== "healthy" && "animate-pulse",
        )}
      />
      {showLabel && (
        <span className={cn("font-medium tabular-nums", textSize, config.labelClass)}>
          {config.label}
        </span>
      )}
    </span>
  );
}
