"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { RevealText } from "@/components/interaction/reveal-text";
import { RecoverySignalField } from "@/components/marketing/recovery-signal-field";
import { standard } from "@/design-system/motion";

export function MarketingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--canvas)] noise-overlay">
      {/* Subtle grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(17,17,15,0.04) 1px, transparent 1px)",
          backgroundSize: "8.333% 100%",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 items-center gap-8 px-4 pt-20 pb-12 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pt-24">
        {/* Left: editorial statement */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={standard}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1 text-[12px] text-[var(--ink-secondary)]"
          >
            <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
            For Whop course creators
          </motion.div>

          <h1 className="font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.98] tracking-[-0.03em] text-[var(--ink-primary)]">
            <RevealText text="Recover the" as="span" byWord />
            <br />
            <RevealText text="members who" as="span" byWord delay={0.15} />
            <br />
            <span className="italic text-[var(--ink-secondary)]">
              <RevealText text="quietly slip away." as="span" byWord delay={0.3} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...standard, delay: 0.5 }}
            className="mt-7 max-w-[460px] text-[16px] leading-relaxed text-[var(--ink-secondary)]"
          >
            RescueLoop detects where students lose momentum, coordinates the
            right intervention, and proves which actions restored progress or
            revenue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...standard, delay: 0.65 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/onboarding"
              className="press inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--ink-primary)] px-5 py-3 text-[14px] font-medium text-white"
            >
              Run a recovery audit
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/overview"
              className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] px-5 py-3 text-[14px] font-medium text-[var(--ink-primary)]"
            >
              Explore the interactive demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...standard, delay: 0.85 }}
            className="mt-6 flex items-center gap-2 text-[12px] text-[var(--ink-muted)]"
          >
            <ShieldCheck className="size-3.5 text-[var(--recovery-green)]" />
            Nothing is sent without your rules and approval.
          </motion.div>
        </div>

        {/* Right: Recovery Signal Field */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...standard, delay: 0.4 }}
          className="relative h-[400px] w-full lg:h-[560px]"
        >
          <RecoverySignalField className="h-full w-full" />
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-muted)]">
              Recovery Signal Field — live
            </p>
          </div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block"
      >
        <div className="flex flex-col items-center gap-2 text-[var(--ink-muted)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-8 w-px bg-[var(--hairline-strong)]"
          />
        </div>
      </motion.div>
    </section>
  );
}
