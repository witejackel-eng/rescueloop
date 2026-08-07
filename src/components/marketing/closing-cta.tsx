"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";

export function ClosingCta() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label="Start your recovery audit"
      className="relative overflow-hidden border-t border-[var(--dark-hairline)] bg-[var(--dark-section)] text-white"
    >
      {/* Subtle diagonal pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 32px, currentColor 32px, currentColor 33px)",
        }}
        aria-hidden="true"
      />

      {/* Soft glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(20,125,104,0.16), transparent 65%)",
        }}
        aria-hidden="true"
      />

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[820px] text-center">
          {/* Eyebrow */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="mb-6 flex items-center justify-center"
          >
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
              <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
              Private preview · no card required
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.08, duration: 0.7, ease: easeOut }}
            className="font-serif text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.98] tracking-[-0.02em] text-white"
          >
            Start your{" "}
            <span className="italic text-[var(--recovery-green)]">
              free recovery audit.
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.18, duration: 0.7, ease: easeOut }}
            className="mx-auto mt-7 max-w-[560px] text-[16px] leading-relaxed text-[var(--dark-secondary)] lg:text-[17px]"
          >
            Walk through the full RescueLoop workflow — detect a stalled
            student, review the evidence, deliver a respectful message, and
            trace the outcome to recovered revenue. Everything is simulated.
            Nothing is sent.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.28, duration: 0.7, ease: easeOut }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/overview"
              className="press group inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-6 py-3.5 text-[14px] font-medium text-[var(--ink-primary)]"
            >
              Explore the demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/student-rescue"
              className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--dark-hairline)] bg-transparent px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.04]"
            >
              <User className="size-4 text-[var(--dark-secondary)]" />
              See student experience
            </Link>
          </motion.div>

          {/* Footnote */}
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]"
          >
            Interactive demonstration · simulated workspace · no real customer data
          </motion.p>
        </div>
      </div>
    </section>
  );
}
