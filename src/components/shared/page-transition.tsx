"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * PageTransition wraps page content with a fade+slide-up entrance animation
 * and staggered children for a polished feel. Respects prefers-reduced-motion.
 *
 * Usage:
 *   <PageTransition>
 *     <PageContent />
 *   </PageTransition>
 */

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/** Reduced-motion variants — instant, no movement */
const REDUCED_CONTAINER_VARIANTS = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0, delayChildren: 0 },
  },
};

const REDUCED_ITEM_VARIANTS = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

interface PageTransitionProps {
  children: ReactNode;
  /** Optional className for the outer motion.div container */
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReduced = useReducedMotion();

  const containerVariants = prefersReduced
    ? REDUCED_CONTAINER_VARIANTS
    : CONTAINER_VARIANTS;

  const itemVariants = prefersReduced
    ? REDUCED_ITEM_VARIANTS
    : ITEM_VARIANTS;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <motion.div variants={itemVariants}>
        {children}
      </motion.div>
    </motion.div>
  );
}
