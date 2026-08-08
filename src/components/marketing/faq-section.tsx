"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";

interface QA {
  q: string;
  a: string;
}

const ITEMS: QA[] = [
  {
    q: "Does RescueLoop guarantee retained revenue?",
    a: "No. RescueLoop surfaces at-risk members and coordinates interventions, but retention depends on the student and the course. We attribute every outcome using evidence tiers — confirmed, strongly associated, or estimated — and never merge them into a single inflated number.",
  },
  {
    q: "How is recovered revenue attributed?",
    a: "Confirmed value requires a documented intervention sequence followed by a payment. Strongly associated value requires an intervention sent and a return within 14 days without another channel touch. Estimated value is a modeled projection over 90 days for the recovered cohort.",
  },
  {
    q: "Will it message students automatically?",
    a: "Only if you put a campaign in automatic mode. The default is manual approval, which routes every intervention to your queue first. Cancellation rescue always requires manual review, regardless of campaign mode.",
  },
  {
    q: "Can students be over-messaged?",
    a: "Hard limits prevent it. Every campaign enforces a per-member monthly ceiling, a cooldown window, and quiet hours. A response or resumed progress automatically removes the student from the active queue.",
  },
  {
    q: "Does it work with one-time courses?",
    a: "Yes, with adjusted attribution. There is no recurring revenue to recover, so the value ledger tracks activations, completion lifts, and refunds avoided instead of retained subscription dollars. ROI is calculated against course price and refund rate.",
  },
  {
    q: "What happens when a student responds?",
    a: "Automation stops for that member immediately. The thread routes to your responded queue for human review. If they report a blocker, it is logged against the lesson and surfaced in Course Intelligence.",
  },
  {
    q: "How does RescueLoop use Whop data?",
    a: "RescueLoop reads membership status, renewal dates, and progress signals from your connected Whop products. It writes back intervention logs, attribution events, and value ledger entries. Nothing is shared with third parties. You can export or delete all data at any time.",
  },
  {
    q: "Can I pause all automation instantly?",
    a: "Yes. The Pause control in Settings stops every queued, scheduled, and pending intervention in one click. Existing conversations stay open for human reply, but no new sends occur until you resume.",
  },
  {
    q: "What is confirmed versus estimated value?",
    a: "Confirmed value is a payment received after a documented intervention with clear causal evidence. Estimated value is a modeled projection based on the probability that a recovered student will still be active in 90 days. The two are always shown separately.",
  },
  {
    q: "Which plan fits my course?",
    a: "Rescue fits a single course under 250 members where activation is the main problem. Growth fits creators with multiple courses and renewal exposure up to ~1,000 members. Scale fits established communities that need cancellation intervention and evidence-tiered recovery attribution. Move up only when the next risk surface is actually on your plate.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();

  return (
    <section id="faq" className="bg-[var(--canvas-elevated)]">
      <div className="mx-auto max-w-[1100px] px-4 py-20 lg:px-8 lg:py-32">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          Honest answers
        </div>
        <h2 className="mt-8 max-w-[20ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          The questions worth asking.
        </h2>
        <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Specific objections, specific answers. If a question is missing, write
          to us and we will add it — including the answer you may not want to
          hear.
        </p>

        <div className="mt-12 border-t border-[var(--hairline)]">
          {ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="relative border-b border-[var(--hairline)]"
              >
                {/* Left border highlight when open */}
                <div
                  className="absolute inset-y-0 left-0 w-[3px] bg-[var(--recovery-green)] transition-opacity duration-300"
                  style={{ opacity: isOpen ? 1 : 0 }}
                  aria-hidden="true"
                />

                {/* Trigger */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-baseline gap-4 py-6 pl-6 text-left transition-colors hover:text-[var(--ink-primary)]"
                  aria-expanded={isOpen}
                >
                  <span className="font-mono text-[12px] tabular-nums text-[var(--ink-muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-[16px] font-medium text-[var(--ink-primary)]">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.25, ease: easeOut }}
                    className="shrink-0 text-[var(--ink-muted)]"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.span>
                </button>

                {/* Content with AnimatePresence */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? false : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeOut }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pl-[calc(1.5rem+1rem+1rem)] text-[14px] leading-relaxed text-[var(--ink-secondary)]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
