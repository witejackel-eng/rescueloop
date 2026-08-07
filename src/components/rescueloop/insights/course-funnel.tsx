import { COURSE_FUNNEL } from "@/lib/mock-data";
import { AnimatedCounter } from "@/components/interaction/animated-counter";

/**
 * Course progression funnel — horizontal bar sequence.
 * Started → Completed first module → Reached midpoint → Reached final module → Completed course.
 * Shows conversion % between stages + drop-off counts.
 */
export function CourseFunnel() {
  const first = COURSE_FUNNEL[0].count;
  const last = COURSE_FUNNEL[COURSE_FUNNEL.length - 1].count;
  const overallRate = (last / first) * 100;
  const max = first;

  return (
    <div className="border border-[var(--hairline)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
          Course progression funnel
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
          Overall: <span className="font-semibold text-[var(--recovery-green)]">
            <AnimatedCounter value={overallRate} decimals={1} suffix="%" />
          </span>{" "}
          completion rate
        </span>
      </div>

      <div className="flex flex-col gap-2 px-5 py-4">
        {COURSE_FUNNEL.map((stage, i) => {
          const widthPct = Math.max(20, (stage.count / max) * 100);
          const prev = i > 0 ? COURSE_FUNNEL[i - 1] : null;
          const conv = prev ? Math.round((stage.count / prev.count) * 100) : null;
          const dropoff = prev ? prev.count - stage.count : null;
          const isFinal = i === COURSE_FUNNEL.length - 1;

          return (
            <div key={stage.stage} className="flex flex-col gap-1">
              {prev && conv !== null && dropoff !== null && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-1 text-[11px] text-[var(--ink-muted)]">
                  <span className="font-mono tabular-nums font-medium text-[var(--recovery-green)]">
                    {conv}%
                  </span>
                  <span>conversion</span>
                  <span className="text-[var(--hairline-strong)]">·</span>
                  <span className="font-mono tabular-nums text-[var(--critical)]">
                    −{dropoff}
                  </span>
                  <span>dropped off</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div
                  className="relative flex h-11 items-center justify-between gap-2 overflow-hidden px-3 transition-all"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: "200px",
                    background: isFinal ? "var(--recovery-green)" : "var(--ink-primary)",
                  }}
                >
                  <span className="truncate text-[12px] font-medium text-white">
                    {stage.stage}
                  </span>
                  <span className="font-mono tabular-nums shrink-0 text-[15px] font-semibold text-white">
                    {stage.count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--hairline)] px-5 py-2 text-[11px] text-[var(--ink-muted)]">
        <span className="font-mono tabular-nums">
          {first} → {last}
        </span>
        <span>Started → Completed</span>
      </div>
    </div>
  );
}
