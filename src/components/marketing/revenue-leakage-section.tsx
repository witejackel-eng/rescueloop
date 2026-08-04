"use client";

import { motion } from "framer-motion";
import { RevealText } from "@/components/interaction/reveal-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";

interface LeakageState {
  name: string;
  studentExperience: string;
  creatorSees: string;
  rescueloopDetects: string;
  intervention: string;
  consequence: string;
}

const STATES: LeakageState[] = [
  {
    name: "Paid · never started",
    studentExperience: "Bought the course and never opened Lesson 1.",
    creatorSees: "A new member on the dashboard.",
    rescueloopDetects: "Zero lesson activity 7+ days after purchase.",
    intervention: "Activation nudge within 14-day cooldown.",
    consequence: "$79/mo at risk",
  },
  {
    name: "Started · stalled",
    studentExperience: "Watched a few lessons and drifted away.",
    creatorSees: "An active member who is technically enrolled.",
    rescueloopDetects: "Progress deviation against their previous pace.",
    intervention: "Re-engage with the next concrete lesson.",
    consequence: "$79/mo at risk",
  },
  {
    name: "Renewal approaching · no progress",
    studentExperience: "Renewal is days away and momentum has stopped.",
    creatorSees: "A renewal line item in billing.",
    rescueloopDetects: "Inactivity overlapping with renewal window.",
    intervention: "Surface value, schedule a check-in.",
    consequence: "$79/mo at risk",
  },
  {
    name: "Cancellation scheduled",
    studentExperience: "Submitted a cancellation request.",
    creatorSees: "A churn notification after the fact.",
    rescueloopDetects: "Cancellation signal before the renewal cuts off.",
    intervention: "Manual review with a retention offer.",
    consequence: "$79/mo at risk",
  },
  {
    name: "Creator learns too late",
    studentExperience: "Already gone — no chance to respond.",
    creatorSees: "A cancellation record in the export.",
    rescueloopDetects: "What would have been detectable 14 days earlier.",
    intervention: "Prevent the next one.",
    consequence: "$948 / year",
  },
];

function StateRow({ state, index }: { state: LeakageState; index: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...standard, delay: index * 0.05 }}
      className="border-t border-[var(--dark-hairline)] px-5 py-6 lg:px-8 lg:py-7"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[14rem_1fr] lg:gap-8">
        {/* State name + consequence */}
        <div className="flex flex-col gap-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--dark-secondary)]">
            {String(index + 1).padStart(2, "0")} · {state.name}
          </div>
          <div className="font-mono text-[14px] tabular-nums text-[var(--recovery-light)]">
            {state.consequence}
          </div>
        </div>

        {/* Detail rows */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--dark-secondary)]">
              Student experiences
            </div>
            <div className="mt-1 text-[14px] leading-snug text-[#F4F1EA]">
              {state.studentExperience}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--dark-secondary)]">
              Creator currently sees
            </div>
            <div className="mt-1 text-[14px] leading-snug text-[var(--dark-secondary)]">
              {state.creatorSees}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--dark-secondary)]">
              RescueLoop detects
            </div>
            <div className="mt-1 text-[14px] leading-snug text-[var(--recovery-light)]">
              {state.rescueloopDetects}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--dark-secondary)]">
              Intervention opportunity
            </div>
            <div className="mt-1 text-[14px] leading-snug text-[#F4F1EA]">
              {state.intervention}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function RevenueLeakageSection() {
  return (
    <section className="relative bg-[var(--dark-section)] text-[#F4F1EA]">
      <div className="mx-auto max-w-[1400px] px-4 py-20 lg:px-8 lg:py-32">
        {/* Section label */}
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          The problem
        </div>

        {/* Headline */}
        <h2 className="mt-8 max-w-[18ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em]">
          <RevealText text="Most course revenue does not disappear at cancellation. It disappears when progress stops." />
        </h2>

        <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-[var(--dark-secondary)]">
          By the time a cancellation shows up in your dashboard, the moment to
          intervene has already passed. RescueLoop watches the five states where
          revenue quietly leaks — and lets you act on each one.
        </p>

        {/* States list */}
        <div className="mt-14 border-t border-[var(--dark-hairline)]">
          {STATES.map((state, i) => (
            <StateRow key={state.name} state={state} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
