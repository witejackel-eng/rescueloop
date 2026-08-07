"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface UseScrollRevealOptions {
  /** IntersectionObserver threshold (0–1). Default: 0.1 */
  threshold?: number;
  /** IntersectionObserver rootMargin. Default: "0px" */
  rootMargin?: string;
  /** If true, once the element becomes visible it stays visible even if scrolled away. Default: true */
  once?: boolean;
}

/**
 * useScrollReveal — tracks whether an element has scrolled into the viewport.
 *
 * Uses IntersectionObserver internally. Returns a ref to attach to the target
 * element and an `isVisible` boolean that flips to `true` when the element
 * enters the viewport (and stays true when `once` is true).
 *
 * Respects `prefers-reduced-motion`: if the user prefers reduced motion,
 * `isVisible` is always `true` so no entrance animation is shown.
 */
export function useScrollReveal(options?: UseScrollRevealOptions) {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    once = true,
  } = options ?? {};

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReduced = useReducedMotion();

  // When reduced motion is preferred, always show content immediately
  useEffect(() => {
    if (prefersReduced && !isVisible) {
      // Use microtask to avoid synchronous setState in effect
      const id = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [prefersReduced, isVisible]);

  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) {
          observer.unobserve(entry.target);
        }
      } else if (!once) {
        setIsVisible(false);
      }
    },
    [once],
  );

  useEffect(() => {
    if (prefersReduced) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(onIntersect, {
      threshold,
      rootMargin,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, prefersReduced, onIntersect]);

  return { ref, isVisible };
}
