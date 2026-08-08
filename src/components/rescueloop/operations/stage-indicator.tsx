"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { OperationStage, OperationStageStatus } from "@/lib/types/operations";

// ── Stage status icon ───────────────────────────────────────
function StageIcon({ status }: { status: OperationStageStatus }) {
  switch (status) {
    case "complete":
      return (
        <CheckCircle2
          className="size-3.5 text-[var(--recovery-green)]"
          strokeWidth={2.25}
        />
      );
    case "active":
      return (
        <Loader2
          className="size-3.5 text-[var(--ink-primary)] animate-spin"
          strokeWidth={2.25}
        />
      );
    case "failed":
      return (
        <XCircle
          className="size-3.5 text-[var(--critical)]"
          strokeWidth={2.25}
        />
      );
    case "pending":
      return (
        <Circle
          className="size-3.5 text-[var(--ink-muted)]"
          strokeWidth={1.5}
        />
      );
  }
}

// ── Props ───────────────────────────────────────────────────
interface StageIndicatorProps {
  stages: OperationStage[];
  currentStageIndex: number;
}

// ── Component ───────────────────────────────────────────────
export function StageIndicator({
  stages,
  currentStageIndex,
}: StageIndicatorProps) {
  return (
    <div className="flex flex-col gap-0">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const isUpcoming = i > currentStageIndex && stage.status === "pending";

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.24 }}
            className="flex items-start gap-2.5"
          >
            {/* Vertical track + icon */}
            <div className="flex flex-col items-center">
              <StageIcon status={stage.status} />
              {!isLast && (
                <div
                  className={`w-px h-4 mt-0.5 ${
                    stage.status === "complete"
                      ? "bg-[var(--recovery-green)]"
                      : "bg-[var(--hairline)]"
                  }`}
                />
              )}
            </div>

            {/* Label + count */}
            <div className="flex items-baseline justify-between gap-2 pb-3 min-w-0">
              <span
                className={`text-[12px] truncate ${
                  isUpcoming
                    ? "text-[var(--ink-muted)]"
                    : "text-[var(--ink-primary)]"
                }`}
              >
                {stage.label}
              </span>

              {/* Real count — only shown when total is known and > 0 */}
              {stage.total > 0 && (
                <span
                  className={`font-mono text-[11px] tabular-nums shrink-0 ${
                    stage.status === "complete"
                      ? "text-[var(--recovery-green)]"
                      : stage.status === "active"
                        ? "text-[var(--ink-primary)]"
                        : "text-[var(--ink-muted)]"
                  }`}
                >
                  {stage.processed}/{stage.total}
                </span>
              )}

              {/* Error detail */}
              {stage.status === "failed" && stage.error && (
                <span className="text-[11px] text-[var(--critical)] truncate">
                  {stage.error}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
