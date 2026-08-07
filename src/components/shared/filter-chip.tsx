"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterChipVariant = "default" | "recovery" | "warning" | "critical" | "info";

export interface FilterChipData {
  id: string;
  label: string;
  value: string;
  variant?: FilterChipVariant;
}

interface FilterChipProps {
  label: string;
  value: string;
  variant?: FilterChipVariant;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<FilterChipVariant, { bg: string; border: string; text: string; dot: string }> = {
  default: {
    bg: "bg-[var(--canvas-elevated)]",
    border: "border-[var(--hairline)]",
    text: "text-[var(--ink-secondary)]",
    dot: "bg-[var(--ink-muted)]",
  },
  recovery: {
    bg: "bg-[var(--recovery-light)]/40",
    border: "border-[var(--recovery-green)]/25",
    text: "text-[var(--recovery-green)]",
    dot: "bg-[var(--recovery-green)]",
  },
  warning: {
    bg: "bg-[var(--warning-light)]/40",
    border: "border-[var(--warning)]/25",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
  },
  critical: {
    bg: "bg-[var(--critical-light)]/40",
    border: "border-[var(--critical)]/25",
    text: "text-[var(--critical)]",
    dot: "bg-[var(--critical)]",
  },
  info: {
    bg: "bg-[var(--info)]/8",
    border: "border-[var(--info)]/25",
    text: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
  },
};

export function FilterChip({
  label,
  value,
  variant = "default",
  onRemove,
  onClick,
  className,
}: FilterChipProps) {
  const style = VARIANT_STYLES[variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] select-none",
        style.bg,
        style.border,
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      <span className="font-medium text-[var(--ink-secondary)]">{label}:</span>
      <span className={cn("font-medium", style.text)}>{value}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "ml-0.5 flex size-4 items-center justify-center rounded-full p-0 transition-colors",
            "text-[var(--ink-muted)] hover:bg-[var(--hairline)] hover:text-[var(--ink-primary)]",
          )}
          aria-label={`Remove ${label}: ${value}`}
        >
          <X className="size-2.5" />
        </button>
      )}
    </motion.div>
  );
}

/** Wrapper with AnimatePresence for removing chips smoothly */
export function FilterChipList({
  chips,
  onRemove,
  onClick,
}: {
  chips: FilterChipData[];
  onRemove?: (id: string) => void;
  onClick?: (id: string) => void;
}) {
  return (
    <AnimatePresence mode="popLayout">
      {chips.map((chip) => (
        <FilterChip
          key={chip.id}
          label={chip.label}
          value={chip.value}
          variant={chip.variant}
          onRemove={onRemove ? () => onRemove(chip.id) : undefined}
          onClick={onClick ? () => onClick(chip.id) : undefined}
        />
      ))}
    </AnimatePresence>
  );
}
