"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile safe-area utilities for RescueLoop.
 *
 * Provides:
 * - SafeAreaWrapper: applies safe-area-inset padding to content
 * - SafeAreaBottomSheet: bottom sheet that respects safe-area-inset-bottom
 * - TouchTarget: enforces minimum 44×44px interactive target size
 * - useSafeAreaInsets: hook for reading safe-area insets from CSS custom properties
 */

// ── Hook: useSafeAreaInsets ──────────────────────────────────────────────

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Reads safe-area-inset values from CSS custom properties set in globals.css.
 * Falls back to 0 when the properties aren't available (non-mobile browsers).
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    function readInsets() {
      const style = getComputedStyle(document.documentElement);
      const parse = (val: string) => {
        const n = parseFloat(val);
        return Number.isFinite(n) ? n : 0;
      };
      setInsets({
        top: parse(style.getPropertyValue("--safe-area-inset-top")),
        bottom: parse(style.getPropertyValue("--safe-area-inset-bottom")),
        left: parse(style.getPropertyValue("--safe-area-inset-left")),
        right: parse(style.getPropertyValue("--safe-area-inset-right")),
      });
    }

    readInsets();
    // Re-read on resize (orientation change may alter safe areas)
    window.addEventListener("resize", readInsets);
    return () => window.removeEventListener("resize", readInsets);
  }, []);

  return insets;
}

// ── Component: SafeAreaWrapper ───────────────────────────────────────────

interface SafeAreaWrapperProps {
  children: ReactNode;
  /** Which edges to apply safe-area padding to */
  edges?: Array<"top" | "bottom" | "left" | "right">;
  className?: string;
  /** HTML element to render as */
  as?: "div" | "main" | "section" | "article";
}

/**
 * Wraps content with safe-area-inset padding on the specified edges.
 * Typically used for full-screen layouts on mobile devices with notches
 * or home indicators.
 */
export function SafeAreaWrapper({
  children,
  edges = ["top", "bottom", "left", "right"],
  className,
  as: Component = "div",
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();

  const style: React.CSSProperties = {
    paddingTop: edges.includes("top") ? insets.top : undefined,
    paddingBottom: edges.includes("bottom") ? insets.bottom : undefined,
    paddingLeft: edges.includes("left") ? insets.left : undefined,
    paddingRight: edges.includes("right") ? insets.right : undefined,
  };

  return (
    <Component className={className} style={style}>
      {children}
    </Component>
  );
}

// ── Component: SafeAreaBottomSheet ───────────────────────────────────────

interface SafeAreaBottomSheetProps {
  children: ReactNode;
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when the sheet should close */
  onClose: () => void;
  className?: string;
  /** Accessible label for the sheet dialog */
  ariaLabel?: string;
}

/**
 * A bottom sheet that respects safe-area-inset-bottom, ensuring
 * interactive content is never hidden behind the iOS home indicator
 * or Android navigation bar.
 *
 * Uses proper dialog semantics (role="dialog", aria-modal, Escape to close).
 */
export function SafeAreaBottomSheet({
  children,
  open,
  onClose,
  className,
  ariaLabel = "Bottom sheet",
}: SafeAreaBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const insets = useSafeAreaInsets();

  // Escape key closes the sheet
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus trap: when opened, move focus into the sheet
  useEffect(() => {
    if (!open || !sheetRef.current) return;
    const firstFocusable = sheetRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "absolute inset-x-0 bottom-0 z-10",
          "max-h-[85vh] overflow-y-auto",
          "rounded-t-xl border-t border-[var(--hairline)]",
          "bg-[var(--surface)] shadow-lg",
          className,
        )}
        style={{
          // Add safe-area-inset-bottom as extra padding so content
          // is never hidden behind the home indicator
          paddingBottom: `calc(1rem + ${insets.bottom}px)`,
        }}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center py-2">
          <div className="h-1 w-8 rounded-full bg-[var(--hairline-strong)]" />
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Component: TouchTarget ───────────────────────────────────────────────

interface TouchTargetProps {
  children: ReactNode;
  className?: string;
  /** Minimum width (default: 44px per WCAG mobile guidance) */
  minWidth?: number;
  /** Minimum height (default: 44px per WCAG mobile guidance) */
  minHeight?: number;
}

/**
 * Enforces minimum touch target size for interactive elements.
 * The child element is centered within the minimum target area,
 * ensuring the visual element can be smaller while the touch target
 * remains accessible.
 *
 * Usage:
 * ```tsx
 * <TouchTarget>
 *   <button className="h-4 w-4">✕</button>
 * </TouchTarget>
 * ```
 */
export function TouchTarget({
  children,
  className,
  minWidth = 44,
  minHeight = 44,
}: TouchTargetProps) {
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      style={{ minWidth, minHeight }}
    >
      {children}
    </span>
  );
}
