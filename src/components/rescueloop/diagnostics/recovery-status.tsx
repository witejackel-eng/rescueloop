"use client";

import {
  CheckCircle2,
  Loader2,
  XCircle,
  AlertOctagon,
  MinusCircle,
} from "lucide-react";
import type { DiagnosticEntry } from "@/lib/types/operations-internal";

interface RecoveryStatusProps {
  entry: DiagnosticEntry;
}

const STATUS_CONFIG = {
  none: { icon: MinusCircle, color: "text-[var(--ink-muted)]", label: "No recovery initiated" },
  in_progress: { icon: Loader2, color: "text-[var(--info)]", label: "Recovery in progress", animate: true },
  succeeded: { icon: CheckCircle2, color: "text-[var(--recovery-green)]", label: "Recovery succeeded" },
  failed: { icon: XCircle, color: "text-[var(--critical)]", label: "Recovery failed" },
  max_retries_exceeded: { icon: AlertOctagon, color: "text-[var(--critical)]", label: "Max retries exceeded" },
} as const;

export function RecoveryStatusDisplay({ entry }: RecoveryStatusProps) {
  const config = STATUS_CONFIG[entry.recoveryStatus];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon
        className={`size-4 ${config.color} ${"animate" in config && config.animate ? "animate-spin" : ""}`}
        strokeWidth={2}
      />
      <div className="flex flex-col">
        <span className={`text-[12px] font-medium ${config.color}`}>{config.label}</span>
        <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
          {entry.retryCount}/{entry.maxRetries} retries
        </span>
      </div>
      {/* Progress bar for in_progress */}
      {entry.recoveryStatus === "in_progress" && entry.maxRetries > 0 && (
        <div className="ml-2 h-[3px] w-16 bg-[var(--hairline-subtle)]">
          <div
            className="h-full bg-[var(--info)]"
            style={{ width: `${(entry.retryCount / entry.maxRetries) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
