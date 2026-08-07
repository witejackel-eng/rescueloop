"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Clock, Moon, MessageSquare, Shield, Edit3, Check } from "lucide-react";

const PLAYBOOKS = [
  {
    name: "Never started", trigger: "Student enrolled but 0 lessons completed after 7 days",
    cooldown: 7, quietHours: 10, approvalMode: "Manual",
    template: "Hi {name}, welcome to {course}! Would you like help getting started?",
    enabled: true,
  },
  {
    name: "Early stall", trigger: "Student completed <20% of lessons and inactive for 5+ days",
    cooldown: 5, quietHours: 10, approvalMode: "Manual",
    template: "Hi {name}, I noticed you've paused early in {course}. Can I help remove any blockers?",
    enabled: true,
  },
  {
    name: "Mid-course stall", trigger: "Student was progressing but inactive for 7+ days after 20% completion",
    cooldown: 7, quietHours: 10, approvalMode: "Manual",
    template: "Hi {name}, you were making great progress! Is there anything I can help with?",
    enabled: true,
  },
  {
    name: "Renewal review", trigger: "Active membership with renewal approaching and recent inactivity",
    cooldown: 3, quietHours: 10, approvalMode: "Auto",
    template: "Hey {name}, your membership renews soon. I'd love to help you get the most from {course}.",
    enabled: false,
  },
];

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState(PLAYBOOKS);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Playbooks</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Intervention rules that determine when and how students are contacted</p>
      </div>

      <div className="space-y-4">
        {playbooks.map((p, i) => (
          <Card key={i} className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="size-5 text-[var(--ink-secondary)]" />
                <div>
                  <h2 className="text-[15px] font-medium text-[var(--ink-primary)]">{p.name}</h2>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{p.trigger}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`rounded-[3px] text-[10px] ${p.approvalMode === "Auto" ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]" : ""}`}
                >
                  {p.approvalMode}
                </Badge>
                <Switch
                  checked={p.enabled}
                  onCheckedChange={(checked) => {
                    const next = [...playbooks];
                    next[i] = { ...next[i], enabled: checked };
                    setPlaybooks(next);
                  }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-[var(--ink-muted)]" />
                <div>
                  <span className="text-[10px] text-[var(--ink-muted)]">Cooldown</span>
                  <p className="text-[13px] text-[var(--ink-primary)]">{p.cooldown} days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Moon className="size-3.5 text-[var(--ink-muted)]" />
                <div>
                  <span className="text-[10px] text-[var(--ink-muted)]">Quiet hours</span>
                  <p className="text-[13px] text-[var(--ink-primary)]">{p.quietHours}pm–8am</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="size-3.5 text-[var(--ink-muted)]" />
                <div>
                  <span className="text-[10px] text-[var(--ink-muted)]">Approval</span>
                  <p className="text-[13px] text-[var(--ink-primary)]">{p.approvalMode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-[var(--ink-muted)]" />
                <div>
                  <span className="text-[10px] text-[var(--ink-muted)]">Status</span>
                  <p className={`text-[13px] ${p.enabled ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]"}`}>
                    {p.enabled ? "Active" : "Disabled"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Message template</span>
              <div className="mt-1 rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-[12px] text-[var(--ink-secondary)]">
                {p.template}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
