"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, DollarSign, Zap } from "lucide-react";
import type { CandidatePreview } from "@/lib/types/operations";
import { formatCurrency } from "@/lib/format";

// ── Props ───────────────────────────────────────────────────
interface CandidatePreviewDisplayProps {
  candidate?: CandidatePreview;
}

// ── Component ───────────────────────────────────────────────
/** Shows the first useful candidate before the full operation completes.
 *  This gives the user immediate value — they can see a rescue target
 *  while the rest of the data is still being processed. */
export function CandidatePreviewDisplay({
  candidate,
}: CandidatePreviewDisplayProps) {
  return (
    <AnimatePresence>
      {candidate && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 py-2.5"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap
              className="size-3 text-[var(--recovery-green)]"
              strokeWidth={2.25}
            />
            <span className="text-[11px] text-[var(--recovery-green)] font-medium">
              First candidate found
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            {/* Avatar */}
            <div className="size-7 rounded bg-[var(--surface)] border border-[var(--hairline)] flex items-center justify-center shrink-0">
              <User className="size-3.5 text-[var(--ink-muted)]" strokeWidth={2} />
            </div>

            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] text-[var(--ink-primary)] font-medium truncate">
                {candidate.name}
              </span>
              <span className="text-[11px] text-[var(--ink-muted)]">
                {candidate.riskSegment.replace(/_/g, " ")}
              </span>
            </div>

            {/* Value */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <DollarSign
                className="size-3 text-[var(--ink-secondary)]"
                strokeWidth={2}
              />
              <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                {formatCurrency(candidate.monthlyValue)}
              </span>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-[var(--ink-secondary)]">
            {candidate.recommendedAction}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
