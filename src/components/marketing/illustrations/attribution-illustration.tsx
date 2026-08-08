"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

// AttributionIllustration — three clearly separated evidence tiers:
// Confirmed / Strongly associated / Estimated.
// An outcome event enters, evidence is checked, event moves into the
// correct tier. Only confirmed contributes to the primary ROI.

export function AttributionIllustration({ active = true }: { active?: boolean }) {
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
      {/* Incoming event */}
      <g style={{ opacity: inView && active ? 1 : 0, transition: "opacity 0.5s ease-out 0.2s" }}>
        <rect x="20" y="88" width="60" height="24" rx="4" fill="var(--canvas-elevated)" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        <text x="28" y="100" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill="var(--ink-muted)">
          OUTCOME
        </text>
        <text x="28" y="108" fontFamily="var(--font-sans)" fontSize="8" fill="var(--ink-primary)">
          Student returned
        </text>
      </g>

      {/* Evidence check */}
      {inView && active && (
        <g>
          <line x1="80" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="2 2">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" begin="0.8s" />
          </line>
          <circle cx="100" cy="100" r="8" fill="none" stroke="var(--warning)" strokeWidth="1.5">
            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="1s" />
          </circle>
          <text x="96" y="103" fontFamily="var(--font-sans)" fontSize="9" fill="var(--warning)" fontWeight="600">?</text>
        </g>
      )}

      {/* Three tier columns */}
      {[
        { x: 130, label: "CONFIRMED", value: "$0", color: "var(--recovery-green)", bg: "var(--recovery-light)", delay: 1.4, active: true },
        { x: 200, label: "ASSOCIATED", value: "$79", color: "var(--info)", bg: "rgba(61,107,140,0.12)", delay: 1.6 },
        { x: 270, label: "ESTIMATED", value: "$711", color: "var(--warning)", bg: "var(--warning-light)", delay: 1.8 },
      ].map((tier, i) => (
        <g
          key={i}
          style={{
            opacity: inView && active ? 1 : 0,
            transform: inView && active ? "translateY(0)" : "translateY(10px)",
            transition: `opacity 0.5s ease-out ${tier.delay}s, transform 0.5s ease-out ${tier.delay}s`,
          }}
        >
          <rect
            x={tier.x}
            y="60"
            width="48"
            height="80"
            rx="4"
            fill={tier.bg}
            stroke={tier.active ? tier.color : "transparent"}
            strokeWidth="1"
            opacity="0.7"
          />
          <text
            x={tier.x + 24}
            y="76"
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono)"
            fontSize="6.5"
            fill={tier.color}
            letterSpacing="0.5"
          >
            {tier.label}
          </text>
          <line x1={tier.x + 6} y1="82" x2={tier.x + 42} y2="82" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          <text
            x={tier.x + 24}
            y="108"
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono)"
            fontSize="14"
            fill="var(--ink-primary)"
            fontWeight="600"
          >
            {tier.value}
          </text>
          <text
            x={tier.x + 24}
            y="124"
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize="7"
            fill="var(--ink-muted)"
          >
            {tier.active ? "→ ROI figure" : "separate"}
          </text>
        </g>
      ))}

      {/* Line from evidence check to confirmed tier */}
      {inView && active && (
        <path
          d="M 108 100 Q 120 100, 130 100"
          stroke="var(--recovery-green)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="3 2"
          opacity="0.6"
        >
          <animate attributeName="stroke-dashoffset" values="0;-10" dur="1.2s" repeatCount="indefinite" begin="1.5s" />
        </path>
      )}

      {/* Never combined note */}
      <text x="160" y="180" textAnchor="middle" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill="var(--ink-muted)" letterSpacing="0.5">
        NEVER COMBINED INTO ONE TOTAL
      </text>

      {/* ROI indicator on confirmed */}
      {inView && active && (
        <g style={{ opacity: 1, transition: "opacity 0.5s ease-out 2s" }}>
          <circle cx="154" cy="46" r="3" fill="var(--recovery-green)">
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" begin="2s" />
          </circle>
          <text x="162" y="49" fontFamily="var(--font-jetbrains-mono)" fontSize="7" fill="var(--recovery-green)">
            Illustrative
          </text>
        </g>
      )}
    </svg>
  );
}
