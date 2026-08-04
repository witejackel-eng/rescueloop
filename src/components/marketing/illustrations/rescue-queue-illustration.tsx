"use client";

import { useRef, useState } from "react";
import { useInView } from "framer-motion";

// RescueQueueIllustration — student signals entering a controlled queue,
// one becoming selected, evidence appearing in an inspector panel,
// approve/schedule/dismiss paths. Manual approval remains visible.

export function RescueQueueIllustration({ active = true }: { active?: boolean }) {
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
      {/* Queue panel */}
      <rect x="16" y="20" width="140" height="160" rx="4" fill="var(--canvas-elevated)" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <text x="24" y="36" fontFamily="var(--font-jetbrains-mono)" fontSize="8" fill="var(--ink-muted)" letterSpacing="1">
        RESCUE QUEUE
      </text>
      <line x1="16" y1="44" x2="156" y2="44" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />

      {/* Student rows entering */}
      {[
        { y: 56, name: "Maya C.", delay: 0 },
        { y: 78, name: "James O.", delay: 0.4 },
        { y: 100, name: "Sofia R.", delay: 0.8, selected: true },
        { y: 122, name: "David K.", delay: 1.2 },
      ].map((row, i) => (
        <g
          key={i}
          style={{
            opacity: inView && active ? 1 : 0,
            transform: inView && active ? "translateX(0)" : "translateX(-12px)",
            transition: `opacity 0.5s ease-out ${row.delay}s, transform 0.5s ease-out ${row.delay}s`,
          }}
        >
          <rect
            x="24"
            y={row.y - 8}
            width="124"
            height="16"
            rx="2"
            fill={row.selected ? "var(--surface)" : "transparent"}
            stroke={row.selected ? "var(--recovery-green)" : "transparent"}
            strokeWidth="1"
          />
          {row.selected && (
            <rect x="24" y={row.y - 8} width="2" height="16" fill="var(--recovery-green)" />
          )}
          <circle cx="32" cy={row.y} r="2.5" fill="currentColor" opacity="0.4" />
          <text x="40" y={row.y + 3} fontFamily="var(--font-sans)" fontSize="9" fill={row.selected ? "var(--ink-primary)" : "var(--ink-secondary)"}>
            {row.name}
          </text>
          <rect x="110" y={row.y - 3} width="30" height="6" rx="1" fill="currentColor" opacity="0.1" />
          <rect x="110" y={row.y - 3} width={row.selected ? "18" : "12"} height="6" rx="1" fill={row.selected ? "var(--recovery-green)" : "currentColor"} opacity="0.4" />
        </g>
      ))}

      {/* Manual approval badge */}
      <g style={{ opacity: inView && active ? 1 : 0, transition: "opacity 0.5s ease-out 1.6s" }}>
        <rect x="24" y="148" width="90" height="14" rx="7" fill="var(--warning-light)" opacity="0.6" />
        <text x="32" y="158" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill="var(--warning)" letterSpacing="0.5">
          MANUAL APPROVAL
        </text>
      </g>

      {/* Arrow to inspector */}
      {inView && active && (
        <line x1="156" y1="100" x2="172" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" begin="1.6s" />
        </line>
      )}

      {/* Inspector panel */}
      <rect x="172" y="20" width="132" height="160" rx="4" fill="var(--surface)" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      <text x="180" y="36" fontFamily="var(--font-jetbrains-mono)" fontSize="8" fill="var(--ink-muted)" letterSpacing="1">
        INSPECTOR
      </text>
      <line x1="172" y1="44" x2="304" y2="44" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />

      {/* Inspector content reveals in sequence */}
      {[
        { y: 58, label: "Student", value: "Sofia R.", delay: 1.8 },
        { y: 78, label: "Trigger", value: "Inactive 10 days", delay: 2.0 },
        { y: 98, label: "Progress", value: "38%", delay: 2.2 },
        { y: 118, label: "Risk", value: "Mid-course stall", delay: 2.4 },
      ].map((row, i) => (
        <g
          key={i}
          style={{
            opacity: inView && active ? 1 : 0,
            transform: inView && active ? "translateX(0)" : "translateX(8px)",
            transition: `opacity 0.4s ease-out ${row.delay}s, transform 0.4s ease-out ${row.delay}s`,
          }}
        >
          <text x="180" y={row.y} fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill="var(--ink-muted)" letterSpacing="0.5">
            {row.label.toUpperCase()}
          </text>
          <text x="180" y={row.y + 10} fontFamily="var(--font-sans)" fontSize="9" fill="var(--ink-primary)">
            {row.value}
          </text>
        </g>
      ))}

      {/* Action buttons */}
      <g style={{ opacity: inView && active ? 1 : 0, transition: "opacity 0.5s ease-out 2.6s" }}>
        <rect x="180" y="148" width="44" height="16" rx="3" fill="var(--ink-primary)" />
        <text x="190" y="159" fontFamily="var(--font-sans)" fontSize="8" fill="white" fontWeight="500">
          Approve
        </text>
        <rect x="228" y="148" width="36" height="16" rx="3" fill="transparent" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <text x="234" y="159" fontFamily="var(--font-sans)" fontSize="8" fill="var(--ink-secondary)">
          Schedule
        </text>
        <rect x="268" y="148" width="32" height="16" rx="3" fill="transparent" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <text x="274" y="159" fontFamily="var(--font-sans)" fontSize="8" fill="var(--ink-muted)">
          Dismiss
        </text>
      </g>
    </svg>
  );
}
