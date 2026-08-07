"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";

// All figures shown are illustrative demo numbers drawn from the
// interactive demo workspace. They are NOT customer results.
//
// Evidence-class policy (see src/lib/attribution/policy.ts):
//   - "Confirmed recovered value" must remain $0 unless a defensible
//     auditable monetary recovery rule is satisfied. We do not claim
//     confirmed recovery from ordinary post-intervention payments.
//   - "Estimated opportunity" is a modelled projection only and is
//     never summed with confirmed or strongly-associated value.
const CELLS = [
  { value: 742, label: "Members monitored (illustrative)", prefix: "", suffix: "" },
  { value: 118, label: "Opportunities detected (illustrative)", prefix: "", suffix: "" },
  { value: 31, label: "Students re-engaged (illustrative)", prefix: "", suffix: "" },
  { value: 0, label: "Confirmed recovered value", prefix: "$", suffix: "" },
];

export function OutcomeStrip() {
  const reduced = useReducedMotion();
  return (
    <section
      id="outcomes"
      className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]"
    >
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        {/* Section label */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={standard}
          className="flex items-center justify-center border-b border-[var(--hairline)] py-5"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
            Interactive demonstration — Creator Growth Lab
          </span>
        </motion.div>

        {/* Stat grid: 2x2 on mobile, 1x4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {CELLS.map((cell, i) => {
            const isLastInMobileRow = i % 2 === 1;
            const isMobileTopRow = i < 2;
            const isLastDesktop = i === 3;
            return (
              <motion.div
                key={cell.label}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ ...standard, delay: i * 0.08 }}
                className={[
                  "flex flex-col items-center gap-2 px-6 py-10 text-center lg:py-12",
                  // Vertical divider on the left edge except first-in-row
                  !isLastInMobileRow ? "border-r border-[var(--hairline)]" : "",
                  "lg:border-r lg:border-[var(--hairline)]",
                  isLastDesktop ? "lg:border-r-0" : "",
                  // Horizontal divider between mobile rows
                  isMobileTopRow ? "border-b border-[var(--hairline)] lg:border-b-0" : "",
                ].join(" ")}
              >
                <div className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] leading-none tracking-[-0.02em] text-[var(--ink-primary)]">
                  <AnimatedCounter
                    value={cell.value}
                    prefix={cell.prefix}
                    suffix={cell.suffix}
                    className="!font-serif !tabular-nums"
                  />
                </div>
                <div className="font-sans text-[13px] text-[var(--ink-secondary)]">
                  {cell.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
