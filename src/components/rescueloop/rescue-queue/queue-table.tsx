"use client";

import { Inbox } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PriorityPill } from "@/components/shared/status-pills";
import { formatShortDate, riskSegmentMeta } from "@/lib/format";
import type { QueueTab, RescueQueueRow, Student } from "@/lib/types";

interface QueueTableProps {
  rows: RescueQueueRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  allSelected: boolean;
  onReview: (student: Student) => void;
  activeTab: QueueTab;
}

const EMPTY_COPY: Record<QueueTab, { title: string; description: string }> = {
  awaiting_review: {
    title: "No students awaiting review",
    description:
      "When RescueLoop detects a new risk signal, you'll see it here for approval.",
  },
  approved: {
    title: "Nothing approved and waiting",
    description:
      "Approved interventions move to Scheduled or Sent once they're queued for delivery.",
  },
  scheduled: {
    title: "No interventions scheduled",
    description:
      "Interventions you schedule for a future time will appear here until they send.",
  },
  sent: {
    title: "No interventions in flight",
    description:
      "Sent messages and opened threads show up here while you wait for a response.",
  },
  responded: {
    title: "No active responses",
    description:
      "When a member replies to a rescue message, you'll see the conversation here.",
  },
  recovered: {
    title: "No recoveries yet",
    description:
      "Members who return to the course after a rescue will appear here once confirmed.",
  },
  dismissed: {
    title: "Nothing dismissed",
    description:
      "Interventions you decline or stop will be archived here for your records.",
  },
};

function EmptyState({ tab }: { tab: QueueTab }) {
  const copy = EMPTY_COPY[tab];
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E3E5DF] bg-[#FFFFFF] px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#F8F8F5] text-[#6A706A]">
        <Inbox className="size-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#171A17]">{copy.title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[#6A706A]">{copy.description}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E3E5DF]">
      <div
        className="h-full rounded-full bg-[#147D68]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function QueueTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  allSelected,
  onReview,
  activeTab,
}: QueueTableProps) {
  if (rows.length === 0) {
    return <EmptyState tab={activeTab} />;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-[#E3E5DF] bg-[#FFFFFF] lg:block">
        <div className="max-h-[640px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[#F8F8F5]">
              <TableRow className="border-b border-[#E3E5DF] hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(c) => onToggleAll(Boolean(c))}
                    aria-label="Select all visible rows"
                  />
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Student
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Trigger
                </TableHead>
                <TableHead className="w-[140px] text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Progress
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Last activity
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Membership
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Recommended rescue
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Priority
                </TableHead>
                <TableHead className="w-24 pr-4 text-right text-xs font-medium uppercase tracking-wide text-[#6A706A]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const selected = selectedIds.has(row.id);
                const course = row.student.courseStates[0];
                const risk = course ? riskSegmentMeta[course.riskSegment] : null;
                return (
                  <TableRow
                    key={row.id}
                    data-state={selected ? "selected" : undefined}
                    className={selected ? "bg-[#F8FBF9]" : undefined}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => onToggleRow(row.id)}
                        aria-label={`Select ${row.student.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 bg-[#E8F5EF] text-[#0B5144]">
                          <AvatarFallback className="bg-[#E8F5EF] text-xs font-medium text-[#0B5144]">
                            {row.student.avatarInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-[#171A17]">
                            {row.student.name}
                          </div>
                          <div className="truncate text-xs text-[#6A706A]">
                            {row.student.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span
                        className="block truncate text-sm text-[#171A17]"
                        title={row.trigger}
                      >
                        {row.trigger}
                      </span>
                      {risk && (
                        <span className={`text-xs ${risk.color}`}>
                          {risk.label}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="tabular-mono text-xs font-medium text-[#171A17]">
                          {row.progressPercent}%
                        </span>
                        <ProgressBar value={row.progressPercent} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="tabular-mono text-sm text-[#171A17]">
                        {formatShortDate(row.lastActivityAt)}
                      </span>
                      {course && (
                        <span className="block text-xs text-[#6A706A]">
                          {course.daysInactive}d inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#6A706A]">
                        {row.membershipLabel}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <span
                        className="block truncate text-sm text-[#171A17]"
                        title={row.recommendedRescue}
                      >
                        {row.recommendedRescue}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PriorityPill priority={row.priority} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReview(row.student)}
                        className="h-8"
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 lg:hidden">
        {rows.map((row) => {
          const selected = selectedIds.has(row.id);
          const course = row.student.courseStates[0];
          const risk = course ? riskSegmentMeta[course.riskSegment] : null;
          return (
            <div
              key={row.id}
              className={`rounded-xl border bg-[#FFFFFF] p-3 transition-colors ${
                selected
                  ? "border-[#147D68] bg-[#F8FBF9]"
                  : "border-[#E3E5DF]"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggleRow(row.id)}
                  aria-label={`Select ${row.student.name}`}
                  className="mt-1"
                />
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-[#E8F5EF] text-xs font-medium text-[#0B5144]">
                    {row.student.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[#171A17]">
                        {row.student.name}
                      </div>
                      <div className="truncate text-xs text-[#6A706A]">
                        {row.student.email}
                      </div>
                    </div>
                    <PriorityPill priority={row.priority} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[#171A17]">
                    {row.trigger}
                  </p>
                  {risk && (
                    <span className={`text-xs ${risk.color}`}>{risk.label}</span>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E3E5DF]">
                        <div
                          className="h-full rounded-full bg-[#147D68]"
                          style={{
                            width: `${Math.max(0, Math.min(100, row.progressPercent))}%`,
                          }}
                        />
                      </div>
                      <span className="tabular-mono text-xs font-medium text-[#171A17]">
                        {row.progressPercent}%
                      </span>
                    </div>
                    <span className="tabular-mono text-xs text-[#6A706A]">
                      {formatShortDate(row.lastActivityAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-[#6A706A]">
                      {row.recommendedRescue}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReview(row.student)}
                      className="h-8 shrink-0"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
