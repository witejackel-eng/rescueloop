"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AttributionPill } from "@/components/shared/status-pills";
import { VALUE_EVENTS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AttributionLevel, ValueEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterTab = "all" | AttributionLevel;

const TAB_DEFS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "confirmed", label: "Confirmed only" },
  { value: "strongly_associated", label: "Strongly associated" },
  { value: "estimated", label: "Estimated" },
];

// Truncation threshold — evidence strings can be long; show first N chars
// inline and surface the full text in a hover tooltip.
const EVIDENCE_MAX = 60;

export function LedgerTable() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VALUE_EVENTS.filter((e) => {
      if (activeTab !== "all" && e.attributionLevel !== activeTab) return false;
      if (!q) return true;
      return (
        e.studentName.toLowerCase().includes(q) ||
        e.event.toLowerCase().includes(q)
      );
    });
  }, [activeTab, query]);

  // Counts shown next to each tab trigger so creators can see tier sizes at a glance.
  const counts = useMemo(() => {
    const byLevel = (lvl: AttributionLevel) =>
      VALUE_EVENTS.filter((e) => e.attributionLevel === lvl).length;
    return {
      all: VALUE_EVENTS.length,
      confirmed: byLevel("confirmed"),
      strongly_associated: byLevel("strongly_associated"),
      estimated: byLevel("estimated"),
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs + search row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as FilterTab)}
          className="w-fit"
        >
          <TabsList className="h-9">
            {TAB_DEFS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-1.5 px-3"
              >
                <span>{t.label}</span>
                <span
                  className={cn(
                    "tabular-mono rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    activeTab === t.value
                      ? "bg-[#147D68] text-white"
                      : "bg-[#F0F2EC] text-[#6A706A]",
                  )}
                >
                  {counts[t.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6A706A]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or event"
            className="pl-8"
            aria-label="Filter ledger by student name or event"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E3E5DF]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E3E5DF] bg-[#F8F8F5] hover:bg-[#F8F8F5]">
              <TableHead className="h-10 px-3 text-xs font-semibold uppercase tracking-wide text-[#6A706A]">
                Event
              </TableHead>
              <TableHead className="h-10 px-3 text-xs font-semibold uppercase tracking-wide text-[#6A706A]">
                Student
              </TableHead>
              <TableHead className="h-10 px-3 text-xs font-semibold uppercase tracking-wide text-[#6A706A]">
                Intervention
              </TableHead>
              <TableHead className="h-10 px-3 text-xs font-semibold uppercase tracking-wide text-[#6A706A]">
                Evidence
              </TableHead>
              <TableHead className="h-10 px-3 text-xs font-semibold uppercase tracking-wide text-[#6A706A]">
                Attribution
              </TableHead>
              <TableHead className="h-10 px-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6A706A]">
                Value
              </TableHead>
              <TableHead className="h-10 px-3 text-xs font-semibold uppercase tracking-wide text-[#6A706A]">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-[#6A706A]"
                >
                  No value events match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e: ValueEvent) => {
                const truncated =
                  e.evidence.length > EVIDENCE_MAX
                    ? `${e.evidence.slice(0, EVIDENCE_MAX)}…`
                    : e.evidence;
                const needsTooltip = e.evidence.length > EVIDENCE_MAX;

                return (
                  <TableRow key={e.id} className="text-sm">
                    <TableCell className="px-3 py-3 font-medium text-[#171A17]">
                      {e.event}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-[#171A17]">
                      {e.studentName}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-[#6A706A]">
                      {e.intervention}
                    </TableCell>
                    <TableCell className="max-w-[280px] px-3 py-3 text-[#6A706A]">
                      {needsTooltip ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help truncate">
                              {truncated}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm text-xs leading-relaxed">
                            {e.evidence}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="truncate">{e.evidence}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <AttributionPill level={e.attributionLevel} />
                    </TableCell>
                    <TableCell className="tabular-mono px-3 py-3 text-right font-medium text-[#171A17]">
                      {e.monetaryValue > 0
                        ? formatCurrency(e.monetaryValue)
                        : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-[#6A706A]">
                      {formatDate(e.date)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-[#6A706A]">
        Showing{" "}
        <span className="tabular-mono font-medium text-[#171A17]">
          {filtered.length}
        </span>{" "}
        of{" "}
        <span className="tabular-mono font-medium text-[#171A17]">
          {VALUE_EVENTS.length}
        </span>{" "}
        value events. Non-monetary events show an em dash.
      </p>
    </div>
  );
}
