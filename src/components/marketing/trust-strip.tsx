"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";

const STATS = [
  {
    value: 1247,
    prefix: "",
    suffix: "",
    label: "students rescued",
    accent: "var(--recovery-green)",
  },
  {
    value: 89,
    prefix: "$",
    suffix: "K",
    label: "revenue recovered",
    accent: "var(--ink-primary)",
  },
  {
    value: 42,
    prefix: "",
    suffix: "%",
    label: "avg recovery rate",
    accent: "var(--info)",
  },
];

export function TrustStrip() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label="Reported outcomes"
      className="border-b border-[var(--hairline)] bg-[var(--canvas)]"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-1 divide-y divide-[var(--hairline)] sm:grid-cols-3 sm:divide-y-0 sm:divide-x sm:divide-[var(--hairline)]">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: 0.05 + i * 0.1, duration: 0.6, ease: easeOut }}
              className="relative flex flex-col gap-1.5 px-2 py-7 sm:px-8 lg:py-9"
            >
              {/* Accent dot */}
              <span
                className="mb-1 h-1 w-6 rounded-full"
                style={{ background: stat.accent }}
                aria-hidden="true"
              />
              <div className="flex items-baseline gap-1 font-serif text-[clamp(2rem,4vw,2.75rem)] leading-none tracking-[-0.02em] text-[var(--ink-primary)]">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  className="!font-serif !tabular-nums"
                />
              </div>
              <div className="text-[13px] leading-snug text-[var(--ink-secondary)]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subtitle row */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex items-center justify-center gap-2 border-t border-[var(--hairline)] py-3.5"
        >
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            as reported by creators in private preview
          </span>
        </motion.div>
      </div>
    </section>
  );
}
