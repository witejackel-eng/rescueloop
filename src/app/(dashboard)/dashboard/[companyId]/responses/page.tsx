"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock } from "lucide-react";

const RESPONSES = [
  { student: "Maya Thompson", course: "Agency Growth System", response: "Continue course", followUp: "Enrolled in next module", time: "2 min ago" },
  { student: "Jamal Wright", course: "Agency Growth System", response: "Continue course", followUp: "Resumed lessons", time: "1 hour ago" },
  { student: "Priya Sharma", course: "Client Breakthrough", response: "I need help", followUp: "Support request created", time: "3 hours ago" },
  { student: "Marcus Chen", course: "Agency Growth System", response: "I'm blocked", followUp: "Blocker identified: technical issue", time: "5 hours ago" },
  { student: "Aisha Patel", course: "Freelance Foundations", response: "Continue course", followUp: "Progress resumed", time: "8 hours ago" },
  { student: "Alex Kim", course: "Agency Growth System", response: "Stop reminders", followUp: "Reminders paused", time: "1 day ago" },
  { student: "Taylor Brown", course: "Agency Growth System", response: "Continue course", followUp: "On track", time: "2 days ago" },
  { student: "Jordan Lee", course: "Freelance Foundations", response: "I need help", followUp: "Awaiting creator response", time: "3 days ago" },
];

export default function ResponsesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Responses</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">{RESPONSES.length} student responses received</p>
      </div>

      <div className="space-y-3">
        {RESPONSES.map((r, i) => (
          <Card key={i} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 size-4 text-[var(--ink-muted)]" />
                <div>
                  <span className="text-[13px] font-medium text-[var(--ink-primary)]">{r.student}</span>
                  <span className="text-[var(--ink-muted)]"> · </span>
                  <span className="text-[12px] text-[var(--ink-muted)]">{r.course}</span>
                  <div className="mt-1.5">
                    <Badge
                      variant="outline"
                      className={`rounded-[3px] text-[10px] ${
                        r.response === "Continue course" ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]" :
                        r.response === "I need help" ? "border-[var(--warning)]/30 text-[var(--warning)]" :
                        r.response === "I'm blocked" ? "border-[var(--critical)]/30 text-[var(--critical)]" :
                        "border-[var(--ink-muted)]/30 text-[var(--ink-muted)]"
                      }`}
                    >
                      {r.response}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">Follow-up: {r.followUp}</p>
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-[var(--ink-muted)]">{r.time}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
