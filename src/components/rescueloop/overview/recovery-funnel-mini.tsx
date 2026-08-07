"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface FunnelStage {
  stage: string;
  count: number;
  label: string;
}

interface RecoveryFunnelMiniProps {
  stages: readonly FunnelStage[];
  className?: string;
}

/**
 * Compact horizontal recovery funnel bar chart.
 * Each stage is rendered as a vertical bar whose height encodes count,
 * with a connecting line + drop-off percentage between stages.
 */
export function RecoveryFunnelMini({ stages, className }: RecoveryFunnelMiniProps) {
  const reduced = useReducedMotion();
  if (!stages.length) return null;

  const max = Math.max(...stages.map((s) => s.count));
  const first = stages[0].count;

  return (
    <div className={cn("w-full", className)}>
      {/* Stage bars */}
      <div className="flex h-[120px] items-end gap-1.5">
        {stages.map((s, i) => {
          const heightPct = max > 0 ? Math.max(6, (s.count / max) * 100) : 6;
          const dropPct = i > 0 && stages[i - 1].count > 0
            ? Math.round((1 - s.count / stages[i - 1].count) * 100)
            : null;
          const conversionPct = i > 0 && first > 0
            ? Math.round((s.count / first) * 100)
            : null;
          return (
            <div
              key={s.stage}
              className="group relative flex flex-1 flex-col items-center justify-end gap-1.5"
            >
              {/* Count label above bar */}
              <span className="font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
                {s.count}
              </span>

              {/* Bar */}
              <motion.div
                initial={reduced ? false : { height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "w-full rounded-t-[3px] transition-colors",
                  i === stages.length - 1
                    ? "bg-[var(--recovery-green)]"
                    : i === 0
                      ? "bg-[var(--ink-muted)]"
                      : "bg-[var(--ink-muted)]/60 group-hover:bg-[var(--ink-secondary)]",
                )}
                style={{ minHeight: 4 }}
              />

              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-1 shadow-md">
                  <p className="text-[10px] font-medium text-[var(--ink-primary)]">{s.stage}</p>
                  <p className="text-[9px] text-[var(--ink-muted)]">{s.label}</p>
                  {conversionPct !== null && (
                    <p className="mt-0.5 font-mono text-[9px] text-[var(--recovery-green)]">
                      {conversionPct}% of detected
                    </p>
                  )}
                  {dropPct !== null && dropPct > 0 && (
                    <p className="font-mono text-[9px] text-[var(--warning)]">
                      −{dropPct}% vs prev
                    </p>
                  )}
                </div>
              </div>

              {/* Stage label below bar */}
              <span className="mt-0.5 text-center text-[9px] uppercase tracking-[0.04em] text-[var(--ink-muted)]">
                {s.stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* Conversion summary */}
      <div className="mt-3 flex items-center justify-between rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
        <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          End-to-end conversion
        </span>
        <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
          {first > 0 && stages.length > 0
            ? `${Math.round((stages[stages.length - 1].count / first) * 100)}%`
            : "—"}
          <span className="ml-2 text-[10px] text-[var(--ink-muted)]">
            ({stages[stages.length - 1]?.count ?? 0}/{first})
          </span>
        </span>
      </div>
    </div>
  );
}
