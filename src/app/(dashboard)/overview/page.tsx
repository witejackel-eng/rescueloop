"use client";

import { useState } from "react";
import { COURSE } from "@/lib/mock-data";
import { OutcomeRegion } from "@/components/rescueloop/overview/outcome-region";
import { RecoveryPulse } from "@/components/rescueloop/overview/recovery-pulse";
import { PriorityList } from "@/components/rescueloop/overview/priority-list";
import { RecoveryTimeline } from "@/components/rescueloop/overview/recovery-timeline";
import { FrictionMiniMap } from "@/components/rescueloop/overview/friction-mini-map";
import { SystemStatus } from "@/components/rescueloop/overview/system-status";
import { QuickActions } from "@/components/rescueloop/overview/quick-actions";

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

export default function OverviewPage() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[28px] leading-none text-[var(--ink-primary)]">
            Recovery Pulse
          </h1>
          <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
            {COURSE.name} · last sync 2 minutes ago
          </p>
        </div>

        {/* Period selector — segmented control (static, 30 days selected) */}
        <div
          role="tablist"
          aria-label="Reporting period"
          className="inline-flex items-center gap-0.5 self-start rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0.5 sm:self-auto"
        >
          {PERIODS.map((p) => {
            const active = p.value === period;
            return (
              <button
                key={p.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPeriod(p.value)}
                className={`relative rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors ${
                  active
                    ? "text-[var(--ink-primary)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-[6px] bg-[var(--surface)] shadow-[0_1px_2px_rgba(17,17,15,0.06),0_0_0_1px_var(--hairline)]" />
                )}
                <span className="relative">{p.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Editorial outcome region */}
      <OutcomeRegion />

      {/* 3. Recovery Pulse — interactive flow visual */}
      <RecoveryPulse />

      {/* 4. Two-column workspace */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column — main */}
        <div className="flex flex-col gap-8">
          {/* 4a. Today's priorities */}
          <PriorityList />

          {/* 4b. Live recovery timeline */}
          <RecoveryTimeline />

          {/* 4c. Course friction signal */}
          <FrictionMiniMap />
        </div>

        {/* Right column — sidebar */}
        <aside className="flex flex-col gap-6">
          {/* 4d. System status */}
          <SystemStatus />

          {/* 4e. Quick actions */}
          <QuickActions />
        </aside>
      </div>
    </div>
  );
}
