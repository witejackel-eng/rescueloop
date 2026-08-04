"use client";

import { Calendar, CheckCircle2 } from "lucide-react";
import { useDemoStore } from "@/features/demo-engine/demo-store";
import { automationStateMeta } from "@/lib/format";

const PLAN_USED = 78;
const PLAN_LIMIT = 100;
const RESET_DATE = "Feb 12";

export function SystemStatus() {
  const automationState = useDemoStore((s) => s.automationState);
  const meta = automationStateMeta[automationState];
  const usagePct = (PLAN_USED / PLAN_LIMIT) * 100;

  return (
    <section className="border border-[var(--hairline)] bg-[var(--surface)]">
      <header className="border-b border-[var(--hairline)] px-4 py-3">
        <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
          System status
        </h3>
      </header>

      <div className="divide-y divide-[var(--hairline)]">
        {/* Automation state */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[12px] text-[var(--ink-muted)]">Automation</span>
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--ink-primary)]">
            <span className={`size-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        {/* Sync status */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[12px] text-[var(--ink-muted)]">Sync</span>
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--ink-secondary)]">
            <CheckCircle2 className="size-3 text-[var(--recovery-green)]" strokeWidth={2.25} />
            <span className="font-mono tabular-nums">2 min ago</span>
          </span>
        </div>

        {/* Plan usage */}
        <div className="px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-[var(--ink-muted)]">Plan usage</span>
            <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
              {PLAN_USED} / {PLAN_LIMIT}
            </span>
          </div>
          <div className="mt-2 h-[3px] w-full bg-[var(--hairline-subtle)]">
            <div
              className="h-full bg-[var(--ink-primary)]"
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
            interventions this month
          </p>
        </div>

        {/* Reset */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[12px] text-[var(--ink-muted)]">
            Usage resets
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[12px] tabular-nums text-[var(--ink-secondary)]">
            <Calendar className="size-3" strokeWidth={2} />
            {RESET_DATE}
          </span>
        </div>
      </div>
    </section>
  );
}
