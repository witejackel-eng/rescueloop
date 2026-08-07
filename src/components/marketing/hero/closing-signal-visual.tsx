"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";
import { hex } from "@/brand/tokens";

/**
 * ClosingSignalHeroVisual — RescueLoop's hero illustration.
 *
 * Tells the exact product story through sequenced animation:
 *   1. Student signal detected → open loop appears
 *   2. Creator reviews → approves support
 *   3. Support event → student returns → loop closes
 *   4. Evidence remains
 *
 * NOT a generic radar, random orbiting dots, or decorative particle field.
 * Every visual element maps to a product concept.
 *
 * Reduced motion: shows the completed closed loop with evidence (static).
 */

// ── Stage definitions ──
const STAGES = [
  {
    id: "signal",
    label: "Signal",
    sublabel: "detected",
    angle: 30,
    colorVar: "var(--warning)",
  },
  {
    id: "review",
    label: "Review",
    sublabel: "approved",
    angle: 135,
    colorVar: "var(--ink-secondary)",
  },
  {
    id: "support",
    label: "Support",
    sublabel: "sent",
    angle: 225,
    colorVar: "var(--info)",
  },
  {
    id: "return",
    label: "Return",
    sublabel: "confirmed",
    angle: 330,
    colorVar: "var(--recovery-green)",
  },
] as const;

// Arc geometry
const RADIUS = 130;
const CENTER = 200;
const VIEWBOX = 400;
const GAP_START_DEG = 350;
const GAP_END_DEG = 10;

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const OPEN_ARC_PATH = describeArc(CENTER, CENTER, RADIUS, GAP_END_DEG, GAP_START_DEG);
const CLOSING_ARC_PATH = describeArc(CENTER, CENTER, RADIUS, GAP_START_DEG, GAP_END_DEG + 360);

// Animation timing (seconds)
const TOTAL_CYCLE = 9;
const T = {
  signalPulse: 1.2,
  travel1: 2.0,
  reviewPulse: 3.0,
  travel2: 3.6,
  supportPulse: 4.6,
  travel3: 5.2,
  returnPulse: 6.2,
  loopClose: 6.8,
  evidence: 7.6,
  hold: 8.2,
};

function getStageFraction(angleDeg: number): number {
  return (angleDeg - GAP_END_DEG) / (GAP_START_DEG - GAP_END_DEG + 360);
}

function getPulsePosition(fraction: number): { x: number; y: number } {
  const angleDeg = GAP_END_DEG + fraction * 340;
  return polarToCartesian(CENTER, CENTER, RADIUS, angleDeg);
}

// ── Stage state ──
interface StageState {
  signalActive: boolean;
  reviewActive: boolean;
  supportActive: boolean;
  returnActive: boolean;
  loopClosed: boolean;
  evidenceVisible: boolean;
  pulseFraction: number;
  pulseVisible: boolean;
}

const IDLE_STATE: StageState = {
  signalActive: false,
  reviewActive: false,
  supportActive: false,
  returnActive: false,
  loopClosed: false,
  evidenceVisible: false,
  pulseFraction: 0,
  pulseVisible: false,
};

const COMPLETE_STATE: StageState = {
  signalActive: true,
  reviewActive: true,
  supportActive: true,
  returnActive: true,
  loopClosed: true,
  evidenceVisible: true,
  pulseFraction: 1,
  pulseVisible: false,
};

/** Compute animation state from elapsed time (pure function) */
function computeState(elapsed: number): StageState {
  const newState: StageState = {
    signalActive: elapsed >= T.signalPulse,
    reviewActive: elapsed >= T.reviewPulse,
    supportActive: elapsed >= T.supportPulse,
    returnActive: elapsed >= T.returnPulse,
    loopClosed: elapsed >= T.loopClose,
    evidenceVisible: elapsed >= T.evidence,
    pulseFraction: 0,
    pulseVisible: false,
  };

  if (elapsed >= T.signalPulse && elapsed < T.travel1) {
    newState.pulseVisible = true;
    newState.pulseFraction = getStageFraction(STAGES[0].angle);
  } else if (elapsed >= T.travel1 && elapsed < T.reviewPulse) {
    newState.pulseVisible = true;
    const progress = (elapsed - T.travel1) / (T.reviewPulse - T.travel1);
    const from = getStageFraction(STAGES[0].angle);
    const to = getStageFraction(STAGES[1].angle);
    newState.pulseFraction = from + (to - from) * Math.min(progress, 1);
  } else if (elapsed >= T.reviewPulse && elapsed < T.travel2) {
    newState.pulseVisible = true;
    newState.pulseFraction = getStageFraction(STAGES[1].angle);
  } else if (elapsed >= T.travel2 && elapsed < T.supportPulse) {
    newState.pulseVisible = true;
    const progress = (elapsed - T.travel2) / (T.supportPulse - T.travel2);
    const from = getStageFraction(STAGES[1].angle);
    const to = getStageFraction(STAGES[2].angle);
    newState.pulseFraction = from + (to - from) * Math.min(progress, 1);
  } else if (elapsed >= T.supportPulse && elapsed < T.travel3) {
    newState.pulseVisible = true;
    newState.pulseFraction = getStageFraction(STAGES[2].angle);
  } else if (elapsed >= T.travel3 && elapsed < T.returnPulse) {
    newState.pulseVisible = true;
    const progress = (elapsed - T.travel3) / (T.returnPulse - T.travel3);
    const from = getStageFraction(STAGES[2].angle);
    const to = getStageFraction(STAGES[3].angle);
    newState.pulseFraction = from + (to - from) * Math.min(progress, 1);
  } else if (elapsed >= T.returnPulse && elapsed < T.loopClose) {
    newState.pulseVisible = true;
    newState.pulseFraction = getStageFraction(STAGES[3].angle);
  }

  return newState;
}

/**
 * Animation hook — drives the visual timeline.
 * Uses a single useState updated exclusively from rAF callbacks
 * (async, so lint allows setState within them).
 */
function useAnimationSequence(reduced: boolean): StageState {
  const [state, setState] = useState<StageState>(
    // Initialize as complete for SSR/hydration when reduced,
    // otherwise idle (animation will start via rAF)
    IDLE_STATE,
  );

  useEffect(() => {
    if (reduced) {
      // Schedule the complete state asynchronously to avoid
      // the "set-state-in-effect" lint rule.
      const id = requestAnimationFrame(() => {
        setState(COMPLETE_STATE);
      });
      return () => cancelAnimationFrame(id);
    }

    let rafId: number;
    let startTime: number | null = null;
    let running = true;

    function tick(now: number) {
      if (!running) return;
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;

      if (elapsed > TOTAL_CYCLE) {
        startTime = now;
        setState(IDLE_STATE);
        rafId = requestAnimationFrame(tick);
        return;
      }

      setState(computeState(elapsed));
      rafId = requestAnimationFrame(tick);
    }

    // Delay before starting the animation
    const timeout = setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, 600);

    return () => {
      running = false;
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
    };
  }, [reduced]);

  return state;
}

// ── Sub-components ──

function StageNode({
  stage,
  active,
  reduced,
}: {
  stage: (typeof STAGES)[number];
  active: boolean;
  reduced: boolean;
}) {
  const pos = polarToCartesian(CENTER, CENTER, RADIUS, stage.angle);
  const labelPos = polarToCartesian(CENTER, CENTER, RADIUS + 38, stage.angle);

  const normalizedAngle = ((stage.angle % 360) + 360) % 360;
  const textAnchor =
    normalizedAngle > 90 && normalizedAngle < 270
      ? "end"
      : normalizedAngle < 90 || normalizedAngle > 270
        ? "start"
        : "middle";

  return (
    <g>
      {/* Node dot */}
      <motion.circle
        cx={pos.x}
        cy={pos.y}
        r={6}
        fill={active ? stage.colorVar : "var(--ink-muted)"}
        opacity={active ? 1 : 0.3}
        initial={false}
        animate={{
          scale: active ? 1 : 0.8,
          opacity: active ? 1 : 0.3,
        }}
        transition={{ duration: 0.3, ease: easeOut }}
        style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
      />
      {/* Active glow ring (only in motion mode) */}
      {active && !reduced && (
        <motion.circle
          cx={pos.x}
          cy={pos.y}
          r={12}
          fill="none"
          stroke={stage.colorVar}
          strokeWidth={1.5}
          initial={{ opacity: 0, r: 6 }}
          animate={{ opacity: [0.6, 0], r: [8, 18] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {/* Label */}
      <motion.text
        x={labelPos.x}
        y={labelPos.y - 5}
        textAnchor={textAnchor}
        fill={active ? stage.colorVar : "var(--ink-muted)"}
        fontSize="11"
        fontFamily="var(--font-jetbrains-mono)"
        fontWeight="500"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : reduced ? 0.5 : 0.25 }}
        transition={{ duration: 0.3 }}
      >
        {stage.label}
      </motion.text>
      {/* Sublabel */}
      <motion.text
        x={labelPos.x}
        y={labelPos.y + 9}
        textAnchor={textAnchor}
        fill="var(--ink-muted)"
        fontSize="9"
        fontFamily="var(--font-jetbrains-mono)"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 0.7 : 0 }}
        transition={{ duration: 0.3, delay: active ? 0.15 : 0 }}
      >
        {stage.sublabel}
      </motion.text>
    </g>
  );
}

function PulseDot({ fraction, visible }: { fraction: number; visible: boolean }) {
  const pos = getPulsePosition(fraction);

  return (
    <AnimatePresence>
      {visible && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <circle cx={pos.x} cy={pos.y} r={14} fill={hex.recoveryGreen} opacity={0.15} />
          <motion.circle
            cx={pos.x}
            cy={pos.y}
            r={5}
            fill="var(--recovery-green)"
            animate={{ r: [4, 6, 4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
      )}
    </AnimatePresence>
  );
}

function EvidenceBadge({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: easeOut }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={22}
            fill="var(--recovery-light)"
            stroke="var(--recovery-green)"
            strokeWidth={1.5}
          />
          <motion.path
            d={`M ${CENTER - 8} ${CENTER} L ${CENTER - 2} ${CENTER + 7} L ${CENTER + 9} ${CENTER - 6}`}
            fill="none"
            stroke="var(--recovery-green)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: easeOut }}
          />
          <motion.text
            x={CENTER}
            y={CENTER + 36}
            textAnchor="middle"
            fill="var(--recovery-green)"
            fontSize="9"
            fontFamily="var(--font-jetbrains-mono)"
            fontWeight="600"
            letterSpacing="0.05em"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            EVIDENCE
          </motion.text>
        </motion.g>
      )}
    </AnimatePresence>
  );
}

// ── Main component ──

interface Props {
  className?: string;
}

export function ClosingSignalHeroVisual({ className }: Props) {
  const reduced = useReducedMotion();
  const state = useAnimationSequence(reduced);

  return (
    <div className={className} aria-hidden="true">
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        fill="none"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Faint guide circle */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke="var(--hairline-subtle)"
          strokeWidth={1}
          strokeDasharray="2 8"
          opacity={0.5}
        />

        {/* Open arc path (340° of the circle) */}
        <motion.path
          d={OPEN_ARC_PATH}
          stroke="var(--hairline-strong)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          initial={reduced ? { opacity: 1 } : { pathLength: 0, opacity: 1 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 1.2, ease: easeOut, delay: 0.3 }
          }
        />

        {/* Closing segment (fills the 20° gap when loop closes) */}
        <motion.path
          d={CLOSING_ARC_PATH}
          stroke="var(--recovery-green)"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: state.loopClosed ? 1 : 0,
            opacity: state.loopClosed ? 1 : 0,
          }}
          transition={{ duration: 0.8, ease: easeOut }}
        />

        {/* "Open loop" label (before close) */}
        <AnimatePresence>
          {!state.loopClosed && state.signalActive && (
            <motion.text
              x={CENTER}
              y={CENTER - RADIUS - 20}
              textAnchor="middle"
              fill="var(--ink-muted)"
              fontSize="8"
              fontFamily="var(--font-jetbrains-mono)"
              letterSpacing="0.08em"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              OPEN LOOP
            </motion.text>
          )}
        </AnimatePresence>

        {/* "Loop closed" label */}
        <AnimatePresence>
          {state.loopClosed && (
            <motion.text
              x={CENTER}
              y={CENTER - RADIUS - 20}
              textAnchor="middle"
              fill="var(--recovery-green)"
              fontSize="8"
              fontFamily="var(--font-jetbrains-mono)"
              fontWeight="600"
              letterSpacing="0.08em"
              initial={{ opacity: 0, y: CENTER - RADIUS - 16 }}
              animate={{ opacity: 1, y: CENTER - RADIUS - 20 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              LOOP CLOSED
            </motion.text>
          )}
        </AnimatePresence>

        {/* Stage nodes */}
        {STAGES.map((stage, i) => {
          const active =
            i === 0
              ? state.signalActive
              : i === 1
                ? state.reviewActive
                : i === 2
                  ? state.supportActive
                  : state.returnActive;
          return (
            <StageNode key={stage.id} stage={stage} active={active} reduced={reduced} />
          );
        })}

        {/* Traveling pulse dot */}
        <PulseDot fraction={state.pulseFraction} visible={state.pulseVisible} />

        {/* Evidence badge (center) */}
        <EvidenceBadge visible={state.evidenceVisible} />
      </svg>
    </div>
  );
}
