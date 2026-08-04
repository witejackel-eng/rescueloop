"use client";

import { Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MembershipStatusPill,
  MomentumPill,
} from "@/components/shared/status-pills";
import { formatShortDate, riskSegmentMeta } from "@/lib/format";
import type { Student } from "@/lib/types";
import { COURSE } from "@/lib/mock-data";

interface StudentCardProps {
  student: Student;
  excluded: boolean;
  onView: (student: Student) => void;
}

/**
 * Mobile results card. Renders below the lg breakpoint as a 1- or 2-column
 * grid (the parent decides).
 */
export function StudentCard({ student, excluded, onView }: StudentCardProps) {
  const cs = student.courseStates[0];
  const risk = riskSegmentMeta[cs.riskSegment];
  return (
    <div className="rounded-xl border border-[#E3E5DF] bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-[#E8F5EF] text-[13px] font-semibold text-[#147D68]">
            {student.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-semibold text-[#171A17]">
              {student.name}
            </span>
            {excluded && (
              <span className="shrink-0 rounded-full border border-[#E3E5DF] bg-[#F0F2EC] px-1.5 py-0 text-[10px] font-medium text-[#6A706A]">
                excluded
              </span>
            )}
          </div>
          <div className="truncate text-[12px] text-[#6A706A]">
            {student.email}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(student)}
          className="h-8 shrink-0 text-[13px]"
        >
          <Eye className="size-3.5" />
          View
        </Button>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="text-[#6A706A]">Progress</span>
          <span className="tabular-mono font-medium text-[#171A17]">
            {cs.progressPercent}%
          </span>
        </div>
        <Progress value={cs.progressPercent} className="h-1.5 bg-[#F0F2EC]" />
        <div className="tabular-mono mt-1 text-[11px] text-[#6A706A]">
          {cs.lessonsCompleted}/{COURSE.lessonCount} lessons · {cs.currentLessonTitle}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <MembershipStatusPill status={student.membership.status} />
        <MomentumPill momentum={cs.momentum} />
        <span className={`text-[12px] font-medium ${risk.color}`}>
          · {risk.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#E3E5DF] pt-3 text-[12px] text-[#6A706A]">
        <span>
          Active <span className="text-[#171A17]">{formatShortDate(cs.lastActivityAt)}</span>{" "}
          · <span className="tabular-mono">{cs.daysInactive}d ago</span>
        </span>
        <span>
          Renews{" "}
          <span className="tabular-mono text-[#171A17]">
            {formatShortDate(student.membership.renewalDate)}
          </span>
        </span>
      </div>
    </div>
  );
}
