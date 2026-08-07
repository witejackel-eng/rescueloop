"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  DEMO_FRICTION_POINTS,
  DEMO_RESPONSE_PATTERNS,
  DEMO_ACTIVATION_PATTERNS,
  DEMO_LESSON_BARS,
} from "@/lib/demo-fixtures";

export function DemoInsightsSection() {
  const totalResponses = DEMO_RESPONSE_PATTERNS.continueCourse + DEMO_RESPONSE_PATTERNS.needHelp + DEMO_RESPONSE_PATTERNS.blocked + DEMO_RESPONSE_PATTERNS.stopReminders;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13px] text-[var(--ink-secondary)]">
        Course intelligence and student behavior patterns. Data is illustrative — sample sizes noted.
      </p>

      {/* Course friction */}
      <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <header className="border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">Course Friction</h3>
          <p className="mt-1 text-[12px] text-[var(--ink-muted)]">Lessons where students stall at above-average rates</p>
        </header>
        <div className="px-5 py-5">
          <div className="flex h-16 items-end gap-1.5">
            {DEMO_LESSON_BARS.map((l) => {
              const max = Math.max(...DEMO_LESSON_BARS.map((b) => b.stallRate));
              const heightPct = (l.stallRate / max) * 100;
              const isHigh = l.stallRate >= 18;
              return (
                <div key={l.lesson} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex w-full items-end justify-center" style={{ height: "100%" }}>
                    <div
                      className={`w-full ${isHigh ? "bg-[var(--warning)]" : "bg-[var(--ink-primary)]/15"}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`font-mono text-[9px] tabular-nums ${isHigh ? "text-[var(--warning)]" : "text-[var(--ink-muted)]"}`}>
                    {l.lesson}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          {DEMO_FRICTION_POINTS.map((fp) => (
            <div key={fp.lesson} className="px-5 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-[14px] font-medium text-[var(--ink-primary)]">{fp.lesson}</h4>
                <span className="font-mono tabular-nums text-[14px] text-[var(--warning)]">{fp.stallRate}%</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[12px] text-[var(--ink-muted)]">
                <span>{fp.affectedStudents} affected students</span>
                <span className="text-[var(--hairline-strong)]">·</span>
                <span>Course average {fp.courseAverage}%</span>
                <span className="text-[var(--hairline-strong)]">·</span>
                <span className="font-mono tabular-nums text-[var(--ink-primary)]">
                  {(fp.stallRate / fp.courseAverage).toFixed(1)}×
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Response patterns */}
        <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
          <header className="border-b border-[var(--hairline)] px-5 py-3">
            <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">Response Patterns</h3>
            <p className="mt-1 text-[12px] text-[var(--ink-muted)]">n = {totalResponses} responses</p>
          </header>
          <div className="divide-y divide-[var(--hairline)]">
            {[
              { label: "Continue course", count: DEMO_RESPONSE_PATTERNS.continueCourse, color: "bg-[var(--recovery-green)]" },
              { label: "I need help", count: DEMO_RESPONSE_PATTERNS.needHelp, color: "bg-[var(--warning)]" },
              { label: "I'm blocked", count: DEMO_RESPONSE_PATTERNS.blocked, color: "bg-[var(--critical)]" },
              { label: "Stop reminders", count: DEMO_RESPONSE_PATTERNS.stopReminders, color: "bg-[var(--ink-muted)]" },
            ].map((item) => (
              <div key={item.label} className="px-5 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-[var(--ink-primary)]">{item.label}</span>
                  <span className="font-mono tabular-nums text-[14px] text-[var(--ink-primary)]">{item.count}</span>
                </div>
                <div className="mt-2 h-[4px] w-full bg-[var(--hairline-subtle)]">
                  <div className={cn("h-full", item.color)} style={{ width: `${(item.count / totalResponses) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activation patterns */}
        <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
          <header className="border-b border-[var(--hairline)] px-5 py-3">
            <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">Activation Patterns</h3>
            <p className="mt-1 text-[12px] text-[var(--ink-muted)]">n = {DEMO_ACTIVATION_PATTERNS.totalStudents} students</p>
          </header>
          <div className="divide-y divide-[var(--hairline)]">
            {[
              { label: "Actively progressing", count: DEMO_ACTIVATION_PATTERNS.activelyProgressing, color: "bg-[var(--recovery-green)]" },
              { label: "Near completion", count: DEMO_ACTIVATION_PATTERNS.nearCompletion, color: "bg-[var(--info)]" },
              { label: "Started but stalled", count: DEMO_ACTIVATION_PATTERNS.startedButStalled, color: "bg-[var(--warning)]" },
              { label: "Never started", count: DEMO_ACTIVATION_PATTERNS.neverStarted, color: "bg-[var(--critical)]" },
            ].map((item) => (
              <div key={item.label} className="px-5 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-[var(--ink-primary)]">{item.label}</span>
                  <span className="font-mono tabular-nums text-[14px] text-[var(--ink-primary)]">{item.count}</span>
                </div>
                <div className="mt-2 h-[4px] w-full bg-[var(--hairline-subtle)]">
                  <div className={cn("h-full", item.color)} style={{ width: `${(item.count / DEMO_ACTIVATION_PATTERNS.totalStudents) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Methodology note */}
      <div className="border border-dashed border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-4">
        <p className="text-[12px] text-[var(--ink-muted)]">
          <span className="font-medium text-[var(--ink-secondary)]">Methodology:</span> Stall rates are calculated from students who started the lesson but did not complete it within 14 days. Friction points are lessons with stall rates &gt;1.5× the course average. All sample sizes are shown. Data is illustrative — not from real customer accounts.
        </p>
      </div>
    </div>
  );
}


