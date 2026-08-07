// RescueLoop motion tokens — consistent timings across the entire app.
// Adapted from the Optimus reference discipline with RescueLoop-specific values.

export const motionTokens = {
  fast: 160,
  standard: 240,
  reveal: 600,
  hero: 900,
  stagger: 45,
  wordCycle: 2800, // ~2.8s between kinetic word changes
  processStep: 5500, // 5.5s auto-advance for process section
  marquee: 32000, // ~32s for one marquee loop
} as const;

export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;
export const easeReveal = [0.16, 1, 0.3, 1] as const;

// Spring for layout animations (nav indicator, segmented controls)
export const spring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
};

// Softer spring for panels and sheets
export const springPanel = {
  type: "spring" as const,
  stiffness: 300,
  damping: 32,
};

// Press response
export const pressScale = {
  whileTap: { scale: 0.98 },
  transition: { duration: motionTokens.fast / 1000, ease: easeOut },
};

// Character reveal — blur resolves, chars rise from below
export const charReveal = {
  hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.035,
      duration: 0.4,
      ease: easeOut,
    },
  }),
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(6px)",
    transition: { duration: 0.2, ease: easeOut },
  },
};

// Scroll reveal variants
export const scrollReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTokens.reveal / 1000, ease: easeReveal },
  },
};

export const scrollRevealLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: motionTokens.reveal / 1000, ease: easeReveal },
  },
};

// Stagger container
export const staggerContainer = (stagger = 0.045, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

// ── Backward-compatible aliases (existing components use these names) ──
export const EASE = easeOut;
export const EASE_OUT = easeOut;
export const EASE_IN_OUT = easeInOut;

export const micro = { duration: motionTokens.fast / 1000, ease: easeOut } as const;
export const standard = { duration: motionTokens.standard / 1000, ease: easeOut } as const;
export const panel = { duration: 0.32, ease: easeOut } as const;

export const springLayout = spring;
export const springSheet = springPanel;
export const springSegment = { type: "spring" as const, stiffness: 440, damping: 38 };

export const slideInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: standard },
  exit: { opacity: 0, y: -4, transition: micro },
};

export const fadeOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: standard },
  exit: { opacity: 0, transition: micro },
};

export function motionProps(reduced: boolean) {
  return { initial: "hidden", animate: "visible", exit: "exit" };
}

export const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
