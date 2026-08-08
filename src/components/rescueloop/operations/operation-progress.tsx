"use client";

import { motion } from "framer-motion";
import type { Operation } from "@/lib/types/operations";
import { operationCounts, isSafeToLeave, requiresUserAction } from "@/lib/types/operations";
import { StageIndicator } from "./stage-indicator";
import { SafeToLeaveBadge } from "./safe-to-leave-badge";
import { ProviderStateDisplay } from "./provider-state";
import { CandidatePreviewDisplay } from "./candidate-preview";

// ── Props ───────────────────────────────────────────────────
interface OperationProgressProps {
  operation: Operation;
  /** Optional title override */
  title?: string;
}

// ── Component ───────────────────────────────────────────────
export function OperationProgress({
  operation,
  title,
}: OperationProgressProps) {
  const { processed, total } = operationCounts(operation);
  const safeToLeave = isSafeToLeave(operation);
  const needsAction = requiresUserAction(operation);
  const isRunning = operation.status === "running";
  const isComplete = operation.status === "complete";
  const isFailed = operation.status === "failed";

  // Real percentage — only meaningful when total > 0
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <section className="border border-[var(--hairline)] bg-[var(--surface)]">
      {/* Header */}
      <header className="border-b border-[var(--hairline)] px-4 py-3 flex items-center justify-between gap-3">
        <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
          {title ?? operationTypeLabel(operation.type)}
        </h3>
        <SafeToLeaveBadge
          persistenceState={operation.persistenceState}
          isComplete={isComplete || isFailed}
        />
      </header>

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Overall progress bar — real counts only */}
        {total > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[12px] text-[var(--ink-muted)]">
                Progress
              </span>
              <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                {processed} / {total}
                {total > 0 && (
                  <span className="text-[var(--ink-muted)] ml-1">
                    ({pct}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-[3px] w-full bg-[var(--hairline-subtle)]">
              <motion.div
                className={`h-full ${
                  isFailed
                    ? "bg-[var(--critical)]"
                    : isComplete
                      ? "bg-[var(--recovery-green)]"
                      : "bg-[var(--ink-primary)]"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}

        {/* Stage breakdown */}
        <StageIndicator
          stages={operation.stages}
          currentStageIndex={operation.currentStageIndex}
        />

        {/* Provider state (delay, retry, permission, disconnect) */}
        <ProviderStateDisplay state={operation.providerState} />

        {/* First useful candidate preview */}
        {isRunning && operation.candidatePreview && (
          <CandidatePreviewDisplay candidate={operation.candidatePreview} />
        )}

        {/* Action-required callout */}
        {needsAction && (
          <div className="border border-[var(--critical)] bg-[var(--critical-light)] px-3 py-2">
            <span className="text-[12px] text-[var(--critical)] font-medium">
              Your action is needed to continue this operation.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Helpers ─────────────────────────────────────────────────
function operationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    whop_sync: "Whop sync",
    bulk_evaluate: "Bulk evaluation",
    bulk_intervention: "Bulk intervention",
    export: "Data export",
  };
  return labels[type] ?? type;
}
