"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AttributionPill } from "@/components/shared/status-pills";
import { SegmentedControl } from "@/components/interaction/segmented-control";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AttributionLevel, ValueEvent } from "@/lib/types";

type FilterTab = "all" | AttributionLevel;

const SEGMENTS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "strongly_associated", label: "Associated" },
  { value: "estimated", label: "Estimated" },
];

interface LedgerTableProps {
  events: ValueEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function LedgerTable({ events, selectedId, onSelect }: LedgerTableProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    if (activeTab === "all") return events;
    return events.filter((e) => e.attributionLevel === activeTab);
  }, [events, activeTab]);

  const counts = useMemo(() => {
    const byLevel = (lvl: AttributionLevel) =>
      events.filter((e) => e.attributionLevel === lvl).length;
    return {
      all: events.length,
      confirmed: byLevel("confirmed"),
      strongly_associated: byLevel("strongly_associated"),
      estimated: byLevel("estimated"),
    } as Record<FilterTab, number>;
  }, [events]);

  const segmentsWithCounts = SEGMENTS.map((s) => ({
    ...s,
    count: counts[s.value],
  }));

  return (
    <div className="flex h-full flex-col bg-[var(--surface)]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
          Value ledger
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          {filtered.length} of {events.length}
        </span>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 border-b border-[var(--hairline)] px-5 py-2">
        <SegmentedControl
          ariaLabel="Attribution filter"
          size="sm"
          segments={segmentsWithCounts}
          value={activeTab}
          onChange={(v) => setActiveTab(v as FilterTab)}
        />
      </div>

      {/* Events list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-6 text-center text-[12px] text-[var(--ink-muted)]">
            No value events match this filter.
          </div>
        ) : (
          <ul role="listbox" aria-label="Value events">
            {filtered.map((e) => {
              const isSelected = e.id === selectedId;
              return (
                <li key={e.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => onSelect(e.id)}
                    className={cn(
                      "relative flex w-full flex-col gap-1 border-b border-[var(--hairline)] px-5 py-3 text-left transition-colors",
                      isSelected
                        ? "bg-[var(--canvas-elevated)]"
                        : "hover:bg-[var(--canvas-elevated)]/60",
                    )}
                  >
                    {isSelected && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 h-full w-[2px] bg-[var(--recovery-green)]"
                      />
                    )}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                        {e.event}
                      </span>
                      <span className="font-mono text-[13px] font-semibold tabular-nums text-[var(--ink-primary)]">
                        {e.monetaryValue > 0 ? formatCurrency(e.monetaryValue) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <AttributionPill level={e.attributionLevel} />
                        <span className="truncate text-[11px] text-[var(--ink-muted)]">
                          {e.studentName} · {e.intervention}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                        {formatDate(e.date)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
