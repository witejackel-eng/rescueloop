"use client";

// Interactive sync status view.
//
// Handles:
//   - Polling for updates (every 10s when sync is running)
//   - Retry button for failed syncs
//   - Safe-to-leave messaging
//
// Receives initial data from the server component and can poll
// the operations API for updates.

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Timer,
} from "lucide-react";
import type {
  OperationReadModel,
  OperationStageRead,
} from "@/lib/operations/operation-read-model";

// ─── Props ───────────────────────────────────────────────────

interface SyncStatusViewProps {
  companyId: string;
  initialOperation: OperationReadModel | null;
  initialCheckpoints: {
    resource: string;
    cursor: string | null;
    sourceWatermark: string | null;
    lastCompletedPage: number;
  }[];
  initialLatestWebhook: {
    eventType: string;
    status: string;
    receivedAt: string;
    lastError: string | null;
  } | null;
}

// ─── State badge ─────────────────────────────────────────────

function StateBadge({ state }: { state: OperationReadModel["state"] }) {
  const config: Record<
    OperationReadModel["state"],
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
  > = {
    pending: {
      label: "Pending",
      variant: "outline",
      className: "text-[var(--ink-muted)]",
    },
    running: {
      label: "Running",
      variant: "default",
      className: "bg-[var(--ink-primary)] text-white",
    },
    completed: {
      label: "Completed",
      variant: "outline",
      className: "text-[var(--recovery-green)] border-[var(--recovery-green)]",
    },
    failed: {
      label: "Failed",
      variant: "destructive",
      className: "",
    },
    cancelled: {
      label: "Cancelled",
      variant: "outline",
      className: "text-[var(--ink-muted)]",
    },
  };

  const { label, variant, className } = config[state];

  return (
    <Badge variant={variant} className={`font-mono text-[11px] ${className}`}>
      {state === "running" && (
        <Loader2 className="mr-1 size-3 animate-spin" />
      )}
      {label}
    </Badge>
  );
}

// ─── Stage state indicator ───────────────────────────────────

function StageStateDot({ state }: { state: OperationStageRead["state"] }) {
  const colorClass =
    state === "completed"
      ? "bg-[var(--recovery-green)]"
      : state === "running"
        ? "bg-[var(--ink-primary)] animate-pulse"
        : state === "failed"
          ? "bg-[var(--critical)]"
          : state === "skipped"
            ? "bg-[var(--ink-muted)]"
            : "bg-[var(--ink-muted)]";

  return <span className={`inline-block size-1.5 rounded-full ${colorClass}`} />;
}

// ─── Format relative time ────────────────────────────────────

function formatTime(isoString: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(
  startedAt: string | null,
  completedAt: string | null,
): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt
    ? new Date(completedAt).getTime()
    : Date.now();
  const diffMs = end - start;
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60_000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${(diffMs / 60_000).toFixed(1)}m`;
}

// ─── Main component ──────────────────────────────────────────

export function SyncStatusView({
  companyId,
  initialOperation,
  initialCheckpoints,
  initialLatestWebhook,
}: SyncStatusViewProps) {
  const [operation, setOperation] = useState<OperationReadModel | null>(
    initialOperation,
  );
  const [checkpoints, setCheckpoints] = useState(initialCheckpoints);
  const [latestWebhook, setLatestWebhook] = useState(initialLatestWebhook);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Poll for updates when sync is running
  const isRunning = operation?.state === "running" || operation?.state === "pending";

  const pollForUpdates = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/dashboard/${companyId}/operations`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const ops = data.operations as OperationReadModel[];
      const latestSync = ops.find((op) => op.type === "sync");
      if (latestSync) {
        setOperation(latestSync);
      }
    } catch {
      // Silent — polling failure is non-fatal
    }
  }, [companyId]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(pollForUpdates, 10_000);
    return () => clearInterval(interval);
  }, [isRunning, pollForUpdates]);

  // Retry handler
  const handleRetry = async () => {
    if (!operation) return;
    setRetrying(true);
    setRetryError(null);

    try {
      const res = await fetch(
        `/api/dashboard/${companyId}/operations/${operation.id}/retry`,
        { method: "POST" },
      );

      if (!res.ok) {
        const data = await res.json();
        setRetryError(data.error ?? "Retry failed");
        return;
      }

      // Immediately poll for the updated state
      await pollForUpdates();
    } catch {
      setRetryError("Network error — please try again");
    } finally {
      setRetrying(false);
    }
  };

  // ─── No sync yet ──────────────────────────────────────────
  if (!operation) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <RefreshCw className="size-8 text-[var(--ink-muted)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">
            No sync has been run yet
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            Sync starts automatically when Whop webhooks arrive, or trigger one
            manually from the health page.
          </p>
          {latestWebhook && (
            <div className="mt-2 flex flex-col items-center gap-1 text-[12px] text-[var(--ink-muted)]">
              <span>
                Last webhook: {latestWebhook.eventType} (
                {formatTime(latestWebhook.receivedAt)})
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Render sync status ───────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* a. Current Sync Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-[18px]">
              Current Sync Status
            </CardTitle>
            <StateBadge state={operation.state} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Stage */}
          <div className="flex items-center gap-2">
            <ArrowRight className="size-3.5 text-[var(--ink-muted)]" />
            <span className="text-[14px] text-[var(--ink-primary)]">
              {operation.stage}
            </span>
          </div>

          {/* Timestamps */}
          <div className="flex flex-col gap-1.5 text-[12px] text-[var(--ink-secondary)]">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-[var(--ink-muted)]" />
              <span>
                Started: {formatTime(operation.startedAt)}
              </span>
              <span className="text-[var(--ink-muted)]">·</span>
              <span>
                Duration:{" "}
                {formatDuration(operation.startedAt, operation.completedAt)}
              </span>
            </div>
            {operation.updatedAt && (
              <div className="flex items-center gap-2">
                <Timer className="size-3.5 text-[var(--ink-muted)]" />
                <span>Updated: {formatTime(operation.updatedAt)}</span>
              </div>
            )}
            {operation.completedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-[var(--recovery-green)]" />
                <span>
                  Completed: {formatTime(operation.completedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Progress — only when both completedUnits and totalUnits are real */}
          {operation.completedUnits !== null &&
            operation.totalUnits !== null &&
            operation.totalUnits > 0 && (
              <div className="mt-1">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[12px] text-[var(--ink-muted)]">
                    Progress
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                    {operation.completedUnits} / {operation.totalUnits}
                    <span className="text-[var(--ink-muted)] ml-1">
                      (
                      {Math.round(
                        (operation.completedUnits / operation.totalUnits) * 100,
                      )}
                      %)
                    </span>
                  </span>
                </div>
                <div className="h-[3px] w-full bg-[var(--hairline)]">
                  <div
                    className={`h-full ${
                      operation.state === "failed"
                        ? "bg-[var(--critical)]"
                        : operation.state === "completed"
                          ? "bg-[var(--recovery-green)]"
                          : "bg-[var(--ink-primary)]"
                    }`}
                    style={{
                      width: `${Math.round(
                        (operation.completedUnits / operation.totalUnits) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

          {/* Error message */}
          {operation.message && operation.state === "failed" && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--critical-light)] bg-[var(--critical-light)]/40 p-3">
              <XCircle className="mt-0.5 size-4 shrink-0 text-[var(--critical)]" />
              <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
                {operation.message}
              </p>
            </div>
          )}

          {/* Trigger and provider metadata */}
          <div className="flex items-center gap-3 text-[11px] text-[var(--ink-muted)]">
            {operation.trigger && (
              <span>
                Trigger: <span className="font-mono">{operation.trigger}</span>
              </span>
            )}
            {operation.provider && (
              <span>
                Provider:{" "}
                <span className="font-mono">{operation.provider}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* b. Stage Breakdown */}
      {operation.stages && operation.stages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[18px]">
              Stage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">State</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Read</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                  <TableHead className="text-right">Finished</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operation.stages.map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell>
                      <StageStateDot state={stage.state} />
                    </TableCell>
                    <TableCell className="font-mono text-[12px]">
                      {stage.resource}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {stage.recordsRead}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {stage.recordsCreated}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {stage.recordsUpdated}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {stage.pagesProcessed}
                    </TableCell>
                    <TableCell className="text-right text-[12px]">
                      {formatTime(stage.completedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* c. Checkpoint Data */}
      {checkpoints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[18px]">
              Checkpoint Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Cursor</TableHead>
                  <TableHead>Watermark</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkpoints.map((cp, i) => (
                  <TableRow key={`${cp.resource}-${i}`}>
                    <TableCell className="font-mono text-[12px]">
                      {cp.resource}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-[11px] text-[var(--ink-muted)]">
                      {cp.cursor ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-[11px] text-[var(--ink-muted)]">
                      {cp.sourceWatermark ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] tabular-nums">
                      {cp.lastCompletedPage}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* d. Webhook Activity */}
      {latestWebhook && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-[18px]">
              Webhook Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-secondary)]">
                  Last webhook
                </span>
                <span className="font-mono text-[12px]">
                  {latestWebhook.eventType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-secondary)]">Status</span>
                <Badge
                  variant={
                    latestWebhook.status === "processed"
                      ? "outline"
                      : latestWebhook.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="font-mono text-[11px]"
                >
                  {latestWebhook.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-secondary)]">Received</span>
                <span className="font-mono text-[12px]">
                  {formatTime(latestWebhook.receivedAt)}
                </span>
              </div>
              {latestWebhook.lastError && (
                <div className="mt-1 rounded-md border border-[var(--critical-light)] bg-[var(--critical-light)]/40 p-2">
                  <p className="font-mono text-[11px] text-[var(--critical)]">
                    {latestWebhook.lastError}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* e. Provider Delay */}
      {operation.providerDelay && (
        <Card className="border-[var(--warning-light)]">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--warning)]" />
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-[var(--ink-primary)]">
                Provider delay
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
                Whop asked RescueLoop to slow down. Your sync is safe and will
                continue after the provider retry window.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* f. Retry Action */}
      {operation.canRetry && operation.state === "failed" && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-[var(--ink-primary)]">
                Retry sync
              </p>
              <p className="text-[13px] text-[var(--ink-secondary)]">
                The last sync failed. You can retry to start a new sync.
              </p>
              {retryError && (
                <p className="font-mono text-[11px] text-[var(--critical)]">
                  {retryError}
                </p>
              )}
            </div>
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="gap-2"
            >
              {retrying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {retrying ? "Retrying…" : "Retry sync"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* g. Safe to Leave */}
      {operation.canLeaveSafely && (
        <div className="flex items-center gap-2 rounded-md border border-[var(--recovery-green)]/20 bg-[var(--recovery-green)]/5 p-3">
          <ShieldCheck className="size-4 shrink-0 text-[var(--recovery-green)]" />
          <p className="text-[13px] text-[var(--ink-secondary)]">
            Your sync continues on the server. It is safe to leave this page.
          </p>
        </div>
      )}
    </div>
  );
}
