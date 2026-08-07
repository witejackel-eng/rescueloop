"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface DataTransitionProps {
  /** The current value to display. Changes trigger the slide transition. */
  value: string | number;
  /** Optional formatter called before rendering. */
  formatter?: (value: string | number) => string;
  /** Additional class names on the wrapper. */
  className?: string;
}

/**
 * DataTransition — wraps a value that changes over time with a smooth
 * slide transition.
 *
 * When the value changes: the old value slides out to the left while
 * the new value slides in from the right. Uses framer-motion
 * AnimatePresence for enter/exit animations.
 *
 * Respects prefers-reduced-motion (instant swap, no animation).
 */
export function DataTransition({
  value,
  formatter,
  className,
}: DataTransitionProps) {
  const prefersReduced = useReducedMotion();
  const displayValue = formatter ? formatter(value) : String(value);

  return (
    <span className={cn("relative inline-flex overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={
            prefersReduced
              ? false
              : { opacity: 0, x: 12, filter: "blur(2px)" }
          }
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, x: -12, filter: "blur(2px)" }
          }
          transition={{
            duration: prefersReduced ? 0 : 0.25,
            ease: [0.16, 1, 0.3, 1] as const,
          }}
          className="inline-block font-mono tabular-nums"
        >
          {displayValue}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
