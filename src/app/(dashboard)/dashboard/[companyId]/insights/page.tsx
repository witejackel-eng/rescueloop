"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle } from "lucide-react";

const FRICTION = [
  { lesson: "Lesson 7", stallRate: "24%", affected: 18, average: "10%", multiplier: "2.4×", detail: "Introduction to Client Acquisition" },
  { lesson: "Lesson 14", stallRate: "19%", affected: 14, average: "10%", multiplier: "1.9×", detail: "Pricing Your Services" },
  { lesson: "Lesson 21", stallRate: "16%", affected: 12, average: "10%", multiplier: "1.6×", detail: "Scaling Delivery Capacity" },
];

const PATTERNS = [
  { name: "Response pattern", detail: "68% of students choose 'Continue course', 18% request help, 9% report blockers, 5% opt out" },
  { name: "Activation pattern", detail: "Students who complete 3+ lessons in the first week have 4.2× lower stall rate" },
  { name: "Re-engagement pattern", detail: "Students contacted within 7 days of stall resume 62% of the time" },
];

export default function InsightsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Insights</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Course friction analysis and student behavior patterns</p>
      </div>

      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-[var(--warning)]" />
          <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Course Friction — Highest Stall Concentration</h2>
        </div>
        <div className="mt-4 space-y-3">
          {FRICTION.map((f, i) => (
            <div key={i} className="flex items-start justify-between rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-4">
              <div>
                <span className="text-[14px] font-medium text-[var(--ink-primary)]">{f.lesson}</span>
                <span className="text-[var(--ink-muted)]"> · </span>
                <span className="text-[12px] text-[var(--ink-muted)]">{f.detail}</span>
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{f.affected} affected students · Course average: {f.average}</p>
              </div>
              <div className="text-right">
                <span className="font-serif text-[20px] text-[var(--warning)]">{f.stallRate}</span>
                <p className="text-[10px] text-[var(--warning)]">{f.multiplier} average</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-[var(--ink-muted)]">Sample size: 742 students · Data is illustrative</p>
      </Card>

      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Behavior Patterns</h2>
        <div className="mt-4 space-y-3">
          {PATTERNS.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-[var(--info)]" />
              <div>
                <span className="text-[13px] font-medium text-[var(--ink-primary)]">{p.name}</span>
                <p className="mt-0.5 text-[12px] text-[var(--ink-secondary)]">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-[var(--ink-muted)]">No guaranteed recommendations · Methodology: cohort comparison with historical baseline</p>
      </Card>
    </div>
  );
}
