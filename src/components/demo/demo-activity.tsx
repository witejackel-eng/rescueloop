"use client";

import { Card } from "@/components/ui/card";
import {
  RefreshCw,
  ScanSearch,
  FileEdit,
  Check,
  Send,
  Eye,
  MessageSquare,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { DEMO_ACTIVITY, type DemoActivityEvent } from "@/lib/demo-fixtures";

const typeMeta: Record<DemoActivityEvent["type"], { icon: LucideIcon; tint: string; label: string }> = {
  sync_completed: { icon: RefreshCw, tint: "text-[var(--ink-secondary)]", label: "Sync completed" },
  candidate_detected: { icon: ScanSearch, tint: "text-[var(--warning)]", label: "Candidate detected" },
  draft_prepared: { icon: FileEdit, tint: "text-[var(--ink-secondary)]", label: "Draft prepared" },
  creator_edited: { icon: FileEdit, tint: "text-[var(--info)]", label: "Creator edited" },
  approved: { icon: Check, tint: "text-[var(--recovery-green)]", label: "Approved" },
  student_opened: { icon: Eye, tint: "text-[var(--info)]", label: "Student opened RescueLoop experience" },
  student_responded: { icon: MessageSquare, tint: "text-[var(--warning)]", label: "Student responded" },
  course_activity_observed: { icon: BookOpen, tint: "text-[var(--recovery-green)]", label: "Course activity observed" },
};

export function DemoActivitySection() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-[var(--ink-secondary)]">
        Operational timeline — every event in the rescue pipeline. All data illustrative.
      </p>

      <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[21px] top-0 bottom-0 w-px bg-[var(--hairline-subtle)]" />

            {DEMO_ACTIVITY.map((event) => {
              const meta = typeMeta[event.type];
              const Icon = meta.icon;
              return (
                <div
                  key={event.id}
                  className="group relative flex items-start gap-4 border-b border-[var(--hairline)] last:border-b-0 px-5 py-3.5 transition-colors hover:bg-[var(--canvas-elevated)]"
                >
                  {/* Icon */}
                  <span className={`relative z-[2] mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface)] ${meta.tint}`}>
                    <Icon className="size-[10px]" strokeWidth={2.25} />
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[13px] text-[var(--ink-primary)]">
                        <span className="font-medium">{event.actor}</span>
                      </p>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                        {event.timestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[var(--ink-secondary)]">{event.detail}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                      {meta.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
