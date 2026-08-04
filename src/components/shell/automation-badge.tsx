"use client";

import { cn } from "@/lib/utils";
import type { AutomationState } from "@/lib/types";

const STATE_META: Record<AutomationState, { label: string; dot: string; text: string }> = {
  audit_only: { label: "Audit only", dot: "bg-[var(--ink-muted)]", text: "text-[var(--ink-secondary)]" },
  manual_approval: { label: "Manual approval", dot: "bg-[var(--warning)]", text: "text-[var(--ink-secondary)]" },
  automatic: { label: "Automatic", dot: "bg-[var(--recovery-green)]", text: "text-[var(--ink-secondary)]" },
  paused: { label: "Paused", dot: "bg-[var(--critical)]", text: "text-[var(--critical)]" },
  connection_problem: { label: "Connection issue", dot: "bg-[var(--critical)]", text: "text-[var(--critical)]" },
};

export function AutomationStateBadge({ state }: { state: AutomationState }) {
  const meta = STATE_META[state];
  return (
    <div className={cn("hidden items-center gap-1.5 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-2 py-1 sm:flex", meta.text)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      <span className="text-[11px] font-medium">{meta.label}</span>
    </div>
  );
}
