"use client";

import React from "react";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Delay in seconds before the animation starts after entering viewport. Default: 0 */
  delay?: number;
  /** Direction the element slides in from. Default: "up" */
  direction?: Direction;
  /** Duration in seconds. Default: 0.35 */
  duration?: number;
  /** Additional class names on the wrapper div. */
  className?: string;
}

/** Maps direction to the initial offset (x, y). */
function getOffset(direction: Direction): { x: number; y: number } {
  switch (direction) {
    case "up":
      return { x: 0, y: 16 };
    case "down":
      return { x: 0, y: -16 };
    case "left":
      return { x: 16, y: 0 };
    case "right":
      return { x: -16, y: 0 };
  }
}

/**
 * ScrollReveal — wraps children with a fade + slide animation triggered
 * when the element scrolls into the viewport.
 *
 * Uses IntersectionObserver via `useScrollReveal`. Respects
 * prefers-reduced-motion (renders children immediately with no animation).
 */
export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  duration = 0.35,
  className,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1, once: true });
  const offset = getOffset(direction);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        initial={{ opacity: 0, x: offset.x, y: offset.y }}
        animate={
          isVisible
            ? { opacity: 1, x: 0, y: 0 }
            : { opacity: 0, x: offset.x, y: offset.y }
        }
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1] as const, // easeOutExpo-ish
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
