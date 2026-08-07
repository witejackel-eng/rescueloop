"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, Eye, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FRICTION_FINDINGS } from "@/lib/mock-data";
import { standard } from "@/design-system/motion";
import type { FrictionFinding } from "@/lib/types";

// Extended status set (Task spec): New / Investigating / Planned / Implemented / Measuring / Resolved
type FindingStatus =
  | "new"
  | "investigating"
  | "planned"
  | "implemented"
  | "measuring"
  | "resolved";

const STATUS_META: Record<
  FindingStatus,
  { label: string; color: string; dot: string }
> = {
  new: {
    label: "New",
    color: "bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/30",
    dot: "bg-[var(--warning)]",
  },
  investigating: {
    label: "Investigating",
    color: "bg-[#E8F0FE] text-[var(--info)] border-[var(--info)]/30",
    dot: "bg-[var(--info)]",
  },
  planned: {
    label: "Planned",
    color: "bg-[#E8F0FE] text-[var(--info)] border-[var(--info)]/30",
    dot: "bg-[var(--info)]",
  },
  implemented: {
    label: "Implemented",
    color: "bg-[var(--recovery-light)] text-[var(--recovery-green)] border-[var(--recovery-green)]/30",
    dot: "bg-[var(--recovery-green)]",
  },
  measuring: {
    label: "Measuring",
    color: "bg-[var(--recovery-light)] text-[var(--recovery-green)] border-[var(--recovery-green)]/30",
    dot: "bg-[var(--recovery-green)]",
  },
  resolved: {
    label: "Resolved",
    color: "bg-[var(--recovery-light)] text-[var(--recovery-green)] border-[var(--recovery-green)]/30",
    dot: "bg-[var(--recovery-green)]",
  },
};

// Map the mock-data status types into our extended set
function initialStatus(seed: FrictionFinding["status"]): FindingStatus {
  if (seed === "new") return "new";
  if (seed === "planned") return "planned";
  if (seed === "completed") return "resolved";
  return "new";
}

const STATUS_OPTIONS: FindingStatus[] = [
  "new",
  "investigating",
  "planned",
  "implemented",
  "measuring",
  "resolved",
];

interface RecommendationWorkflowProps {
  selectedLesson: number;
  onSelectLesson: (lessonIndex: number) => void;
}

export function RecommendationWorkflow({
  selectedLesson,
  onSelectLesson,
}: RecommendationWorkflowProps) {
  const [statuses, setStatuses] = useState<Record<string, FindingStatus>>(() =>
    Object.fromEntries(FRICTION_FINDINGS.map((f) => [f.id, initialStatus(f.status)])),
  );

  // Order findings so the selected lesson is at the top, then by lesson index
  const ordered = [...FRICTION_FINDINGS].sort((a, b) => {
    if (a.lessonIndex === selectedLesson) return -1;
    if (b.lessonIndex === selectedLesson) return 1;
    return a.lessonIndex - b.lessonIndex;
  });

  function changeStatus(id: string, next: FindingStatus) {
    setStatuses((prev) => ({ ...prev, [id]: next }));
    const finding = FRICTION_FINDINGS.find((f) => f.id === id);
    if (next === "implemented") {
      toast.success(
        `Lesson ${finding?.lessonIndex} marked Implemented — 14-day observation period started`,
      );
    } else {
      toast.info(`Lesson ${finding?.lessonIndex} → ${STATUS_META[next].label}`);
    }
  }

  function viewAffected(finding: FrictionFinding) {
    onSelectLesson(finding.lessonIndex);
    toast.info(`Lesson ${finding.lessonIndex} selected — ${finding.affectedStudents} students affected`);
  }

  return (
    <div className="border border-[var(--hairline)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
          Recommendation workflow
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          {FRICTION_FINDINGS.length} findings
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-[var(--hairline)]">
        {ordered.map((finding) => {
          const status = statuses[finding.id] ?? "new";
          const meta = STATUS_META[status];
          const multiple = (finding.stallRate / finding.courseAverageStallRate).toFixed(1);
          const isMeasuring = status === "measuring";
          const isImplemented = status === "implemented";

          return (
            <li key={finding.id} className="flex flex-col gap-3 px-5 py-4">
              {/* Header: lesson ref + title + status selector */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    Lesson {finding.lessonIndex} · {finding.lessonTitle}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[var(--ink-primary)]">
                    {finding.recommendation}
                  </p>
                </div>
                <Select
                  value={status}
                  onValueChange={(v) => changeStatus(finding.id, v as FindingStatus)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-7 w-[140px] shrink-0 rounded-none border bg-[var(--surface)] text-[11px] font-medium",
                      meta.color,
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-[12px]">
                        <span className="flex items-center gap-2">
                          <span className={cn("size-1.5 rounded-full", STATUS_META[s].dot)} />
                          {STATUS_META[s].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Evidence bullets */}
              <ul className="flex flex-col gap-1.5 text-[12px] text-[var(--ink-secondary)]">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="size-3 shrink-0 text-[var(--warning)]" />
                  <span>
                    <span className="font-mono font-semibold tabular-nums text-[var(--ink-primary)]">{finding.stallRate}%</span>{" "}
                    stall rate · <span className="font-mono font-semibold tabular-nums text-[var(--critical)]">{multiple}×</span> course average
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="size-3 shrink-0 text-[var(--info)]" />
                  <span>
                    <span className="font-mono font-semibold tabular-nums text-[var(--ink-primary)]">{finding.affectedStudents}</span>{" "}
                    students affected
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="size-3 shrink-0 text-[var(--critical)]" />
                  <span>
                    <span className="font-mono font-semibold tabular-nums text-[var(--ink-primary)]">{finding.reportsCount}</span>{" "}
                    reports of difficulty
                  </span>
                </li>
              </ul>

              {/* Measuring note (when status is Implemented → auto-transitions) */}
              <AnimatePresence mode="wait">
                {isImplemented && (
                  <motion.div
                    key="implemented-note"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={standard}
                    className="border border-[var(--warning)]/30 bg-[var(--warning-light)] px-3 py-2 text-[12px] text-[var(--warning)]"
                  >
                    <span className="font-medium">Measuring — 14-day observation period.</span>{" "}
                    We&apos;ll compare stall rate vs baseline before promoting to Resolved.
                  </motion.div>
                )}
                {isMeasuring && (
                  <motion.div
                    key="measuring-note"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={standard}
                    className="border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] px-3 py-2 text-[12px] text-[var(--recovery-green)]"
                  >
                    <span className="font-medium">Under observation.</span>{" "}
                    Stall rate comparison vs baseline in progress. Promote to Resolved once 14-day
                    window completes and improvement is verifiable.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer actions */}
              <div className="flex items-center gap-2 border-t border-[var(--hairline)] pt-2">
                <button
                  type="button"
                  onClick={() => viewAffected(finding)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                >
                  <Eye className="size-3" />
                  View affected students
                </button>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                  L{finding.lessonIndex}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
