"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Check,
  X,
  Clock,
  ShieldOff,
  Snowflake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityPill } from "@/components/shared/status-pills";
import { formatShortDate } from "@/lib/format";
import { springLayout } from "@/design-system/motion";
import type { Priority } from "@/lib/types";
import type { QueueItem } from "./wp04-types";

// ── State badge config ───────────────────────────────────────
const STATE_BADGE_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  detected: { label: "Detected", variant: "outline" },
  awaiting_approval: { label: "Awaiting review", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  scheduled: { label: "Scheduled", variant: "default" },
  queued: { label: "Queued", variant: "default" },
  sent: { label: "Sent", variant: "default" },
  opened: { label: "Opened", variant: "default" },
  responded: { label: "Responded", variant: "default" },
  recovered: { label: "Recovered", variant: "default" },
  not_recovered: { label: "Not recovered", variant: "destructive" },
  dismissed: { label: "Dismissed", variant: "outline" },
  stopped: { label: "Stopped", variant: "outline" },
  // DB-specific states
  drafted: { label: "Draft", variant: "outline" },
  delivery_attempted: { label: "Delivering", variant: "default" },
  notification_accepted: { label: "Accepted", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

function StateBadge({ state }: { state: string }) {
  const config = STATE_BADGE_CONFIG[state] ?? {
    label: state.replace(/_/g, " "),
    variant: "outline" as const,
  };
  return (
    <Badge
      variant={config.variant}
      className="h-5 rounded-none px-1.5 font-mono text-[10px] uppercase tracking-wide"
    >
      {config.label}
    </Badge>
  );
}

/** Priority color mapping for the evidence-based priority badge. */
function priorityColorClass(priority: Priority): string {
  switch (priority) {
    case "urgent":
      return "bg-[var(--critical)] text-white";
    case "high":
      return "bg-[var(--warning)] text-white";
    case "medium":
      return "bg-[#4C7ECF] text-white";
    case "low":
      return "bg-[#6A706A] text-white";
  }
}

// ── Inactivity label ─────────────────────────────────────────
function inactivityLabel(days: number): string {
  if (days === 0) return "Active today";
  if (days === 1) return "1d inactive";
  return `${days}d inactive`;
}

function inactivityColorClass(days: number): string {
  if (days <= 3) return "text-[var(--ink-secondary)]";
  if (days <= 7) return "text-[var(--warning)]";
  return "text-[var(--critical)]";
}

// ── Props ────────────────────────────────────────────────────
interface WP04StudentRowProps {
  item: QueueItem;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onDismiss: () => void;
  reduced?: boolean;
}

// ── Component ────────────────────────────────────────────────
export function WP04StudentRow({
  item,
  isSelected,
  onSelect,
  onApprove,
  onDismiss,
  reduced = false,
}: WP04StudentRowProps) {
  const x = useMotionValue(0);
  const approveOpacity = useTransform(x, [10, 110], [0, 1]);
  const dismissOpacity = useTransform(x, [-110, -10], [1, 0]);

  function handleDragEnd(_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    if (info.offset.x > 120 || info.velocity.x > 500) {
      onApprove();
    } else if (info.offset.x < -120 || info.velocity.x < -500) {
      onDismiss();
    }
  }

  // State indicators
  const showSuppressed = item.suppressed;
  const showCooldown = item.inCooldown;

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
        aria-label={`${item.studentName}, ${item.trigger}, ${item.priority} priority`}
        className={cn(
          "relative z-10 block w-full text-left",
          "bg-[var(--surface)] border-b border-[var(--hairline)] px-4 py-3 transition-colors",
          "lg:flex lg:items-center lg:gap-3 lg:px-4 lg:py-2.5",
          !isSelected && "hover:bg-[var(--canvas-elevated)]",
          showSuppressed && "opacity-60",
        )}
      >
        {/* Selected background overlay (desktop) */}
        {isSelected && (
          <>
            <motion.span
              layoutId="selected-row-wp04"
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
          <div className="flex items-start gap-2.5 lg:w-[220px] lg:shrink-0 lg:items-center">
            <Avatar className="size-8 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
              <AvatarFallback className="rounded-none bg-[var(--canvas-elevated)] text-[11px] font-medium text-[var(--ink-primary)]">
                {item.studentAvatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-medium text-[var(--ink-primary)]">
                  {item.studentName}
                </span>
              </div>
              <div className="truncate text-[12px] text-[var(--ink-muted)] lg:hidden">
                {item.courseName}
              </div>
              {/* Desktop: show trigger reason */}
              <div
                className="hidden truncate text-[12px] text-[var(--ink-secondary)] lg:block"
                title={item.trigger}
              >
                {item.trigger}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 lg:w-[130px] lg:shrink-0">
            <div className="h-[3px] flex-1 overflow-hidden bg-[var(--hairline)]">
              <div
                className={cn(
                  "h-full transition-[width] duration-300",
                  item.progressPercent > 50
                    ? "bg-[var(--recovery-green)]"
                    : item.progressPercent > 20
                      ? "bg-[var(--warning)]"
                      : "bg-[var(--critical)]",
                )}
                style={{ width: `${Math.max(0, Math.min(100, item.progressPercent))}%` }}
              />
            </div>
            <span className="w-9 text-right font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
              {item.progressPercent}%
            </span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center justify-between gap-2 lg:ml-auto lg:justify-end">
            {/* Inactivity — desktop only */}
            <span
              className={cn(
                "hidden font-mono text-[11px] tabular-nums lg:block",
                inactivityColorClass(item.inactivityDays),
              )}
            >
              {inactivityLabel(item.inactivityDays)}
            </span>

            {/* Inactivity — mobile only */}
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums lg:hidden",
                inactivityColorClass(item.inactivityDays),
              )}
            >
              {inactivityLabel(item.inactivityDays)}
            </span>

            {/* Last activity date — desktop */}
            <span className="hidden font-mono text-[11px] tabular-nums text-[var(--ink-muted)] lg:block">
              {formatShortDate(item.lastActivityAt)}
            </span>

            {/* State indicators */}
            {showSuppressed && (
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--critical)]" title="Student is suppressed">
                <ShieldOff className="size-3" />
              </span>
            )}
            {showCooldown && (
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--warning)]" title="In cooldown period">
                <Snowflake className="size-3" />
              </span>
            )}
            {item.scheduledFor && (
              <span className="flex items-center gap-0.5 font-mono text-[10px] text-[var(--ink-muted)]" title="Scheduled">
                <Clock className="size-3" />
              </span>
            )}

            {/* Evidence-based priority badge */}
            <span
              className={cn(
                "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                priorityColorClass(item.priority),
              )}
            >
              {item.priority}
            </span>

            {/* State badge — desktop */}
            <div className="hidden lg:block">
              <StateBadge state={item.state} />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
