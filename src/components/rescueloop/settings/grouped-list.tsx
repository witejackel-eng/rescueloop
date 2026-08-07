"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupedListProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Visual treatment for destructive sections. */
  variant?: "default" | "destructive";
}

/**
 * iOS-style grouped list — used throughout Settings.
 * Title + description header, then a bordered list of rows separated by 1px
 * dividers. No card radii — 1px borders only.
 */
export function GroupedList({
  title,
  description,
  children,
  className,
  variant = "default",
}: GroupedListProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      {(title || description) && (
        <div className="flex flex-col gap-0.5 px-1">
          {title && (
            <h2
              className={cn(
                "font-mono text-[11px] font-semibold uppercase tracking-[0.12em]",
                variant === "destructive"
                  ? "text-[var(--critical)]"
                  : "text-[var(--ink-muted)]",
              )}
            >
              {title}
            </h2>
          )}
          {description && (
            <p className="text-[12px] text-[var(--ink-muted)]">{description}</p>
          )}
        </div>
      )}
      <div
        className={cn(
          "border",
          variant === "destructive"
            ? "border-[var(--critical)]/30"
            : "border-[var(--hairline)]",
          "bg-[var(--surface)]",
        )}
      >
        {children}
      </div>
    </section>
  );
}

interface RowProps {
  label: string;
  description?: string;
  /** Right-aligned value or control. */
  children?: React.ReactNode;
  /** Clicking the row opens a detail screen / sheet. Shows a chevron. */
  onClick?: () => void;
  /** Destructive action row (red text label). */
  destructive?: boolean;
  /** Hide the bottom border (last row). */
  last?: boolean;
}

export function Row({
  label,
  description,
  children,
  onClick,
  destructive,
  last,
}: RowProps) {
  const isButton = !!onClick;
  const Component = isButton ? "button" : "div";
  return (
    <Component
      type={isButton ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
        !last && "border-b border-[var(--hairline)]",
        isButton && "hover:bg-[var(--canvas-elevated)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] font-medium",
            destructive ? "text-[var(--critical)]" : "text-[var(--ink-primary)]",
          )}
        >
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)]">
            {description}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
      {isButton && (
        <ChevronRight
          className={cn(
            "size-4 shrink-0",
            destructive ? "text-[var(--critical)]/70" : "text-[var(--ink-muted)]",
          )}
        />
      )}
    </Component>
  );
}

interface ValueLabelProps {
  children: React.ReactNode;
  /** Mono treatment for numbers/values. */
  mono?: boolean;
  className?: string;
}

export function ValueLabel({ children, mono, className }: ValueLabelProps) {
  return (
    <span
      className={cn(
        "text-[12px]",
        mono ? "font-mono tabular-nums text-[var(--ink-primary)]" : "text-[var(--ink-secondary)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
