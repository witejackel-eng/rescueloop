"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityPill } from "@/components/shared/status-pills";
import { formatShortDate } from "@/lib/format";
import { springLayout } from "@/design-system/motion";
import type { InterventionState, Momentum, Priority, RescueQueueRow } from "@/lib/types";

// Reference date used across the demo for relative-day math.
const TODAY = new Date();

/**
 * Merged row: static mock-data row + live state from the demo store.
 * The store overlays interventionState, scheduledFor, excluded, and progressPercent.
 */
export interface LiveQueueRow extends RescueQueueRow {
  liveInterventionState: InterventionState;
  liveProgress: number;
  scheduledFor: string | null;
  excluded: boolean;
}

interface StudentRowProps {
  row: LiveQueueRow;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onDismiss: () => void;
  reduced?: boolean;
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

function daysUntil(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  return Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function priorityWeight(p: Priority): number {
  switch (p) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

export const PRIORITY_WEIGHT = priorityWeight;

export function StudentRow({
  row,
  isSelected,
  onSelect,
  onApprove,
  onDismiss,
  reduced = false,
}: StudentRowProps) {
  const x = useMotionValue(0);
  const approveOpacity = useTransform(x, [10, 110], [0, 1]);
  const dismissOpacity = useTransform(x, [-110, -10], [1, 0]);

  const course = row.student.courseStates[0];
  const momentum = course?.momentum;
  const dotClass = momentumDotClass(momentum);

  const renewalDays = daysUntil(row.renewalDate);
  const renewalWarning = renewalDays >= 0 && renewalDays <= 7;
  const renewalLabel =
    renewalDays === 0
      ? "Renews today"
      : renewalDays === 1
        ? "Renews in 1d"
        : renewalDays > 0
          ? `Renews in ${renewalDays}d`
          : `Renewed ${Math.abs(renewalDays)}d ago`;

  function handleDragEnd(_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    if (info.offset.x > 120 || info.velocity.x > 500) {
      onApprove();
    } else if (info.offset.x < -120 || info.velocity.x < -500) {
      onDismiss();
    }
  }

  return (
    <motion.div
      layout
      exit={reduced ? { opacity: 0 } : { opacity: 0, x: -48, transition: { duration: 0.22 } }}
      drag={reduced ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      dragMomentum={false}
      style={{ x }}
      onDragEnd={handleDragEnd}
      className="relative select-none touch-pan-y"
    >
      {/* Swipe action reveals — mobile only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-between px-5 lg:hidden"
      >
        <motion.div
          style={{ opacity: approveOpacity }}
          className="flex items-center gap-1.5 text-[var(--recovery-green)]"
        >
          <Check className="size-5" strokeWidth={2.5} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]">Approve</span>
        </motion.div>
        <motion.div
          style={{ opacity: dismissOpacity }}
          className="flex items-center gap-1.5 text-[var(--critical)]"
        >
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]">Dismiss</span>
          <X className="size-5" strokeWidth={2.5} />
        </motion.div>
      </div>

      <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected ? "true" : undefined}
        aria-label={`${row.student.name}, ${row.trigger}, ${row.priority} priority`}
        className={cn(
          "relative z-10 block w-full text-left",
          "bg-[var(--surface)] border-b border-[var(--hairline)] px-4 py-3 transition-colors",
          "lg:flex lg:items-center lg:gap-3 lg:px-4 lg:py-2.5",
          !isSelected && "hover:bg-[var(--canvas-elevated)]",
        )}
      >
        {/* Selected background overlay (desktop) — uses shared layoutId for sliding selection */}
        {isSelected && (
          <>
            <motion.span
              layoutId="selected-row"
              transition={springLayout}
              className="absolute inset-0 -z-10 hidden bg-[var(--surface)] lg:block"
            />
            <span
              aria-hidden
              className="absolute left-0 top-0 hidden h-full w-[2px] bg-[var(--recovery-green)] lg:block"
            />
          </>
        )}

        {/* Layout: flex-col on mobile, flex-row on lg */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
          {/* Avatar + identity */}
          <div className="flex items-start gap-2.5 lg:w-[240px] lg:shrink-0 lg:items-center">
            <Avatar className="size-8 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
              <AvatarFallback className="rounded-none bg-[var(--canvas-elevated)] text-[11px] font-medium text-[var(--ink-primary)]">
                {row.student.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-medium text-[var(--ink-primary)]">
                  {row.student.name}
                </span>
                {/* momentum dot — mobile inline */}
                <span className={cn("size-1.5 rounded-full lg:hidden", dotClass)} />
              </div>
              <div className="truncate text-[12px] text-[var(--ink-muted)] lg:hidden">
                {row.student.email}
              </div>
              <div
                className="hidden truncate text-[12px] text-[var(--ink-secondary)] lg:block"
                title={row.trigger}
              >
                {row.trigger}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 lg:w-[150px] lg:shrink-0">
            <div className="h-[3px] flex-1 overflow-hidden bg-[var(--hairline)]">
              <div
                className="h-full bg-[var(--recovery-green)] transition-[width] duration-300"
                style={{ width: `${Math.max(0, Math.min(100, row.liveProgress))}%` }}
              />
            </div>
            <span className="w-9 text-right font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
              {row.liveProgress}%
            </span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center justify-between gap-3 lg:ml-auto lg:justify-end">
            {/* Momentum dot — desktop only */}
            <span
              className={cn("hidden size-1.5 rounded-full lg:block", dotClass)}
              aria-label={`Momentum: ${momentum ?? "unknown"}`}
            />
            <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
              ${row.student.membership.monthlyValue}/mo
            </span>
            <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
              {formatShortDate(row.lastActivityAt)}
            </span>
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                renewalWarning ? "text-[var(--warning)]" : "text-[var(--ink-muted)]",
              )}
            >
              {renewalLabel}
            </span>
            <PriorityPill priority={row.priority} />
          </div>
        </div>
      </button>
    </motion.div>
  );
}
