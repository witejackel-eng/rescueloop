"use client";

import { useRef, useEffect } from "react";

/**
 * useFocusRestore — restores focus to a trigger element after a
 * drawer/dialog/sheet closes.
 *
 * Usage:
 *   const triggerRef = useFocusRestore(isOpen);
 *   <button ref={triggerRef} onClick={open}>Open</button>
 *
 * When `isOpen` transitions from true → false, focus returns to the
 * element that holds this ref. Works with Radix Dialog/Sheet and
 * Vaul Drawer because those components call onOpenChange(false) on
 * close — the effect runs after the DOM settles.
 *
 * @param isOpen  Whether the overlay is currently open
 * @returns       A ref to attach to the trigger element
 */
export function useFocusRestore(isOpen: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    // Detect close transition: was open, now closed
    if (wasOpenRef.current && !isOpen) {
      // Schedule focus restore after the overlay finishes its exit animation.
      // Radix/Vaul use data-state=closed + CSS transitions, so we wait
      // two frames to be safe (one for React commit, one for animation start).
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (triggerRef.current) {
            triggerRef.current.focus({ preventScroll: true });
          }
        });
      });
      return () => cancelAnimationFrame(id);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  return triggerRef;
}

/**
 * useEscapeKey — calls `callback` when Escape is pressed while `isActive`
 * is true. Captures at the document level so it fires even when a child
 * element has focus.
 *
 * @param callback  Function to call on Escape
 * @param isActive  Whether the listener should be active
 */
export function useEscapeKey(callback: () => void, isActive: boolean) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (!isActive) return;

    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        savedCallback.current();
      }
    }

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [isActive]);
}

/**
 * Check if an element is effectively visible.
 * Uses offsetParent in real browsers (fast layout check) and
 * falls back to DOM connectivity + style checks for environments
 * where offsetParent is unreliable (e.g. jsdom).
 */
function isElementVisible(el: HTMLElement): boolean {
  // Fast path: if offsetParent is non-null, element is visible
  if (el.offsetParent !== null) return true;
  // Fixed-position elements have offsetParent === null but are visible
  if (el.style.position === "fixed") return true;
  // Fallback: check DOM connectivity and non-hidden display
  // This handles jsdom and other environments where offsetParent is unreliable
  if (el.isConnected && el.style.display !== "none" && !el.hasAttribute("hidden")) return true;
  return false;
}

/**
 * FocusTrap — utilities for trapping focus inside a container element.
 * Useful for modal dialogs that need to prevent focus from escaping
 * (supplements Radix's built-in focus management for custom overlays).
 */
export const FocusTrap = {
  /**
   * Get all focusable descendants of a container.
   * Matches visible, enabled elements that accept keyboard focus.
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      "details > summary",
      '[contenteditable="true"]',
    ].join(", ");

    return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
      isElementVisible
    );
  },

  /**
   * Create a keydown handler that wraps focus inside a container.
   */
  createTrapHandler(container: HTMLElement): (e: KeyboardEvent) => void {
    return (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = FocusTrap.getFocusableElements(container);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
  },
};

/**
 * useFocusTrap — hook version of FocusTrap for React components.
 * Attaches a Tab trap listener when `isActive` is true.
 *
 * @param containerRef  Ref to the container element
 * @param isActive      Whether the trap should be active
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const handler = FocusTrap.createTrapHandler(container);

    container.addEventListener("keydown", handler, true);
    return () => container.removeEventListener("keydown", handler, true);
  }, [containerRef, isActive]);
}
