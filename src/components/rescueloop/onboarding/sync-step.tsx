"use client";

// Sync step component for the onboarding wizard.
// Shows sync progress with stages, record counts, last provider response
// time, failure state with retry, stale run detection, and
// leave-and-return support (reassurance messaging).

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Database,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  SyncStage,
  SYNC_STAGE_ORDER,
  SYNC_STAGE_LABELS,
  type SyncProgress,
  type StageProgress,
  type SyncFailure,
  getSyncProgressFraction,
  isStaleRun,
} from "@/lib/onboarding/sync-progress-types";
import type { OnboardingState } from "@/lib/onboarding/onboarding-state";

// ─── Props ──────────────────────────────────────────────────────

interface SyncStepProps {
  companyId: string;
  organizationId: string;
  onboardingState: OnboardingState;
  /** Initial sync progress (loaded from DB or freshly created). */
  initialSyncProgress: SyncProgress;
  /** Called when the user wants to retry the failed sync. */
  onRetry: () => void;
  /** Called when sync completes successfully. */
  onSyncComplete: () => void;
  /** Whether a sync is currently in flight. */
  syncing: boolean;
}

// ─── Stage status icon ──────────────────────────────────────────

function StageStatusIcon({ status }: { status: StageProgress["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />;
    case "in_progress":
      return <Loader2 className="size-4 animate-spin text-[var(--info-accent)]" />;
    case "failed":
      return <AlertTriangle className="size-4 text-[var(--critical)]" />;
    case "pending":
    default:
      return <div className="size-4 rounded-full border-2 border-[var(--hairline)]" />;
  }
}

// ─── Relative time helper ───────────────────────────────────────

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ${diffMin % 60}m ago`;
}

// ─── Main Sync Step ─────────────────────────────────────────────

export function SyncStep({
  initialSyncProgress,
  onRetry,
  onSyncComplete,
  syncing,
}: SyncStepProps) {
  const progress = initialSyncProgress;
  const [polling, setPolling] = useState(false);

  // Auto-detect completion
  const allComplete =
    progress.stages.length > 0 &&
    progress.stages.every((s) => s.status === "completed");
  const hasFailure = progress.failure !== null;
  const stale = isStaleRun(progress);
  const progressPercent = Math.round(getSyncProgressFraction(progress) * 100);

  // Check for completion
  useEffect(() => {
    if (allComplete && !syncing) {
      onSyncComplete();
    }
  }, [allComplete, syncing, onSyncComplete]);

  // Polling for progress updates (simulates a real sync)
  // In production, this would use WebSocket or SSE
  useEffect(() => {
    if (!syncing || hasFailure || allComplete) {
      return;
    }

    // Defer setPolling to avoid synchronous setState in effect body
    const timeout = setTimeout(() => setPolling(true), 0);
    const interval = setInterval(() => {
      // In a real implementation, this would fetch from an API
      // that reads the persisted sync progress from the DB
      // For now, we rely on the parent updating initialSyncProgress
    }, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      setPolling(false);
    };
  }, [syncing, hasFailure, allComplete]);

  const handleRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Progress overview ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Database className="size-4 text-[var(--recovery-green)]" />
            Syncing your data
          </CardTitle>
          <CardDescription>
            Pulling member, course, and progress data from Whop.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Overall progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--ink-primary)]">
                {allComplete
                  ? "Sync complete!"
                  : hasFailure
                    ? "Sync failed"
                    : "Syncing…"}
              </span>
              <span className="font-mono text-[12px] text-[var(--ink-muted)]">
                {progressPercent}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Records processed count */}
          <div className="flex items-center justify-between text-[12px] text-[var(--ink-secondary)]">
            <span className="flex items-center gap-1.5">
              <Database className="size-3" />
              {progress.recordsProcessed.toLocaleString()} records processed
            </span>
            {progress.lastProviderResponseAt && (
              <span className="flex items-center gap-1">
                <Wifi className="size-3" />
                Last response: {timeAgo(progress.lastProviderResponseAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Stage list ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sync stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2.5">
            {progress.stages.map((stage) => (
              <div
                key={stage.stage}
                className="flex items-center gap-3 text-[13px]"
              >
                <StageStatusIcon status={stage.status} />
                <span
                  className={
                    stage.status === "completed"
                      ? "text-[var(--ink-primary)]"
                      : stage.status === "in_progress"
                        ? "font-medium text-[var(--ink-primary)]"
                        : stage.status === "failed"
                          ? "text-[var(--critical)]"
                          : "text-[var(--ink-muted)]"
                  }
                >
                  {SYNC_STAGE_LABELS[stage.stage as SyncStage]}
                </span>
                {stage.recordsProcessed > 0 && (
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {stage.recordsProcessed}
                  </Badge>
                )}
                {stage.status === "in_progress" && (
                  <Badge
                    variant="outline"
                    className="animate-pulse font-mono text-[10px] text-[var(--info-accent)]"
                  >
                    running
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Failure state ───────────────────────────────────── */}
      {hasFailure && progress.failure && (
        <FailureAlert failure={progress.failure} onRetry={handleRetry} syncing={syncing} />
      )}

      {/* ─── Stale run detection ─────────────────────────────── */}
      {stale && !hasFailure && !allComplete && (
        <Alert className="border-[var(--warning)]/40 bg-[var(--warning-light)]/30">
          <AlertTriangle className="size-4 text-[var(--warning)]" />
          <AlertTitle className="text-[13px]">Sync appears stalled</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 text-[12px]">
            <p>
              No progress updates have been received for over 30 minutes.
              The sync may have stalled or the server may have restarted.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRetry}
              disabled={syncing}
            >
              <RotateCcw className="size-3.5" />
              Restart sync
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Reassurance messaging ───────────────────────────── */}
      {!allComplete && !hasFailure && (
        <Alert className="border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/30">
          <Info className="size-4 text-[var(--recovery-green)]" />
          <AlertTitle className="text-[13px] text-[var(--recovery-green)]">
            You can leave and come back
          </AlertTitle>
          <AlertDescription className="text-[12px] text-[var(--ink-secondary)]">
            This may take a few minutes. Your progress is saved automatically,
            so you can close this page and return later to pick up where you left off.
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Completion state ─────────────────────────────────── */}
      {allComplete && (
        <Card className="border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/30">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="size-5 text-[var(--recovery-green)]" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[14px] font-medium text-[var(--ink-primary)]">
                Sync complete
              </p>
              <p className="font-mono text-[12px] text-[var(--ink-secondary)]">
                {progress.recordsProcessed.toLocaleString()} records processed
                {progress.lastProviderResponseAt && (
                  <> · last update {timeAgo(progress.lastProviderResponseAt)}</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Failure alert sub-component ────────────────────────────────

function FailureAlert({
  failure,
  onRetry,
  syncing,
}: {
  failure: SyncFailure;
  onRetry: () => void;
  syncing: boolean;
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle className="text-[13px]">
        Sync failed at: {SYNC_STAGE_LABELS[failure.stage as SyncStage] ?? failure.stage}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2 text-[12px]">
        <p>{failure.message}</p>
        {failure.retryable ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onRetry}
            disabled={syncing}
          >
            <RotateCcw className="size-3.5" />
            Retry sync
          </Button>
        ) : (
          <p className="text-[var(--ink-muted)]">
            This error requires manual intervention. Please contact support.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
