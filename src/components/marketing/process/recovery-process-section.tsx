"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/marketing/shared/scroll-reveal";
import { SectionEyebrow } from "@/components/marketing/shared/section-eyebrow";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, easeOut } from "@/design-system/motion";

const STEPS = [
  {
    number: "I",
    title: "Detect",
    description:
      "RescueLoop identifies meaningful inactivity, course stalls, cancellation signals and renewal risk.",
  },
  {
    number: "II",
    title: "Review",
    description:
      "The creator sees why the student was selected, checks the evidence and edits or approves the intervention.",
  },
  {
    number: "III",
    title: "Support",
    description:
      "The student receives a respectful message with a clear way to continue, ask for help or stop reminders.",
  },
  {
    number: "IV",
    title: "Measure",
    description:
      "RescueLoop observes what happened next and classifies the outcome using transparent attribution rules.",
  },
];

export function RecoveryProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Intersection observer to start/stop auto-advance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance every 5.5s, pauses after manual interaction or when offscreen
  useEffect(() => {
    if (reduced || userInteracted || !inView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, motionTokens.processStep);
    return () => clearInterval(interval);
  }, [reduced, userInteracted, inView]);

  function handleSelect(index: number) {
    setActiveStep(index);
    setUserInteracted(true);
  }

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative overflow-hidden border-y border-[var(--dark-hairline)] bg-[var(--dark-section)] py-20 text-[var(--dark-secondary)] lg:py-32"
    >
      {/* Diagonal pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <ScrollReveal className="mb-16 lg:mb-24">
          <SectionEyebrow dark>How RescueLoop works</SectionEyebrow>
          <h2 className="mt-6 max-w-[800px] font-serif text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-[-0.02em] text-white">
            From lost momentum to{" "}
            <span className="italic text-[var(--dark-secondary)]">renewed progress.</span>
          </h2>
        </ScrollReveal>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Steps */}
          <div>
            {STEPS.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => handleSelect(index)}
                className={`w-full border-b border-[var(--dark-hairline)] py-7 text-left transition-all duration-500 lg:py-8 ${
                  activeStep === index ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-serif text-[28px] text-[var(--dark-secondary)] lg:text-[32px]">
                    {step.number}
                  </span>
                  <div className="flex-1">
                    <h3 className="mb-2 font-serif text-[22px] text-white transition-transform duration-500 group-hover:translate-x-2 lg:text-[28px]">
                      {step.title}
                    </h3>
                    <p className="max-w-[400px] text-[15px] leading-relaxed text-[var(--dark-secondary)]">
                      {step.description}
                    </p>
                    {activeStep === index && (
                      <div className="mt-4 h-px w-full overflow-hidden bg-[var(--dark-hairline)]">
                        {!reduced && (
                          <div
                            key={`${activeStep}-${userInteracted}`}
                            className="h-full bg-[var(--recovery-green)]"
                            style={{
                              width: userInteracted ? "100%" : "0",
                              animation: !userInteracted
                                ? `process-progress ${motionTokens.processStep}ms linear forwards`
                                : "none",
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Sticky visual panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)]">
              {/* Window header */}
              <div className="flex items-center justify-between border-b border-[var(--dark-hairline)] px-5 py-3">
                <div className="flex gap-2">
                  <div className="size-2.5 rounded-full bg-[var(--dark-hairline)]" />
                  <div className="size-2.5 rounded-full bg-[var(--dark-hairline)]" />
                  <div className="size-2.5 rounded-full bg-[var(--dark-hairline)]" />
                </div>
                <span className="font-mono text-[11px] text-[var(--dark-secondary)]">
                  {STEPS[activeStep].title.toLowerCase()}.panel
                </span>
              </div>

              {/* Panel content — changes per step */}
              <div className="min-h-[320px] p-6 lg:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: easeOut }}
                  >
                    <ProcessVisualPanel step={activeStep} reduced={reduced} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Status bar */}
              <div className="flex items-center gap-3 border-t border-[var(--dark-hairline)] px-5 py-3">
                <span className="size-2 rounded-full bg-[var(--recovery-green)]" />
                <span className="font-mono text-[11px] text-[var(--dark-secondary)]">
                  {userInteracted ? "Manual mode" : "Auto-progressing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes process-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}

function ProcessVisualPanel({ step, reduced }: { step: number; reduced: boolean }) {
  // Detect panel — student event stream + evidence
  if (step === 0) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">STUDENT EVENT STREAM</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Maya Thompson</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">38% progress</span>
        </RevealLine>
        <RevealLine delay={0.5} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">No activity for 8 days</span>
        </RevealLine>
        <RevealLine delay={0.7} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Renews in 4 days</span>
        </RevealLine>
        <RevealLine delay={0.9} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">Previous pace: 3.2 lessons/week</span>
        </RevealLine>
        <div className="mt-4 border-t border-[var(--dark-hairline)] pt-3">
          <RevealLine delay={1.1} reduced={reduced}>
            <span className="font-mono text-[11px] tracking-wide text-[var(--recovery-green)]">DETECTED</span>
          </RevealLine>
        </div>
      </div>
    );
  }

  // Review panel — queue inspector + message preview
  if (step === 1) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">CREATOR QUEUE INSPECTOR</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-white">Why flagged:</span>{" "}
          <span className="text-[var(--dark-secondary)]">Stalled at Lesson 12</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="text-white">Evidence:</span>{" "}
          <span className="text-[var(--dark-secondary)]">10 days inactive · 38% · renews Feb 15</span>
        </RevealLine>
        <RevealLine delay={0.5} reduced={reduced}>
          <span className="text-white">Recommended:</span>{" "}
          <span className="text-[var(--dark-secondary)]">Mid-Course Rescue</span>
        </RevealLine>
        <div className="mt-3 rounded-[4px] border border-[var(--dark-hairline)] bg-[var(--dark-section)] p-3">
          <RevealLine delay={0.7} reduced={reduced}>
            <span className="font-mono text-[11px] text-[var(--dark-secondary)]">MESSAGE PREVIEW</span>
          </RevealLine>
          <RevealLine delay={0.9} reduced={reduced}>
            <span className="text-[13px] text-white">Hi Maya, you're over a third through — that's real progress…</span>
          </RevealLine>
        </div>
        <RevealLine delay={1.1} reduced={reduced}>
          <span className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--warning)]/20 px-3 py-1 font-mono text-[11px] text-[var(--warning)]">
            MANUAL APPROVAL REQUIRED
          </span>
        </RevealLine>
      </div>
    );
  }

  // Support panel — mobile student experience
  if (step === 2) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">STUDENT EXPERIENCE</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-white">Hi Maya 👋</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">You're at 38% — that's real progress.</span>
        </RevealLine>
        <div className="mt-3 space-y-2">
          <RevealLine delay={0.5} reduced={reduced}>
            <span className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--recovery-green)] bg-[var(--recovery-green)]/10 px-3 py-2 text-[13px] text-[var(--recovery-green)]">
              Continue course
            </span>
          </RevealLine>
          <RevealLine delay={0.7} reduced={reduced}>
            <span className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--dark-hairline)] px-3 py-2 text-[13px] text-[var(--dark-secondary)]">
              I'm stuck
            </span>
          </RevealLine>
          <RevealLine delay={0.9} reduced={reduced}>
            <span className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--dark-hairline)] px-3 py-2 text-[13px] text-[var(--dark-secondary)]">
              Remind me tomorrow
            </span>
          </RevealLine>
        </div>
      </div>
    );
  }

  // Measure panel — outcome evidence + attribution tier
  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">OUTCOME EVIDENCE</p>
      <RevealLine delay={0.1} reduced={reduced}>
        <span className="text-white">Student returned</span>
      </RevealLine>
      <RevealLine delay={0.3} reduced={reduced}>
        <span className="text-[var(--dark-secondary)]">Lesson completed</span>
      </RevealLine>
      <RevealLine delay={0.5} reduced={reduced}>
        <span className="font-mono text-[13px] text-white">Progress 38% → 42%</span>
      </RevealLine>
      <RevealLine delay={0.7} reduced={reduced}>
        <span className="text-[var(--dark-secondary)]">Cancellation reversed</span>
      </RevealLine>
      <div className="mt-4 border-t border-[var(--dark-hairline)] pt-3">
        <RevealLine delay={0.9} reduced={reduced}>
          <span className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">ATTRIBUTION</span>
        </RevealLine>
        <RevealLine delay={1.1} reduced={reduced}>
          <span className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--recovery-green)]/15 px-3 py-1 font-mono text-[12px] text-[var(--recovery-green)]">
            STRONGLY ASSOCIATED
          </span>
        </RevealLine>
        <RevealLine delay={1.3} reduced={reduced}>
          <span className="text-[12px] text-[var(--dark-secondary)]">Not combined with estimated value.</span>
        </RevealLine>
      </div>
    </div>
  );
}

function RevealLine({ children, delay, reduced }: { children: React.ReactNode; delay: number; reduced: boolean }) {
  if (reduced) {
    return <div>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.4, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
