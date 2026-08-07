"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

// SignalDetectionIllustration — A student progress timeline with lesson
// activity points, a fading momentum line, a detection pulse identifying
// a stall, and an evidence card appearing after detection.
// Loops slowly. Uses inline SVG + CSS keyframes.

export function SignalDetectionIllustration({ active = true }: { active?: boolean }) {
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
      {/* Lesson activity points along a timeline */}
      <line
        x1="20"
        y1="100"
        x2="300"
        y2="100"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />

      {/* Momentum line — fades toward the right */}
      <path
        d="M 20 100 Q 60 70, 100 80 T 180 90 Q 210 95, 240 110 T 300 130"
        stroke="var(--recovery-green)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        strokeDasharray="0"
        style={{
          strokeDasharray: 400,
          strokeDashoffset: inView && active ? 0 : 400,
          transition: "stroke-dashoffset 2s ease-out",
        }}
      />

      {/* Lesson dots — appear sequentially */}
      {[40, 80, 120, 160, 200, 240].map((x, i) => (
        <g key={x}>
          <circle
            cx={x}
            cy={100}
            r="4"
            fill="currentColor"
            opacity="0.2"
            style={{
              opacity: inView && active ? 0.5 : 0,
              transition: `opacity 0.4s ease-out ${0.3 + i * 0.25}s`,
            }}
          />
          {i < 4 && (
            <circle
              cx={x}
              cy={100}
              r="2"
              fill="var(--recovery-green)"
              style={{
                opacity: inView && active ? 1 : 0,
                transition: `opacity 0.3s ease-out ${0.4 + i * 0.25}s`,
              }}
            />
          )}
        </g>
      ))}

      {/* The stall — last two dots are amber */}
      <circle cx="240" cy="100" r="3" fill="var(--warning)" opacity="0.8" />

      {/* Detection pulse — expands once, loops slowly */}
      {inView && active && (
        <circle cx="240" cy="100" r="4" fill="none" stroke="var(--warning)" strokeWidth="1.5">
          <animate
            attributeName="r"
            values="4;22;4"
            dur="3.5s"
            begin="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0;0.8"
            dur="3.5s"
            begin="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Evidence card appearing after detection */}
      <g
        style={{
          opacity: inView && active ? 1 : 0,
          transform: inView && active ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.6s ease-out 2s, transform 0.6s ease-out 2s",
        }}
      >
        <rect
          x="200"
          y="135"
          width="110"
          height="48"
          rx="4"
          fill="var(--surface)"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.9"
        />
        <text x="208" y="150" fontFamily="var(--font-jetbrains-mono)" fontSize="8" fill="var(--ink-muted)">
          EVIDENCE
        </text>
        <line x1="208" y1="155" x2="302" y2="155" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
        <text x="208" y="167" fontFamily="var(--font-sans)" fontSize="9" fill="var(--ink-primary)">
          8 days inactive
        </text>
        <text x="208" y="177" fontFamily="var(--font-sans)" fontSize="9" fill="var(--ink-secondary)">
          Stalled at Lesson 12
        </text>
      </g>

      {/* Labels */}
      <text x="20" y="40" fontFamily="var(--font-jetbrains-mono)" fontSize="9" fill="var(--ink-muted)" letterSpacing="1">
        PROGRESS TIMELINE
      </text>
      <text x="200" y="125" fontFamily="var(--font-jetbrains-mono)" fontSize="8" fill="var(--warning)">
        DETECTED
      </text>
    </svg>
  );
}
