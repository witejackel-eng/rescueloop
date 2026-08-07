"use client";

import { Inbox, CheckCircle2, CalendarClock, Send, MessageSquare, RefreshCw, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InterventionState, Priority, QueueTab, RiskSegment } from "@/lib/types";

export interface StageDef {
  value: QueueTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  states: InterventionState[];
}

export const STAGE_DEFS: StageDef[] = [
  {
    value: "awaiting_review",
    label: "Awaiting review",
    icon: Inbox,
    states: ["awaiting_approval"],
  },
  {
    value: "approved",
    label: "Approved",
    icon: CheckCircle2,
    states: ["approved"],
  },
  {
    value: "scheduled",
    label: "Scheduled",
    icon: CalendarClock,
    states: ["scheduled"],
  },
  { value: "sent", label: "Sent", icon: Send, states: ["sent", "opened"] },
  {
    value: "responded",
    label: "Responded",
    icon: MessageSquare,
    states: ["responded"],
  },
  {
    value: "recovered",
    label: "Recovered",
    icon: RefreshCw,
    states: ["recovered"],
  },
  {
    value: "dismissed",
    label: "Dismissed",
    icon: Archive,
    states: ["dismissed", "stopped"],
  },
];

interface SegmentNavProps {
  activeStage: QueueTab;
  onStageChange: (stage: QueueTab) => void;
  counts: Record<QueueTab, number>;
  priorityFilter: Priority | "all";
  onPriorityFilter: (priority: Priority | "all") => void;
  riskFilter: RiskSegment | "all";
  onRiskFilter: (risk: RiskSegment | "all") => void;
  className?: string;
}

const RISK_OPTIONS: { value: RiskSegment; label: string }[] = [
  { value: "never_started", label: "Never started" },
  { value: "early_stall", label: "Early stall" },
  { value: "mid_course_stall", label: "Mid-course stall" },
  { value: "near_completion", label: "Near completion" },
  { value: "inactive_near_renewal", label: "Inactive near renewal" },
  { value: "scheduled_cancellation", label: "Scheduled cancellation" },
];

export function SegmentNav({
  activeStage,
  onStageChange,
  counts,
  priorityFilter,
  onPriorityFilter,
  riskFilter,
  onRiskFilter,
  className,
}: SegmentNavProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:w-[220px] shrink-0 flex-col gap-6 border-r border-[var(--hairline)] pr-4",
        className,
      )}
      aria-label="Queue stages"
    >
      <nav className="flex flex-col gap-px" aria-label="Stage navigation">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Stages
        </p>
        {STAGE_DEFS.map((stage) => {
          const active = stage.value === activeStage;
          const count = counts[stage.value] ?? 0;
          const Icon = stage.icon;
          return (
            <button
              key={stage.value}
              onClick={() => onStageChange(stage.value)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 py-2 pl-3 pr-2 text-left transition-colors",
                active
                  ? "bg-[var(--canvas-elevated)] text-[var(--ink-primary)]"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]/60 hover:text-[var(--ink-primary)]",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-full w-[2px] bg-[var(--recovery-green)]"
                />
              )}
              <Icon
                className={cn(
                  "size-[15px] shrink-0",
                  active ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]",
                )}
              />
              <span className="flex-1 text-[13px] font-medium">{stage.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    active ? "text-[var(--ink-secondary)]" : "text-[var(--ink-muted)]",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Filters
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[var(--ink-secondary)]">Priority</span>
          <Select
            value={priorityFilter}
            onValueChange={(v) => onPriorityFilter(v as Priority | "all")}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-full rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px] text-[var(--ink-primary)]"
              aria-label="Filter by priority"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[var(--ink-secondary)]">Risk segment</span>
          <Select
            value={riskFilter}
            onValueChange={(v) => onRiskFilter(v as RiskSegment | "all")}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-full rounded-none border-[var(--hairline)] bg-[var(--surface)] text-[12px] text-[var(--ink-primary)]"
              aria-label="Filter by risk segment"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none max-h-[280px]">
              <SelectItem value="all">All segments</SelectItem>
              {RISK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
    </aside>
  );
}

/**
 * Mobile-only horizontal stage selector. Renders above the student list on
 * small screens so users can switch stages without the desktop segment nav.
 */
interface MobileStageNavProps {
  activeStage: QueueTab;
  onStageChange: (stage: QueueTab) => void;
  counts: Record<QueueTab, number>;
  className?: string;
}

export function MobileStageNav({
  activeStage,
  onStageChange,
  counts,
  className,
}: MobileStageNavProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2 lg:hidden",
        className,
      )}
      role="tablist"
      aria-label="Queue stages"
    >
      {STAGE_DEFS.map((stage) => {
        const active = stage.value === activeStage;
        const count = counts[stage.value] ?? 0;
        const Icon = stage.icon;
        return (
          <button
            key={stage.value}
            role="tab"
            aria-selected={active}
            onClick={() => onStageChange(stage.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[12px] font-medium transition-colors",
              active
                ? "border-[var(--recovery-green)] bg-[var(--recovery-light)] text-[var(--recovery-green)]"
                : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)]",
            )}
          >
            <Icon className="size-3.5" />
            <span className="whitespace-nowrap">{stage.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  active ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
