"use client";

import { useMemo } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Transition, Variant } from "framer-motion";
import { motionTokens, easeOut } from "@/design-system/motion";

/**
 * Enhanced reduced motion hook that enforces the RescueLoop Motion Contract
 * (02_MOTION_CONTRACT.md).
 *
 * Contract rules when reduced motion is active:
 * - translation (x, y) → 0 (no positional movement)
 * - blur → 0 (no blur filter)
 * - parallax → 0 (no parallax offsets)
 * - repetition → 1 (no continuous/looping animation)
 * - fallback → opacity-only transitions
 *
 * When motion is NOT reduced, full motion is allowed (framer-motion is the
 * single transform owner per contract).
 */

export interface ReducedMotionContract {
  /** Whether the user prefers reduced motion */
  reduced: boolean;
  /** Duration: 0 when reduced, normal otherwise */
  duration: number;
  /** Transition config: opacity-only when reduced, normal otherwise */
  transition: Transition;
  /** Get framer-motion props appropriate for the current motion state */
  motionProps: (variants?: {
    hidden?: Variant;
    visible?: Variant;
    exit?: Variant;
  }) => {
    initial: string;
    animate: string;
    exit: string;
    variants: Record<string, Variant>;
    transition: Transition;
  };
  /** Reduced-safe variant: strips translation, blur, parallax */
  safeVariant: (variant: Variant) => Variant;
}

// Reduced-motion variants — opacity only, no translation or blur
const reducedHidden: Variant = { opacity: 0 };
const reducedVisible: Variant = { opacity: 1, transition: { duration: 0.15 } };
const reducedExit: Variant = { opacity: 0, transition: { duration: 0.1 } };

// Normal motion variants with y-slide + opacity
const normalHidden: Variant = {
  opacity: 0,
  y: 8,
};
const normalVisible: Variant = {
  opacity: 1,
  y: 0,
  transition: { duration: motionTokens.standard / 1000, ease: easeOut },
};
const normalExit: Variant = {
  opacity: 0,
  y: -4,
  transition: { duration: motionTokens.fast / 1000, ease: easeOut },
};

/**
 * Strip unsafe motion properties from a variant according to the motion contract.
 * When reduced motion is active, removes: x, y, translateX, translateY,
 * filter (blur), scale (parallax-like), and sets repetition to 1.
 */
function sanitizeVariant(variant: Variant, reduced: boolean): Variant {
  if (!reduced) return variant;

  if (typeof variant !== "object" || variant === null) return variant;

  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(variant)) {
    switch (key) {
      // Translation — removed entirely
      case "x":
      case "y":
      case "translateX":
      case "translateY":
        // Omit positional transforms under reduced motion
        break;

      // Blur/filter — removed entirely
      case "filter":
        // Omit blur filters under reduced motion
        break;

      // Scale used as parallax — reset to 1
      case "scale":
      case "scaleX":
      case "scaleY":
        cleaned[key] = 1;
        break;

      // Transition — sanitize nested transition
      case "transition":
        if (typeof value === "object" && value !== null) {
          const sanitizedTransition: Record<string, unknown> = {};
          for (const [tKey, tValue] of Object.entries(value)) {
            if (tKey === "repeat" || tKey === "repeatDelay") {
              // No repetition under reduced motion
              continue;
            }
            sanitizedTransition[tKey] = tValue;
          }
          // Force short duration
          sanitizedTransition.duration = 0.15;
          cleaned[key] = sanitizedTransition;
        } else {
          cleaned[key] = value;
        }
        break;

      default:
        cleaned[key] = value;
        break;
    }
  }

  // Cast back to Variant — the cleaned object is a valid motion variant
  // with only safe properties (opacity, scale=1, transition without repeat)
  return cleaned as Variant;
}

/**
 * Hook that provides reduced-motion-aware motion utilities.
 *
 * @example
 * ```tsx
 * const motion = useReducedMotionContract();
 *
 * return (
 *   <motion.div {...motion.motionProps()}>
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useReducedMotionContract(): ReducedMotionContract {
  const reduced = useReducedMotion();

  const duration = reduced ? 0 : motionTokens.standard / 1000;

  const transition: Transition = reduced
    ? { duration: 0.15, ease: "linear" }
    : { duration: motionTokens.standard / 1000, ease: easeOut };

  const safeVariant = useMemo(
    () =>
      (variant: Variant): Variant =>
        sanitizeVariant(variant, reduced),
    [reduced],
  );

  const motionPropsFn = useMemo(
    () =>
      (
        variants?: {
          hidden?: Variant;
          visible?: Variant;
          exit?: Variant;
        },
      ) => {
        const hidden = variants?.hidden ?? (reduced ? reducedHidden : normalHidden);
        const visible = variants?.visible ?? (reduced ? reducedVisible : normalVisible);
        const exit = variants?.exit ?? (reduced ? reducedExit : normalExit);

        // If custom variants are provided and we're in reduced mode, sanitize them
        const finalHidden = variants?.hidden ? sanitizeVariant(hidden, reduced) : hidden;
        const finalVisible = variants?.visible ? sanitizeVariant(visible, reduced) : visible;
        const finalExit = variants?.exit ? sanitizeVariant(exit, reduced) : exit;

        return {
          initial: "hidden" as const,
          animate: "visible" as const,
          exit: "exit" as const,
          variants: {
            hidden: finalHidden,
            visible: finalVisible,
            exit: finalExit,
          },
          transition,
        };
      },
    [reduced, transition],
  );

  return {
    reduced,
    duration,
    transition,
    motionProps: motionPropsFn,
    safeVariant,
  };
}

/**
 * Standalone sanitize function for use outside React components
 * (e.g., in test assertions or config objects).
 */
export { sanitizeVariant };
