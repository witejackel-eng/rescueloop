"use client";

import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * EnhancedEmptyState — beautiful centered empty state with animated entrance.
 *
 * Props:
 *   icon     — Lucide icon component to display
 *   title    — Serif title text
 *   description — Muted description text
 *   actionLabel?  — Optional CTA button label
 *   onAction?     — Optional CTA button click handler
 */

interface EnhancedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EnhancedEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EnhancedEmptyStateProps) {
  const prefersReduced = useReducedMotion();

  const containerVariants = prefersReduced
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.96, y: 8 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      };

  return (
    <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
      {/* Dot-grid background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--hairline-subtle) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center px-6 py-8 text-center"
      >
        {/* Large muted icon */}
        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--canvas-elevated)]">
          <Icon className="size-7 text-[var(--ink-muted)]" strokeWidth={1.5} />
        </div>

        {/* Serif title */}
        <h3 className="mt-4 font-serif text-[18px] text-[var(--ink-primary)]">
          {title}
        </h3>

        {/* Muted description */}
        <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-[var(--ink-secondary)]">
          {description}
        </p>

        {/* Optional CTA button */}
        {actionLabel && onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            className="mt-4 h-8 rounded-[6px] border-[var(--hairline-strong)] px-4 text-[12px] text-[var(--ink-secondary)] hover:border-[var(--ink-primary)] hover:text-[var(--ink-primary)]"
          >
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
