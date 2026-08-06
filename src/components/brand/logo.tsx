"use client";

import { cn } from "@/lib/utils";

// ─── Size tokens ──────────────────────────────────────────────
const SIZE_MAP = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
} as const;

type SizeToken = keyof typeof SIZE_MAP;

// ─── Variant types ────────────────────────────────────────────
export type RescueLoopMarkVariant = "primary" | "mono" | "reversed" | "micro";
export type RescueLoopMarkSize = SizeToken | number;
export type BrandContext = "marketing" | "workspace" | "student" | "internal";

// ─── Canonical Closing Signal geometry ────────────────────────
// Primary mark paths (128x128 viewBox) — ink arc + green signal
const PRIMARY_ARC = "M91 27.5A44 44 0 1 0 100 84";
const PRIMARY_SIGNAL_STROKE = "M94 37c-7.4-6.8-16.2-10.8-26.4-12";
const PRIMARY_SIGNAL_NODE_CX = 101.5;
const PRIMARY_SIGNAL_NODE_CY = 40.5;
const PRIMARY_SIGNAL_NODE_R = 9.5;

// Micro mark paths (64x64 viewBox) — simplified for small sizes
const MICRO_ARC = "M45.5 14.5A22 22 0 1 0 50 42";
const MICRO_SIGNAL_STROKE = "M47 20c-3.8-3.5-8.3-5.6-13.5-6.2";
const MICRO_SIGNAL_NODE_CX = 50.5;
const MICRO_SIGNAL_NODE_CY = 21.7;
const MICRO_SIGNAL_NODE_R = 5.2;

// ─── Color maps ───────────────────────────────────────────────
const INK = "#11110F";
const GREEN = "#147D68";
const CREAM = "#F4F1EA";

const VARIANT_COLORS = {
  primary: { arc: INK, stroke: GREEN, node: GREEN },
  mono: { arc: INK, stroke: INK, node: INK },
  reversed: { arc: CREAM, stroke: CREAM, node: CREAM },
  micro: { arc: INK, stroke: GREEN, node: GREEN },
} as const;

// ─── RescueLoopMark ──────────────────────────────────────────
export interface RescueLoopMarkProps {
  /** Visual variant of the mark. */
  variant?: RescueLoopMarkVariant;
  /** Size token or explicit pixel value. */
  size?: RescueLoopMarkSize;
  /** Additional CSS classes. */
  className?: string;
  /** Decorative mode — mark is hidden from assistive technology. */
  decorative?: boolean;
  /** Accessible label — required when decorative is false. */
  label?: string;
}

export function RescueLoopMark({
  variant = "primary",
  size = "md",
  className,
  decorative = true,
  label,
}: RescueLoopMarkProps) {
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const isMicro = variant === "micro" || px <= 20;
  const colors = VARIANT_COLORS[isMicro && variant !== "mono" && variant !== "reversed" ? "micro" : variant];
  const viewBox = isMicro ? "0 0 64 64" : "0 0 128 128";
  const strokeWidth = isMicro ? 7 : 12;

  // Accessibility: decorative marks get aria-hidden, meaningful marks need a label
  const ariaProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label ?? "RescueLoop" };

  if (isMicro) {
    return (
      <svg
        width={px}
        height={px}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...ariaProps}
      >
        <path d={MICRO_ARC} fill="none" stroke={colors.arc} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={MICRO_SIGNAL_STROKE} fill="none" stroke={colors.stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx={MICRO_SIGNAL_NODE_CX} cy={MICRO_SIGNAL_NODE_CY} r={MICRO_SIGNAL_NODE_R} fill={colors.node} />
      </svg>
    );
  }

  return (
    <svg
      width={px}
      height={px}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...ariaProps}
    >
      <path d={PRIMARY_ARC} fill="none" stroke={colors.arc} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d={PRIMARY_SIGNAL_STROKE} fill="none" stroke={colors.stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx={PRIMARY_SIGNAL_NODE_CX} cy={PRIMARY_SIGNAL_NODE_CY} r={PRIMARY_SIGNAL_NODE_R} fill={colors.node} />
    </svg>
  );
}

// ─── RescueLoopWordmark ──────────────────────────────────────
export interface RescueLoopWordmarkProps {
  className?: string;
}

export function RescueLoopWordmark({ className }: RescueLoopWordmarkProps) {
  return (
    <span className={cn("font-sans text-[1.35rem] font-semibold leading-none tracking-tight text-[var(--ink-primary)]", className)}>
      RescueLoop
    </span>
  );
}

// ─── RescueLoopLogo (mark + wordmark) ────────────────────────
export interface RescueLoopLogoProps {
  /** Brand context determines identity intensity. */
  context?: BrandContext;
  /** Compact mode — smaller mark, used in workspace/internal shells. */
  compact?: boolean;
  /** Mark variant override. */
  variant?: RescueLoopMarkVariant;
  /** Additional CSS classes. */
  className?: string;
  /** Decorative mode for the mark. */
  decorative?: boolean;
}

export function RescueLoopLogo({
  context = "marketing",
  compact = false,
  variant = "primary",
  className,
  decorative = true,
}: RescueLoopLogoProps) {
  const markSize = context === "student" ? "xs" : compact ? "sm" : context === "marketing" ? "lg" : "md";
  const gap = context === "student" ? "gap-1.5" : "gap-2";
  const wordmarkSize = context === "student" ? "text-[13px]" : compact ? "text-[14px]" : "";

  return (
    <div className={cn("flex items-center", gap, className)}>
      <RescueLoopMark variant={variant} size={markSize} decorative={decorative} />
      <RescueLoopWordmark className={wordmarkSize} />
    </div>
  );
}

// ─── BrandSignature (quiet student-safe identity) ────────────
export interface BrandSignatureProps {
  context?: "student" | "legal" | "error";
  className?: string;
}

export function BrandSignature({ context = "student", className }: BrandSignatureProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <RescueLoopMark variant="micro" size="xs" decorative />
      <span className="text-[11px] font-medium tracking-wide text-[var(--ink-muted)]">
        RescueLoop
      </span>
    </div>
  );
}
