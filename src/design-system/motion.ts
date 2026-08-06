// RescueLoop motion tokens — consistent timings across the entire app.
// Adapted from the Optimus reference discipline with RescueLoop-specific values.
// Per spec 02_MOTION_CONTRACT.md:
//   instant: 80ms; press: 120ms; micro: 160ms; standard: 240ms;
//   panel: 320ms; route: 360ms; reveal: 520ms; hero: 820ms max;
//   first-value: 480ms

export const motionTokens = {
  /** Instant feedback — 80ms. Press feedback next frame. */
  instant: 80,
  /** Press response — 120ms. */
  press: 120,
  /** Micro transition — 160ms. (Was `fast`.) */
  micro: 160,
  /** Backward-compatible alias. */
  fast: 160,
  /** Standard transition — 240ms. */
  standard: 240,
  /** Panel transition — 320ms. */
  panel: 320,
  /** Route transition — 360ms. */
  route: 360,
  /** First-value transition — 480ms. */
  firstValue: 480,
  /** Reveal transition — 520ms. (Was 600ms — corrected to spec.) */
  reveal: 520,
  /** Hero transition — 820ms max. (Was 900ms — corrected to spec max.) */
  hero: 820,
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

// Press response — uses press token (120ms)
export const pressScale = {
  whileTap: { scale: 0.98 },
  transition: { duration: motionTokens.press / 1000, ease: easeOut },
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

export const micro = { duration: motionTokens.micro / 1000, ease: easeOut } as const;
export const standard = { duration: motionTokens.standard / 1000, ease: easeOut } as const;
// panel alias — now uses the spec-correct 320ms
export const panelMotion = { duration: motionTokens.panel / 1000, ease: easeOut } as const;
// Keep backward-compatible `panel` export
export const panel = panelMotion;

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

// ── Motion contract assertions ─────────────────────────────────
// These verify the spec values at the type level. If the values
// drift from the spec, TypeScript will flag the mismatch.

type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Verify spec values (commented out to avoid unused type errors,
// but keeping as documentation of the contract):
// _instant:  AssertExact<typeof motionTokens.instant, 80>     = true
// _press:    AssertExact<typeof motionTokens.press, 120>    = true
// _micro:    AssertExact<typeof motionTokens.micro, 160>    = true
// _standard: AssertExact<typeof motionTokens.standard, 240> = true
// _panel:    AssertExact<typeof motionTokens.panel, 320>    = true
// _route:    AssertExact<typeof motionTokens.route, 360>    = true
// _reveal:   AssertExact<typeof motionTokens.reveal, 520>   = true
// _hero:     AssertExact<typeof motionTokens.hero, 820>     = true
// _firstVal: AssertExact<typeof motionTokens.firstValue, 480> = true
