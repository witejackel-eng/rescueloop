"use client";

import { motion } from "framer-motion";
import {
  SYNC_STAGES,
  syncStageMeta,
  operationCounts,
  isSafeToLeave,
  requiresUserAction,
} from "@/lib/types/operations";
import type {
  Operation,
  SyncStage,
  OperationStage,
} from "@/lib/types/operations";
import { SafeToLeaveBadge } from "./safe-to-leave-badge";
import { ProviderStateDisplay } from "./provider-state";
import { CandidatePreviewDisplay } from "./candidate-preview";

// ── Props ───────────────────────────────────────────────────
interface SyncProgressViewProps {
  operation: Operation;
}

// ── Component ───────────────────────────────────────────────
/** Specialized view for the first Whop sync. Shows the five
 *  canonical stages with real counts for each. */
export function SyncProgressView({ operation }: SyncProgressViewProps) {
  const { processed, total } = operationCounts(operation);
  const safeToLeave = isSafeToLeave(operation);
  const isComplete = operation.status === "complete";
  const isFailed = operation.status === "failed";
  const isRunning = operation.status === "running";
  const needsAction = requiresUserAction(operation);

  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  // Map operation stages to the canonical sync stages
  const stageMap = new Map<string, OperationStage>();
  for (const s of operation.stages) {
    stageMap.set(s.id, s);
  }

  return (
    <section className="border border-[var(--hairline)] bg-[var(--surface)]">
      {/* Header */}
      <header className="border-b border-[var(--hairline)] px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
            First Whop sync
          </h3>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
            Importing your members and course data
          </p>
        </div>
        <SafeToLeaveBadge
          persistenceState={operation.persistenceState}
          isComplete={isComplete || isFailed}
        />
      </header>

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Overall progress */}
        {total > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[12px] text-[var(--ink-muted)]">
                Overall
              </span>
              <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                {processed} / {total}
                <span className="text-[var(--ink-muted)] ml-1">
                  ({pct}%)
                </span>
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

        {/* Stage rows — each sync stage with its real count */}
        <div className="flex flex-col divide-y divide-[var(--hairline)]">
          {SYNC_STAGES.map((stageId, i) => {
            const meta = syncStageMeta[stageId];
            const stage = stageMap.get(stageId);
            const isCurrent = i === operation.currentStageIndex;
            const isPast = i < operation.currentStageIndex;
            const stageProcessed = stage?.processed ?? 0;
            const stageTotal = stage?.total ?? 0;
            const stageStatus = stage?.status ?? "pending";

            return (
              <motion.div
                key={stageId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex items-center gap-3 px-0 py-2.5"
              >
                {/* Dot indicator */}
                <span
                  className={`size-1.5 rounded-full shrink-0 ${
                    stageStatus === "complete"
                      ? "bg-[var(--recovery-green)]"
                      : stageStatus === "active"
                        ? "bg-[var(--ink-primary)] animate-pulse"
                        : stageStatus === "failed"
                          ? "bg-[var(--critical)]"
                          : "bg-[var(--ink-muted)]"
                  }`}
                />

                {/* Stage info */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-[12px] ${
                        isPast || stageStatus === "complete"
                          ? "text-[var(--ink-primary)]"
                          : isCurrent
                            ? "text-[var(--ink-primary)] font-medium"
                            : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {meta.label}
                    </span>

                    {/* Real count for this stage */}
                    {stageTotal > 0 && (
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          stageStatus === "complete"
                            ? "text-[var(--recovery-green)]"
                            : stageStatus === "active"
                              ? "text-[var(--ink-primary)]"
                              : "text-[var(--ink-muted)]"
                        }`}
                      >
                        {stageProcessed}/{stageTotal}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    {meta.description}
                  </span>
                </div>

                {/* Per-stage mini progress bar */}
                {stageTotal > 0 && (
                  <div className="w-16 h-[2px] bg-[var(--hairline-subtle)] shrink-0">
                    <div
                      className={`h-full ${
                        stageStatus === "complete"
                          ? "bg-[var(--recovery-green)]"
                          : stageStatus === "failed"
                            ? "bg-[var(--critical)]"
                            : "bg-[var(--ink-primary)]"
                      }`}
                      style={{
                        width: `${Math.round((stageProcessed / stageTotal) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Provider state */}
        <ProviderStateDisplay state={operation.providerState} />

        {/* Candidate preview — first rescue target found */}
        {isRunning && operation.candidatePreview && (
          <CandidatePreviewDisplay candidate={operation.candidatePreview} />
        )}

        {/* Action required */}
        {needsAction && (
          <div className="border border-[var(--critical)] bg-[var(--critical-light)] px-3 py-2">
            <span className="text-[12px] text-[var(--critical)] font-medium">
              Your action is needed to continue this sync.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
