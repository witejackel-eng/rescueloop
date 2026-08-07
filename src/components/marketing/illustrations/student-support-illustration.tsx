"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

// StudentSupportIllustration — a mobile student card with calm options:
// Continue course / I'm stuck / Remind me later / Stop reminders.
// A support message appears, one option highlights, a branch connects
// to the next step, the continuation path becomes active.

export function StudentSupportIllustration({ active = true }: { active?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: false, margin: "-60px" });

  return (
    <svg
      ref={ref}
      viewBox="0 0 320 200"
      className="h-full w-full text-[var(--ink-primary)]"
      fill="none"
      aria-hidden="true"
    >
      {/* Phone frame */}
      <rect x="110" y="16" width="100" height="168" rx="12" fill="var(--surface)" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <rect x="110" y="16" width="100" height="168" rx="12" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />

      {/* Notch */}
      <rect x="148" y="22" width="24" height="4" rx="2" fill="currentColor" opacity="0.15" />

      {/* Calm support message */}
      <g style={{ opacity: inView && active ? 1 : 0, transition: "opacity 0.6s ease-out 0.3s" }}>
        <rect x="122" y="40" width="76" height="32" rx="6" fill="var(--canvas-elevated)" />
        <text x="128" y="52" fontFamily="var(--font-sans)" fontSize="7" fill="var(--ink-muted)">
          Hi Sofia —
        </text>
        <text x="128" y="62" fontFamily="var(--font-sans)" fontSize="7" fill="var(--ink-secondary)">
          Want a quick checklist
        </text>
        <text x="128" y="70" fontFamily="var(--font-sans)" fontSize="7" fill="var(--ink-secondary)">
          to continue?
        </text>
      </g>

      {/* Options */}
      {[
        { y: 84, label: "Continue course", delay: 0.8, highlight: true },
        { y: 104, label: "I'm stuck", delay: 1.0 },
        { y: 124, label: "Remind me later", delay: 1.2 },
        { y: 144, label: "Stop reminders", delay: 1.4 },
      ].map((opt, i) => (
        <g
          key={i}
          style={{
            opacity: inView && active ? 1 : 0,
            transform: inView && active ? "translateY(0)" : "translateY(6px)",
            transition: `opacity 0.4s ease-out ${opt.delay}s, transform 0.4s ease-out ${opt.delay}s`,
          }}
        >
          <rect
            x="122"
            y={opt.y - 8}
            width="76"
            height="14"
            rx="4"
            fill={opt.highlight ? "var(--recovery-green)" : "transparent"}
            stroke={opt.highlight ? "transparent" : "currentColor"}
            strokeWidth="0.5"
            opacity={opt.highlight ? 1 : 0.2}
          />
          <text
            x="128"
            y={opt.y + 1}
            fontFamily="var(--font-sans)"
            fontSize="8"
            fill={opt.highlight ? "white" : "var(--ink-secondary)"}
            fontWeight={opt.highlight ? "500" : "400"}
          >
            {opt.label}
          </text>
        </g>
      ))}

      {/* Branch line from Continue to outcome */}
      {inView && active && (
        <path
          d="M 198 84 Q 240 84, 248 100 Q 256 116, 248 132"
          stroke="var(--recovery-green)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="3 3"
          opacity="0.6"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-12"
            dur="1.5s"
            repeatCount="indefinite"
            begin="2s"
          />
        </path>
      )}

      {/* Outcome — continuation path active */}
      <g style={{ opacity: inView && active ? 1 : 0, transition: "opacity 0.5s ease-out 2.2s" }}>
        <rect x="248" y="128" width="56" height="32" rx="6" fill="var(--recovery-light)" />
        <circle cx="260" cy="142" r="3" fill="var(--recovery-green)">
          <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" begin="2.5s" />
        </circle>
        <text x="268" y="145" fontFamily="var(--font-sans)" fontSize="8" fill="var(--recovery-green)" fontWeight="500">
          Resumed
        </text>
        <text x="254" y="156" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill="var(--ink-secondary)">
          Lesson 12 ✓
        </text>
      </g>

      {/* Left-side label */}
      <text x="20" y="100" fontFamily="var(--font-jetbrains-mono)" fontSize="9" fill="var(--ink-muted)" letterSpacing="1">
        STUDENT
      </text>
      <text x="20" y="112" fontFamily="var(--font-jetbrains-mono)" fontSize="9" fill="var(--ink-muted)" letterSpacing="1">
        EXPERIENCE
      </text>

      {/* Soft connecting dots */}
      <line x1="50" y1="106" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeDasharray="2 3" />
    </svg>
  );
}
