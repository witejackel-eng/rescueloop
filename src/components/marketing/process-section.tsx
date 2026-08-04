"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard, panel } from "@/design-system/motion";

type StepId = "detect" | "understand" | "rescue" | "prove" | "improve";

const STEPS: { id: StepId; label: string; description: string }[] = [
  { id: "detect", label: "Detect", description: "Surface the risk signal" },
  { id: "understand", label: "Understand", description: "Assemble the evidence" },
  { id: "rescue", label: "Rescue", description: "Coordinate the intervention" },
  { id: "prove", label: "Prove", description: "Attribute the outcome" },
  { id: "improve", label: "Improve", description: "Fix the underlying course" },
];

const STEP_DURATION_MS = 5000;

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-px w-full bg-[var(--dark-hairline)]">
      <motion.div
        className="h-full bg-[var(--recovery-green)]"
        initial={false}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  );
}

function MiniProgress({ value, before }: { value: number; before?: number }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden bg-[var(--dark-hairline)]">
      {before !== undefined && (
        <div
          className="absolute inset-y-0 left-0 bg-[var(--dark-secondary)] opacity-40"
          style={{ width: `${before}%` }}
        />
      )}
      <motion.div
        className="absolute inset-y-0 left-0 bg-[var(--recovery-green)]"
        initial={false}
        animate={{ width: `${value}%` }}
        transition={panel}
      />
    </div>
  );
}

function TimelineDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            i < activeIndex
              ? "bg-[var(--recovery-green)]"
              : i === activeIndex
                ? "bg-[var(--recovery-light)]"
                : "bg-[var(--dark-hairline)]",
          )}
        />
      ))}
    </div>
  );
}

function DetectPanel() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
        Risk signal detected
      </div>

      {/* Student card */}
      <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-serif text-[20px] text-[#F4F1EA]">Maya Thompson</div>
            <div className="mt-0.5 font-mono text-[11px] text-[var(--dark-secondary)]">
              st_014 · member since Jan 12
            </div>
          </div>
          <div className="rounded-[4px] border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--warning)]">
            Mid-course stall
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
              Progress
            </div>
            <div className="mt-1.5">
              <MiniProgress value={38} />
            </div>
            <div className="mt-1 font-mono text-[12px] text-[#F4F1EA]">38%</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
              Days inactive
            </div>
            <div className="mt-1 font-mono text-[20px] text-[#F4F1EA]">8d</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
              Renews in
            </div>
            <div className="mt-1 font-mono text-[20px] text-[var(--warning)]">4d</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
              Previous pace
            </div>
            <div className="mt-1 font-mono text-[20px] text-[#F4F1EA]">3.2<span className="text-[12px] text-[var(--dark-secondary)]">/wk</span></div>
          </div>
        </div>

        <div className="mt-5 border-t border-[var(--dark-hairline)] pt-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
              Lesson timeline
            </span>
            <span className="font-mono text-[10px] text-[var(--dark-secondary)]">L1 → L12</span>
          </div>
          <div className="mt-2">
            <TimelineDots activeIndex={5} />
          </div>
        </div>
      </div>

      <div className="text-[13px] leading-relaxed text-[var(--dark-secondary)]">
        No dashboard would flag this. Maya is enrolled, paid through next week,
        and technically active. RescueLoop detects that she has stalled against
        her own pace.
      </div>
    </div>
  );
}

function UnderstandPanel() {
  const EVIDENCE = [
    { label: "progress_deviation", value: "−62% vs. pace", tone: "warning" as const },
    { label: "last_lesson", value: "L12 · Onboarding a Client", tone: "neutral" as const },
    { label: "similar_pattern", value: "42 students matched", tone: "neutral" as const },
    { label: "intervention_cooldown", value: "OK · 0 sent in 14d", tone: "good" as const },
  ];
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
        Evidence assembled
      </div>

      <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)]">
        {EVIDENCE.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between gap-4 px-5 py-4",
              i > 0 && "border-t border-[var(--dark-hairline)]",
            )}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--dark-secondary)]">
              {row.label}
            </span>
            <span
              className={cn(
                "font-mono text-[13px]",
                row.tone === "warning" && "text-[var(--warning)]",
                row.tone === "good" && "text-[var(--recovery-green)]",
                row.tone === "neutral" && "text-[#F4F1EA]",
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
          Pattern match
        </div>
        <div className="mt-2 text-[14px] leading-relaxed text-[#F4F1EA]">
          42 students with a similar pace deviation went on to cancel within
          14 days. 19 of them resumed progress after a single check-in.
        </div>
        <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-[var(--dark-secondary)]">
          <Sparkles className="size-3.5 text-[var(--recovery-green)]" />
          pattern_momentum_decline · confidence 0.78
        </div>
      </div>
    </div>
  );
}

function RescuePanel() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
        Intervention queued
      </div>

      {/* Message preview */}
      <div className="border-l-2 border-[var(--recovery-green)] bg-[var(--dark-elevated)] p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
          Message preview
        </div>
        <p className="mt-2 font-serif text-[16px] leading-snug text-[#F4F1EA]">
          “Hi Maya — last time you were in, you finished Onboarding a Client.
          The next lesson is 6 minutes and picks up exactly where you left off.
          Want me to send a quick link?”
        </p>
      </div>

      {/* Send timing */}
      <div className="flex items-center justify-between border-y border-[var(--dark-hairline)] py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
          Scheduled send
        </span>
        <span className="font-mono text-[13px] text-[#F4F1EA]">Tomorrow · 9:00 AM</span>
      </div>

      {/* Safety checks */}
      <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)]">
        <div className="border-b border-[var(--dark-hairline)] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
          Safety checks
        </div>
        {[
          { label: "Cooldown OK", value: "0 sent in 14d" },
          { label: "Quiet hours OK", value: "9:00–21:00 ET" },
          { label: "Max messages OK", value: "1 / 3 this month" },
        ].map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2.5",
              i > 0 && "border-t border-[var(--dark-hairline)]",
            )}
          >
            <div className="flex items-center gap-2">
              <Check className="size-3.5 text-[var(--recovery-green)]" />
              <span className="text-[13px] text-[#F4F1EA]">{row.label}</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--dark-secondary)]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Approval + options */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--recovery-green)]/40 bg-[var(--recovery-green)]/10 px-2.5 py-1.5 font-mono text-[11px] text-[var(--recovery-light)]">
          <ShieldCheck className="size-3.5" />
          Creator approval required
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Continue", "I'm stuck", "Remind me tomorrow"].map((opt) => (
          <span
            key={opt}
            className="rounded-[4px] border border-[var(--dark-hairline)] px-2.5 py-1 text-[12px] text-[var(--dark-secondary)]"
          >
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProvePanel() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
        Outcome attributed
      </div>

      {/* Outcome chips */}
      <div className="grid grid-cols-1 gap-2">
        {[
          { label: "Student returned", value: "2 days after send" },
          { label: "Lesson completed", value: "L13 · Outreach Plan" },
          { label: "Progress", value: "38% → 42%" },
        ].map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              i > 0 && "border-t border-[var(--dark-hairline)]",
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
              <span className="text-[14px] text-[#F4F1EA]">{row.label}</span>
            </div>
            <span className="font-mono text-[12px] text-[var(--dark-secondary)]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Before / after bars */}
      <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
          Progress change
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="w-10 font-mono text-[12px] text-[var(--dark-secondary)]">Before</span>
          <div className="flex-1">
            <MiniProgress value={38} />
          </div>
          <span className="font-mono text-[12px] text-[#F4F1EA]">38%</span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-10 font-mono text-[12px] text-[var(--dark-secondary)]">After</span>
          <div className="flex-1">
            <MiniProgress value={42} before={38} />
          </div>
          <span className="font-mono text-[12px] text-[var(--recovery-green)]">42%</span>
        </div>
      </div>

      {/* Attribution badge */}
      <div className="flex items-center justify-between border border-[var(--recovery-green)]/30 bg-[var(--recovery-green)]/5 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
            Attribution
          </div>
          <div className="mt-0.5 text-[14px] text-[#F4F1EA]">Strongly associated</div>
        </div>
        <span className="font-mono text-[13px] text-[var(--recovery-green)]">+$79</span>
      </div>
    </div>
  );
}

function ImprovePanel() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
        Course pattern identified
      </div>

      <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
          Connected stalls
        </div>
        <div className="mt-2 font-serif text-[20px] text-[#F4F1EA]">
          Multiple stalls connected to Lesson 7
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
              Reports
            </div>
            <div className="mt-0.5 font-mono text-[18px] text-[var(--warning)]">7</div>
            <div className="font-mono text-[10px] text-[var(--dark-secondary)]">“setup is unclear”</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
              Affected
            </div>
            <div className="mt-0.5 font-mono text-[18px] text-[#F4F1EA]">18</div>
            <div className="font-mono text-[10px] text-[var(--dark-secondary)]">students stalled</div>
          </div>
        </div>
      </div>

      {/* Mini lesson map */}
      <div className="border border-[var(--dark-hairline)] bg-[var(--dark-elevated)] p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
            Lesson map
          </span>
          <span className="font-mono text-[10px] text-[var(--dark-secondary)]">L1 → L9</span>
        </div>
        <div className="mt-4 flex items-end gap-1.5" style={{ height: 80 }}>
          {[
            { l: "L1", h: 90, friction: false },
            { l: "L2", h: 78, friction: false },
            { l: "L3", h: 72, friction: false },
            { l: "L4", h: 64, friction: false },
            { l: "L5", h: 60, friction: false },
            { l: "L6", h: 54, friction: false },
            { l: "L7", h: 28, friction: true },
            { l: "L8", h: 48, friction: false },
            { l: "L9", h: 42, friction: false },
          ].map((bar) => (
            <div key={bar.l} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full",
                    bar.friction ? "bg-[var(--warning)]" : "bg-[var(--dark-secondary)]/40",
                  )}
                  style={{ height: `${bar.h}%` }}
                />
              </div>
              <span
                className={cn(
                  "font-mono text-[9px]",
                  bar.friction ? "text-[var(--warning)]" : "text-[var(--dark-secondary)]",
                )}
              >
                {bar.l}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="border border-[var(--recovery-green)]/30 bg-[var(--recovery-green)]/5 p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--recovery-green)]">
          Recommended course improvement
        </div>
        <div className="mt-2 text-[14px] leading-snug text-[#F4F1EA]">
          Add a setup walkthrough video to Lesson 7. Estimated to reduce
          mid-course stall by ~30%.
        </div>
      </div>
    </div>
  );
}

function StepPanel({ step }: { step: StepId }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={standard}
      >
        {step === "detect" && <DetectPanel />}
        {step === "understand" && <UnderstandPanel />}
        {step === "rescue" && <RescuePanel />}
        {step === "prove" && <ProvePanel />}
        {step === "improve" && <ImprovePanel />}
      </motion.div>
    </AnimatePresence>
  );
}

export function ProcessSection() {
  const reduced = useReducedMotion();
  const [activeStep, setActiveStep] = useState<StepId>("detect");
  const [userInteracted, setUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  // Auto-advance every STEP_DURATION_MS unless user interacted
  useEffect(() => {
    if (userInteracted || reduced) return;

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / STEP_DURATION_MS) * 100);
      setProgress(pct);
      if (elapsed >= STEP_DURATION_MS) {
        setActiveStep((prev) => {
          const idx = STEPS.findIndex((s) => s.id === prev);
          return STEPS[(idx + 1) % STEPS.length].id;
        });
        setProgress(0);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [activeStep, userInteracted, reduced]);

  function selectStep(id: StepId) {
    setActiveStep(id);
    setUserInteracted(true);
    setProgress(0);
  }

  return (
    <section
      id="process"
      className="relative bg-[var(--dark-section)] text-[#F4F1EA]"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-20 lg:px-8 lg:py-32">
        {/* Section label */}
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--dark-secondary)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          How it works
        </div>

        <h2 className="mt-8 max-w-[16ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em]">
          A single student, all five steps.
        </h2>
        <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-[var(--dark-secondary)]">
          Watch Maya move through detection, evidence, intervention, attribution,
          and course improvement — one continuous loop.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16">
          {/* Left: steps */}
          <div className="flex flex-col">
            <div className="border-t border-[var(--dark-hairline)]">
              {STEPS.map((step, i) => {
                const isActive = step.id === activeStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => selectStep(step.id)}
                    className="group block w-full border-b border-[var(--dark-hairline)] py-6 text-left"
                  >
                    <div className="flex items-baseline gap-5">
                      <span
                        className={cn(
                          "font-mono text-[12px] tabular-nums transition-colors",
                          isActive
                            ? "text-[var(--recovery-green)]"
                            : "text-[var(--dark-secondary)]",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div
                          className={cn(
                            "font-serif text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight tracking-[-0.02em] transition-colors",
                            isActive
                              ? "text-[#F4F1EA]"
                              : "text-[var(--dark-secondary)] group-hover:text-[#F4F1EA]",
                          )}
                        >
                          {step.label}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-[14px] transition-colors",
                            isActive
                              ? "text-[var(--dark-secondary)]"
                              : "text-[var(--dark-secondary)]/60",
                          )}
                        >
                          {step.description}
                        </div>
                      </div>
                      <ArrowRight
                        className={cn(
                          "size-5 shrink-0 transition-all",
                          isActive
                            ? "translate-x-0 text-[var(--recovery-green)] opacity-100"
                            : "-translate-x-1 text-[var(--dark-secondary)] opacity-0 group-hover:opacity-50",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Auto-advance progress */}
            <div className="mt-8">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">
                <span>Auto-advance</span>
                <span>{userInteracted ? "Paused" : `${Math.round(progress)}%`}</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={userInteracted ? 0 : progress} />
              </div>
              {userInteracted && (
                <button
                  onClick={() => {
                    setUserInteracted(false);
                    setProgress(0);
                  }}
                  className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--recovery-green)] underline-offset-4 hover:underline"
                >
                  Resume auto-advance
                </button>
              )}
            </div>
          </div>

          {/* Right: sticky simulation */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative border border-[var(--dark-hairline)] bg-[var(--dark-section)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--dark-hairline)] px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 animate-pulse rounded-full bg-[var(--recovery-green)]" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--dark-secondary)]">
                    Live simulation
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[var(--dark-secondary)]">
                  Step {activeIndex + 1} / {STEPS.length}
                </span>
              </div>

              <StepPanel step={activeStep} />
            </div>

            {/* Caption */}
            <p className="mt-4 font-mono text-[11px] text-[var(--dark-secondary)]">
              {reduced
                ? "Reduced motion: simulation paused."
                : userInteracted
                  ? "Auto-advance paused after manual selection."
                  : "Auto-advances every 5 seconds until you select a step."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
