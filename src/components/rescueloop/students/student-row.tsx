"use client";

import { motion } from "framer-motion";
import { ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatShortDate, relativeDay, riskSegmentMeta } from "@/lib/format";
import { springLayout } from "@/design-system/motion";
import type { InterventionState, Momentum, Student } from "@/lib/types";
import { getInterventionForStudent } from "@/lib/students-directory";
import { interventionStateMeta } from "@/lib/format";

const TODAY = new Date("2026-02-01T00:00:00");

function daysUntil(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  return Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function momentumDotClass(momentum: Momentum | undefined): string {
  switch (momentum) {
    case "recovered":
    case "accelerating":
      return "bg-[var(--recovery-green)]";
    case "steady":
      return "bg-[var(--info)]";
    case "slowing":
      return "bg-[var(--warning)]";
    case "stopped":
      return "bg-[var(--critical)]";
    default:
      return "bg-[var(--ink-muted)]";
  }
}

function interventionOutcomeLabel(state: InterventionState | null): string {
  if (!state) return "—";
  return interventionStateMeta[state].label;
}

interface StudentRowProps {
  student: Student;
  isSelected: boolean;
  onSelect: () => void;
  onApprove?: (student: Student) => void;
  onView: (student: Student) => void;
}

export function StudentRow({ student, isSelected, onSelect, onView }: StudentRowProps) {
  const course = student.courseStates[0];
  const momentum = course?.momentum;
  const dotClass = momentumDotClass(momentum);
  const intervention = getInterventionForStudent(student.id);
  const risk = course ? riskSegmentMeta[course.riskSegment] : null;
  const interventionState = intervention?.state ?? null;
  const canApprove = interventionState === "awaiting_approval";

  const renewalDays = daysUntil(student.membership.renewalDate);
  const renewalLabel =
    renewalDays === 0
      ? "Renews today"
      : renewalDays === 1
        ? "Renews in 1d"
        : renewalDays > 0
          ? `Renews in ${renewalDays}d`
          : `Renewed ${Math.abs(renewalDays)}d ago`;
  const renewalWarning = renewalDays >= 0 && renewalDays <= 7;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected ? "true" : undefined}
      aria-label={`${student.name}, ${course?.progressPercent ?? 0}% progress, ${risk?.label ?? "unknown risk"}`}
      className={cn(
        "relative flex w-full items-center gap-3 border-b border-[var(--hairline)] px-4 py-2.5 text-left transition-colors",
        !isSelected && "bg-[var(--surface)] hover:bg-[var(--canvas-elevated)]",
      )}
    >
      {isSelected && (
        <>
          <motion.span
            layoutId="students-row-selected"
            transition={springLayout}
            className="absolute inset-0 -z-10 bg-[var(--canvas-elevated)]"
          />
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full w-[2px] bg-[var(--recovery-green)]"
          />
        </>
      )}

      {/* Avatar + identity */}
      <Avatar className="size-8 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
        <AvatarFallback className="rounded-none bg-[var(--canvas-elevated)] text-[11px] font-medium text-[var(--ink-primary)]">
          {student.avatarInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 w-[200px] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-[var(--ink-primary)]">
            {student.name}
          </span>
          {student.excluded && (
            <span className="border border-[var(--hairline)] bg-[var(--canvas)] px-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              excluded
            </span>
          )}
        </div>
        <div className="truncate text-[11px] text-[var(--ink-muted)]">{student.email}</div>
      </div>

      {/* Membership value */}
      <span className="hidden w-[70px] shrink-0 font-mono text-[11px] tabular-nums text-[var(--ink-secondary)] lg:block">
        ${student.membership.monthlyValue}/mo
      </span>

      {/* Progress bar + % */}
      <div className="flex flex-1 items-center gap-2">
        <div className="h-[3px] flex-1 overflow-hidden bg-[var(--hairline)]">
          <div
            className="h-full bg-[var(--recovery-green)] transition-[width] duration-300"
            style={{ width: `${Math.max(0, Math.min(100, course?.progressPercent ?? 0))}%` }}
          />
        </div>
        <span className="w-9 text-right font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
          {course?.progressPercent ?? 0}%
        </span>
      </div>

      {/* Momentum dot */}
      <span
        className={cn("hidden size-1.5 shrink-0 rounded-full lg:block", dotClass)}
        aria-label={`Momentum: ${momentum ?? "unknown"}`}
      />

      {/* Last activity */}
      <span className="hidden w-[80px] shrink-0 font-mono text-[11px] tabular-nums text-[var(--ink-muted)] lg:block">
        {course ? formatShortDate(course.lastActivityAt) : "—"}
      </span>

      {/* Renewal */}
      <span
        className={cn(
          "hidden w-[90px] shrink-0 font-mono text-[11px] tabular-nums lg:block",
          renewalWarning ? "text-[var(--warning)]" : "text-[var(--ink-muted)]",
        )}
      >
        {renewalLabel}
      </span>

      {/* Last intervention outcome */}
      <span className="hidden w-[110px] shrink-0 truncate text-[11px] text-[var(--ink-secondary)] xl:block">
        {interventionOutcomeLabel(interventionState)}
      </span>

      {/* Quick actions */}
      <div className="flex w-[80px] shrink-0 items-center justify-end gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] text-[var(--ink-secondary)] hover:bg-[var(--canvas)] hover:text-[var(--ink-primary)]"
          onClick={(e) => {
            e.stopPropagation();
            onView(student);
          }}
        >
          <Eye className="size-3" />
          View
        </Button>
        <ChevronRight className="size-3 text-[var(--ink-muted)]" />
      </div>
    </button>
  );
}

// Compact mobile card variant
export function StudentCard({
  student,
  onSelect,
  onView,
}: {
  student: Student;
  onSelect: () => void;
  onView: (student: Student) => void;
}) {
  const course = student.courseStates[0];
  const momentum = course?.momentum;
  const dotClass = momentumDotClass(momentum);
  const risk = course ? riskSegmentMeta[course.riskSegment] : null;
  const renewalDays = daysUntil(student.membership.renewalDate);
  const renewalLabel =
    renewalDays === 0
      ? "Renews today"
      : renewalDays > 0
        ? `Renews in ${renewalDays}d`
        : `Renewed ${Math.abs(renewalDays)}d ago`;
  const renewalWarning = renewalDays >= 0 && renewalDays <= 7;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-2 border border-[var(--hairline)] bg-[var(--surface)] p-3 text-left transition-colors hover:bg-[var(--canvas-elevated)]"
    >
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
          <AvatarFallback className="rounded-none bg-[var(--canvas-elevated)] text-[12px] font-medium text-[var(--ink-primary)]">
            {student.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-[var(--ink-primary)]">
              {student.name}
            </span>
            <span className={cn("size-1.5 shrink-0 rounded-full", dotClass)} />
          </div>
          <div className="truncate text-[11px] text-[var(--ink-muted)]">{student.email}</div>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
          ${student.membership.monthlyValue}/mo
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-[3px] flex-1 overflow-hidden bg-[var(--hairline)]">
          <div
            className="h-full bg-[var(--recovery-green)]"
            style={{ width: `${Math.max(0, Math.min(100, course?.progressPercent ?? 0))}%` }}
          />
        </div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
          {course?.progressPercent ?? 0}%
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
        <span className={cn("font-medium", risk?.color)}>{risk?.label ?? "—"}</span>
        <span className="font-mono tabular-nums">{formatShortDate(course?.lastActivityAt ?? "")}</span>
        <span className={cn("font-mono tabular-nums", renewalWarning && "text-[var(--warning)]")}>
          {renewalLabel}
        </span>
      </div>

      <div className="flex items-center justify-end gap-1 border-t border-[var(--hairline)] pt-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] text-[var(--ink-secondary)] hover:bg-[var(--canvas)] hover:text-[var(--ink-primary)]"
          onClick={(e) => {
            e.stopPropagation();
            onView(student);
          }}
        >
          <Eye className="size-3" />
          View
        </Button>
      </div>
    </button>
  );
}
