"use client";

import {
  Info,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { DiagnosticEntry, DiagnosticSeverity } from "@/lib/types/operations-internal";

interface DiagnosticCardProps {
  entry: DiagnosticEntry;
}

const SEVERITY_CONFIG: Record<DiagnosticSeverity, { icon: typeof Info; color: string; bg: string; label: string }> = {
  info: { icon: Info, color: "text-[var(--info)]", bg: "bg-[#D6E4F0]", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-[var(--warning)]", bg: "bg-[var(--warning-light)]", label: "Warning" },
  error: { icon: XCircle, color: "text-[var(--critical)]", bg: "bg-[var(--critical-light)]", label: "Error" },
  critical: { icon: AlertOctagon, color: "text-[var(--critical)]", bg: "bg-[var(--critical)]", label: "Critical" },
};

const RECOVERY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: "No recovery", color: "text-[var(--ink-muted)]" },
  in_progress: { label: "Recovering", color: "text-[var(--info)]" },
  succeeded: { label: "Recovered", color: "text-[var(--recovery-green)]" },
  failed: { label: "Failed", color: "text-[var(--critical)]" },
  max_retries_exceeded: { label: "Max retries exceeded", color: "text-[var(--critical)]" },
};

export function DiagnosticCard({ entry }: DiagnosticCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sc = SEVERITY_CONFIG[entry.severity];
  const SeverityIcon = sc.icon;
  const rs = RECOVERY_STATUS_LABELS[entry.recoveryStatus];

  return (
    <div className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)]">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
      >
        <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[6px] ${sc.bg}`}>
          <SeverityIcon className={`size-3 ${entry.severity === "critical" ? "text-white" : sc.color}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--ink-primary)]">{entry.title}</span>
            <span className={rs.color + " text-[10px] font-medium uppercase"}>{rs.label}</span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--ink-muted)]">{entry.description}</p>
          <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-[var(--ink-muted)]">
            <span>{entry.errorId}</span>
            <span>{entry.category.replace(/_/g, " ")}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="mt-1 size-4 text-[var(--ink-muted)]" />
        ) : (
          <ChevronRight className="mt-1 size-4 text-[var(--ink-muted)]" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--hairline)] px-4 py-4">
          {/* Context (no sensitive data) */}
          <div className="mb-4">
            <h5 className="mb-1.5 text-[11px] font-medium uppercase text-[var(--ink-muted)]">Context</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {Object.entries(entry.context).map(([key, value]) => (
                <div key={key}>
                  <span className="text-[10px] text-[var(--ink-muted)]">{key}</span>
                  <span className="ml-1 font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery suggestion */}
          <div className="mb-4">
            <h5 className="mb-1.5 text-[11px] font-medium uppercase text-[var(--ink-muted)]">Recovery Suggestion</h5>
            <p className="text-[12px] leading-relaxed text-[var(--ink-secondary)]">{entry.recoverySuggestion}</p>
          </div>

          {/* Recovery rule */}
          {entry.recoveryRule && (
            <div className="mb-4">
              <h5 className="mb-1.5 text-[11px] font-medium uppercase text-[var(--ink-muted)]">Recovery Rule</h5>
              <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3 text-[11px]">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    <span className="text-[var(--ink-muted)]">Action:</span>{" "}
                    <span className="font-medium text-[var(--ink-primary)]">
                      {entry.recoveryRule.recoveryAction.replace(/_/g, " ")}
                    </span>
                  </span>
                  <span>
                    <span className="text-[var(--ink-muted)]">Max retries:</span>{" "}
                    <span className="font-mono tabular-nums text-[var(--ink-primary)]">{entry.recoveryRule.maxRetries}</span>
                  </span>
                  <span>
                    <span className="text-[var(--ink-muted)]">Base delay:</span>{" "}
                    <span className="font-mono tabular-nums text-[var(--ink-primary)]">{entry.recoveryRule.baseDelayMs}ms</span>
                  </span>
                  <span>
                    <span className="text-[var(--ink-muted)]">Max delay:</span>{" "}
                    <span className="font-mono tabular-nums text-[var(--ink-primary)]">{entry.recoveryRule.maxDelayMs}ms</span>
                  </span>
                </div>
                <p className="mt-1.5 text-[var(--ink-muted)]">{entry.recoveryRule.description}</p>
              </div>
            </div>
          )}

          {/* Retry info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
            <span>Retries: {entry.retryCount}/{entry.maxRetries}</span>
            {entry.lastRetryAt && <span>Last retry: {new Date(entry.lastRetryAt).toLocaleTimeString()}</span>}
            {entry.nextRetryAt && <span>Next retry: {new Date(entry.nextRetryAt).toLocaleTimeString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
