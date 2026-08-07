"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, Shield } from "lucide-react";
import type { PersistenceState } from "@/lib/types/operations";

// ── Props ───────────────────────────────────────────────────
interface SafeToLeaveBadgeProps {
  persistenceState: PersistenceState;
  isComplete: boolean;
}

// ── Meta for each persistence state ─────────────────────────
const meta: Record<
  PersistenceState,
  { label: string; icon: typeof ShieldCheck; color: string }
> = {
  not_persisted: {
    label: "Saving…",
    icon: Shield,
    color: "text-[var(--warning)]",
  },
  persisting: {
    label: "Saving…",
    icon: Loader2,
    color: "text-[var(--warning)]",
  },
  persisted: {
    label: "Safe to leave",
    icon: ShieldCheck,
    color: "text-[var(--recovery-green)]",
  },
};

// ── Component ───────────────────────────────────────────────
export function SafeToLeaveBadge({
  persistenceState,
  isComplete,
}: SafeToLeaveBadgeProps) {
  // Once complete, always safe to leave
  const state: PersistenceState = isComplete ? "persisted" : persistenceState;
  const m = meta[state];
  const Icon = m.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className="inline-flex items-center gap-1.5"
      >
        <Icon
          className={`size-3 ${m.color} ${
            state === "persisting" ? "animate-spin" : ""
          }`}
          strokeWidth={2.25}
        />
        <span className={`text-[11px] ${m.color}`}>{m.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
