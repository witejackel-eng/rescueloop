"use client";

import { Search, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority } from "@/lib/types";

export type SortKey = "last_activity" | "priority" | "progress" | "renewal_date";

interface QueueToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  priorityFilter: Priority | "all";
  onPriorityFilter: (value: Priority | "all") => void;
  riskFilter: string;
  onRiskFilter: (value: string) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  rowCount: number;
  totalCount: number;
}

const PRIORITY_OPTIONS: { value: Priority | "all"; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const RISK_OPTIONS = [
  { value: "all", label: "All risk segments" },
  { value: "never_started", label: "Never started" },
  { value: "early_stall", label: "Early stall" },
  { value: "mid_course_stall", label: "Mid-course stall" },
  { value: "near_completion", label: "Near completion" },
  { value: "scheduled_cancellation", label: "Scheduled cancellation" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "last_activity", label: "Last activity" },
  { value: "priority", label: "Priority" },
  { value: "progress", label: "Progress" },
  { value: "renewal_date", label: "Renewal date" },
];

export function QueueToolbar({
  search,
  onSearch,
  priorityFilter,
  onPriorityFilter,
  riskFilter,
  onRiskFilter,
  sort,
  onSort,
  rowCount,
  totalCount,
}: QueueToolbarProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[280px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6A706A]" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by student or trigger"
            className="h-9 bg-[#FFFFFF] pl-8 text-sm"
            aria-label="Search queue"
          />
        </div>

        <Select
          value={priorityFilter}
          onValueChange={(v) => onPriorityFilter(v as Priority | "all")}
        >
          <SelectTrigger size="sm" className="h-9 gap-1.5 bg-[#FFFFFF] text-sm">
            <SlidersHorizontal className="size-3.5 text-[#6A706A]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={onRiskFilter}>
          <SelectTrigger size="sm" className="h-9 gap-1.5 bg-[#FFFFFF] text-sm">
            <SlidersHorizontal className="size-3.5 text-[#6A706A]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RISK_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
          <SelectTrigger size="sm" className="h-9 gap-1.5 bg-[#FFFFFF] text-sm">
            <ArrowDownUp className="size-3.5 text-[#6A706A]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="tabular-mono shrink-0 text-xs text-[#6A706A]">
        Showing{" "}
        <span className="font-medium text-[#171A17]">{rowCount}</span> of{" "}
        {totalCount}
      </p>
    </div>
  );
}
