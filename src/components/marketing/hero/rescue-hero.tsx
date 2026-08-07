"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { ClosingSignalHeroVisual } from "@/components/marketing/hero/closing-signal-visual";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";
import { copy } from "@/brand/copy";

export function RescueHero() {
  const reduced = useReducedMotion();

  // Fade-in helper: reduced motion = opacity-only, full motion = slide-up + opacity
  const fade = (delay: number) =>
    reduced
      ? { opacity: 0 }
      : { opacity: 0, y: 16 };

  const animate = { opacity: 1, y: 0 };

  const transition = (delay: number) =>
    reduced
      ? { delay, duration: 0.15 }
      : { delay, duration: 0.7, ease: easeOut };

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[var(--canvas)] scroll-mt-0"
      style={{ minHeight: "min(100svh, 768px)" }}
    >
      {/* Subtle technical grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(17,17,15,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(17,17,15,0.035) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / 12}% ${100 / 8}%`,
          // Fade near center-left for text readability
          maskImage:
            "radial-gradient(ellipse 80% 70% at 35% 50%, transparent 30%, black 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 35% 50%, transparent 30%, black 80%)",
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

      {/* Two-column grid: copy left, Closing Signal visual right */}
      <div className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-8 px-6 pt-28 pb-12 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-12 lg:pt-28 lg:pb-16">
        {/* ── LEFT: Copy column ── */}
        <div className="flex flex-col">
          {/* Eyebrow */}
          <motion.div
            initial={fade(0)}
            animate={animate}
            transition={transition(0.1)}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-3 font-mono text-[12px] text-[var(--ink-muted)]">
              <span className="h-px w-8 bg-[var(--hairline-strong)]" />
              {copy.eyebrow}
            </span>
          </motion.div>

          {/* Headline — "leave" in italic with ink-secondary */}
          <h1
            className="max-w-[900px] font-serif text-[clamp(2.75rem,5vw,4.5rem)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--ink-primary)]"
          >
            <motion.span
              className="block"
              initial={fade(0.15)}
              animate={animate}
              transition={transition(0.15)}
            >
              Close the loop before they{" "}
              <em className="not-italic text-[var(--ink-secondary)]">leave</em>
              {" "}.
            </motion.span>
          </h1>

          {/* Supporting line */}
          <motion.p
            initial={fade(0.4)}
            animate={animate}
            transition={transition(0.4)}
            className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-[var(--ink-secondary)] lg:text-[18px]"
          >
            {copy.support}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={fade(0.55)}
            animate={animate}
            transition={transition(0.55)}
            className="mt-8 flex flex-col gap-3 sm:flex-row lg:items-center"
          >
            <Link
              href="/overview"
              className="press group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--ink-primary)] px-6 py-3.5 text-[14px] font-medium text-white"
            >
              {copy.primaryCTA}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/student-rescue"
              className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] px-6 py-3.5 text-[14px] font-medium text-[var(--ink-primary)]"
            >
              <User className="size-4 text-[var(--ink-muted)]" />
              {copy.secondaryCTA}
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition(0.75)}
            className="mt-5"
          >
            <span className="font-mono text-[11px] tracking-wide text-[var(--ink-muted)]">
              {copy.trustLine}
            </span>
          </motion.div>

          {/* Disclosure */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition(0.9)}
            className="mt-2"
          >
            <span className="font-mono text-[10px] tracking-wide text-[var(--ink-muted)] opacity-60">
              {copy.disclosure}
            </span>
          </motion.div>
        </div>

        {/* ── RIGHT: Closing Signal visual ── */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={reduced ? { duration: 0.15 } : { delay: 0.3, duration: 0.9, ease: easeOut }}
          className="relative h-[300px] w-full sm:h-[380px] lg:h-[480px]"
        >
          <ClosingSignalHeroVisual className="h-full w-full" />
        </motion.div>
      </div>
    </section>
  );
}
