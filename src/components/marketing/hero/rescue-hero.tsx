"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { ProductStoryVisual, MobileProductCard, MobileOutcomeIndicator } from "@/components/marketing/hero/product-story-visual";
import { WorkflowMarquee } from "@/components/marketing/hero/workflow-marquee";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";
import { copy } from "@/brand/copy";

// RescueHero — product-led, premium hero.
// Layout: ~55% copy / ~45% product story visual (desktop).
// Mobile: stacked — copy then simplified product card.
// Preserves the closing-signal identity inside the product composition.

export function RescueHero() {
  const reduced = useReducedMotion();

  const fade = (delay: number) =>
    reduced
      ? { opacity: 0 }
      : { opacity: 0, y: 14, transition: { delay, duration: 0.7, ease: easeOut } };

  return (
    <section className="relative overflow-hidden bg-[var(--canvas)]">
      {/* Subtle technical grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(17,17,15,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(17,17,15,0.035) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / 12}% ${100 / 8}%`,
          maskImage: "radial-gradient(ellipse 70% 60% at 30% 40%, transparent 20%, black 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 30% 40%, transparent 20%, black 70%)",
        }}
      />

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Desktop + Tablet layout ───────────────────────────────── */}
      <div className="relative z-10 mx-auto hidden max-w-[1400px] lg:grid lg:min-h-[100svh] lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-8 lg:px-12 lg:py-20 xl:grid-cols-[1.2fr_1fr]">

        {/* Left: copy column */}
        <div className="flex flex-col justify-center py-12">
          {/* Eyebrow */}
          <motion.div
            initial={fade(0)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.6, ease: easeOut }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-3 font-mono text-[11px] tracking-wide text-[var(--ink-muted)]">
              <span className="h-px w-7 bg-[var(--hairline-strong)]" />
              {copy.eyebrow}
            </span>
          </motion.div>

          {/* Headline — split for staggered animation */}
          <h1 className="max-w-[680px] font-serif text-[clamp(2.75rem,5.5vw,5rem)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--ink-primary)]">
            <motion.span
              className="block"
              initial={fade(0.1)}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.75, ease: easeOut }}
            >
              Close the loop
            </motion.span>
            <motion.span
              className="block"
              initial={fade(0.2)}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.75, ease: easeOut }}
            >
              before they leave.
            </motion.span>
          </h1>

          {/* Supporting line */}
          <motion.p
            initial={fade(0.4)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.65, ease: easeOut }}
            className="mt-8 max-w-[480px] text-[17px] leading-relaxed text-[var(--ink-secondary)]"
          >
            {copy.support}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={fade(0.55)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.65, ease: easeOut }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/overview"
              className="press group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--ink-primary)] px-6 py-3.5 text-[14px] font-medium text-white transition-shadow hover:shadow-[0_2px_8px_rgba(17,17,15,0.15)]"
            >
              {copy.primaryCTA}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/student-rescue"
              className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] px-5 py-3.5 text-[14px] font-medium text-[var(--ink-primary)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              <User className="size-4 text-[var(--ink-muted)]" />
              {copy.secondaryCTA}
            </Link>
          </motion.div>

          {/* Micro trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="mt-5"
          >
            <span className="font-mono text-[10px] tracking-[0.06em] text-[var(--ink-muted)]">
              {copy.microTrustStrip}
            </span>
          </motion.div>

          {/* Tertiary safety disclosure */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-3"
          >
            <span className="font-mono text-[10px] text-[var(--ink-muted)] opacity-70">
              {copy.tertiaryDisclosure}
            </span>
          </motion.div>
        </div>

        {/* Right: Product Story Visual */}
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: easeOut }}
          className="relative flex min-h-[540px] items-center justify-center xl:min-h-[580px]"
          aria-label="RescueLoop workflow illustration"
        >
          <ProductStoryVisual />
        </motion.div>
      </div>

      {/* ── Mobile layout ─────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex flex-col px-6 pb-16 pt-24 lg:hidden">
        {/* Eyebrow */}
        <motion.div
          initial={fade(0)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6, ease: easeOut }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-wide text-[var(--ink-muted)]">
            <span className="h-px w-6 bg-[var(--hairline-strong)]" />
            {copy.eyebrow}
          </span>
        </motion.div>

        {/* Headline — split for staggered animation */}
        <h1 className="max-w-[340px] font-serif text-[clamp(2.25rem,8vw,3.5rem)] font-normal leading-[0.95] tracking-[-0.03em] text-[var(--ink-primary)]">
          <motion.span
            className="block"
            initial={fade(0.1)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.75, ease: easeOut }}
          >
            Close the loop
          </motion.span>
          <motion.span
            className="block"
            initial={fade(0.2)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.75, ease: easeOut }}
          >
            before they leave.
          </motion.span>
        </h1>

        {/* Supporting line */}
        <motion.p
          initial={fade(0.35)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65, ease: easeOut }}
          className="mt-6 max-w-[320px] text-[15px] leading-relaxed text-[var(--ink-secondary)]"
        >
          {copy.support}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={fade(0.5)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.65, ease: easeOut }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/overview"
            className="press group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--ink-primary)] px-5 py-3 text-[14px] font-medium text-white"
          >
            {copy.primaryCTA}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/student-rescue"
            className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] px-5 py-3 text-[14px] font-medium text-[var(--ink-primary)]"
          >
            <User className="size-4 text-[var(--ink-muted)]" />
            {copy.secondaryCTA}
          </Link>
        </motion.div>

        {/* Micro trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="mt-5"
        >
          <span className="font-mono text-[10px] tracking-[0.06em] text-[var(--ink-muted)]">
            {copy.microTrustStrip}
          </span>
        </motion.div>

        {/* Tertiary safety disclosure */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-2"
        >
          <span className="font-mono text-[10px] text-[var(--ink-muted)] opacity-70">
            {copy.tertiaryDisclosure}
          </span>
        </motion.div>

        {/* Simplified product card */}
        <div className="mt-10">
          <MobileProductCard />
          <MobileOutcomeIndicator />
        </div>
      </div>

      {/* Workflow marquee at bottom */}
      <div className="relative z-10 mt-8 lg:mt-0">
        <WorkflowMarquee />
      </div>
    </section>
  );
}
