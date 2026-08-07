"use client";

import { Card } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/interaction/animated-counter";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: string;
  /** Tailwind color class for the value, e.g. "text-[var(--warning)]". */
  colorClassName?: string;
  /** Optional small accent dot (e.g. status indicator). */
  accent?: "none" | "warning" | "critical" | "info" | "recovery";
  format?: "integer" | "currency" | "percent";
  /** Optional click handler — when provided, card becomes interactive. */
  onClick?: () => void;
  delay?: number;
  /** Enable glassmorphism effect */
  glass?: boolean;
  /** Enable gradient accent strip at top */
  gradientStrip?: boolean;
  /** Enable shimmer border on hover */
  shimmerBorder?: boolean;
}

const ACCENT_COLORS: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  none: "bg-transparent",
  warning: "bg-[var(--warning)]",
  critical: "bg-[var(--critical)]",
  info: "bg-[var(--info)]",
  recovery: "bg-[var(--recovery-green)]",
};

// Map accent to icon container background + icon color + left border
const ACCENT_CONTAINER: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  none: "bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]",
  warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
  critical: "bg-[var(--critical)]/10 text-[var(--critical)]",
  info: "bg-[var(--info)]/10 text-[var(--info)]",
  recovery: "bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]",
};

const ACCENT_LEFT_BORDER: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  none: "",
  warning: "before:bg-[var(--warning)]",
  critical: "before:bg-[var(--critical)]",
  info: "before:bg-[var(--info)]",
  recovery: "before:bg-[var(--recovery-green)]",
};

// Map accent to gradient strip class
const ACCENT_GRADIENT_STRIP: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  none: "gradient-strip",
  warning: "gradient-strip gradient-strip-warning",
  critical: "gradient-strip gradient-strip-critical",
  info: "gradient-strip gradient-strip-info",
  recovery: "gradient-strip gradient-strip-recovery",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  colorClassName,
  accent = "none",
  format = "integer",
  onClick,
  delay = 0,
  glass = false,
  gradientStrip = false,
  shimmerBorder = false,
}: MetricCardProps) {
  const prefix = format === "currency" ? "$" : "";
  const suffix = format === "percent" ? "%" : "";

  const Wrapper: React.ElementType = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative block w-full overflow-hidden text-left",
        "rounded-[10px] p-4",
        // Base border/background
        glass
          ? "glass"
          : "border border-[var(--hairline)] bg-[var(--surface)]",
        // Gradient strip at top
        gradientStrip && ACCENT_GRADIENT_STRIP[accent],
        // Shimmer border on hover
        shimmerBorder && "shimmer-border",
        // Inner shadow for depth
        "metric-card-depth",
        // Hover lift animation
        "metric-card-hover",
        // Left accent border (4px), visible when accent !== "none" — uses inner ::before offset
        accent !== "none" && ACCENT_LEFT_BORDER[accent],
        onClick && "hover:border-[var(--hairline-strong)] active:scale-[0.99]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Inner gradient overlay for subtle depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-[var(--recovery-green)]/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Left accent border (3px) — positioned inside to not conflict with gradient-strip */}
      {accent !== "none" && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-[3px] rounded-l-[inherit] transition-all duration-300",
            accent === "warning" && "bg-[var(--warning)]",
            accent === "critical" && "bg-[var(--critical)]",
            accent === "info" && "bg-[var(--info)]",
            accent === "recovery" && "bg-[var(--recovery-green)]",
          )}
        />
      )}

      {/* Top row: tinted icon container + label + status dot */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-[6px] transition-transform duration-200 group-hover:scale-110",
            ACCENT_CONTAINER[accent],
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          {label}
        </span>
        {accent !== "none" && (
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              ACCENT_COLORS[accent],
            )}
          />
        )}
      </div>

      {/* Value — larger font, tighter letter-spacing */}
      <div
        className={cn(
          "mt-3 font-serif text-[32px] leading-none tabular-nums tracking-[-0.03em]",
          colorClassName ?? "text-[var(--ink-primary)]",
        )}
      >
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} duration={1.2} />
      </div>

      {/* Trend — more prominent */}
      {trend && (
        <p className="mt-2 text-[11px] font-semibold text-[var(--ink-secondary)]">{trend}</p>
      )}
    </Wrapper>
  );
}
