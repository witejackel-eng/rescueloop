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
    title: "Understand",
    description:
      "Evidence is gathered: progress deviation, last lesson, similar student patterns, and campaign cooldown checks.",
  },
  {
    number: "III",
    title: "Review",
    description:
      "The creator sees why the student was selected, checks the evidence and edits or approves the intervention.",
  },
  {
    number: "IV",
    title: "Support",
    description:
      "The student receives a respectful message from their creator with a clear way to continue or stop reminders.",
  },
  {
    number: "V",
    title: "Observe",
    description:
      "RescueLoop watches whether the student responded to the support, replied, resumed lessons or reversed a cancellation.",
  },
  {
    number: "VI",
    title: "Prove",
    description:
      "The outcome is classified as confirmed, strongly associated, or estimated — never combined into one total.",
  },
  {
    number: "VII",
    title: "Improve",
    description:
      "Repeated blockers are connected to specific lessons, surfacing course improvements with real evidence.",
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
  // I — Detect: events that produced the candidate
  if (step === 0) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">CANDIDATE EVENTS</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Maya Chen · Agency Growth System · $79/mo</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">38% complete</span>
        </RevealLine>
        <RevealLine delay={0.5} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">No lesson activity for 8 days</span>
        </RevealLine>
        <RevealLine delay={0.7} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Renews in 4 days</span>
        </RevealLine>
        <RevealLine delay={0.9} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">Previous pace: 3.2 lessons/week</span>
        </RevealLine>
        <div className="mt-4 border-t border-[var(--dark-hairline)] pt-3">
          <RevealLine delay={1.1} reduced={reduced}>
            <span className="font-mono text-[11px] tracking-wide text-[var(--recovery-green)]">CANDIDATE DETECTED</span>
          </RevealLine>
        </div>
      </div>
    );
  }

  // II — Understand: evidence, sample history, campaign conditions
  if (step === 1) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">EVIDENCE SUMMARY</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-white">Progress deviation:</span>{" "}
          <span className="text-[var(--dark-secondary)]">-62% vs baseline pace</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="text-white">Last lesson:</span>{" "}
          <span className="text-[var(--dark-secondary)]">Lesson 11 — Onboarding a Client</span>
        </RevealLine>
        <RevealLine delay={0.5} reduced={reduced}>
          <span className="text-white">Similar student pattern:</span>{" "}
          <span className="text-[var(--dark-secondary)]">matched (n=42)</span>
        </RevealLine>
        <RevealLine delay={0.7} reduced={reduced}>
          <span className="text-white">Campaign cooldown:</span>{" "}
          <span className="text-[var(--dark-secondary)]">clear — no prior send</span>
        </RevealLine>
        <RevealLine delay={0.9} reduced={reduced}>
          <span className="text-white">Renewal context:</span>{" "}
          <span className="text-[var(--dark-secondary)]">membership active, 4 days to renewal</span>
        </RevealLine>
      </div>
    );
  }

  // III — Review: message preview, cooldown, creator approval
  if (step === 2) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">CREATOR QUEUE INSPECTOR</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-white">Why flagged:</span>{" "}
          <span className="text-[var(--dark-secondary)]">Stalled at Lesson 12 for 8 days</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="text-white">Recommended:</span>{" "}
          <span className="text-[var(--dark-secondary)]">Mid-Course Rescue</span>
        </RevealLine>
        <div className="mt-3 rounded-[4px] border border-[var(--dark-hairline)] bg-[var(--dark-section)] p-3">
          <RevealLine delay={0.5} reduced={reduced}>
            <span className="font-mono text-[11px] text-[var(--dark-secondary)]">MESSAGE PREVIEW</span>
          </RevealLine>
          <RevealLine delay={0.7} reduced={reduced}>
            <span className="text-[13px] text-white">Hi Maya — Aditya from Agency Growth System here. You're 38% through. Want a quick onboarding checklist?</span>
          </RevealLine>
        </div>
        <RevealLine delay={0.9} reduced={reduced}>
          <span className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--warning)]/20 px-3 py-1 font-mono text-[11px] text-[var(--warning)]">
            MANUAL APPROVAL REQUIRED
          </span>
        </RevealLine>
      </div>
    );
  }

  // IV — Support: student-facing experience
  if (step === 3) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">STUDENT EXPERIENCE</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-white">Hi Maya — Aditya from Agency Growth System here.</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">You're 38% through. Next lesson takes ~12 minutes.</span>
        </RevealLine>
        <div className="mt-3 space-y-2">
          <RevealLine delay={0.5} reduced={reduced}>
            <span className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--recovery-green)] bg-[var(--recovery-green)]/10 px-3 py-2 text-[13px] text-[var(--recovery-green)]">
              Continue with Lesson 12
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
          <RevealLine delay={1.1} reduced={reduced}>
            <span className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--dark-hairline)] px-3 py-2 text-[13px] text-[var(--dark-secondary)]">
              Stop course reminders
            </span>
          </RevealLine>
        </div>
      </div>
    );
  }

  // V — Observe: open, response, lesson events
  if (step === 4) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">OBSERVED EVENTS</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">Response received</span>{" "}
          <span className="text-[var(--dark-secondary)]">— 2 hours after send</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">Student responded</span>{" "}
          <span className="text-[var(--dark-secondary)]">— chose "Continue"</span>
        </RevealLine>
        <RevealLine delay={0.5} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">Lesson 12 started</span>
        </RevealLine>
        <RevealLine delay={0.7} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">Lesson 12 completed</span>
        </RevealLine>
        <RevealLine delay={0.9} reduced={reduced}>
          <span className="font-mono text-[13px] text-white">Progress 38% → 42%</span>
        </RevealLine>
        <RevealLine delay={1.1} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Cancellation reversed</span>
        </RevealLine>
      </div>
    );
  }

  // VI — Prove: evidence chain + attribution classification
  if (step === 5) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">EVIDENCE CHAIN</p>
        <RevealLine delay={0.1} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Candidate detected → Creator approved → Intervention dispatched</span>
        </RevealLine>
        <RevealLine delay={0.3} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Student responded → Student resumed → Lesson completed</span>
        </RevealLine>
        <RevealLine delay={0.5} reduced={reduced}>
          <span className="text-[var(--dark-secondary)]">Cancellation reversed → Payment continued</span>
        </RevealLine>
        <div className="mt-4 border-t border-[var(--dark-hairline)] pt-3">
          <RevealLine delay={0.7} reduced={reduced}>
            <span className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">ATTRIBUTION</span>
          </RevealLine>
          <RevealLine delay={0.9} reduced={reduced}>
            <span className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--recovery-green)]/15 px-3 py-1 font-mono text-[12px] text-[var(--recovery-green)]">
              CONFIRMED
            </span>
          </RevealLine>
          <RevealLine delay={1.1} reduced={reduced}>
            <span className="text-[12px] text-[var(--dark-secondary)]">Payment verified. Not combined with estimated value.</span>
          </RevealLine>
        </div>
      </div>
    );
  }

  // VII — Improve: blockers connected to Lesson 7, recommended course change
  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] tracking-wide text-[var(--dark-secondary)]">COURSE IMPROVEMENT SIGNAL</p>
      <RevealLine delay={0.1} reduced={reduced}>
        <span className="text-white">Multiple stalls connected to Lesson 7</span>
      </RevealLine>
      <RevealLine delay={0.3} reduced={reduced}>
        <span className="text-[var(--dark-secondary)]">7 students reported "setup unclear"</span>
      </RevealLine>
      <RevealLine delay={0.5} reduced={reduced}>
        <span className="font-mono text-[13px] text-white">Stall rate: 24% (course avg: 10%)</span>
      </RevealLine>
      <div className="mt-3 rounded-[4px] border border-[var(--dark-hairline)] bg-[var(--dark-section)] p-3">
        <RevealLine delay={0.7} reduced={reduced}>
          <span className="font-mono text-[11px] text-[var(--dark-secondary)]">RECOMMENDATION</span>
        </RevealLine>
        <RevealLine delay={0.9} reduced={reduced}>
          <span className="text-[13px] text-white">Add a short setup walkthrough and downloadable checklist to Lesson 7.</span>
        </RevealLine>
      </div>
      <RevealLine delay={1.1} reduced={reduced}>
        <span className="text-[12px] text-[var(--dark-secondary)]">Status: Investigating → Planned. Measurement period required before claiming success.</span>
      </RevealLine>
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
