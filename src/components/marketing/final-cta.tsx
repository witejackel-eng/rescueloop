"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { RevealText } from "@/components/interaction/reveal-text";
import { RecoverySignalField } from "@/components/marketing/recovery-signal-field";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";

export function FinalCta() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState<{ x: number; y: number } | null>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function onPointerLeave() {
    setSpotlight(null);
  }

  return (
    <section
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative overflow-hidden bg-[var(--dark-section)] text-[#F4F1EA]"
    >
      {/* Background generative visual at reduced opacity */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <RecoverySignalField className="h-full w-full" />
      </div>

      {/* Cursor spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={
          spotlight
            ? {
                background: `radial-gradient(420px circle at ${spotlight.x}px ${spotlight.y}px, rgba(20,125,104,0.18), transparent 70%)`,
              }
            : { background: "radial-gradient(420px circle at 50% 50%, transparent, transparent)" }
        }
        transition={reduced ? { duration: 0 } : { duration: 0.15 }}
      />

      {/* Subtle grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "8.333% 100%",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1100px] px-4 py-24 text-center lg:px-8 lg:py-36">
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={standard}
          className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--recovery-green)]" />
          Private preview
        </motion.div>

        <h2 className="mx-auto mt-8 max-w-[18ch] font-serif text-[clamp(2.25rem,5.4vw,4.5rem)] leading-[1.02] tracking-[-0.02em]">
          <RevealText text="Find the members who need help before they disappear." />
        </h2>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...standard, delay: 0.2 }}
          className="mx-auto mt-6 max-w-[54ch] text-[15px] leading-relaxed text-[var(--dark-secondary)]"
        >
          Run a recovery audit on your connected Whop products. The first signal
          is usually waiting in plain sight.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...standard, delay: 0.35 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/onboarding"
            className="press inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#F4F1EA] px-5 py-3 text-[14px] font-medium text-[var(--ink-primary)]"
          >
            Run a recovery audit
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/overview"
            className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--dark-hairline)] bg-transparent px-5 py-3 text-[14px] font-medium text-[#F4F1EA]"
          >
            Explore the live workspace
          </Link>
        </motion.div>

        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ ...standard, delay: 0.5 }}
          className="mt-6 font-mono text-[11px] text-[var(--dark-secondary)]"
        >
          No credit card. Nothing is sent without your rules and approval.
        </motion.p>
      </div>
    </section>
  );
}
