"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  // If false, renders the final value immediately (for SSR / reduced motion)
  animate?: boolean;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.2,
  className,
  animate = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  // Whether we should actually run an animation. When false (reduced motion,
  // SSR, or not yet in view) we render the final value directly.
  const shouldAnimate = animate && !reduced && inView;
  const [display, setDisplay] = useState(0);
  // Track the latest displayed value so re-animations can start from where
  // we left off (smoother for slider-driven live updates).
  const displayRef = useRef(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    const start = performance.now();
    const startValue = displayRef.current;
    const endValue = value;
    const delta = endValue - startValue;
    let raf: number;

    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const next = startValue + delta * eased;
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        displayRef.current = endValue;
        setDisplay(endValue);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldAnimate, value, duration]);

  const renderValue = shouldAnimate ? display : value;

  const formatted = renderValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={cn("font-mono tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
