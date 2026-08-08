"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeReveal, standard } from "@/design-system/motion";
import { ScrollReveal } from "@/components/marketing/shared/scroll-reveal";
import { SectionEyebrow } from "@/components/marketing/shared/section-eyebrow";

// ── Lesson data ─────────────────────────────────────────────

interface LessonNode {
  id: string;
  index: number;
  title: string;
  stallRate: number;
  affected: number;
  reachedPct: number;
}

const COURSE_AVG_STALL = 11;

const LESSONS: LessonNode[] = [
  { id: "l1", index: 1, title: "Welcome & Setup", stallRate: 6, affected: 8, reachedPct: 97 },
  { id: "l2", index: 2, title: "Market Research", stallRate: 9, affected: 14, reachedPct: 89 },
  { id: "l3", index: 3, title: "Positioning", stallRate: 10, affected: 18, reachedPct: 84 },
  { id: "l4", index: 4, title: "Offer Design", stallRate: 8, affected: 12, reachedPct: 79 },
  { id: "l5", index: 5, title: "Pricing Strategy", stallRate: 12, affected: 22, reachedPct: 73 },
  { id: "l6", index: 6, title: "Sales Page", stallRate: 14, affected: 26, reachedPct: 68 },
  { id: "l7", index: 7, title: "Checkout Setup", stallRate: 24, affected: 47, reachedPct: 58 },
  { id: "l8", index: 8, title: "Email Sequence", stallRate: 11, affected: 16, reachedPct: 52 },
  { id: "l9", index: 9, title: "Launch Plan", stallRate: 7, affected: 9, reachedPct: 48 },
  { id: "l10", index: 10, title: "First Promotion", stallRate: 5, affected: 6, reachedPct: 44 },
  { id: "l11", index: 11, title: "Analytics Review", stallRate: 4, affected: 4, reachedPct: 41 },
  { id: "l12", index: 12, title: "Iteration", stallRate: 3, affected: 3, reachedPct: 38 },
];

const MAX_STALL = Math.max(...LESSONS.map((l) => l.stallRate));

function frictionSeverity(stallRate: number): "ok" | "watch" | "high" {
  if (stallRate <= COURSE_AVG_STALL) return "ok";
  if (stallRate <= 16) return "watch";
  return "high";
}

// ── Component ───────────────────────────────────────────────

export function CourseIntelligenceMoment() {
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>("l7");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId ?? selectedId;
  const active = LESSONS.find((n) => n.id === activeId) ?? LESSONS[6]!;

  return (
    <section
      id="course-intelligence-moment"
      className="border-t border-[var(--hairline)] bg-[var(--section-white)] py-20 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <ScrollReveal>
          <SectionEyebrow>Course Intelligence</SectionEyebrow>
          <h2 className="mt-6 max-w-[24ch] font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
            One lesson causes{" "}
            <span className="italic text-[var(--ink-secondary)]">
              most of the damage.
            </span>
          </h2>
          <p className="mt-6 max-w-[56ch] text-[15px] leading-relaxed text-[var(--ink-secondary)] lg:text-[16px]">
            The bar chart shows student reach at each lesson. The friction marker at
            Lesson 7 reveals a 24% stall rate — nearly double the course average.
            That&apos;s your highest-leverage fix.
          </p>
        </ScrollReveal>

        {/* Product surface */}
        <ScrollReveal delay={0.15}>
          <div className="mt-14 border border-[var(--hairline)] bg-[var(--surface)] shadow-sm">
            {/* Chart header */}
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-3.5 text-[var(--ink-secondary)]" />
                <span className="font-serif text-[16px] text-[var(--ink-primary)]">
                  Lesson progression
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  {LESSONS.length} tracked lessons
                </span>
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  Course avg {COURSE_AVG_STALL}%
                </span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="px-5 pt-8 pb-6 lg:px-8 lg:pt-10 lg:pb-8">
              <div
                className="flex items-end justify-between gap-1.5 sm:gap-2 lg:gap-3"
                style={{ height: 260 }}
              >
                {LESSONS.map((node) => {
                  const severity = frictionSeverity(node.stallRate);
                  const isSelected = selectedId === node.id;
                  const isHovered = hoveredId === node.id;
                  const isFrictionPoint = node.index === 7;
                  const frictionHeight = (node.stallRate / MAX_STALL) * 100;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedId(node.id)}
                      onMouseEnter={() => setHoveredId(node.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end"
                      aria-label={`Lesson ${node.index}: ${node.title}, stall rate ${node.stallRate}%, ${node.affected} affected`}
                    >
                      {/* Friction marker (colored bar on top) */}
                      <div
                        className={cn(
                          "w-full transition-all duration-200",
                          severity === "ok" ? "opacity-0" : "opacity-100",
                        )}
                        style={{
                          height: `${frictionHeight}%`,
                          minHeight: severity === "ok" ? 0 : 4,
                        }}
                      >
                        <div
                          className={cn(
                            "mx-auto h-full w-1/2 transition-colors",
                            severity === "high"
                              ? "bg-[var(--critical)]"
                              : severity === "watch"
                                ? "bg-[var(--warning)]"
                                : "bg-transparent",
                          )}
                        />
                      </div>

                      {/* Reach bar */}
                      <motion.div
                        initial={reduced ? false : { height: 0 }}
                        whileInView={{ height: `${node.reachedPct}%` }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{
                          ...standard,
                          duration: 0.6,
                          delay: 0.04 * node.index,
                        }}
                        className={cn(
                          "w-full transition-colors duration-200",
                          isFrictionPoint
                            ? "bg-[var(--recovery-green)]"
                            : isSelected || isHovered
                              ? "bg-[var(--ink-primary)]"
                              : "bg-[var(--ink-muted)]/30 group-hover:bg-[var(--ink-muted)]/60",
                        )}
                        style={{ maxHeight: "100%" }}
                      />

                      {/* Lesson label */}
                      <div
                        className={cn(
                          "mt-2 font-mono text-[10px] tabular-nums transition-colors duration-200",
                          isFrictionPoint
                            ? "text-[var(--recovery-green)]"
                            : isSelected || isHovered
                              ? "text-[var(--ink-primary)]"
                              : "text-[var(--ink-muted)]",
                        )}
                      >
                        L{node.index}
                      </div>

                      {/* Friction label above L7 */}
                      {isFrictionPoint && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--recovery-green)]">
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

              {/* Legend */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] text-[var(--ink-secondary)]">
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
                className="border-t border-[var(--hairline)]"
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
                      vs. course avg {COURSE_AVG_STALL}%
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
                      ) : active.stallRate > COURSE_AVG_STALL ? (
                        <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-[var(--warning)]" />
                      ) : (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--recovery-green)]" />
                      )}
                      <span>
                        {active.index === 7
                          ? "Add a setup walkthrough video to reduce stall by an estimated 30%."
                          : active.stallRate > COURSE_AVG_STALL
                            ? `Monitor L${active.index}. Affected count is small enough to address through outreach first.`
                            : "Healthy. No action needed at this stall rate."}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--hairline)] px-5 py-3">
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                Hover or tap any lesson to inspect
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                742 students · 29 lessons
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
