"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";

// ProductStoryVisual — layered composition showing the RescueLoop workflow.
// Cards represent: Signal (candidate) → Review (approval) → Outcome (observed).
// An incomplete closing-signal SVG path sits behind the cards.
// Staggered entry motion with a first-value moment animation.
// Respects reduced-motion.

// ── Workflow stages for the first-value moment ─────────────────────
type Stage = "idle" | "detected" | "evidence" | "review" | "approved" | "observed";

const STAGE_SEQUENCE: Stage[] = ["detected", "evidence", "review", "approved", "observed"];
const STAGE_DURATIONS: Record<Stage, number> = {
  idle: 6000,      // Wait 6s before replay
  detected: 1800,
  evidence: 1600,
  review: 2000,
  approved: 1800,
  observed: 4000,  // Hold the complete state for 4s before reset
};

// ── Closing Signal SVG Path ────────────────────────────────────────
function ClosingSignalPath({ className, activeStage }: { className?: string; activeStage: Stage }) {
  // Determine which nodes are "active" based on stage
  const signalActive = activeStage !== "idle";
  const reviewActive = activeStage === "review" || activeStage === "approved" || activeStage === "observed";
  const supportActive = activeStage === "approved" || activeStage === "observed";
  const observeActive = activeStage === "observed";

  return (
    <svg
      viewBox="0 0 400 520"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Incomplete circular arc — Signal → Review → Support → (gap) → Observe */}
      <path
        d="M200 40 C300 40 360 110 360 200 C360 290 300 360 200 360 C140 360 90 330 70 280"
        stroke="var(--hairline-strong)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        strokeLinecap="round"
      />
      {/* Gap — the loop is not yet closed (unless observed) */}
      <path
        d="M70 280 C55 240 55 190 70 150 C90 90 140 55 200 40"
        stroke={observeActive ? "var(--recovery-green)" : "var(--hairline)"}
        strokeWidth={observeActive ? "1.5" : "1"}
        strokeDasharray={observeActive ? "4 6" : "2 10"}
        strokeLinecap="round"
        opacity={observeActive ? 0.6 : 0.4}
      />

      {/* Signal node (top) */}
      <circle cx="200" cy="40" r="5" fill="var(--warning)" opacity={signalActive ? 0.8 : 0.4} />
      <circle cx="200" cy="40" r="2.5" fill="var(--warning)" opacity={signalActive ? 1 : 0.5} />

      {/* Review node (right) */}
      <circle cx="360" cy="200" r="5" fill={reviewActive ? "var(--ink-secondary)" : "var(--ink-muted)"} opacity={reviewActive ? 0.6 : 0.3} />
      <circle cx="360" cy="200" r="2.5" fill={reviewActive ? "var(--ink-primary)" : "var(--ink-secondary)"} opacity={reviewActive ? 0.9 : 0.4} />

      {/* Support node (bottom) */}
      <circle cx="200" cy="360" r="5" fill="var(--recovery-green)" opacity={supportActive ? 0.6 : 0.25} />
      <circle cx="200" cy="360" r="2.5" fill="var(--recovery-green)" opacity={supportActive ? 1 : 0.4} />

      {/* Observe node (left) — the green node that visually closes the loop */}
      <circle cx="70" cy="200" r="6" fill="var(--recovery-green)" opacity={observeActive ? 0.4 : 0.15} />
      <circle cx="70" cy="200" r="3" fill="var(--recovery-green)" opacity={observeActive ? 0.9 : 0.3} />

      {/* Node labels */}
      <text x="200" y="24" textAnchor="middle" fill={signalActive ? "var(--warning)" : "var(--ink-muted)"} fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" letterSpacing="0.1em" opacity={signalActive ? 0.9 : 0.5}>SIGNAL</text>
      <text x="380" y="204" textAnchor="start" fill={reviewActive ? "var(--ink-secondary)" : "var(--ink-muted)"} fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" letterSpacing="0.1em" opacity={reviewActive ? 0.8 : 0.4}>REVIEW</text>
      <text x="200" y="384" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" letterSpacing="0.1em" opacity={supportActive ? 0.7 : 0.4}>SUPPORT</text>
      <text x="50" y="204" textAnchor="end" fill="var(--recovery-green)" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" letterSpacing="0.1em" opacity={observeActive ? 0.9 : 0.3}>OBSERVE</text>
    </svg>
  );
}

// ── Candidate Card (dominant) ──────────────────────────────────────
function CandidateCard({ stage }: { stage: Stage }) {
  const visible = stage !== "idle";
  const showEvidence = stage === "evidence" || stage === "review" || stage === "approved" || stage === "observed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.65, ease: easeOut }}
      className="relative rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_1px_3px_rgba(17,17,15,0.06),0_8px_24px_rgba(17,17,15,0.04)]"
      style={{ minWidth: 280 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[var(--hairline-subtle)] px-5 pt-4 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-[var(--ink-primary)]">Maya Thompson</span>
          </div>
          <span className="font-mono text-[11px] tracking-wide text-[var(--ink-muted)]">Agency Growth System</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-light)] px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--warning)]">
          <span className="size-1.5 rounded-full bg-[var(--warning)]" />
          Mid-course stall
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-5 py-3.5">
        <MetricRow label="Progress" value="38%" />
        <MetricRow label="Inactive" value="8 days" />
        <MetricRow label="Last lesson" value="Module 4" />
        <MetricRow label="Renews in" value="4 days" />
      </div>

      {/* Evidence — appears on evidence stage */}
      <AnimatePresence>
        {showEvidence && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="overflow-hidden border-t border-[var(--hairline-subtle)] px-5 py-3"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Evidence</span>
            <ul className="mt-1.5 space-y-1">
              <EvidenceItem text="previous pace 3.2 lessons/week" />
              <EvidenceItem text="no activity since Module 4" />
              <EvidenceItem text="no recent intervention" />
              <EvidenceItem text="reminders allowed" />
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <div className="border-t border-[var(--hairline-subtle)] px-5 py-2.5">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{
              backgroundColor: stage === "detected" ? "var(--warning)" : stage === "observed" ? "var(--recovery-green)" : "var(--warning)",
            }}
            transition={{ duration: 0.3 }}
            className="size-1.5 rounded-full"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            {stage === "observed" ? "Course activity observed" : "Candidate detected"}
          </span>
          <span className="ml-auto font-mono text-[10px] text-[var(--ink-muted)]">2m ago</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Review Card (smaller) ──────────────────────────────────────────
function ReviewCard({ stage }: { stage: Stage }) {
  const visible = stage === "review" || stage === "approved" || stage === "observed";
  const approved = stage === "approved" || stage === "observed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.55, ease: easeOut }}
      className="relative rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_1px_2px_rgba(17,17,15,0.04),0_4px_12px_rgba(17,17,15,0.03)]"
      style={{ minWidth: 240 }}
    >
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Review</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] ${approved ? "bg-[var(--recovery-light)] text-[var(--recovery-green)]" : "bg-[var(--canvas-elevated)] text-[var(--ink-muted)]"}`}>
            {approved ? "Approved" : "Draft ready"}
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-snug text-[var(--ink-secondary)]">
          &ldquo;Hey Maya — noticed you haven&apos;t visited in a few days. Here&apos;s where you left off…&rdquo;
        </p>
      </div>
      <div className="border-t border-[var(--hairline-subtle)] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[var(--ink-muted)]">
            {approved ? "Accepted by Whop" : "Nothing sends until approved"}
          </span>
          <div className="flex gap-2">
            <span className="rounded-[5px] border border-[var(--hairline)] px-2.5 py-1 font-mono text-[10px] text-[var(--ink-muted)]">Edit</span>
            <motion.span
              animate={{
                opacity: approved ? 1 : 0.6,
                backgroundColor: approved ? "var(--recovery-green)" : "var(--ink-muted)",
              }}
              transition={{ duration: 0.3 }}
              className="rounded-[5px] px-2.5 py-1 font-mono text-[10px] font-medium text-white"
            >
              {approved ? "Approved ✓" : "Approve"}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Outcome Card (smallest) ────────────────────────────────────────
function OutcomeCard({ stage }: { stage: Stage }) {
  const visible = stage === "observed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 14, scale: 0.97 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="relative rounded-[7px] border border-[var(--recovery-green)] border-opacity-30 bg-[var(--surface)] shadow-[0_1px_2px_rgba(17,17,15,0.03)]"
      style={{ minWidth: 220 }}
    >
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[var(--recovery-green)]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--recovery-green)]">Activity observed</span>
        </div>
        <p className="mt-1.5 text-[12px] text-[var(--ink-secondary)]">
          Course activity resumed · Lesson 5 started
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">Observed</span>
          <span className="text-[9px] text-[var(--ink-muted)]">·</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">after intervention</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Workflow step indicator (animated) ─────────────────────────────
function WorkflowStepIndicator({ stage }: { stage: Stage }) {
  const steps = [
    { label: "Candidate detected", active: stage === "detected" || stage === "evidence" || stage === "review" || stage === "approved" || stage === "observed" },
    { label: "Creator reviewed", active: stage === "review" || stage === "approved" || stage === "observed" },
    { label: "Approval recorded", active: stage === "approved" || stage === "observed" },
    { label: "Activity observed", active: stage === "observed" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="mt-2 flex items-center gap-1.5"
      aria-hidden="true"
    >
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1.5">
          <span
            className={`size-1 rounded-full transition-colors duration-300 ${
              step.active ? "bg-[var(--recovery-green)]" : "bg-[var(--hairline-strong)]"
            }`}
          />
          <span
            className={`font-mono text-[8px] tracking-[0.06em] transition-colors duration-300 ${
              step.active ? "text-[var(--ink-secondary)]" : "text-[var(--ink-muted)]"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-[8px] text-[var(--ink-muted)]">·</span>
          )}
        </div>
      ))}
    </motion.div>
  );
}

// ── Tiny helpers ───────────────────────────────────────────────────
function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[12px] text-[var(--ink-muted)]">{label}</span>
      <span className="font-mono text-[12px] font-medium text-[var(--ink-primary)]">{value}</span>
    </div>
  );
}

function EvidenceItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-[11px] text-[var(--ink-secondary)]">
      <span className="mt-[3px] text-[var(--ink-muted)]">•</span>
      {text}
    </li>
  );
}

// ── Stage progression hook ─────────────────────────────────────────
function useWorkflowStage() {
  const [stage, setStage] = useState<Stage>("idle");
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      // For reduced-motion: show the final "observed" state immediately
      setStage("observed");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let currentIndex = -1; // -1 = idle

    function advance() {
      currentIndex++;
      if (currentIndex === 0) {
        setStage("detected");
        timeout = setTimeout(advance, STAGE_DURATIONS.detected);
      } else if (currentIndex === 1) {
        setStage("evidence");
        timeout = setTimeout(advance, STAGE_DURATIONS.evidence);
      } else if (currentIndex === 2) {
        setStage("review");
        timeout = setTimeout(advance, STAGE_DURATIONS.review);
      } else if (currentIndex === 3) {
        setStage("approved");
        timeout = setTimeout(advance, STAGE_DURATIONS.approved);
      } else if (currentIndex === 4) {
        setStage("observed");
        // After observed, wait then reset
        timeout = setTimeout(advance, STAGE_DURATIONS.observed);
      } else {
        // Reset to idle, then replay after idle duration
        setStage("idle");
        currentIndex = -1;
        timeout = setTimeout(advance, STAGE_DURATIONS.idle);
      }
    }

    // Start the sequence after a brief initial delay
    timeout = setTimeout(advance, 800);

    return () => clearTimeout(timeout);
  }, [reduced]);

  return stage;
}

// ── Main Component ─────────────────────────────────────────────────
export function ProductStoryVisual() {
  const stage = useWorkflowStage();

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Closing Signal SVG path — behind cards */}
      <ClosingSignalPath
        activeStage={stage}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[85%] -translate-x-1/2 -translate-y-1/2 opacity-60"
      />

      {/* Card composition — layered with slight offsets */}
      <div className="relative z-10 flex flex-col items-center gap-2.5 px-4" style={{ maxWidth: 340 }}>
        {/* Candidate card — dominant */}
        <CandidateCard stage={stage} />

        {/* Connecting indicator between candidate and review */}
        <AnimatePresence>
          {(stage === "review" || stage === "approved" || stage === "observed") && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
              aria-hidden="true"
            >
              <div className="h-2 w-px bg-[var(--hairline-strong)]" />
              <div className="size-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--surface)]" />
              <div className="h-2 w-px bg-[var(--hairline-strong)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review card — slightly offset right */}
        <div className="ml-8 w-full max-w-[280px]">
          <ReviewCard stage={stage} />
        </div>

        {/* Connecting indicator between review and outcome */}
        <AnimatePresence>
          {stage === "observed" && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
              aria-hidden="true"
            >
              <div className="h-2 w-px bg-[var(--hairline-strong)]" />
              <div className="size-1.5 rounded-full border border-[var(--recovery-green)] bg-[var(--recovery-light)]" />
              <div className="h-2 w-px bg-[var(--recovery-green)]" style={{ opacity: 0.3 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outcome card — smallest, slightly offset left */}
        <div className="-mr-4 w-full max-w-[240px]">
          <OutcomeCard stage={stage} />
        </div>

        {/* Step indicator */}
        <WorkflowStepIndicator stage={stage} />
      </div>
    </div>
  );
}

// ── Mobile simplified card ─────────────────────────────────────────
export function MobileProductCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: easeOut }}
      className="mx-auto w-full max-w-[360px] rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_1px_3px_rgba(17,17,15,0.06),0_8px_24px_rgba(17,17,15,0.04)]"
    >
      <div className="flex items-start justify-between px-4 pt-3.5 pb-2">
        <div>
          <span className="text-[14px] font-medium text-[var(--ink-primary)]">Maya Thompson</span>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--ink-muted)]">
            8 days inactive · 38% complete
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-light)] px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[var(--warning)]">
          <span className="size-1.5 rounded-full bg-[var(--warning)]" />
          Stall
        </span>
      </div>
      <div className="border-t border-[var(--hairline-subtle)] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">Evidence available</span>
          <span className="rounded-[5px] border border-[var(--hairline)] px-3 py-1.5 font-mono text-[10px] font-medium text-[var(--ink-primary)]">
            Review simulated case
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Mobile outcome indicator ───────────────────────────────────────
export function MobileOutcomeIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.5, ease: easeOut }}
      className="mx-auto mt-3 flex items-center gap-2"
    >
      <span className="size-2 rounded-full bg-[var(--recovery-green)]" />
      <span className="font-mono text-[10px] text-[var(--ink-muted)]">
        Activity observed after intervention
      </span>
    </motion.div>
  );
}
