"use client";

import { useState } from "react";
import {
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
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { COURSE, PRODUCT } from "@/lib/mock-data";
import {
  formatDate,
  formatShortDate,
  relativeDay,
  riskSegmentMeta,
} from "@/lib/format";
import type { Intervention, Student, ProgressEvent } from "@/lib/types";

interface StudentDrawerProps {
  student: Student | null;
  intervention: Intervention | null;
  previousInterventions: Intervention[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TimelineIcon({ action }: { action: ProgressEvent["action"] }) {
  switch (action) {
    case "completed":
      return (
        <span className="flex size-5 items-center justify-center rounded-full bg-[#E8F5EF] text-[#27966A]">
          <Check className="size-3" />
        </span>
      );
    case "started":
      return (
        <span className="flex size-5 items-center justify-center rounded-full bg-[#E8F0FE] text-[#4C7ECF]">
          <Play className="size-3" />
        </span>
      );
    case "stalled":
      return (
        <span className="flex size-5 items-center justify-center rounded-full bg-[#FEF3E2] text-[#D89222]">
          <Pause className="size-3" />
        </span>
      );
    case "returned":
      return (
        <span className="flex size-5 items-center justify-center rounded-full bg-[#E8F5EF] text-[#147D68]">
          <RefreshCw className="size-3" />
        </span>
      );
    default:
      return null;
  }
}

function TimelineLabel({ action }: { action: ProgressEvent["action"] }) {
  const labels: Record<ProgressEvent["action"], string> = {
    completed: "Completed",
    started: "Started",
    stalled: "Stalled",
    returned: "Returned",
  };
  return <>{labels[action]}</>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
        {label}
      </dt>
      <dd className="text-sm text-[#171A17]">{children}</dd>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#171A17]">
      <Icon className="size-4 text-[#6A706A]" />
      {children}
    </h3>
  );
}

export function StudentDrawer({
  student,
  intervention,
  previousInterventions,
  open,
  onOpenChange,
}: StudentDrawerProps) {
  const [editingMessage, setEditingMessage] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [lastInterventionId, setLastInterventionId] = useState<string | null>(
    null,
  );

  // Reset edit state when switching interventions (render-time adjustment).
  const currentId = intervention?.id ?? null;
  if (currentId !== lastInterventionId) {
    setLastInterventionId(currentId);
    setEditingMessage(false);
    setMessageDraft(intervention?.messagePreview ?? "");
  }

  if (!student || !intervention) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] p-0" />
      </Sheet>
    );
  }

  const courseState = student.courseStates[0];
  const risk = courseState ? riskSegmentMeta[courseState.riskSegment] : null;
  const cooldownText = intervention.cooldownUntil
    ? `${formatDate(intervention.cooldownUntil)} · ${relativeDay(intervention.cooldownUntil)}`
    : "None";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        {/* Header — student identity */}
        <SheetHeader className="gap-3 border-b border-[#E3E5DF] p-4 pr-12">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-[#E8F5EF] text-sm font-semibold text-[#0B5144]">
                {student.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base font-semibold text-[#171A17]">
                {student.name}
              </SheetTitle>
              <SheetDescription className="truncate text-xs text-[#6A706A]">
                {student.email}
              </SheetDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6A706A]">
            <span>Joined {formatShortDate(student.joinedAt)}</span>
            <span className="text-[#D8DAD4]">·</span>
            <span className="truncate">{PRODUCT.name}</span>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 p-4">
            {/* Course & membership */}
            <section className="flex flex-col gap-3">
              <SectionTitle icon={Sparkles}>Course &amp; membership</SectionTitle>
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Course">{COURSE.name}</Field>
                <Field label="Status">
                  <MembershipStatusPill status={student.membership.status} />
                </Field>
                <Field label="Renews">
                  <span className="tabular-mono">
                    {formatShortDate(student.membership.renewalDate)}
                  </span>
                </Field>
                <Field label="Monthly value">
                  <span className="tabular-mono">
                    ${student.membership.monthlyValue}/mo
                  </span>
                </Field>
              </dl>
            </section>

            <div className="h-px bg-[#E3E5DF]" />

            {/* Progress */}
            {courseState && (
              <section className="flex flex-col gap-3">
                <SectionTitle icon={Play}>Progress</SectionTitle>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="tabular-mono text-sm font-semibold text-[#171A17]">
                      {courseState.progressPercent}%
                    </span>
                    <span className="text-xs text-[#6A706A]">
                      {courseState.lessonsCompleted} of {COURSE.lessonCount}{" "}
                      lessons
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E3E5DF]">
                    <div
                      className="h-full rounded-full bg-[#147D68]"
                      style={{
                        width: `${Math.max(0, Math.min(100, courseState.progressPercent))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[#6A706A]">
                    Current lesson:{" "}
                    <span className="font-medium text-[#171A17]">
                      {courseState.currentLessonTitle}
                    </span>
                  </p>
                </div>
              </section>
            )}

            <div className="h-px bg-[#E3E5DF]" />

            {/* Activity, renewal, risk */}
            {courseState && (
              <section className="grid grid-cols-2 gap-3">
                <Field label="Last activity">
                  <span className="tabular-mono">
                    {formatShortDate(courseState.lastActivityAt)}
                  </span>
                  <span className="block text-xs text-[#6A706A]">
                    {courseState.daysInactive} days inactive
                  </span>
                </Field>
                <Field label="Renewal">
                  <span className="tabular-mono">
                    {formatShortDate(student.membership.renewalDate)}
                  </span>
                  <span className="block text-xs text-[#6A706A]">
                    {relativeDay(student.membership.renewalDate)}
                  </span>
                </Field>
                <Field label="Current risk">
                  {risk && <span className={risk.color}>{risk.label}</span>}
                </Field>
                <Field label="Priority">
                  <PriorityPill priority={intervention.priority} />
                </Field>
              </section>
            )}

            <div className="h-px bg-[#E3E5DF]" />

            {/* Progress timeline */}
            {courseState && courseState.progressHistory.length > 0 && (
              <section className="flex flex-col gap-3">
                <SectionTitle icon={History}>Progress timeline</SectionTitle>
                <ol className="relative space-y-3 pl-6">
                  <span className="absolute left-[9px] top-1 bottom-1 w-px bg-[#E3E5DF]" />
                  {[...courseState.progressHistory].reverse().map((event, i) => (
                    <li key={`${event.date}-${event.lessonIndex}-${i}`} className="relative">
                      <span className="absolute -left-6 top-0.5">
                        <TimelineIcon action={event.action} />
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[#171A17]">
                            {event.lessonTitle}
                          </span>
                          <span className="tabular-mono text-xs text-[#6A706A]">
                            {formatShortDate(event.date)}
                          </span>
                        </div>
                        <span className="text-xs text-[#6A706A]">
                          <TimelineLabel action={event.action} /> · Lesson{" "}
                          {event.lessonIndex + 1}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="h-px bg-[#E3E5DF]" />

            {/* Why RescueLoop flagged them */}
            <section className="flex flex-col gap-3">
              <SectionTitle icon={Sparkles}>
                Why RescueLoop flagged them
              </SectionTitle>
              <p className="text-sm text-[#171A17]">{intervention.trigger}</p>
              {intervention.evidence.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {intervention.evidence.map((ev, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[#6A706A]"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#147D68]" />
                      {ev}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="h-px bg-[#E3E5DF]" />

            {/* Recommended action */}
            <section className="flex flex-col gap-2">
              <SectionTitle icon={Sparkles}>Recommended action</SectionTitle>
              <p className="text-sm text-[#171A17]">
                {intervention.recommendedAction}
              </p>
            </section>

            <div className="h-px bg-[#E3E5DF]" />

            {/* Message preview / edit */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <SectionTitle icon={Mail}>Message preview</SectionTitle>
                {!editingMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs text-[#6A706A]"
                    onClick={() => {
                      setMessageDraft(intervention.messagePreview);
                      setEditingMessage(true);
                    }}
                  >
                    <FileEdit className="size-3.5" />
                    Edit message
                  </Button>
                )}
              </div>
              {editingMessage ? (
                <div className="flex flex-col gap-2">
                  <Textarea
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    rows={6}
                    className="bg-[#FFFFFF] text-sm"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setEditingMessage(false)}
                    >
                      <X className="size-3.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 bg-[#147D68] text-xs text-white hover:bg-[#147D68]/90"
                      onClick={() => setEditingMessage(false)}
                    >
                      <Check className="size-3.5" />
                      Save draft
                    </Button>
                  </div>
                </div>
              ) : (
                <blockquote className="rounded-lg border-l-2 border-[#147D68] bg-[#F8F8F5] p-3 text-sm italic leading-relaxed text-[#171A17]">
                  {intervention.messagePreview || "No message drafted."}
                </blockquote>
              )}
            </section>

            <div className="h-px bg-[#E3E5DF]" />

            {/* Send timing + cooldown */}
            <section className="grid grid-cols-2 gap-3">
              <Field label="Send timing">
                {intervention.scheduledFor ? (
                  <span className="flex flex-col">
                    <span className="tabular-mono">
                      {formatDate(intervention.scheduledFor)}
                    </span>
                    <span className="text-xs text-[#6A706A]">
                      {relativeDay(intervention.scheduledFor)}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#147D68]">
                    <Send className="size-3.5" />
                    Send now
                  </span>
                )}
              </Field>
              <Field label="Cooldown until">
                <span className="tabular-mono text-sm">{cooldownText}</span>
              </Field>
            </section>

            <div className="h-px bg-[#E3E5DF]" />

            {/* Previous interventions */}
            <section className="flex flex-col gap-2">
              <SectionTitle icon={History}>Previous interventions</SectionTitle>
              {previousInterventions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#E3E5DF] bg-[#F8F8F5] px-3 py-4 text-center text-xs text-[#6A706A]">
                  No previous interventions for this member.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {previousInterventions.map((iv) => (
                    <li
                      key={iv.id}
                      className="rounded-lg border border-[#E3E5DF] bg-[#FFFFFF] p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[#171A17]">
                          {iv.recommendedAction}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-[#E3E5DF] bg-[#F8F8F5] text-xs text-[#6A706A]"
                        >
                          {iv.state}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-[#6A706A]">{iv.trigger}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="h-px bg-[#E3E5DF]" />

            {/* Attribution evidence */}
            <section className="flex flex-col gap-2">
              <SectionTitle icon={Sparkles}>Attribution evidence</SectionTitle>
              <div className="flex items-center gap-2">
                <AttributionPill level={intervention.attributionLevel} />
                {intervention.scheduledFor && (
                  <Badge
                    variant="outline"
                    className="border-[#E3E5DF] bg-[#F8F8F5] text-xs text-[#6A706A]"
                  >
                    <CalendarClock className="size-3" />
                    Scheduled
                  </Badge>
                )}
              </div>
              <ul className="flex flex-col gap-1.5">
                {intervention.evidence.map((ev, i) => (
                  <li
                    key={`attr-${i}`}
                    className="flex items-start gap-2 text-sm text-[#6A706A]"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#4C7ECF]" />
                    {ev}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#E3E5DF] bg-[#FFFFFF] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-[#147D68] text-white hover:bg-[#147D68]/90"
            >
              <Send className="size-3.5" />
              Approve &amp; send
            </Button>
            <Button variant="outline" size="sm">
              <FileEdit className="size-3.5" />
              Edit message
            </Button>
            <Button variant="ghost" size="sm" className="text-[#6A706A]">
              <Clock className="size-3.5" />
              Remind me later
            </Button>
            <Button variant="ghost" size="sm" className="text-[#6A706A]">
              Dismiss
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#6A706A] hover:bg-[#F4E8E6] hover:text-[#C64D45]"
                >
                  <ShieldOff className="size-3.5" />
                  Exclude student
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Exclude this student?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {student.name.split(" ")[0]} will no longer receive any
                    automated rescue interventions. You can reverse this from
                    their student profile at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-[#C64D45] text-white hover:bg-[#C64D45]/90">
                    Exclude student
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
