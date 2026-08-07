"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock,
  FileEdit,
  History,
  Mail,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldOff,
  Sparkles,
  RotateCcw,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AttributionPill,
  MembershipStatusPill,
  PriorityPill,
} from "@/components/shared/status-pills";
import { CAMPAIGNS, COURSE, PRODUCT } from "@/lib/mock-data";
import {
  formatDate,
  formatShortDate,
  relativeDay,
  riskSegmentMeta,
} from "@/lib/format";
import type { Intervention, ProgressEvent } from "@/lib/types";
import type { LiveQueueRow } from "./student-row";

interface InspectorProps {
  row: LiveQueueRow | null;
  intervention: Intervention | null;
  previousInterventions: Intervention[];
  onApprove: (id: string) => void;
  onSchedule: (id: string, when: string) => void;
  onDismiss: (id: string) => void;
  onExclude: (id: string) => void;
  onTriggerRecovery: (id: string, name: string) => void;
  /** When true, action bar is sticky inside a Sheet (mobile). When false, sticky inside column. */
  variant?: "column" | "sheet";
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
      <Icon className="size-3.5" />
      {children}
    </h3>
  );
}

function TimelineIcon({ action }: { action: ProgressEvent["action"] }) {
  switch (action) {
    case "completed":
      return (
        <span className="flex size-5 items-center justify-center border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]">
          <Check className="size-3" />
        </span>
      );
    case "started":
      return (
        <span className="flex size-5 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]">
          <Play className="size-3" />
        </span>
      );
    case "stalled":
      return (
        <span className="flex size-5 items-center justify-center border border-[var(--warning)]/30 bg-[var(--warning-light)] text-[var(--warning)]">
          <Pause className="size-3" />
        </span>
      );
    case "returned":
      return (
        <span className="flex size-5 items-center justify-center border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]">
          <RefreshCw className="size-3" />
        </span>
      );
    default:
      return null;
  }
}

function timelineLabel(action: ProgressEvent["action"]): string {
  const map: Record<ProgressEvent["action"], string> = {
    completed: "Completed",
    started: "Started",
    stalled: "Stalled",
    returned: "Returned",
  };
  return map[action];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--ink-primary)]">{children}</dd>
    </div>
  );
}

const SCHEDULE_OPTIONS = [
  { label: "In 1 hour", value: "In 1 hour" },
  { label: "Tomorrow · 9:00 AM", value: "Tomorrow · 9:00 AM" },
  { label: "In 3 days · 9:00 AM", value: "In 3 days · 9:00 AM" },
  { label: "Next Monday · 9:00 AM", value: "Next Monday · 9:00 AM" },
];

export function Inspector({
  row,
  intervention,
  previousInterventions,
  onApprove,
  onSchedule,
  onDismiss,
  onExclude,
  onTriggerRecovery,
  variant = "column",
}: InspectorProps) {
  const [messageDraft, setMessageDraft] = useState("");
  const [lastInterventionId, setLastInterventionId] = useState<string | null>(null);

  // Reset draft when intervention changes — render-time adjustment per React docs
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const currentId = intervention?.id ?? null;
  if (currentId !== lastInterventionId) {
    setLastInterventionId(currentId);
    setMessageDraft(intervention?.messagePreview ?? "");
  }

  if (!row || !intervention) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-[260px]">
          <div className="mx-auto flex size-10 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]">
            <Sparkles className="size-4" />
          </div>
          <p className="mt-4 text-[14px] font-medium text-[var(--ink-primary)]">
            Select a student to review
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-muted)]">
            The inspector shows the rescue plan, message, and safety state for the
            selected row. Use J / K to move between students.
          </p>
        </div>
      </div>
    );
  }

  const student = row.student;
  const courseState = student.courseStates[0];
  const risk = courseState ? riskSegmentMeta[courseState.riskSegment] : null;
  const cooldownText = intervention.cooldownUntil
    ? `${formatShortDate(intervention.cooldownUntil)} · ${relativeDay(intervention.cooldownUntil)}`
    : "None";

  // Look up campaign for safety controls
  const campaign = CAMPAIGNS.find((c) => c.type === row.campaignType);
  const safety = campaign?.safety;
  const maxMessages = safety?.maxMessagesPerMember ?? 2;
  const quietHours = safety
    ? `${safety.quietHoursStart}–${safety.quietHoursEnd}`
    : "20:00–08:00";

  const showAttribution =
    row.liveInterventionState === "recovered" ||
    row.liveInterventionState === "responded";

  const canApprove = row.liveInterventionState === "awaiting_approval";
  const canSchedule = row.liveInterventionState === "awaiting_approval";
  const canDismiss =
    row.liveInterventionState === "awaiting_approval" ||
    row.liveInterventionState === "approved" ||
    row.liveInterventionState === "scheduled";
  const canTriggerRecovery =
    row.liveInterventionState === "sent" ||
    row.liveInterventionState === "opened" ||
    row.liveInterventionState === "responded";

  const messageDirty = messageDraft !== intervention.messagePreview;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[var(--canvas-elevated)]",
        variant === "column" && "border-l border-[var(--hairline)]",
      )}
    >
      {/* Header — student identity */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--hairline)] px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--surface)]">
            <AvatarFallback className="rounded-none bg-[var(--surface)] text-[13px] font-medium text-[var(--ink-primary)]">
              {student.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-[20px] leading-tight text-[var(--ink-primary)]">
              {student.name}
            </h2>
            <p className="truncate text-[12px] text-[var(--ink-muted)]">{student.email}</p>
          </div>
          <PriorityPill priority={intervention.priority} />
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          <span>Joined {formatShortDate(student.joinedAt)}</span>
          <span className="text-[var(--hairline-strong)]">·</span>
          <span>{PRODUCT.name}</span>
          <span className="text-[var(--hairline-strong)]">·</span>
          <MembershipStatusPill status={student.membership.status} />
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y divide-[var(--hairline)]">
          {/* 1. Membership & summary */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={Sparkles}>Membership &amp; value</SectionTitle>
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Course">{COURSE.name}</Field>
              <Field label="Renews">
                <span className="font-mono tabular-nums">
                  {formatShortDate(student.membership.renewalDate)}
                </span>
                <span className="block text-[11px] text-[var(--ink-muted)]">
                  {relativeDay(student.membership.renewalDate)}
                </span>
              </Field>
              <Field label="Monthly value">
                <span className="font-mono tabular-nums">
                  ${student.membership.monthlyValue}/mo
                </span>
              </Field>
              <Field label="Annual value">
                <span className="font-mono tabular-nums">
                  ${student.membership.monthlyValue * 12}/yr
                </span>
              </Field>
            </dl>
          </section>

          {/* 2. Progress timeline */}
          {courseState && courseState.progressHistory.length > 0 && (
            <section className="flex flex-col gap-3 px-5 py-4">
              <SectionTitle icon={History}>Progress timeline</SectionTitle>
              <ol className="relative space-y-3 pl-6">
                <span className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--hairline)]" />
                {[...courseState.progressHistory].reverse().map((event, i) => (
                  <li
                    key={`${event.date}-${event.lessonIndex}-${i}`}
                    className="relative"
                  >
                    <span className="absolute -left-6 top-0.5">
                      <TimelineIcon action={event.action} />
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                          {event.lessonTitle}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                          {formatShortDate(event.date)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--ink-muted)]">
                        {timelineLabel(event.action)} · Lesson {event.lessonIndex + 1}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-1 flex items-center gap-3 border-t border-[var(--hairline)] pt-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-[3px] flex-1 overflow-hidden bg-[var(--hairline)]">
                    <div
                      className="h-full bg-[var(--recovery-green)]"
                      style={{
                        width: `${Math.max(0, Math.min(100, row.liveProgress))}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
                    {row.liveProgress}%
                  </span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                  {courseState.lessonsCompleted}/{COURSE.lessonCount} lessons
                </span>
              </div>
            </section>
          )}

          {/* 3. Why RescueLoop flagged them */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={AlertTriangle}>Why RescueLoop flagged them</SectionTitle>
            <p className="text-[13px] leading-relaxed text-[var(--ink-primary)]">
              {intervention.trigger}
            </p>
            {intervention.evidence.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {intervention.evidence.map((ev, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[13px] text-[var(--ink-secondary)]"
                  >
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--recovery-green)]" />
                    {ev}
                  </li>
                ))}
              </ul>
            )}
            {risk && (
              <p className="text-[12px] text-[var(--ink-muted)]">
                Risk segment:{" "}
                <span className={cn("font-medium", risk.color)}>{risk.label}</span>
              </p>
            )}
          </section>

          {/* 4. Recommended intervention */}
          <section className="flex flex-col gap-2 px-5 py-4">
            <SectionTitle icon={Sparkles}>Recommended intervention</SectionTitle>
            <p className="text-[13px] leading-relaxed text-[var(--ink-primary)]">
              {intervention.recommendedAction}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              {row.campaignType.replace(/_/g, " ")}
            </p>
          </section>

          {/* 5. Message editor */}
          <section className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle icon={Mail}>Message</SectionTitle>
              {messageDirty && (
                <button
                  type="button"
                  onClick={() => setMessageDraft(intervention.messagePreview)}
                  className="flex items-center gap-1 font-mono text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                >
                  <RotateCcw className="size-3" />
                  Reset to template
                </button>
              )}
            </div>
            <Textarea
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              rows={6}
              className="rounded-none border-[var(--hairline)] bg-[var(--surface)] font-sans text-[13px] leading-relaxed text-[var(--ink-primary)] focus-visible:ring-[var(--recovery-green)]/30"
              aria-label="Editable message draft"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {messageDraft.length} chars · {messageDirty ? "edited" : "template"}
            </p>
          </section>

          {/* 6. Safety & cooldown */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={ShieldOff}>Safety &amp; cooldown</SectionTitle>
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Cooldown until">
                <span className="font-mono text-[12px] tabular-nums">{cooldownText}</span>
              </Field>
              <Field label="Quiet hours">
                <span className="font-mono text-[12px] tabular-nums">{quietHours}</span>
              </Field>
              <Field label="Max messages / member">
                <span className="font-mono text-[12px] tabular-nums">{maxMessages}/mo</span>
              </Field>
              <Field label="Send timing">
                {intervention.scheduledFor || row.scheduledFor ? (
                  <span className="font-mono text-[12px] tabular-nums">
                    {row.scheduledFor ?? intervention.scheduledFor}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--recovery-green)]">
                    <Send className="size-3" />
                    Send now
                  </span>
                )}
              </Field>
            </dl>
          </section>

          {/* 7. Previous interventions */}
          <section className="flex flex-col gap-2 px-5 py-4">
            <SectionTitle icon={History}>Previous interventions</SectionTitle>
            {previousInterventions.length === 0 ? (
              <p className="border border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-3 py-3 text-center text-[12px] text-[var(--ink-muted)]">
                No previous interventions for this member.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {previousInterventions.map((iv) => (
                  <li
                    key={iv.id}
                    className="border border-[var(--hairline)] bg-[var(--surface)] p-3 text-[13px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[var(--ink-primary)]">
                        {iv.recommendedAction}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                        {iv.state.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--ink-muted)]">{iv.trigger}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 8. Attribution */}
          {showAttribution && (
            <section className="flex flex-col gap-2 px-5 py-4">
              <SectionTitle icon={Sparkles}>Attribution</SectionTitle>
              <div className="flex flex-wrap items-center gap-2">
                <AttributionPill level={intervention.attributionLevel} />
                {row.scheduledFor && (
                  <span className="flex items-center gap-1 border border-[var(--hairline)] bg-[var(--canvas)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">
                    <CalendarClock className="size-3" />
                    Scheduled
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-1.5">
                {intervention.evidence.map((ev, i) => (
                  <li
                    key={`attr-${i}`}
                    className="flex items-start gap-2 text-[13px] text-[var(--ink-secondary)]"
                  >
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--info)]" />
                    {ev}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Sticky actions */}
      <div className="shrink-0 border-t border-[var(--hairline)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-col gap-2">
          {/* Primary row */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!canApprove}
              onClick={() => onApprove(row.id)}
              className="h-9 flex-1 rounded-none bg-[var(--ink-primary)] text-[var(--canvas)] hover:bg-[var(--ink-primary)]/90 disabled:opacity-40"
            >
              <Send className="size-3.5" />
              Approve &amp; send
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canSchedule}
                  className="h-9 rounded-none border-[var(--hairline)] bg-[var(--surface)] px-3 text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)] disabled:opacity-40"
                >
                  <CalendarClock className="size-3.5" />
                  Schedule
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={6}
                className="w-56 rounded-none border-[var(--hairline)] bg-[var(--surface)] p-1"
              >
                <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  Send at
                </p>
                <div className="flex flex-col">
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onSchedule(row.id, opt.value)}
                      className="flex items-center gap-2 px-2 py-2 text-left text-[13px] text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)]"
                    >
                      <Clock className="size-3.5 text-[var(--ink-muted)]" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Secondary row */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!canDismiss}
              onClick={() => onDismiss(row.id)}
              className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] disabled:opacity-40"
            >
              <FileEdit className="size-3.5" />
              Dismiss
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={row.excluded}
                  className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-muted)] hover:bg-[var(--critical-light)] hover:text-[var(--critical)] disabled:opacity-40"
                >
                  <ShieldOff className="size-3.5" />
                  Exclude
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-none sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Exclude this student?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {student.name.split(" ")[0]} will no longer receive any automated
                    rescue interventions. You can reverse this from their student profile
                    at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-none bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
                    onClick={() => onExclude(row.id)}
                  >
                    Exclude student
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              variant="ghost"
              disabled={!canTriggerRecovery}
              onClick={() => onTriggerRecovery(row.id, student.name)}
              className="ml-auto h-8 rounded-none px-3 text-[12px] text-[var(--recovery-green)] hover:bg-[var(--recovery-light)] hover:text-[var(--recovery-green)] disabled:opacity-40"
            >
              <Zap className="size-3.5" />
              Trigger demo recovery
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tiny animated badge for the approved state swap (kept for future use).
export function AnimatedStateBadge({ state }: { state: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={state}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={{ duration: 0.18 }}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--recovery-green)]"
      >
        {state}
      </motion.span>
    </AnimatePresence>
  );
}
