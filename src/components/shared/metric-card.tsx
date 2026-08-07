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
        "rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all duration-200",
        // Left accent border (4px), visible when accent !== "none"
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
        "before:transition-all before:duration-300",
        accent !== "none" && ACCENT_LEFT_BORDER[accent],
        onClick && "hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_1px_0_var(--hairline),0_4px_16px_-6px_rgba(17,17,15,0.10)] active:scale-[0.99]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row: tinted icon container + label + status dot */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-[6px] transition-transform group-hover:scale-105",
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

      {/* Value */}
      <div
        className={cn(
          "mt-3 font-serif text-[30px] leading-none tabular-nums tracking-tight",
          colorClassName ?? "text-[var(--ink-primary)]",
        )}
      >
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} duration={1.2} />
      </div>

      {/* Trend */}
      {trend && (
        <p className="mt-2 text-[11px] font-medium text-[var(--ink-secondary)]">{trend}</p>
      )}
    </Wrapper>
  );
}
