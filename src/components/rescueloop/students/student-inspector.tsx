"use client";

import {
  AlertTriangle,
  CalendarClock,
  Check,
  History,
  Mail,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldOff,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
} from "@/components/shared/status-pills";
import { COURSE, PRODUCT } from "@/lib/mock-data";
import {
  formatShortDate,
  interventionStateMeta,
  relativeDay,
  riskSegmentMeta,
} from "@/lib/format";
import { getInterventionForStudent } from "@/lib/students-directory";
import type { ProgressEvent, Student } from "@/lib/types";

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
  return {
    completed: "Completed",
    started: "Started",
    stalled: "Stalled",
    returned: "Returned",
  }[action];
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

interface StudentInspectorProps {
  student: Student | null;
  excluded: boolean;
  onToggleExclude: (next: boolean) => void;
  onSendMessage: () => void;
  variant?: "column" | "sheet";
}

export function StudentInspector({
  student,
  excluded,
  onToggleExclude,
  onSendMessage,
  variant = "column",
}: StudentInspectorProps) {
  if (!student) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-[260px]">
          <div className="mx-auto flex size-10 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]">
            <Sparkles className="size-4" />
          </div>
          <p className="mt-4 text-[14px] font-medium text-[var(--ink-primary)]">
            Select a student
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-muted)]">
            The profile shows progress, membership, momentum, and quick actions for the
            selected student.
          </p>
        </div>
      </div>
    );
  }

  const course = student.courseStates[0];
  const risk = course ? riskSegmentMeta[course.riskSegment] : null;
  const intervention = getInterventionForStudent(student.id);
  const interventionState = intervention?.state ?? null;
  const interventionMeta = interventionState ? interventionStateMeta[interventionState] : null;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[var(--canvas-elevated)]",
        variant === "column" && "border-l border-[var(--hairline)]",
      )}
    >
      {/* Header — identity */}
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
          {/* Membership & value */}
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
                <span className="font-mono tabular-nums">${student.membership.monthlyValue}/mo</span>
              </Field>
              <Field label="Annual value">
                <span className="font-mono tabular-nums">${student.membership.monthlyValue * 12}/yr</span>
              </Field>
            </dl>
          </section>

          {/* Progress */}
          {course && (
            <section className="flex flex-col gap-3 px-5 py-4">
              <SectionTitle icon={History}>Progress timeline</SectionTitle>
              {course.progressHistory.length > 0 && (
                <ol className="relative space-y-3 pl-6">
                  <span className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--hairline)]" />
                  {[...course.progressHistory].reverse().map((event, i) => (
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
              )}
              <div className="mt-1 flex items-center gap-3 border-t border-[var(--hairline)] pt-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-[3px] flex-1 overflow-hidden bg-[var(--hairline)]">
                    <div
                      className="h-full bg-[var(--recovery-green)]"
                      style={{
                        width: `${Math.max(0, Math.min(100, course.progressPercent))}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
                    {course.progressPercent}%
                  </span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                  {course.lessonsCompleted}/{COURSE.lessonCount} lessons
                </span>
              </div>
              {risk && (
                <p className="text-[12px] text-[var(--ink-muted)]">
                  Risk segment:{" "}
                  <span className={cn("font-medium", risk.color)}>{risk.label}</span>
                </p>
              )}
            </section>
          )}

          {/* Last intervention */}
          {intervention && interventionMeta && (
            <section className="flex flex-col gap-3 px-5 py-4">
              <SectionTitle icon={AlertTriangle}>Last intervention</SectionTitle>
              <div className="flex items-start gap-2">
                <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", interventionMeta.dot)} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                    {intervention.recommendedAction}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">{intervention.trigger}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-medium",
                    interventionMeta.color,
                  )}
                >
                  {interventionMeta.label}
                </span>
                {intervention.sentAt && (
                  <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                    Sent {formatShortDate(intervention.sentAt)}
                  </span>
                )}
                {intervention.cooldownUntil && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--ink-muted)]">
                    <CalendarClock className="size-3" />
                    Cooldown {formatShortDate(intervention.cooldownUntil)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AttributionPill level={intervention.attributionLevel} />
              </div>
            </section>
          )}

          {/* Membership quick stats */}
          <section className="flex flex-col gap-3 px-5 py-4">
            <SectionTitle icon={Sparkles}>Activity</SectionTitle>
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Days inactive">
                <span className="font-mono text-[12px] tabular-nums">{course?.daysInactive ?? 0}d</span>
              </Field>
              <Field label="Current lesson">
                <span className="text-[12px]">{course?.currentLessonTitle ?? "—"}</span>
              </Field>
            </dl>
          </section>
        </div>
      </div>

      {/* Sticky actions */}
      <div className="shrink-0 border-t border-[var(--hairline)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={onSendMessage}
            className="h-8 rounded-none bg-[var(--ink-primary)] text-[var(--canvas)] hover:bg-[var(--ink-primary)]/90"
          >
            <Mail className="size-3.5" />
            Send message
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-muted)] hover:bg-[var(--critical-light)] hover:text-[var(--critical)]"
              >
                <ShieldOff className="size-3.5" />
                {excluded ? "Re-include" : "Exclude"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-none sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {excluded ? "Re-include this student?" : "Exclude this student?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {excluded
                    ? `${student.name.split(" ")[0]} will start receiving automated rescue interventions again.`
                    : `${student.name.split(" ")[0]} will no longer receive any automated rescue interventions. You can reverse this at any time.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-none bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90"
                  onClick={() => onToggleExclude(!excluded)}
                >
                  {excluded ? "Re-include student" : "Exclude student"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-8 rounded-none px-3 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)]"
            onClick={() => {
              /* no-op for now */
            }}
          >
            <Send className="size-3.5" />
            Open in queue
          </Button>
        </div>
      </div>
    </div>
  );
}
