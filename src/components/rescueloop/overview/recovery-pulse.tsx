"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { RECOVERY_FUNNEL } from "@/lib/mock-data";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EASE, standard } from "@/design-system/motion";

// Recovery funnel with an inserted "Reviewed" stage between Eligible and Contacted.
// Source: RECOVERY_FUNNEL (Detected 118, Eligible 96, Contacted 78, Responded 43,
// Resumed 31, Retained 7). Reviewed = 88 (creator reviewed & approved).
const FUNNEL = [
  RECOVERY_FUNNEL[0], // Detected — 118
  RECOVERY_FUNNEL[1], // Eligible — 96
  { stage: "Reviewed", count: 88, label: "Creator reviewed and approved" },
  RECOVERY_FUNNEL[2], // Contacted — 78
  RECOVERY_FUNNEL[3], // Responded — 43
  RECOVERY_FUNNEL[4], // Resumed — 31
  RECOVERY_FUNNEL[5], // Retained — 7
] as const;

type Stage = (typeof FUNNEL)[number];

export function RecoveryPulse() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(0);

  const max = FUNNEL[0].count;
  const selectedStage = FUNNEL[selected];

  return (
    <section className="border border-[var(--hairline)] bg-[var(--surface)]">
      <header className="flex flex-col gap-2 border-b border-[var(--hairline)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-[20px] leading-none text-[var(--ink-primary)]">
            Recovery Pulse
          </h2>
          <p className="mt-1.5 text-[12px] text-[var(--ink-muted)]">
            From detected risk to retained member · last 30 days
          </p>
        </div>
        <div className="flex items-baseline gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
          <span className="tabular-nums">{selectedStage.count}</span>
          <span className="lowercase">{selectedStage.stage.toLowerCase()}</span>
          <ArrowRight className="size-3" />
          <span className="text-[var(--ink-secondary)]">
            filtering to <span className="tabular-nums text-[var(--ink-primary)]">{selectedStage.count}</span> students
          </span>
        </div>
      </header>

      {/* Horizontal scroll on mobile, fits on desktop */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[860px] items-stretch px-5 py-6">
          {FUNNEL.map((stage, i) => {
            const prev = i > 0 ? (FUNNEL[i - 1] as Stage) : null;
            const conv = prev ? Math.round((stage.count / prev.count) * 100) : null;
            const isSelected = selected === i;
            const barWidthPct = (stage.count / max) * 100;
            return (
              <div
                key={stage.stage}
                className="flex items-stretch"
                style={{ flex: i === 0 ? "0 0 auto" : "0 0 auto" }}
              >
                {i > 0 && prev !== null && conv !== null && (
                  <div className="flex w-12 flex-col items-center justify-end pb-3">
                    <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                      {conv}%
                    </span>
                    <div className="my-1.5 h-px w-full bg-[var(--hairline)]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                      →
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={isSelected}
                  className={`relative flex w-[120px] flex-col gap-3 border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-[var(--hairline)] bg-[var(--canvas-elevated)]"
                      : "border-transparent hover:bg-[var(--canvas-elevated)]"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="pulse-active-bar"
                      transition={reduced ? { duration: 0 } : standard}
                      className="absolute left-0 top-0 h-full w-[2px] bg-[var(--recovery-green)]"
                    />
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    {stage.stage}
                  </span>
                  <span className="font-mono tabular-nums text-[28px] leading-none text-[var(--ink-primary)]">
                    {stage.count}
                  </span>
                  <div className="mt-auto h-[3px] w-full bg-[var(--hairline-subtle)]">
                    <motion.div
                      className="h-full bg-[var(--recovery-green)]"
                      initial={false}
                      animate={{ width: `${barWidthPct}%` }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { duration: 0.32, ease: EASE }
                      }
                    />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter footer */}
      <div className="flex flex-col gap-2 border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-[var(--ink-secondary)]">
          Filtering to{" "}
          <span className="font-mono tabular-nums text-[var(--ink-primary)]">
            {selectedStage.count}
          </span>{" "}
          students in{" "}
          <span className="text-[var(--ink-primary)]">
            {selectedStage.stage.toLowerCase()}
          </span>
        </p>
        {selected !== 0 && (
          <button
            type="button"
            onClick={() => setSelected(0)}
            className="self-start text-[12px] text-[var(--recovery-green)] hover:underline sm:self-auto"
          >
            Clear filter
          </button>
        )}
      </div>
    </section>
  );
}
