"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { KineticRecoveryWord } from "@/components/marketing/hero/kinetic-recovery-word";
import { RecoveryLoopCanvas } from "@/components/marketing/hero/recovery-loop-canvas";
import { WorkflowMarquee } from "@/components/marketing/hero/workflow-marquee";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, easeOut } from "@/design-system/motion";

export function RescueHero() {
  const reduced = useReducedMotion();
  const fade = (delay: number) =>
    reduced
      ? { opacity: 1 }
      : { opacity: 0, y: 16, transition: { delay, duration: 0.7, ease: easeOut } };

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[var(--canvas)]">
      {/* Subtle technical grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(17,17,15,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(17,17,15,0.035) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / 12}% ${100 / 8}%`,
          // Fade near center for text readability
          maskImage: "radial-gradient(ellipse 80% 70% at 35% 50%, transparent 30%, black 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 35% 50%, transparent 30%, black 80%)",
        }}
      />

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Recovery Loop Canvas — right side */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-full opacity-70 lg:w-[55%]">
        <RecoveryLoopCanvas className="h-full w-full" density={1} />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-center px-6 pb-32 pt-28 lg:px-12 lg:pt-32">
        {/* Eyebrow */}
        <motion.div
          initial={fade(0)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: easeOut }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-3 font-mono text-[12px] text-[var(--ink-muted)]">
            <span className="h-px w-8 bg-[var(--hairline-strong)]" />
            Student success and revenue recovery for Whop creators
          </span>
        </motion.div>

        {/* Headline */}
        <h1
          className="max-w-[900px] font-serif text-[clamp(3rem,9vw,8.5rem)] font-normal leading-[0.92] tracking-[-0.03em] text-[var(--ink-primary)]"
          style={{ minHeight: "2.2em" }}
        >
          <motion.span
            className="block"
            initial={fade(0.15)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: easeOut }}
          >
            Help more
          </motion.span>
          <motion.span
            className="block"
            initial={fade(0.3)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: easeOut }}
          >
            students{" "}
            <KineticRecoveryWord />
          </motion.span>
        </h1>

        {/* Supporting copy + CTAs */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-24">
          <motion.p
            initial={fade(0.6)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: easeOut }}
            className="max-w-[520px] text-[17px] leading-relaxed text-[var(--ink-secondary)] lg:text-[18px]"
          >
            RescueLoop identifies where paying students lose momentum, helps
            creators review respectful interventions, and shows which actions
            restored progress or revenue.
          </motion.p>

          <motion.div
            initial={fade(0.75)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7, ease: easeOut }}
            className="flex flex-col gap-3 sm:flex-row lg:items-center"
          >
            <Link
              href="/overview"
              className="press group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--ink-primary)] px-6 py-3.5 text-[14px] font-medium text-white"
            >
              Explore the interactive demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/student-rescue"
              className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] px-6 py-3.5 text-[14px] font-medium text-[var(--ink-primary)]"
            >
              <User className="size-4 text-[var(--ink-muted)]" />
              See the student experience
            </Link>
          </motion.div>
        </div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="mt-10"
        >
          <span className="font-mono text-[11px] tracking-wide text-[var(--ink-muted)]">
            Interactive demonstration. No messages are sent and no customer data is connected.
          </span>
        </motion.div>
      </div>

      {/* Workflow marquee at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <WorkflowMarquee />
      </div>
    </section>
  );
}
