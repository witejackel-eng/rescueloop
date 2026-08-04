import { TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { KPIS } from "@/lib/mock-data";

/**
 * Editorial outcome region — replaces the four equal KPI cards.
 *
 * Single bordered panel with 1px internal dividers forming an asymmetric
 * grid. Left (larger) shows the confirmed recovered value as a huge serif
 * number with secondary metrics below. Right (narrower) shows value-to-cost
 * and estimated 90-day retained value.
 *
 * Reads like a financial broadsheet, not a dashboard.
 */
export function OutcomeRegion() {
  return (
    <section className="grid grid-cols-1 border border-[var(--hairline)] bg-[var(--surface)] lg:grid-cols-[1fr_320px]">
      {/* Left — hero confirmed recovered value + secondary metrics */}
      <div className="flex flex-col gap-6 border-b border-[var(--hairline)] p-6 lg:border-b-0 lg:border-r lg:p-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Confirmed recovered value
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="font-serif text-[var(--ink-primary)] text-[72px] leading-[0.95] sm:text-[88px]">
              <AnimatedCounter
                value={KPIS.confirmedRecoveredRevenue}
                prefix="$"
                className="font-serif"
              />
            </span>
            <span className="inline-flex items-center gap-1 rounded-[3px] bg-[var(--recovery-light)] px-2 py-0.5 text-[12px] font-medium text-[var(--recovery-green)]">
              <TrendingUp className="size-3" strokeWidth={2.25} />
              <span className="font-mono tabular-nums">+$79</span>
              <span>this week</span>
            </span>
          </div>
        </div>

        {/* Secondary metrics — 1px dividers between cells */}
        <div className="grid grid-cols-3 border-t border-[var(--hairline)] pt-5">
          <SecondaryMetric
            value={KPIS.studentsReengaged}
            label="students returned"
          />
          <SecondaryMetric
            value={KPIS.firstTimeActivations}
            label="first-time activations"
            bordered
          />
          <SecondaryMetric
            value={KPIS.cancellationsReversed}
            label="cancellations reversed"
            bordered
          />
        </div>
      </div>

      {/* Right — value-to-cost + estimated */}
      <div className="grid grid-rows-2">
        <div className="border-b border-[var(--hairline)] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Value-to-cost
          </p>
          <p className="mt-3 font-mono tabular-nums text-[40px] leading-none text-[var(--ink-primary)]">
            <AnimatedCounter
              value={KPIS.confirmedValueToCost}
              decimals={1}
              suffix="×"
            />
          </p>
          <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
            Confirmed / plan cost
          </p>
        </div>
        <div className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Est. 90-day retained value
          </p>
          <p className="mt-3 font-mono tabular-nums text-[40px] leading-none text-[var(--ink-secondary)]">
            <AnimatedCounter
              value={KPIS.estimated90DayRetainedValue}
              prefix="$"
            />
          </p>
          <p className="mt-2 text-[11px] italic text-[var(--ink-muted)]">
            Estimated — not confirmed
          </p>
        </div>
      </div>
    </section>
  );
}

function SecondaryMetric({
  value,
  label,
  bordered,
}: {
  value: number;
  label: string;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? "border-l border-[var(--hairline)] pl-4" : "pr-4"}>
      <p className="font-mono tabular-nums text-[22px] leading-none text-[var(--ink-primary)]">
        <AnimatedCounter value={value} />
      </p>
      <p className="mt-1.5 text-[12px] leading-snug text-[var(--ink-muted)]">
        {label}
      </p>
    </div>
  );
}
