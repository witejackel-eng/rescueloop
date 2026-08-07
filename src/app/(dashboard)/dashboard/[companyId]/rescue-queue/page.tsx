"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  Edit3,
  CheckCircle2,
  Calendar,
  X,
  ChevronRight,
} from "lucide-react";

const CANDIDATES = [
  {
    name: "Maya Thompson", course: "Agency Growth System", membership: "Active",
    lastActivity: "8 days ago", progress: "68%", trigger: "Mid-course stall",
    urgency: "High", evidence: "Completed 20/29 lessons, stalled at Lesson 21",
    cooldown: "3 days remaining", contacts: 2,
    message: "Hi Maya, I noticed you've been making great progress through the Agency Growth System! You've completed 20 lessons so far. Is there anything I can help with to get you back on track?",
  },
  {
    name: "Devon Park", course: "Agency Growth System", membership: "Active — renews in 5 days",
    lastActivity: "14 days ago", progress: "45%", trigger: "Inactive near renewal",
    urgency: "Urgent", evidence: "Last activity 14 days ago, membership renewal approaching",
    cooldown: "None", contacts: 1,
    message: "Hey Devon, your membership is coming up for renewal soon and I noticed you haven't been active recently. I'd love to help you get the most from the course — what can I do?",
  },
  {
    name: "Sara Klein", course: "Agency Growth System", membership: "Active",
    lastActivity: "21 days ago", progress: "0%", trigger: "Never started",
    urgency: "Medium", evidence: "Enrolled 21 days ago, 0 lessons completed",
    cooldown: "None", contacts: 0,
    message: "Hi Sara! Welcome to Agency Growth System. I noticed you haven't started yet — would you like some guidance on where to begin?",
  },
  {
    name: "Jamal Wright", course: "Agency Growth System", membership: "Active",
    lastActivity: "3 days ago", progress: "52%", trigger: "Review required",
    urgency: "Medium", evidence: "Completed 15/29 lessons, responded to previous outreach",
    cooldown: "None", contacts: 3,
    message: "Hi Jamal, thanks for your earlier response. I'm checking in to see how things are going with Lesson 16.",
  },
];

export default function RescueQueuePage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [actionState, setActionState] = useState<Record<number, string>>({});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Rescue Queue</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
          {CANDIDATES.length} students need attention
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Queue list */}
        <div className="space-y-3 lg:col-span-3">
          {CANDIDATES.map((c, i) => (
            <Card
              key={i}
              className={`cursor-pointer rounded-[8px] border bg-[var(--surface)] p-4 transition-all ${
                selected === i ? "border-[var(--recovery-green)]/40 shadow-sm" : "border-[var(--hairline)] hover:border-[var(--hairline)] hover:shadow-sm"
              }`}
              onClick={() => setSelected(i)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[var(--ink-primary)]">{c.name}</span>
                    <Badge
                      variant="outline"
                      className={`rounded-[3px] text-[9px] ${
                        c.urgency === "Urgent" ? "border-[var(--critical)]/30 text-[var(--critical)]" :
                        c.urgency === "High" ? "border-[var(--warning)]/30 text-[var(--warning)]" :
                        "border-[var(--info)]/30 text-[var(--info)]"
                      }`}
                    >
                      {c.urgency}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{c.trigger}</p>
                </div>
                <ChevronRight className="size-4 text-[var(--ink-muted)]" />
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--ink-muted)]">
                <span>{c.course}</span>
                <span>·</span>
                <span>{c.lastActivity}</span>
                <span>·</span>
                <span>{c.progress} complete</span>
              </div>
              {actionState[i] && (
                <div className="mt-3 rounded-[4px] bg-[var(--recovery-green)]/10 px-3 py-2 text-[11px] text-[var(--recovery-green)]">
                  {actionState[i]}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Inspector */}
        <div className="lg:col-span-2">
          {selected !== null ? (
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              {(() => {
                const c = CANDIDATES[selected];
                return (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-[18px] text-[var(--ink-primary)]">{c.name}</h2>
                      <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">{c.course}</p>
                    </div>

                    <div className="space-y-2 text-[12px]">
                      {[
                        ["Membership", c.membership],
                        ["Last activity", c.lastActivity],
                        ["Progress", c.progress],
                        ["Trigger", c.trigger],
                        ["Cooldown", c.cooldown],
                        ["Previous contacts", String(c.contacts)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-[var(--ink-muted)]">{label}</span>
                          <span className="text-[var(--ink-primary)]">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Evidence</span>
                      <p className="mt-1 text-[12px] text-[var(--ink-secondary)]">{c.evidence}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Draft message</span>
                      <div className="mt-1 rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-[12px] text-[var(--ink-secondary)]">
                        {c.message}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-[6px] text-[12px] bg-[var(--recovery-green)] hover:bg-[var(--recovery-green)]/90"
                        onClick={(e) => { e.stopPropagation(); setActionState(prev => ({ ...prev, [selected]: "Approved — sending to student" })); }}
                      >
                        <CheckCircle2 className="mr-1.5 size-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-[6px] text-[12px]"
                        onClick={(e) => { e.stopPropagation(); setActionState(prev => ({ ...prev, [selected]: "Scheduled for later" })); }}
                      >
                        <Calendar className="mr-1.5 size-3.5" /> Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-[6px] text-[12px]"
                        onClick={(e) => { e.stopPropagation(); setActionState(prev => ({ ...prev, [selected]: "Dismissed" })); }}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </Card>
          ) : (
            <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] text-[13px] text-[var(--ink-muted)]">
              Select a candidate to view details
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
