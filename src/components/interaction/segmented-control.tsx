"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springSegment } from "@/design-system/motion";

interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
  size = "md",
  ariaLabel,
}: SegmentedControlProps<T>) {
  const selectedIndex = segments.findIndex((s) => s.value === value);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (index + 1) % segments.length;
      onChange(segments[next].value);
      (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (index - 1 + segments.length) % segments.length;
      onChange(segments[prev].value);
      (e.currentTarget.parentElement?.children[prev] as HTMLElement)?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center gap-0.5 overflow-x-auto rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0.5",
        size === "sm" && "p-0.5",
        className,
      )}
    >
      {segments.map((seg, i) => {
        const active = i === selectedIndex;
        return (
          <button
            key={seg.value}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(seg.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "relative z-10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]",
              active
                ? "text-[var(--ink-primary)]"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]",
            )}
          >
            {active && (
              <motion.span
                layoutId={`segment-bg-${ariaLabel ?? "ctrl"}`}
                transition={springSegment}
                className="absolute inset-0 z-[-1] rounded-[8px] bg-[var(--surface)] shadow-[0_1px_2px_rgba(17,17,15,0.08),0_0_0_1px_var(--hairline)]"
              />
            )}
            {seg.label}
            {seg.count !== undefined && (
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  active ? "text-[var(--ink-secondary)]" : "text-[var(--ink-muted)]",
                )}
              >
                {seg.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
