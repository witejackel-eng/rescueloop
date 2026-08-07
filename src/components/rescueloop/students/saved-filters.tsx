"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { springLayout } from "@/design-system/motion";

export interface SavedFilterPill {
  id: string;
  label: string;
  count: number;
}

interface SavedFiltersProps {
  pills: SavedFilterPill[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Horizontal scrollable pill row of saved filters.
 * Active pill gets a 2px recovery-green underline via shared layoutId.
 * Native scrollbar hidden for a clean editorial look.
 */
export function SavedFilters({ pills, active, onChange, className }: SavedFiltersProps) {
  return (
    <div
      className={cn(
        "-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="tablist"
      aria-label="Saved filters"
    >
      {pills.map((pill) => {
        const isActive = pill.id === active;
        return (
          <button
            key={pill.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(pill.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors",
              isActive
                ? "text-[var(--ink-primary)]"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]",
            )}
          >
            <span>{pill.label}</span>
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                isActive ? "text-[var(--ink-muted)]" : "text-[var(--ink-muted)]",
              )}
            >
              {pill.count}
            </span>
            {isActive && (
              <motion.span
                layoutId="saved-filter-underline"
                transition={springLayout}
                className="absolute inset-x-2 bottom-0 h-[2px] bg-[var(--recovery-green)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
