"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { StudentRow, type LiveQueueRow } from "./student-row";
import type { QueueTab } from "@/lib/types";

interface StudentListProps {
  rows: LiveQueueRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  activeStage: QueueTab;
  reduced?: boolean;
  className?: string;
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

export function StudentList({
  rows,
  selectedId,
  onSelect,
  onApprove,
  onDismiss,
  activeStage,
  reduced = false,
  className,
}: StudentListProps) {
  return (
    <div className={className}>
      {/* Header strip with count */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--canvas)]/95 px-4 py-2 backdrop-blur">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          {rows.length} {rows.length === 1 ? "student" : "students"}
        </span>
        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
          ← swipe to act on mobile
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState stage={activeStage} />
      ) : (
        <div role="listbox" aria-label="Students in queue" tabIndex={0}>
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map((row) => (
              <StudentRow
                key={row.id}
                row={row}
                isSelected={row.id === selectedId}
                onSelect={() => onSelect(row.id)}
                onApprove={() => onApprove(row.id)}
                onDismiss={() => onDismiss(row.id)}
                reduced={reduced}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function EmptyState({ stage }: { stage: QueueTab }) {
  const copy = EMPTY_COPY[stage];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center px-6 py-20 text-center"
    >
      <div className="flex size-10 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]">
        <Inbox className="size-4" />
      </div>
      <h3 className="mt-4 text-[14px] font-medium text-[var(--ink-primary)]">{copy.title}</h3>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-[var(--ink-muted)]">
        {copy.description}
      </p>
    </motion.div>
  );
}
