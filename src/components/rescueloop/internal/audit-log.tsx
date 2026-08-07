"use client";

import { CheckCircle2, XCircle, Clock, MinusCircle } from "lucide-react";
import type { AuditEntry, AuditResult } from "@/lib/types/operations-internal";

interface AuditLogProps {
  entries: AuditEntry[];
  maxRows?: number;
}

const RESULT_CONFIG: Record<AuditResult, { icon: typeof CheckCircle2; color: string; label: string }> = {
  success: { icon: CheckCircle2, color: "text-[var(--recovery-green)]", label: "Success" },
  failed: { icon: XCircle, color: "text-[var(--critical)]", label: "Failed" },
  pending: { icon: Clock, color: "text-[var(--warning)]", label: "Pending" },
  idempotent_noop: { icon: MinusCircle, color: "text-[var(--ink-muted)]", label: "No-op (idempotent)" },
};

export function AuditLog({ entries, maxRows = 50 }: AuditLogProps) {
  const visible = entries.slice(0, maxRows);

  return (
    <div className="flex flex-col gap-0 rounded-[8px] border border-[var(--hairline)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-4 py-3">
        <h3 className="font-serif text-[14px] text-[var(--ink-primary)]">Audit Trail</h3>
        <span className="text-[11px] text-[var(--ink-muted)]">
          {entries.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Timestamp</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Action</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Actor</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Target</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Result</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--ink-muted)]">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline)]">
            {visible.map((entry) => {
              const rc = RESULT_CONFIG[entry.result];
              const ResultIcon = rc.icon;
              return (
                <tr
                  key={entry.id}
                  className="bg-[var(--surface)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-[var(--ink-muted)]">
                    {new Date(entry.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </td>
                  <td className="px-3 py-2 font-medium text-[var(--ink-primary)]">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full bg-[var(--info)]" />
                      {entry.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--ink-secondary)]">
                    {entry.actor}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--ink-muted)]">
                    {entry.targetResourceId.length > 20
                      ? entry.targetResourceId.slice(0, 20) + "…"
                      : entry.targetResourceId}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 ${rc.color}`}>
                      <ResultIcon className="size-3" strokeWidth={2} />
                      {rc.label}
                    </span>
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-[var(--ink-muted)]">
                    {entry.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length > maxRows && (
        <div className="border-t border-[var(--hairline)] px-4 py-2 text-center text-[11px] text-[var(--ink-muted)]">
          Showing {maxRows} of {entries.length} entries
        </div>
      )}
    </div>
  );
}
