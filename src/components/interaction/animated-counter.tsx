"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Available easing functions. */
type EasingFn = "easeOutCubic" | "easeOutExpo";

/** Resolve an easing name to a progress → eased value function. */
function getEasing(fn: EasingFn): (t: number) => number {
  switch (fn) {
    case "easeOutCubic":
      return (t) => 1 - Math.pow(1 - t, 3);
    case "easeOutExpo":
      return (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  }
}

/** Color flash direction when the value changes. */
type FlashDirection = "up" | "down" | "none";

interface AnimatedCounterProps {
  value: number;
  /** String before the number, e.g. "$", "-". Default: "" */
  prefix?: string;
  /** String after the number, e.g. "%", " members". Default: "" */
  suffix?: string;
  /** Number of decimal places. Default: 0 */
  decimals?: number;
  /** Animation duration in seconds. Default: 1.2 */
  duration?: number;
  /** Easing function. Default: "easeOutCubic" */
  easing?: EasingFn;
  /** Direction of count — "up" animates from 0→value, "down" animates from value→0. Default: "up" */
  direction?: "up" | "down";
  /** Additional class names. */
  className?: string;
  /** If false, renders the final value immediately (for SSR / reduced motion). Default: true */
  animate?: boolean;
  /** Whether to show a green/red flash when the value changes. Default: true */
  colorFlash?: boolean;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.2,
  easing = "easeOutCubic",
  direction = "up",
  className,
  animate = true,
  colorFlash = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const shouldAnimate = animate && !reduced && inView;

  // Resolve the start value based on direction
  const startValue = direction === "down" ? value : 0;

  const [display, setDisplay] = useState(direction === "down" ? value : 0);
  const displayRef = useRef(direction === "down" ? value : 0);
  const prevValueRef = useRef(value);
  const [flash, setFlash] = useState<FlashDirection>("none");
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect value changes and trigger color flash
  // Uses requestAnimationFrame to avoid synchronous setState in effect
  useEffect(() => {
    if (!colorFlash || reduced) return;

    const prev = prevValueRef.current;
    const prevFlash = flash;
    prevValueRef.current = value;

    let newFlash: FlashDirection = "none";
    if (value > prev) {
      newFlash = "up";
    } else if (value < prev) {
      newFlash = "down";
    }

    if (newFlash === "none" && prevFlash === "none") return;

    // Schedule flash update via rAF to avoid synchronous setState in effect
    const id = requestAnimationFrame(() => {
      setFlash(newFlash);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlash("none"), 600);
    });

    return () => cancelAnimationFrame(id);
  }, [value, colorFlash, reduced, flash]);

  // Animation loop
  useEffect(() => {
    if (!shouldAnimate) return;

    const start = performance.now();
    const from = displayRef.current;
    const to = value;
    const delta = to - from;
    const easeFn = getEasing(easing);
    let raf: number;

    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeFn(progress);
      const next = from + delta * eased;
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        displayRef.current = to;
        setDisplay(to);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldAnimate, value, duration, easing]);

  const renderValue = shouldAnimate ? display : value;

  const formatted = renderValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Color flash class
  const flashClass =
    flash === "up"
      ? "value-flash-up"
      : flash === "down"
        ? "value-flash-down"
        : "";

  return (
    <span
      ref={ref}
      className={cn("font-mono tabular-nums inline-block", flashClass, className)}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
