"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  COURSE_AVERAGE_STALL_RATE,
  LESSON_FRICTION,
} from "@/lib/mock-data";
import { springLayout, standard } from "@/design-system/motion";

export interface LessonFrictionDatum {
  lesson: string;
  lessonIndex: number;
  lessonTitle: string;
  stallRate: number;
  affected: number;
}

// Parse "L7: Setting Up Your First Campaign" into structured data
export const LESSON_FRICTION_PARSED: LessonFrictionDatum[] = LESSON_FRICTION.map((d) => {
  const match = d.lesson.match(/^L(\d+):\s*(.+)$/);
  return {
    lesson: d.lesson,
    lessonIndex: match ? Number(match[1]) : 0,
    lessonTitle: match ? match[2] : d.lesson,
    stallRate: d.stallRate,
    affected: d.affected,
  };
});

const MAX_AFFECTED = Math.max(...LESSON_FRICTION_PARSED.map((d) => d.affected));
const MAX_STALL = Math.max(...LESSON_FRICTION_PARSED.map((d) => d.stallRate));

interface CourseMapProps {
  selectedLesson: number;
  onSelectLesson: (lessonIndex: number) => void;
}

/**
 * Interactive horizontal lesson sequence.
 * Each lesson is a column. Width represents affected count (reach).
 * Height of the bar represents stall rate.
 * Bars over the course average are amber.
 */
export function CourseMap({ selectedLesson, onSelectLesson }: CourseMapProps) {
  const selected = LESSON_FRICTION_PARSED.find((d) => d.lessonIndex === selectedLesson) ?? LESSON_FRICTION_PARSED[0];
  const multiple = (selected.stallRate / COURSE_AVERAGE_STALL_RATE).toFixed(1);

  return (
    <div className="border border-[var(--hairline)] bg-[var(--surface)]">
      {/* Header — selected lesson summary */}
      <div className="flex flex-col gap-2 border-b border-[var(--hairline)] px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Lesson {selected.lessonIndex}
          </span>
          <h2 className="font-serif text-[20px] leading-tight text-[var(--ink-primary)]">
            {selected.lessonTitle}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] tabular-nums">
          <span className="text-[var(--ink-primary)]">
            Stall rate{" "}
            <span className={cn("font-semibold", selected.stallRate > COURSE_AVERAGE_STALL_RATE ? "text-[var(--warning)]" : "text-[var(--recovery-green)]")}>
              {selected.stallRate}%
            </span>
          </span>
          <span className="text-[var(--ink-muted)]">·</span>
          <span className="text-[var(--ink-secondary)]">
            <span className="font-semibold text-[var(--ink-primary)]">{multiple}×</span> course average
          </span>
          <span className="text-[var(--ink-muted)]">·</span>
          <span className="text-[var(--ink-secondary)]">
            <span className="font-semibold text-[var(--ink-primary)]">{selected.affected}</span> affected students
          </span>
          <span className="text-[var(--ink-muted)]">·</span>
          <span className="text-[var(--ink-secondary)]">
            <span className="font-semibold text-[var(--ink-primary)]">{/* reportsCount not in mock-data — derive */}{Math.max(1, Math.round(selected.affected / 3))}</span> reports
          </span>
        </div>
      </div>

      {/* Map — horizontal sequence */}
      <div className="relative px-5 py-6">
        {/* Course average reference line */}
        <div
          className="pointer-events-none absolute inset-x-5 border-t border-dashed border-[var(--warning)]/60"
          style={{ top: `${50 + ((MAX_STALL - COURSE_AVERAGE_STALL_RATE) / MAX_STALL) * 50}%` }}
          aria-hidden
        >
          <span className="absolute -top-2 right-0 bg-[var(--surface)] px-1.5 font-mono text-[10px] text-[var(--warning)]">
            Course avg {COURSE_AVERAGE_STALL_RATE}%
          </span>
        </div>

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${LESSON_FRICTION_PARSED.length}, minmax(0, 1fr))`,
          }}
        >
          {LESSON_FRICTION_PARSED.map((d) => {
            const isSelected = d.lessonIndex === selectedLesson;
            const isOverAverage = d.stallRate > COURSE_AVERAGE_STALL_RATE;
            const reachWidth = Math.max(28, (d.affected / MAX_AFFECTED) * 100);
            const barHeight = (d.stallRate / MAX_STALL) * 100;

            return (
              <button
                key={d.lesson}
                type="button"
                onClick={() => onSelectLesson(d.lessonIndex)}
                aria-pressed={isSelected}
                className="group relative flex h-[180px] flex-col items-center justify-end gap-2 pb-1 pt-3"
                aria-label={`Lesson ${d.lessonIndex}: ${d.lessonTitle}, stall rate ${d.stallRate}%`}
              >
                {/* Column reach indicator (faint track) */}
                <div className="absolute inset-x-1 top-2 h-[120px] bg-[var(--hairline-subtle)]" aria-hidden />

                {/* Bar */}
                <motion.div
                  layout
                  transition={standard}
                  className={cn(
                    "relative z-10 w-full",
                  )}
                  style={{
                    width: `${reachWidth}%`,
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <div
                    className={cn(
                      "w-full transition-colors",
                      isSelected
                        ? "bg-[var(--ink-primary)]"
                        : isOverAverage
                          ? "bg-[var(--warning)] group-hover:bg-[var(--warning)]/80"
                          : "bg-[var(--recovery-green)]/60 group-hover:bg-[var(--recovery-green)]",
                    )}
                    style={{ height: `${Math.max(6, barHeight * 1.5)}px` }}
                  />
                </motion.div>

                {/* Selected underline */}
                {isSelected && (
                  <motion.span
                    layoutId="lesson-map-selected"
                    transition={springLayout}
                    className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 bg-[var(--recovery-green)]"
                  />
                )}

                {/* Label */}
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums",
                      isSelected ? "text-[var(--ink-primary)]" : "text-[var(--ink-muted)]",
                    )}
                  >
                    L{d.lessonIndex}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums",
                      isOverAverage ? "text-[var(--warning)]" : "text-[var(--ink-secondary)]",
                    )}
                  >
                    {d.stallRate}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] px-5 py-3 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--ink-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 bg-[var(--recovery-green)]/60" />
            ≤ course avg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 bg-[var(--warning)]" />
            over avg (friction)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 bg-[var(--ink-primary)]" />
            selected
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
          Bar height = stall rate · column density = students reached
        </span>
      </div>
    </div>
  );
}
