"use client";

import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  MembershipStatusPill,
  MomentumPill,
} from "@/components/shared/status-pills";
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  riskSegmentMeta,
} from "@/lib/format";
import { COURSE } from "@/lib/mock-data";
import type { ProgressEvent, Student } from "@/lib/types";

interface StudentSummarySheetProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excluded: boolean;
  onExcludeChange: (next: boolean) => void;
  onSendMessage: () => void;
}

const ACTION_COLOR: Record<ProgressEvent["action"], string> = {
  completed: "bg-[#27966A]",
  started: "bg-[#4C7ECF]",
  stalled: "bg-[#D89222]",
  returned: "bg-[#147D68]",
};

/**
 * Right-side sheet with a condensed student profile. Surfaces the
 * data the creator would need at a glance before deciding to act.
 */
export function StudentSummarySheet({
  student,
  open,
  onOpenChange,
  excluded,
  onExcludeChange,
  onSendMessage,
}: StudentSummarySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        {student ? (
          <SheetBody
            student={student}
            excluded={excluded}
            onExcludeChange={onExcludeChange}
            onSendMessage={onSendMessage}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-[13px] text-[#6A706A]">
            No student selected.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  student,
  excluded,
  onExcludeChange,
  onSendMessage,
}: {
  student: Student;
  excluded: boolean;
  onExcludeChange: (next: boolean) => void;
  onSendMessage: () => void;
}) {
  const cs = student.courseStates[0];
  const risk = riskSegmentMeta[cs.riskSegment];
  const recentEvents = [...cs.progressHistory].slice(-5).reverse();

  return (
    <>
      <SheetHeader className="gap-0 border-b border-[#E3E5DF] p-5 pb-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-[#E8F5EF] text-[14px] font-semibold text-[#147D68]">
              {student.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-[16px] font-semibold text-[#171A17]">
              {student.name}
            </SheetTitle>
            <SheetDescription className="truncate text-[13px] text-[#6A706A]">
              {student.email}
            </SheetDescription>
            <div className="mt-1.5 text-[12px] text-[#6A706A]">
              Joined{" "}
              <span className="text-[#171A17]">
                {formatDate(student.joinedAt)}
              </span>
            </div>
          </div>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-5">
          {/* Course progress */}
          <section>
            <h3 className="mb-2 text-[13px] font-medium text-[#6A706A]">
              Course progress
            </h3>
            <div className="rounded-lg border border-[#E3E5DF] bg-[#F8F8F5] p-4">
              <div className="flex items-baseline justify-between">
                <span className="tabular-mono text-[28px] font-semibold text-[#171A17]">
                  {cs.progressPercent}%
                </span>
                <span className="tabular-mono text-[13px] text-[#6A706A]">
                  {cs.lessonsCompleted}/{COURSE.lessonCount} lessons
                </span>
              </div>
              <Progress value={cs.progressPercent} className="mt-2 h-2 bg-white" />
              <div className="mt-2 text-[12px] text-[#6A706A]">
                Currently on{" "}
                <span className="text-[#171A17]">{cs.currentLessonTitle}</span>
              </div>
            </div>
          </section>

          {/* Activity & membership */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#E3E5DF] p-3">
              <div className="text-[12px] text-[#6A706A]">Last activity</div>
              <div className="mt-0.5 text-[14px] font-medium text-[#171A17]">
                {formatShortDate(cs.lastActivityAt)}
              </div>
              <div className="tabular-mono text-[12px] text-[#6A706A]">
                {cs.daysInactive === 0
                  ? "today"
                  : `${cs.daysInactive} days inactive`}
              </div>
            </div>
            <div className="rounded-lg border border-[#E3E5DF] p-3">
              <div className="mb-0.5 text-[12px] text-[#6A706A]">Membership</div>
              <MembershipStatusPill status={student.membership.status} />
              <div className="tabular-mono mt-1.5 text-[12px] text-[#6A706A]">
                {formatCurrency(student.membership.monthlyValue)}/mo · renews{" "}
                {formatShortDate(student.membership.renewalDate)}
              </div>
            </div>
          </section>

          {/* Risk & momentum */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#E3E5DF] p-3">
              <div className="text-[12px] text-[#6A706A]">Risk segment</div>
              <div
                className={`mt-0.5 text-[14px] font-medium ${risk.color}`}
              >
                {risk.label}
              </div>
            </div>
            <div className="rounded-lg border border-[#E3E5DF] p-3">
              <div className="mb-0.5 text-[12px] text-[#6A706A]">Momentum</div>
              <MomentumPill momentum={cs.momentum} />
            </div>
          </section>

          {/* Recent progress timeline */}
          <section>
            <h3 className="mb-2 text-[13px] font-medium text-[#6A706A]">
              Recent progress
            </h3>
            <ol className="space-y-2.5">
              {recentEvents.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${ACTION_COLOR[ev.action]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] text-[#171A17]">
                        {ev.lessonTitle}
                      </span>
                      <span className="tabular-mono shrink-0 text-[11px] text-[#6A706A]">
                        {formatShortDate(ev.date)}
                      </span>
                    </div>
                    <div className="text-[11px] capitalize text-[#6A706A]">
                      {ev.action}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </ScrollArea>

      {/* Footer actions */}
      <div className="border-t border-[#E3E5DF] bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[#171A17]">
              Exclude from automation
            </div>
            <div className="text-[12px] text-[#6A706A]">
              No interventions will be sent
            </div>
          </div>
          <Switch checked={excluded} onCheckedChange={onExcludeChange} />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSendMessage}
            className="flex-1 bg-[#147D68] hover:bg-[#147D68]/90"
          >
            <Send className="size-4" />
            Send message
          </Button>
          <Button asChild variant="outline">
            <Link href="/rescue-queue" aria-label="View full rescue profile">
              Full profile
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
