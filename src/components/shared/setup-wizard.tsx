"use client";

import { type ReactNode, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/* ── Types ──────────────────────────────────────────────────────── */

export interface WizardStep {
  id: string;
  label: string;
  content: ReactNode;
}

export interface SetupWizardProps {
  steps: WizardStep[];
  currentStep: number;
  direction: 1 | -1;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  canAdvance?: boolean;
  isLastStep?: boolean;
  finishLabel?: string;
}

/* ── Animation variants ─────────────────────────────────────────── */

const slideVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const slideTransition = {
  type: "tween" as const,
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1],
};

/* ── Component ──────────────────────────────────────────────────── */

export function SetupWizard({
  steps,
  currentStep,
  direction,
  onStepChange,
  onComplete,
  canAdvance = true,
  isLastStep = false,
  finishLabel = "Finish",
}: SetupWizardProps) {
  const totalSteps = steps.length;
  const progressPct = ((currentStep + 1) / totalSteps) * 100;
  const isFirst = currentStep === 0;

  const goNext = useCallback(() => {
    if (isLastStep) {
      onComplete?.();
    } else {
      onStepChange(currentStep + 1);
    }
  }, [isLastStep, onComplete, onStepChange, currentStep]);

  const goBack = useCallback(() => {
    if (!isFirst) onStepChange(currentStep - 1);
  }, [isFirst, onStepChange, currentStep]);

  /* Keyboard navigation */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (e.key === "Enter" && canAdvance) {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canAdvance, goNext]);

  return (
    <div className="flex flex-col min-h-[min(680px,100vh)] w-full">
      {/* ── Progress bar ──────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-2">
        <Progress
          value={progressPct}
          className="h-1.5 rounded-full bg-[var(--hairline)] [&>[data-slot=progress-indicator]]:rounded-full [&>[data-slot=progress-indicator]]:bg-[var(--recovery-green)]"
        />
      </div>

      {/* ── Step indicator dots ──────────────────────────────── */}
      <div className="flex items-center justify-center gap-1 px-6 pb-6">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isUpcoming = i > currentStep;

          return (
            <div key={step.id} className="flex items-center">
              {/* Dot */}
              <button
                type="button"
                onClick={() => {
                  if (i < currentStep) onStepChange(i);
                }}
                className={cn(
                  "relative flex size-7 items-center justify-center rounded-full transition-all duration-200",
                  isCompleted &&
                    "bg-[var(--recovery-green)] text-white cursor-pointer hover:opacity-80",
                  isCurrent &&
                    "bg-[var(--recovery-green)]/15 border-2 border-[var(--recovery-green)] text-[var(--recovery-green)]",
                  isUpcoming && "bg-[var(--canvas-elevated)] border border-[var(--hairline)] text-[var(--ink-muted)]",
                )}
                aria-label={`Step ${i + 1}: ${step.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
              >
                {isCompleted ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="text-[11px] font-semibold">{i + 1}</span>
                )}
              </button>

              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-[2px] w-6 rounded-full transition-colors duration-300",
                    i < currentStep
                      ? "bg-[var(--recovery-green)]"
                      : "bg-[var(--hairline)]",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step label ────────────────────────────────────────── */}
      <div className="px-6 pb-2 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          Step {currentStep + 1} of {totalSteps} — {steps[currentStep]?.label}
        </span>
      </div>

      {/* ── Step content (animated) ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="min-h-0"
          >
            {steps[currentStep]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation buttons ────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-[var(--hairline)] bg-[var(--canvas)] px-6 py-4 mt-auto">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={isFirst}
          className={cn(
            "rounded-[8px] text-[13px] text-[var(--ink-secondary)]",
            isFirst && "invisible",
          )}
        >
          Back
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--ink-muted)]">
            {currentStep + 1}/{totalSteps}
          </span>
          <Button
            onClick={goNext}
            disabled={!canAdvance}
            className="rounded-[8px] bg-[var(--recovery-green)] px-6 text-[13px] font-medium text-white hover:bg-[var(--recovery-green)]/90"
          >
            {isLastStep ? finishLabel : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
