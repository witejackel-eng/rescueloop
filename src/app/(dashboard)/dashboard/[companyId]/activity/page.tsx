"use client";

import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const EVENTS = [
  { event: "Sync completed", detail: "742 members, 8 courses, full sync", time: "23 min ago", icon: CheckCircle2, color: "text-[var(--recovery-green)]" },
  { event: "Candidate detected", detail: "Jamal W. stalled at Lesson 7", time: "8 min ago", icon: AlertCircle, color: "text-[var(--warning)]" },
  { event: "Draft prepared", detail: "Message generated for Sara K.", time: "12 min ago", icon: Clock, color: "text-[var(--info)]" },
  { event: "Creator edited", detail: "Maya T. message edited by creator", time: "15 min ago", icon: Activity, color: "text-[var(--ink-secondary)]" },
  { event: "Approved", detail: "Message to Devon P. approved", time: "18 min ago", icon: CheckCircle2, color: "text-[var(--recovery-green)]" },
  { event: "Student opened RescueLoop experience", detail: "Maya T. clicked rescue link", time: "20 min ago", icon: Activity, color: "text-[var(--recovery-green)]" },
  { event: "Student responded", detail: "Maya T. chose 'Continue course'", time: "2 min ago", icon: CheckCircle2, color: "text-[var(--recovery-green)]" },
  { event: "Course activity observed", detail: "Aisha P. completed Lesson 26", time: "1 hour ago", icon: Activity, color: "text-[var(--ink-secondary)]" },
];

export default function ActivityPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Activity</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Operational timeline for your RescueLoop workspace</p>
      </div>

      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="space-y-4">
          {EVENTS.map((e, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--canvas)] ${e.color}`}>
                <e.icon className="size-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium text-[var(--ink-primary)]">{e.event}</span>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{e.detail}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[var(--ink-muted)]">{e.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
