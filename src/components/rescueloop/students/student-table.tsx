"use client";

import { Eye, History, Ban, Send, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MembershipStatusPill,
  MomentumPill,
} from "@/components/shared/status-pills";
import { formatShortDate, riskSegmentMeta } from "@/lib/format";
import type { Student } from "@/lib/types";
import { COURSE } from "@/lib/mock-data";

export type StudentAction = "history" | "exclude" | "message";

interface StudentTableProps {
  students: Student[];
  excludedIds: Set<string>;
  onView: (student: Student) => void;
  onAction: (student: Student, action: StudentAction) => void;
}

/**
 * Desktop results table. Hidden below the lg breakpoint where the
 * mobile card grid takes over.
 */
export function StudentTable({
  students,
  excludedIds,
  onView,
  onAction,
}: StudentTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E3E5DF] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#E3E5DF] bg-[#F8F8F5] hover:bg-[#F8F8F5]">
            <TableHead className="pl-4 text-[13px] font-medium text-[#6A706A]">
              Student
            </TableHead>
            <TableHead className="text-[13px] font-medium text-[#6A706A]">
              Progress
            </TableHead>
            <TableHead className="text-[13px] font-medium text-[#6A706A]">
              Last activity
            </TableHead>
            <TableHead className="text-[13px] font-medium text-[#6A706A]">
              Membership
            </TableHead>
            <TableHead className="text-[13px] font-medium text-[#6A706A]">
              Renewal
            </TableHead>
            <TableHead className="text-[13px] font-medium text-[#6A706A]">
              Risk
            </TableHead>
            <TableHead className="text-[13px] font-medium text-[#6A706A]">
              Momentum
            </TableHead>
            <TableHead className="pr-4 text-right text-[13px] font-medium text-[#6A706A]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const cs = student.courseStates[0];
            const risk = riskSegmentMeta[cs.riskSegment];
            const excluded = excludedIds.has(student.id);
            return (
              <TableRow
                key={student.id}
                className="border-b border-[#E3E5DF] last:border-0 hover:bg-[#F8F8F5]"
              >
                <TableCell className="py-3 pl-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-[#E8F5EF] text-[12px] font-semibold text-[#147D68]">
                        {student.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-[#171A17]">
                          {student.name}
                        </span>
                        {excluded && (
                          <span className="rounded-full border border-[#E3E5DF] bg-[#F0F2EC] px-1.5 py-0 text-[10px] font-medium text-[#6A706A]">
                            excluded
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[12px] text-[#6A706A]">
                        {student.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Progress
                      value={cs.progressPercent}
                      className="h-1.5 w-20 bg-[#F0F2EC]"
                    />
                    <span className="tabular-mono text-[13px] font-medium text-[#171A17]">
                      {cs.progressPercent}%
                    </span>
                  </div>
                  <div className="tabular-mono mt-0.5 text-[11px] text-[#6A706A]">
                    {cs.lessonsCompleted}/{COURSE.lessonCount} lessons
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="text-[13px] text-[#171A17]">
                    {formatShortDate(cs.lastActivityAt)}
                  </div>
                  <div className="tabular-mono text-[11px] text-[#6A706A]">
                    {cs.daysInactive === 0
                      ? "today"
                      : `${cs.daysInactive} days ago`}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <MembershipStatusPill status={student.membership.status} />
                </TableCell>
                <TableCell className="py-3">
                  <span className="tabular-mono text-[13px] text-[#171A17]">
                    {formatShortDate(student.membership.renewalDate)}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span
                    className={`text-[13px] font-medium ${risk.color}`}
                  >
                    {risk.label}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <MomentumPill momentum={cs.momentum} />
                </TableCell>
                <TableCell className="py-3 pr-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(student)}
                      className="h-8 px-2.5 text-[13px] text-[#147D68] hover:bg-[#E8F5EF] hover:text-[#147D68]"
                    >
                      <Eye className="size-3.5" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#6A706A]"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => onAction(student, "history")}
                        >
                          <History className="size-4" />
                          View rescue history
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(student, "exclude")}
                        >
                          <Ban className="size-4" />
                          {excluded
                            ? "Re-include in automation"
                            : "Exclude from automation"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction(student, "message")}
                        >
                          <Send className="size-4" />
                          Send message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
