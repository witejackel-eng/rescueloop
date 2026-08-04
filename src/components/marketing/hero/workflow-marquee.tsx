"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/design-system/motion";

const STEPS = [
  { label: "Detect lost momentum", tag: "SIGNAL" },
  { label: "Review the evidence", tag: "REVIEW" },
  { label: "Approve respectful support", tag: "SUPPORT" },
  { label: "Student responds", tag: "RESPONSE" },
  { label: "Progress resumes", tag: "RETURN" },
  { label: "Attribute the outcome", tag: "EVIDENCE" },
  { label: "Improve the course", tag: "IMPROVEMENT" },
];

// WorkflowMarquee — infinite horizontal rail of truthful product concepts.
// Uses CSS transform animation (GPU-friendly). Pauses on hover.
// Disabled continuous movement for reduced-motion users (shows static list).

export function WorkflowMarquee() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-[var(--hairline)] bg-[var(--canvas-elevated)] px-6 py-4">
        {STEPS.map((step) => (
          <div key={step.tag} className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--ink-muted)]">
              {step.tag}
            </span>
            <span className="text-[14px] text-[var(--ink-secondary)]">{step.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden border-y border-[var(--hairline)] bg-[var(--canvas-elevated)]"
      aria-label="RescueLoop workflow"
    >
      <div
        className="flex w-max items-center gap-12 py-4"
        style={{
          animation: `marquee-scroll ${motionTokens.marquee}ms linear infinite`,
        }}
      >
        {[...STEPS, ...STEPS, ...STEPS].map((step, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 px-2">
            <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--ink-muted)]">
              {step.tag}
            </span>
            <span className="text-[14px] text-[var(--ink-secondary)]">{step.label}</span>
            <span className="text-[var(--ink-muted)]">·</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-33.333%);
          }
        }
        .group:hover > div {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
