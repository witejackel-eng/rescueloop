"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BLOCKER_ANALYSIS, STUDENTS } from "@/lib/mock-data";

// Map human-readable blocker labels (from mock-data) to a typed key for coloring.
const BLOCKER_COLOR: Record<string, string> = {
  "Lack of time": "var(--warning)",
  "Material is difficult": "var(--warning)",
  "Unsure what to do next": "var(--info)",
  "Expected something different": "var(--warning)",
  "Technical problem": "var(--critical)",
  "Needs creator help": "var(--critical)",
};

interface BlockerExplorerProps {
  selectedLesson: number;
}

export function BlockerExplorer({ selectedLesson }: BlockerExplorerProps) {
  const [activeBlocker, setActiveBlocker] = useState<string | null>(null);

  const sorted = [...BLOCKER_ANALYSIS].sort((a, b) => b.percent - a.percent);
  const maxPct = Math.max(...sorted.map((b) => b.percent));
  const totalResponses = sorted.reduce((sum, b) => sum + b.count, 0);

  // Derive affected students sample (use a deterministic subset based on blocker label)
  const affectedStudents = (blocker: string): { name: string; id: string }[] => {
    const seed = blocker.length;
    const sample: { name: string; id: string }[] = [];
    const activeStudents = STUDENTS.filter((s) => !s.excluded);
    for (let i = 0; i < Math.min(4, BLOCKER_ANALYSIS.find((b) => b.blocker === blocker)?.count ?? 0); i++) {
      const student = activeStudents[(seed + i * 3) % activeStudents.length];
      if (student) sample.push({ name: student.name, id: student.id });
    }
    return sample;
  };

  function toggleBlocker(blocker: string) {
    if (activeBlocker === blocker) {
      setActiveBlocker(null);
    } else {
      setActiveBlocker(blocker);
      const count = BLOCKER_ANALYSIS.find((b) => b.blocker === blocker)?.count ?? 0;
      toast.info(`Filtered: ${count} students reported "${blocker.toLowerCase()}"`);
    }
  }

  return (
    <div className="border border-[var(--hairline)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
          Why students get stuck
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink-primary)]">{totalResponses}</span> blocker responses
        </span>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4">
        {sorted.map((b) => {
          const color = BLOCKER_COLOR[b.blocker] ?? "var(--info)";
          const widthPct = (b.percent / maxPct) * 100;
          const isActive = activeBlocker === b.blocker;
          const sample = isActive ? affectedStudents(b.blocker) : [];

          return (
            <div key={b.blocker} className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => toggleBlocker(b.blocker)}
                aria-expanded={isActive}
                className="group flex items-center gap-3 text-left"
              >
                <span className="w-[160px] shrink-0 truncate text-[12px] font-medium text-[var(--ink-primary)]">
                  {b.blocker}
                </span>
                <div className="relative h-2.5 flex-1 bg-[var(--hairline-subtle)]">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all",
                      isActive && "opacity-80",
                    )}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span
                  className="w-[44px] shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums"
                  style={{ color }}
                >
                  {b.percent}%
                </span>
                <span className="w-[80px] shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                  {b.count} students
                </span>
              </button>

              {/* Affected students sample — shown when blocker is active */}
              {isActive && (
                <div className="ml-[160px] flex flex-wrap items-center gap-1.5 border-l-2 pl-3" style={{ borderColor: color }}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                    Sample students
                  </span>
                  {sample.map((s) => (
                    <span
                      key={s.id}
                      className="border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 text-[11px] text-[var(--ink-secondary)]"
                    >
                      {s.name}
                    </span>
                  ))}
                  <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                    +{(b.count - sample.length)} more
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--hairline)] px-5 py-2 text-[11px] text-[var(--ink-muted)]">
        <span>
          {selectedLesson > 0
            ? `Blockers reported at Lesson ${selectedLesson} and across the course`
            : "Self-reported blockers from students who stalled"}
        </span>
        <span className="font-mono">Last 30 days</span>
      </div>
    </div>
  );
}
