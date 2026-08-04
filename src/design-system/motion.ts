// RescueLoop motion configuration
// Central transition + spring definitions used across the entire app.

export const EASE = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

// Micro response — buttons, rows, controls
export const micro = {
  duration: 0.12,
  ease: EASE,
} as const;

// Standard transition — most UI state changes
export const standard = {
  duration: 0.22,
  ease: EASE,
} as const;

// Panel transition — sheets, drawers, inspectors
export const panel = {
  duration: 0.32,
  ease: EASE,
} as const;

// Spring for sheets / inspectors
export const springSheet = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
};

// Soft layout spring — shared layout animations, segmented controls
export const springLayout = {
  type: "spring" as const,
  stiffness: 300,
  damping: 32,
};

// Snappy spring for segmented control thumbs
export const springSegment = {
  type: "spring" as const,
  stiffness: 440,
  damping: 38,
};

// Press response transform
export const pressScale = {
  whileHover: { scale: 1.0 },
  whileTap: { scale: 0.98 },
  transition: micro,
};

// Character reveal variants (blur + opacity per character)
export const charReveal = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.018,
      duration: 0.32,
      ease: EASE,
    },
  }),
};

// Stagger container
export const staggerContainer = (stagger = 0.04, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

// Slide-in for list items
export const slideInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: standard,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: micro,
  },
};

// Fade for overlays
export const fadeOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: standard },
  exit: { opacity: 0, transition: micro },
};

// Reduced-motion variants
export const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// Helper to pick variants based on reduced motion
export function motionProps(reduced: boolean) {
  return reduced
    ? { initial: "hidden", animate: "visible", exit: "exit" }
    : { initial: "hidden", animate: "visible", exit: "exit" };
}
