"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/marketing/shared/scroll-reveal";
import { SectionEyebrow } from "@/components/marketing/shared/section-eyebrow";
import { SignalDetectionIllustration } from "@/components/marketing/illustrations/signal-detection-illustration";
import { RescueQueueIllustration } from "@/components/marketing/illustrations/rescue-queue-illustration";
import { StudentSupportIllustration } from "@/components/marketing/illustrations/student-support-illustration";
import { AttributionIllustration } from "@/components/marketing/illustrations/attribution-illustration";

const FEATURES = [
  {
    number: "01",
    title: "Detect meaningful risk",
    description:
      "RescueLoop watches for members who never started, stalled mid-course, or are approaching renewal without progress. No churn scores — just clear, reviewable signals.",
    Illustration: SignalDetectionIllustration,
  },
  {
    number: "02",
    title: "Review before anything is sent",
    description:
      "Every intervention passes through your queue. You see the evidence, edit the message, schedule the timing, and approve. Nothing sends automatically without your say-so.",
    Illustration: RescueQueueIllustration,
  },
  {
    number: "03",
    title: "Help students continue",
    description:
      "Students receive a calm, supportive message with a clear way to continue, ask for help, or pause reminders. The experience feels human — never like surveillance.",
    Illustration: StudentSupportIllustration,
  },
  {
    number: "04",
    title: "Prove what actually worked",
    description:
      "When a student returns, RescueLoop attributes the outcome as confirmed, strongly associated, or estimated — never combined into one misleading number. Only confirmed value enters your ROI.",
    Illustration: AttributionIllustration,
  },
];

export function FeatureRows() {
  return (
    <section id="product" className="border-t border-[var(--hairline)] bg-[var(--canvas)] py-20 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <ScrollReveal className="mb-16 lg:mb-24">
          <SectionEyebrow>What RescueLoop does</SectionEyebrow>
          <h2 className="mt-6 max-w-[700px] font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
            A disciplined loop from lost momentum to{" "}
            <span className="italic text-[var(--ink-secondary)]">proven recovery.</span>
          </h2>
        </ScrollReveal>

        <div className="border-t border-[var(--hairline)]">
          {FEATURES.map((feature, index) => (
            <FeatureRow key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureRowProps {
  feature: (typeof FEATURES)[number];
  index: number;
}

function FeatureRow({ feature }: FeatureRowProps) {
  return (
    <ScrollReveal
      direction="none"
      className="group border-b border-[var(--hairline)]"
    >
      <div className="grid gap-8 py-12 transition-all duration-500 group-hover:py-14 lg:grid-cols-[auto_1fr_1fr] lg:gap-16 lg:py-16">
        {/* Number */}
        <div className="shrink-0">
          <span className="font-mono text-[13px] text-[var(--ink-muted)] transition-colors duration-500 group-hover:text-[var(--ink-secondary)]">
            {feature.number}
          </span>
        </div>

        {/* Title + description */}
        <div>
          <motion.h3
            className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] leading-tight tracking-[-0.02em] text-[var(--ink-primary)] transition-transform duration-500 group-hover:translate-x-2"
          >
            {feature.title}
          </motion.h3>
          <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-[var(--ink-secondary)] lg:text-[16px]">
            {feature.description}
          </p>
        </div>

        {/* Illustration */}
        <div className="flex items-center justify-center lg:justify-end">
          <div className="h-[200px] w-full max-w-[340px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-4 transition-all duration-500 group-hover:border-[var(--hairline-strong)]">
            <feature.Illustration />
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
