"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, User } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { ScrollReveal } from "@/components/marketing/shared/scroll-reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";

export function FinalCta() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-[var(--hairline)] py-20 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <ScrollReveal>
          <div
            className="relative border border-[var(--hairline)] bg-[var(--surface)]"
            onMouseMove={handleMouseMove}
          >
            {/* Cursor-responsive spotlight */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08] transition-opacity duration-300"
              style={{
                background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(20,125,104,0.4), transparent 50%)`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-12 px-8 py-16 lg:flex-row lg:justify-between lg:px-16 lg:py-24">
              {/* Content */}
              <div className="flex-1">
                <h2 className="mb-6 font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[0.98] tracking-[-0.02em] text-[var(--ink-primary)]">
                  Help the right{" "}
                  <span className="italic text-[var(--ink-secondary)]">students continue.</span>
                </h2>
                <p className="mb-10 max-w-[480px] text-[16px] leading-relaxed text-[var(--ink-secondary)] lg:text-[17px]">
                  Explore the RescueLoop demonstration and see how one
                  responsible recovery workflow moves from evidence to action
                  to outcome.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/overview"
                    data-testid="final-cta-explore-demo"
                    className="press group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--ink-primary)] px-6 py-3.5 text-[14px] font-medium text-white"
                  >
                    Explore demo
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/student-rescue"
                    className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--hairline)] px-6 py-3.5 text-[14px] font-medium text-[var(--ink-primary)]"
                  >
                    <User className="size-4 text-[var(--ink-muted)]" />
                    View student experience
                  </Link>
                </div>
                <p className="mt-6 font-mono text-[11px] text-[var(--ink-muted)]">
                  Interactive demo · simulated workspace
                </p>
              </div>

              {/* Recovery ring illustration */}
              <div className="hidden h-[320px] w-[320px] shrink-0 items-center justify-center lg:flex">
                <RecoveryRing active={inView && !reduced} />
              </div>
            </div>

            {/* Decorative corners */}
            <div className="absolute right-0 top-0 h-24 w-24 border-b border-l border-[var(--hairline)]" />
            <div className="absolute bottom-0 left-0 h-24 w-24 border-r border-t border-[var(--hairline)]" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function RecoveryRing({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full text-[var(--ink-primary)]" fill="none" aria-hidden="true">
      {/* Outer ring */}
      <circle cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="1" opacity="0.08" />

      {/* Dotted recovery loop */}
      <circle
        cx="160"
        cy="160"
        r="120"
        stroke="var(--recovery-green)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="4 8"
        opacity="0.3"
        style={{
          transformOrigin: "center",
          animation: active ? "ring-rotate 30s linear infinite" : "none",
        }}
      />

      {/* Mid ring */}
      <circle cx="160" cy="160" r="90" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />

      {/* Orbiting evidence nodes */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 160 + Math.cos(rad) * 120;
        const y = 160 + Math.sin(rad) * 120;
        const isGreen = i >= 3;
        return (
          <g key={angle}>
            <line
              x1="160"
              y1="160"
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.08"
            />
            <circle
              cx={x}
              cy={y}
              r="5"
              fill={isGreen ? "var(--recovery-green)" : "currentColor"}
              opacity={isGreen ? 0.8 : 0.2}
              style={{
                transformOrigin: "center",
                animation: active ? `ring-rotate 30s linear infinite reverse` : "none",
                transformBox: "fill-box",
              }}
            />
            {active && (
              <circle cx={x} cy={y} r="5" fill="none" stroke={isGreen ? "var(--recovery-green)" : "currentColor"} strokeWidth="1" opacity="0.3">
                <animate
                  attributeName="r"
                  values="5;14;5"
                  dur="3s"
                  begin={`${i * 0.6}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.4;0;0.4"
                  dur="3s"
                  begin={`${i * 0.6}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}

      {/* Center */}
      <circle cx="160" cy="160" r="6" fill="var(--recovery-green)" opacity="0.15" />
      <circle cx="160" cy="160" r="3" fill="var(--recovery-green)" />

      {/* Flowing arcs */}
      {active && (
        <>
          <path
            d="M 160 40 A 120 120 0 0 1 264 100"
            stroke="var(--recovery-green)"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            strokeDasharray="3 6"
          >
            <animate attributeName="stroke-dashoffset" values="0;-18" dur="2s" repeatCount="indefinite" />
          </path>
          <path
            d="M 264 220 A 120 120 0 0 1 160 280"
            stroke="var(--recovery-green)"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
            strokeDasharray="3 6"
          >
            <animate attributeName="stroke-dashoffset" values="0;-18" dur="2.5s" repeatCount="indefinite" />
          </path>
        </>
      )}

      <style jsx>{`
        @keyframes ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
