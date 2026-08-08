"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";

interface Principle {
  label: string;
  description: string;
}

const PRINCIPLES: Principle[] = [
  {
    label: "Maximum-message limits",
    description: "A hard ceiling per member per month, enforced before send.",
  },
  {
    label: "Quiet hours",
    description: "No intervention sends outside configured local hours.",
  },
  {
    label: "Cooldowns",
    description: "Wait days between contacts per member, never overridden by a campaign.",
  },
  {
    label: "Stop after response",
    description: "A reply pauses automation until the conversation is reviewed.",
  },
  {
    label: "Stop after progress resumes",
    description: "A returned student is removed from the active queue.",
  },
  {
    label: "Manual cancellation review",
    description: "Cancellations route to a human before any retention message sends.",
  },
  {
    label: "Honest attribution",
    description: "Confirmed, strongly associated, and estimated are never merged.",
  },
  {
    label: "Student-facing language controls",
    description: "Every message is reviewable and editable before it goes out.",
  },
];

export function SafetySection() {
  const reduced = useReducedMotion();
  return (
    <section id="safety" className="bg-[var(--section-warm)]">
      <div className="mx-auto max-w-[1400px] px-4 py-20 lg:px-8 lg:py-32">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          The ethics
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="max-w-[18ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
              Intervention without intrusion.
            </h2>
            <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
              RescueLoop is built to be safe to leave on. Eight controls run on
              every send, every campaign, every member — defaults you can audit
              and override, but never bypass silently.
            </p>
            <p className="mt-5 max-w-[44ch] text-[13px] text-[var(--ink-muted)]">
              Every safety rule is logged. Every override is recorded. Every
              student has an exit.
            </p>
          </div>

          {/* Principles grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.label}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ ...standard, delay: i * 0.04 }}
                className={[
                  "border-b border-[var(--hairline)] p-5 lg:p-6",
                  // Right divider on the left column at sm+ (only on the
                  // first item of each row)
                  i % 2 === 0 ? "sm:border-r sm:border-[var(--hairline)]" : "",
                  // Remove bottom border on the last row at sm+ (last two items)
                  i >= PRINCIPLES.length - 2 ? "sm:border-b-0" : "",
                  // Single column on mobile: only the last item loses its
                  // bottom border.
                  i === PRINCIPLES.length - 1 ? "border-b-0" : "",
                ].join(" ")}
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--recovery-green)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-2 text-[14px] font-medium text-[var(--ink-primary)]">
                  {p.label}
                </div>
                <div className="mt-1.5 text-[13px] leading-snug text-[var(--ink-secondary)]">
                  {p.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
