"use client";

import { useState } from "react";
import {
  Lock,
  RefreshCw,
  MailX,
  CreditCard,
  Webhook,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { ExceptionSignal, ExceptionCategory } from "@/lib/types/operations-internal";

interface ExceptionTableProps {
  exceptions: ExceptionSignal[];
}

const CATEGORY_ICONS: Record<ExceptionCategory, typeof Lock> = {
  permission_failure: Lock,
  stalled_sync: RefreshCw,
  dead_letter: MailX,
  billing_issue: CreditCard,
  webhook_lag: Webhook,
  high_cost_tenant: TrendingUp,
};

const CATEGORY_LABELS: Record<ExceptionCategory, string> = {
  permission_failure: "Permission",
  stalled_sync: "Sync",
  dead_letter: "Dead Letter",
  billing_issue: "Billing",
  webhook_lag: "Webhook",
  high_cost_tenant: "High Cost",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-[#F0F2EC] text-[#6A706A]",
  medium: "bg-[#FEF3E2] text-[#D89222]",
  high: "bg-[#F4E8E6] text-[#C64D45]",
  critical: "bg-[var(--critical)] text-white",
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-[var(--critical)]",
  investigating: "text-[var(--warning)]",
  recovering: "text-[var(--info)]",
  resolved: "text-[var(--recovery-green)]",
  escalated: "text-[var(--critical)]",
};

const FILTERS: { value: ExceptionCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "permission_failure", label: "Permission" },
  { value: "stalled_sync", label: "Sync" },
  { value: "dead_letter", label: "Dead Letter" },
  { value: "billing_issue", label: "Billing" },
  { value: "webhook_lag", label: "Webhook" },
  { value: "high_cost_tenant", label: "High Cost" },
];

export function ExceptionTable({ exceptions }: ExceptionTableProps) {
  const [filter, setFilter] = useState<ExceptionCategory | "all">("all");

  const filtered =
    filter === "all" ? exceptions : exceptions.filter((e) => e.category === filter);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
              filter === f.value
                ? "bg-[var(--ink-primary)] text-white"
                : "bg-[var(--canvas-elevated)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            {f.label}
            {f.value !== "all" && (
              <span className="ml-1 font-mono tabular-nums">
                {exceptions.filter((e) => e.category === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[8px] border border-[var(--hairline)]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]">
              <th className="px-3 py-2.5 text-left font-medium text-[var(--ink-muted)]">Category</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--ink-muted)]">Severity</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--ink-muted)]">Status</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--ink-muted)]">Org</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--ink-muted)]">Title</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--ink-muted)]">Count</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--ink-muted)]">Last Seen</th>
              <th className="px-3 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline)]">
            {filtered.map((ex) => {
              const Icon = CATEGORY_ICONS[ex.category];
              return (
                <tr
                  key={ex.id}
                  className="bg-[var(--surface)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="size-3 text-[var(--ink-muted)]" strokeWidth={2} />
                      {CATEGORY_LABELS[ex.category]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-[4px] px-1.5 py-0.5 font-medium ${SEVERITY_COLORS[ex.severity]}`}
                    >
                      {ex.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-medium ${STATUS_COLORS[ex.status]}`}>
                      {ex.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--ink-secondary)]">
                    <Link
                      href={`/internal/orgs/${ex.orgId}`}
                      className="hover:text-[var(--ink-primary)] hover:underline"
                    >
                      {ex.orgName}
                    </Link>
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-2.5 text-[var(--ink-primary)]">
                    {ex.title}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--ink-secondary)]">
                    {ex.count}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--ink-muted)]">
                    {formatTimeAgo(ex.lastSeenAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/internal/orgs/${ex.orgId}`}
                      className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    >
                      <ChevronRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[12px] text-[var(--ink-muted)]">
            No exceptions in this category
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.round((now - then) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}
