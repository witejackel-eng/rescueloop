"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { scrollReveal, scrollRevealLeft, easeReveal } from "@/design-system/motion";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  as?: "div" | "section" | "li" | "span";
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  as = "div",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-80px" });
  const reduced = useReducedMotion();

  const variants: Variants =
    direction === "left"
      ? scrollRevealLeft
      : direction === "right"
        ? { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeReveal } } }
        : direction === "none"
          ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6, ease: easeReveal } } }
          : scrollReveal;

  const MotionTag = motion[as] as typeof motion.div;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionTag
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
