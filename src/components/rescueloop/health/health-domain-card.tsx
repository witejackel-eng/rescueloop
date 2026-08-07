"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { HEALTH_STATUS_META, HEALTH_DOMAIN_LABELS } from "@/lib/types/health";
import type { HealthSignal, HealthStatus } from "@/lib/types/health";

export function HealthDomainCard({ signal }: { signal: HealthSignal }) {
  const meta = HEALTH_STATUS_META[signal.status];
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hairline)]">
        <div className="flex items-center gap-2.5">
          <StatusIcon status={signal.status} />
          <h3 className="font-serif text-[15px] text-[var(--ink-primary)]">
            {signal.label}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}>
            <span className={`size-1 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Description */}
        <p className="text-[12px] text-[var(--ink-muted)]">
          {signal.description}
        </p>

        {/* Details */}
        <p className="text-[13px] text-[var(--ink-primary)]">
          {signal.details}
        </p>

        {/* Non-healthy extras */}
        {signal.status !== "healthy" && (
          <div className="mt-3 space-y-2 rounded-md border border-[var(--hairline-subtle)] bg-[var(--canvas)] p-3">
            {/* Impact */}
            {signal.impact && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--warning-amber)]" strokeWidth={2} />
                <div>
                  <span className="text-[11px] font-medium text-[var(--ink-secondary)]">Impact</span>
                  <p className="text-[12px] text-[var(--ink-primary)]">{signal.impact}</p>
                </div>
              </div>
            )}

            {/* Data safety */}
            <div className="flex items-center gap-2">
              {signal.dataSafe ? (
                <CheckCircle2 className="size-3.5 text-[var(--recovery-green)]" strokeWidth={2} />
              ) : (
                <XCircle className="size-3.5 text-[var(--critical-red)]" strokeWidth={2} />
              )}
              <span className="text-[12px] text-[var(--ink-primary)]">
                {signal.dataSafe
                  ? "Your data is safe"
                  : "Data may be at risk — take action immediately"}
              </span>
            </div>

            {/* Retry status */}
            <div className="flex items-center gap-2">
              {signal.retrying ? (
                <>
                  <span className="size-3.5 rounded-full border-2 border-[var(--warning-amber)] border-t-transparent animate-spin" />
                  <span className="text-[12px] text-[var(--ink-secondary)]">
                    RescueLoop is automatically retrying
                  </span>
                </>
              ) : (
                <>
                  <HelpCircle className="size-3.5 text-[var(--ink-muted)]" strokeWidth={2} />
                  <span className="text-[12px] text-[var(--ink-muted)]">
                    Not currently retrying
                  </span>
                </>
              )}
            </div>

            {/* Action required */}
            {signal.actionRequired && signal.actionLabel && (
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={signal.actionHref || "#"}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-primary)] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
                >
                  {signal.actionLabel}
                  <ArrowRight className="size-3" strokeWidth={2} />
                </a>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  Creator action required
                </span>
              </div>
            )}

            {!signal.actionRequired && (
              <p className="text-[11px] text-[var(--ink-muted)]">
                No creator action needed — this should resolve automatically
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--hairline-subtle)]">
        <span className="text-[11px] text-[var(--ink-muted)]">
          Checked {timeAgo(signal.lastChecked)}
        </span>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: HealthStatus }) {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="size-4 text-[var(--recovery-green)]" strokeWidth={2} />;
    case "degraded":
      return <AlertTriangle className="size-4 text-[var(--warning-amber)]" strokeWidth={2} />;
    case "unhealthy":
      return <XCircle className="size-4 text-[var(--critical-red)]" strokeWidth={2} />;
    case "unknown":
      return <HelpCircle className="size-4 text-[var(--ink-muted)]" strokeWidth={2} />;
  }
}
