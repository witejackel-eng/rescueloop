"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";
import {
  LESSON_FRICTION,
  COURSE_AVERAGE_STALL_RATE,
} from "@/lib/mock-data";

// Map the friction data into nodes. Heights (students reaching) follow a
// realistic decay across the course. L7 is the focal friction point.
interface LessonNode {
  id: string;
  index: number;
  title: string;
  stallRate: number;
  affected: number;
  reachedPct: number; // % of starters who reach this lesson
}

const REACH_CURVE = [96, 88, 84, 78, 72, 68, 62, 58, 54]; // 9 nodes

const NODES: LessonNode[] = LESSON_FRICTION.map((row, i) => {
  const match = row.lesson.match(/^L(\d+):\s*(.+)$/);
  const index = match ? Number(match[1]) : i + 1;
  const title = match ? match[2] : row.lesson;
  return {
    id: `l${index}`,
    index,
    title,
    stallRate: row.stallRate,
    affected: row.affected,
    reachedPct: REACH_CURVE[i] ?? 60,
  };
});

function frictionSeverity(stallRate: number): "ok" | "watch" | "high" {
  if (stallRate <= COURSE_AVERAGE_STALL_RATE) return "ok";
  if (stallRate <= 15) return "watch";
  return "high";
}

export function CourseIntelligenceSection() {
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>("l7");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId ?? selectedId;
  const active = NODES.find((n) => n.id === activeId) ?? NODES.find((n) => n.id === "l7")!;

  function selectNode(id: string) {
    setSelectedId(id);
  }

  const maxStall = Math.max(...NODES.map((n) => n.stallRate));

  return (
    <section className="bg-[var(--canvas-elevated)]">
      <div className="mx-auto max-w-[1400px] px-4 py-20 lg:px-8 lg:py-32">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          Course intelligence
        </div>
        <h2 className="mt-8 max-w-[20ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          See exactly where students get stuck.
        </h2>
        <p className="mt-6 max-w-[60ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Each bar shows the share of starters who reach a lesson. Amber markers
          flag stalls that exceed the course average. Lesson 7 is the largest
          single-lesson drop-off — and the highest-leverage fix.
        </p>

        {/* Lesson map */}
        <div className="mt-14 border border-[var(--hairline)] bg-[var(--surface)] p-6 lg:p-10">
          {/* Map header */}
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Lesson progression · 9 tracked lessons
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              Course avg {COURSE_AVERAGE_STALL_RATE}%
            </span>
          </div>

          {/* Bar chart */}
          <div className="mt-8">
            <div className="flex items-end justify-between gap-2 lg:gap-4" style={{ height: 220 }}>
              {NODES.map((node) => {
                const severity = frictionSeverity(node.stallRate);
                const isSelected = selectedId === node.id;
                const isHovered = hoveredId === node.id;
                const isHighlighted = node.index === 7;
                const frictionHeight = (node.stallRate / maxStall) * 100;
                return (
                  <button
                    key={node.id}
                    onClick={() => selectNode(node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    aria-label={`Lesson ${node.index}: ${node.title}, stall rate ${node.stallRate}%`}
                  >
                    {/* Friction marker (amber bar on top) */}
                    <div
                      className={cn(
                        "w-full transition-all",
                        severity === "ok" ? "opacity-0" : "opacity-100",
                      )}
                      style={{ height: `${frictionHeight}%`, minHeight: severity === "ok" ? 0 : 6 }}
                    >
                      <div
                        className={cn(
                          "mx-auto h-full w-1/2",
                          severity === "high"
                            ? "bg-[var(--critical)]"
                            : severity === "watch"
                              ? "bg-[var(--warning)]"
                              : "bg-transparent",
                        )}
                      />
                    </div>

                    {/* Reach bar (students who reached this lesson) */}
                    <motion.div
                      initial={reduced ? false : { height: 0 }}
                      whileInView={{ height: `${node.reachedPct}%` }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ ...standard, duration: 0.6, delay: 0.05 * node.index }}
                      className={cn(
                        "w-full transition-colors",
                        isHighlighted
                          ? "bg-[var(--recovery-green)]"
                          : isSelected || isHovered
                            ? "bg-[var(--ink-primary)]"
                            : "bg-[var(--ink-muted)]/40 group-hover:bg-[var(--ink-muted)]",
                      )}
                      style={{ maxHeight: "100%" }}
                    />

                    {/* Lesson label */}
                    <div
                      className={cn(
                        "mt-2 font-mono text-[10px] tabular-nums transition-colors",
                        isHighlighted
                          ? "text-[var(--recovery-green)]"
                          : isSelected || isHovered
                            ? "text-[var(--ink-primary)]"
                            : "text-[var(--ink-muted)]",
                      )}
                    >
                      L{node.index}
                    </div>

                    {/* Highlight indicator above */}
                    {isHighlighted && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--recovery-green)]">
                        ▼ friction
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Axis caption */}
            <div className="mt-3 flex items-center justify-between border-t border-[var(--hairline-subtle)] pt-2 font-mono text-[10px] text-[var(--ink-muted)]">
              <span>Lesson index</span>
              <span>Stall rate · affected students</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-[var(--ink-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 bg-[var(--ink-primary)]" />
              Reach (students who got here)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 bg-[var(--warning)]" />
              Above-average stall
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 bg-[var(--critical)]" />
              Critical stall
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 bg-[var(--recovery-green)]" />
              Highlighted friction point
            </span>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={standard}
            className="mt-8 border border-[var(--hairline)] bg-[var(--surface)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
              {/* Lesson */}
              <div className="border-b border-[var(--hairline)] px-5 py-5 lg:border-b-0 lg:border-r">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Lesson
                </div>
                <div className="mt-1.5 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[var(--ink-primary)]">
                  L{active.index}
                </div>
                <div className="mt-1 text-[13px] text-[var(--ink-secondary)]">
                  {active.title}
                </div>
              </div>

              {/* Stall rate */}
              <div className="border-b border-[var(--hairline)] px-5 py-5 lg:border-b-0 lg:border-r">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Stall rate
                </div>
                <div
                  className={cn(
                    "mt-1.5 font-mono text-[28px] tabular-nums leading-none",
                    frictionSeverity(active.stallRate) === "high"
                      ? "text-[var(--critical)]"
                      : frictionSeverity(active.stallRate) === "watch"
                        ? "text-[var(--warning)]"
                        : "text-[var(--ink-primary)]",
                  )}
                >
                  {active.stallRate}%
                </div>
                <div className="mt-1 font-mono text-[11px] text-[var(--ink-muted)]">
                  vs. course avg {COURSE_AVERAGE_STALL_RATE}%
                </div>
              </div>

              {/* Affected */}
              <div className="border-b border-[var(--hairline)] px-5 py-5 lg:border-b-0 lg:border-r">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Affected students
                </div>
                <div className="mt-1.5 font-mono text-[28px] tabular-nums leading-none text-[var(--ink-primary)]">
                  {active.affected}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[var(--ink-muted)]">
                  reached L{active.index} and stalled
                </div>
              </div>

              {/* Recommendation */}
              <div className="px-5 py-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Recommended action
                </div>
                <div className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-[var(--ink-primary)]">
                  {active.index === 7 ? (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--warning)]" />
                  ) : (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--recovery-green)]" />
                  )}
                  <span>
                    {active.index === 7
                      ? "Add a setup walkthrough video to reduce stall by an estimated 30%."
                      : active.stallRate > COURSE_AVERAGE_STALL_RATE
                        ? `Monitor L${active.index}. Affected count is small enough to address through outreach first.`
                        : "Healthy. No action needed at this stall rate."}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="mt-6 font-mono text-[11px] text-[var(--ink-muted)]">
          Hover or tap any lesson to inspect its stall rate and affected count.
        </p>
      </div>
    </section>
  );
}
