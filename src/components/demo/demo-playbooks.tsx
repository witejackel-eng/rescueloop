"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DEMO_PLAYBOOKS, type DemoPlaybook } from "@/lib/demo-fixtures";
import { cn } from "@/lib/utils";

export function DemoPlaybooksSection() {
  const [playbooks, setPlaybooks] = useState<DemoPlaybook[]>(DEMO_PLAYBOOKS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCooldown, setEditCooldown] = useState("");
  const [simMsg, setSimMsg] = useState<string | null>(null);

  function handleToggle(id: string) {
    setPlaybooks((prev) => prev.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
    setSimMsg(id);
    setTimeout(() => setSimMsg(null), 2000);
  }

  function handleSaveCooldown(id: string) {
    setPlaybooks((prev) => prev.map((p) => p.id === id ? { ...p, cooldown: editCooldown } : p));
    setEditingId(null);
    setSimMsg(id);
    setTimeout(() => setSimMsg(null), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-[var(--ink-secondary)]">
        Creator-defined rules that determine when RescueLoop acts. All changes are simulated — nothing is saved.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {playbooks.map((pb) => (
          <Card key={pb.id} className={cn(
            "border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden",
            !pb.enabled && "opacity-60",
          )}>
            <header className="border-b border-[var(--hairline)] px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">{pb.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-[2px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-0 text-[10px] font-mono tabular-nums text-[var(--ink-secondary)]">
                    {pb.studentsDetected} detected
                  </Badge>
                  <Switch
                    checked={pb.enabled}
                    onCheckedChange={() => handleToggle(pb.id)}
                    aria-label={`${pb.enabled ? "Disable" : "Enable"} ${pb.name}`}
                  />
                </div>
              </div>
            </header>
            <div className="divide-y divide-[var(--hairline)]">
              <div className="px-5 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Criteria</dt>
                <dd className="mt-1 text-[13px] text-[var(--ink-primary)]">{pb.criteria}</dd>
              </div>
              <div className="px-5 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Cooldown</dt>
                {editingId === pb.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editCooldown}
                      onChange={(e) => setEditCooldown(e.target.value)}
                      className="flex-1 rounded-none border border-[var(--hairline)] bg-[var(--canvas)] px-2 py-1 text-[13px] text-[var(--ink-primary)] focus-visible:ring-[var(--recovery-green)]/30"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCooldown(pb.id)}
                      className="text-[12px] text-[var(--recovery-green)] hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-[12px] text-[var(--ink-muted)] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="text-[13px] text-[var(--ink-primary)]">{pb.cooldown}</span>
                    <button
                      type="button"
                      onClick={() => { setEditingId(pb.id); setEditCooldown(pb.cooldown); }}
                      className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                    >
                      Edit
                    </button>
                  </dd>
                )}
              </div>
              <div className="px-5 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Quiet hours</dt>
                <dd className="mt-1 text-[13px] text-[var(--ink-primary)]">{pb.quietHours}</dd>
              </div>
              <div className="px-5 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Message template</dt>
                <dd className="mt-1 text-[13px] text-[var(--ink-secondary)]">{pb.messageTemplate}</dd>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Approval behavior</span>
                <Badge className={cn(
                  "rounded-[2px] border px-2 py-0.5 text-[10px] font-medium",
                  pb.approvalBehavior === "manual" ? "border-[var(--warning)]/30 bg-[var(--warning-light)] text-[var(--warning)]" : "border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]",
                )}>
                  {pb.approvalBehavior}
                </Badge>
              </div>
            </div>
            {simMsg === pb.id && (
              <div className="border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-2 text-[11px] text-[var(--ink-muted)] italic">
                Simulation only — change is local
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
