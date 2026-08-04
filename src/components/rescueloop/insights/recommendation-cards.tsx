"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  RotateCcw,
  X,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pills";
import type { FrictionFinding } from "@/lib/types";

type FindingStatus = FrictionFinding["status"];

const STATUS_META: Record<
  FindingStatus,
  { label: string; color: string; dot: string }
> = {
  new: {
    label: "New",
    color: "bg-[#FEF3E2] text-[#D89222] border-[#F5E0C2]",
    dot: "bg-[#D89222]",
  },
  planned: {
    label: "Planned",
    color: "bg-[#E8F0FE] text-[#4C7ECF] border-[#C9DCF5]",
    dot: "bg-[#4C7ECF]",
  },
  completed: {
    label: "Completed",
    color: "bg-[#E8F5EF] text-[#27966A] border-[#C7E6D5]",
    dot: "bg-[#27966A]",
  },
  dismissed: {
    label: "Dismissed",
    color: "bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]",
    dot: "bg-[#6A706A]",
  },
};

interface Props {
  finding: FrictionFinding;
}

export function RecommendationCard({ finding }: Props) {
  const [status, setStatus] = useState<FindingStatus>(finding.status);
  const meta = STATUS_META[status];
  const multiple = (finding.stallRate / finding.courseAverageStallRate).toFixed(
    1,
  );

  // Max bar width is the lesson's own stall rate (so it always reaches the
  // end of the comparison track). The course-avg bar scales relative to it.
  const lessonBarWidth = 100;
  const avgBarWidth =
    (finding.courseAverageStallRate / finding.stallRate) * 100;

  function markPlanned() {
    setStatus("planned");
    toast.success(`Lesson ${finding.lessonIndex} marked as planned`);
  }
  function markCompleted() {
    setStatus("completed");
    toast.success(`Lesson ${finding.lessonIndex} marked as completed`);
  }
  function dismiss() {
    setStatus("dismissed");
    toast.info(`Lesson ${finding.lessonIndex} recommendation dismissed`);
  }
  function reactivate() {
    setStatus("new");
    toast.info(`Lesson ${finding.lessonIndex} recommendation reactivated`);
  }
  function viewAffected() {
    toast.info(
      `Showing ${finding.affectedStudents} students affected by Lesson ${finding.lessonIndex}`,
    );
  }

  return (
    <Card
      className="gap-0 overflow-hidden border-l-4 py-0"
      style={{ borderLeftColor: meta.dot }}
    >
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Header: lesson ref + title + status pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6A706A]">
              Lesson {finding.lessonIndex}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#171A17]">
              {finding.lessonTitle}
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <StatusPill className={meta.color} dot dotColor={meta.dot}>
                {meta.label}
              </StatusPill>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Recommendation text (prominent) */}
        <div className="rounded-lg bg-[#F8F8F5] px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#6A706A]">
            Recommendation
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-[#171A17]">
            {finding.recommendation}
          </p>
        </div>

        {/* Stall rate vs course average comparison */}
        <div className="flex flex-col gap-2">
          <ComparisonRow
            label={`Lesson ${finding.lessonIndex}`}
            value={`${finding.stallRate}%`}
            widthPct={lessonBarWidth}
            color={
              finding.stallRate > 15
                ? "#C64D45"
                : finding.stallRate > 10
                  ? "#D89222"
                  : "#147D68"
            }
          />
          <ComparisonRow
            label="Course avg"
            value={`${finding.courseAverageStallRate}%`}
            widthPct={avgBarWidth}
            color="#6A706A"
            track
          />
        </div>

        {/* Evidence bullets */}
        <ul className="flex flex-col gap-1.5 text-xs text-[#6A706A]">
          <li className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 shrink-0 text-[#D89222]" />
            <span>
              <span
                className="font-semibold text-[#171A17]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {finding.affectedStudents}
              </span>{" "}
              students stalled at this lesson
            </span>
          </li>
          <li className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 shrink-0 text-[#D89222]" />
            <span>
              <span
                className="font-semibold text-[#171A17]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {finding.reportsCount}
              </span>{" "}
              reported difficulty
            </span>
          </li>
          <li className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 shrink-0 text-[#C64D45]" />
            <span>
              Stall rate is{" "}
              <span
                className="font-semibold text-[#C64D45]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {multiple}&times;
              </span>{" "}
              the course average
            </span>
          </li>
        </ul>

        {/* Action buttons based on status */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#E3E5DF] pt-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-2"
            >
              {status === "new" && (
                <>
                  <Button size="sm" onClick={markPlanned}>
                    <ClipboardList className="size-3.5" />
                    Mark planned
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismiss}
                  >
                    <X className="size-3.5" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={viewAffected}
                  >
                    <Eye className="size-3.5" />
                    View affected students
                  </Button>
                </>
              )}
              {status === "planned" && (
                <>
                  <Button size="sm" onClick={markCompleted}>
                    <CheckCircle2 className="size-3.5" />
                    Mark completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismiss}
                  >
                    <X className="size-3.5" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={viewAffected}
                  >
                    <Eye className="size-3.5" />
                    View affected students
                  </Button>
                </>
              )}
              {status === "completed" && (
                <>
                  <StatusPill
                    className="bg-[#E8F5EF] text-[#27966A] border-[#C7E6D5]"
                    dot
                    dotColor="bg-[#27966A]"
                  >
                    Completed
                  </StatusPill>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={viewAffected}
                  >
                    <Eye className="size-3.5" />
                    View affected students
                  </Button>
                </>
              )}
              {status === "dismissed" && (
                <>
                  <StatusPill
                    className="bg-[#F0F2EC] text-[#6A706A] border-[#E3E5DF]"
                    dot
                    dotColor="bg-[#6A706A]"
                  >
                    Dismissed
                  </StatusPill>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={reactivate}
                  >
                    <RotateCcw className="size-3.5" />
                    Reactivate
                  </Button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({
  label,
  value,
  widthPct,
  color,
  track,
}: {
  label: string;
  value: string;
  widthPct: number;
  color: string;
  track?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-[#6A706A]">{label}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#F0F2EC]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${Math.max(8, widthPct)}%`,
            backgroundColor: color,
            opacity: track ? 0.55 : 1,
          }}
        />
      </div>
      <span
        className="tabular-mono w-10 shrink-0 text-right text-xs font-semibold"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}
