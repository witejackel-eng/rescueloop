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
        "group relative block w-full text-left",
        "rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all duration-200",
        onClick && "hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_1px_0_var(--hairline),0_4px_12px_-6px_rgba(17,17,15,0.08)] active:scale-[0.99]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center gap-2 text-[var(--ink-muted)]">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-[0.06em]">
          {label}
        </span>
        {accent !== "none" && (
          <span
            aria-hidden
            className={cn(
              "ml-auto size-1.5 rounded-full",
              ACCENT_COLORS[accent],
            )}
          />
        )}
      </div>

      {/* Value */}
      <div
        className={cn(
          "mt-2 font-serif text-[28px] leading-none tabular-nums",
          colorClassName ?? "text-[var(--ink-primary)]",
        )}
      >
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} duration={1.2} />
      </div>

      {/* Trend */}
      {trend && (
        <p className="mt-1.5 text-[10px] text-[var(--ink-muted)]">{trend}</p>
      )}
    </Wrapper>
  );
}
