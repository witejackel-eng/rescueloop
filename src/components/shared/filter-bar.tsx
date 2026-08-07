"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FilterChipList,
  type FilterChipData,
  type FilterChipVariant,
} from "@/components/shared/filter-chip";

// ── Filter definitions ─────────────────────────────────────────
export interface FilterOption {
  label: string;
  values: { value: string; label: string; variant?: FilterChipVariant }[];
}

export const DEFAULT_FILTER_OPTIONS: FilterOption[] = [
  {
    label: "Risk Level",
    values: [
      { value: "low", label: "Low", variant: "recovery" },
      { value: "medium", label: "Medium", variant: "warning" },
      { value: "high", label: "High", variant: "critical" },
      { value: "critical", label: "Critical", variant: "critical" },
    ],
  },
  {
    label: "Status",
    values: [
      { value: "active", label: "Active", variant: "recovery" },
      { value: "inactive", label: "Inactive", variant: "default" },
      { value: "at_risk", label: "At Risk", variant: "warning" },
    ],
  },
  {
    label: "Time Range",
    values: [
      { value: "7d", label: "Last 7 days", variant: "info" },
      { value: "30d", label: "Last 30 days", variant: "info" },
      { value: "90d", label: "Last 90 days", variant: "info" },
    ],
  },
  {
    label: "Response Type",
    values: [
      { value: "email", label: "Email", variant: "default" },
      { value: "dm", label: "DM", variant: "default" },
      { value: "manual", label: "Manual", variant: "default" },
    ],
  },
];

// ── Active filters type (exported for consumers) ──────────────
export type ActiveFilters = Record<string, string>;

interface FilterBarProps {
  filters?: FilterOption[];
  activeFilters?: ActiveFilters;
  onFiltersChange?: (filters: ActiveFilters) => void;
  className?: string;
}

export function FilterBar({
  filters = DEFAULT_FILTER_OPTIONS,
  activeFilters: externalFilters,
  onFiltersChange,
  className,
}: FilterBarProps) {
  const [internalFilters, setInternalFilters] = useState<ActiveFilters>({});
  const activeFilters = externalFilters ?? internalFilters;

  const setFilters = useCallback(
    (next: ActiveFilters) => {
      if (externalFilters !== undefined && onFiltersChange) {
        onFiltersChange(next);
      } else {
        setInternalFilters(next);
      }
    },
    [externalFilters, onFiltersChange],
  );

  // Build chip data from active filters
  const chips: FilterChipData[] = Object.entries(activeFilters).map(
    ([key, value]) => {
      // Find the matching option to get label and variant
      for (const group of filters) {
        const match = group.values.find((v) => v.value === value);
        if (match) {
          return {
            id: key,
            label: group.label,
            value: match.label,
            variant: match.variant,
          };
        }
      }
      return { id: key, label: key, value };
    },
  );

  const activeCount = Object.keys(activeFilters).length;

  function addFilter(category: string, value: string) {
    setFilters({ ...activeFilters, [category]: value });
  }

  function removeFilter(key: string) {
    const next = { ...activeFilters };
    delete next[key];
    setFilters(next);
  }

  function clearAll() {
    setFilters({});
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Filter icon + count badge */}
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
        <Filter className="size-3" />
        Filters
        {activeCount > 0 && (
          <Badge className="h-4 min-w-4 rounded-full bg-[var(--ink-primary)] px-1 text-[9px] text-white">
            {activeCount}
          </Badge>
        )}
      </span>

      {/* Active filter chips */}
      <FilterChipList chips={chips} onRemove={removeFilter} />

      {/* Add filter dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 rounded-full border-[var(--hairline)] bg-[var(--surface)] px-2.5 text-[11px] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]"
          >
            <Plus className="size-3" />
            Add filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[180px] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-1 shadow-lg"
        >
          {filters.map((group, gi) => (
            <DropdownMenuSub key={group.label}>
              <DropdownMenuSubTrigger className="rounded-[6px] text-[12px] text-[var(--ink-primary)]">
                {group.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  className="w-[160px] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-1 shadow-lg"
                >
                  {group.values.map((opt) => {
                    const isApplied = activeFilters[group.label] === opt.value;
                    return (
                      <DropdownMenuItem
                        key={opt.value}
                        disabled={isApplied}
                        onSelect={() => addFilter(group.label, opt.value)}
                        className={cn(
                          "rounded-[6px] text-[12px]",
                          isApplied
                            ? "text-[var(--ink-muted)]"
                            : "text-[var(--ink-primary)]",
                        )}
                      >
                        {opt.label}
                        {isApplied && (
                          <span className="ml-auto text-[10px] text-[var(--recovery-green)]">Active</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear all button */}
      <AnimatePresence>
        {activeCount > 1 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            onClick={clearAll}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--critical-light)]/30 hover:text-[var(--critical)]"
          >
            <X className="size-3" />
            Clear all
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
