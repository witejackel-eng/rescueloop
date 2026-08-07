"use client";

import { useState } from "react";
import { Check, Clock, Edit3, Send, X, CalendarClock, MessageSquare, ShieldOff, RotateCcw, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DEMO_QUEUE_CANDIDATES, type DemoQueueCandidate } from "@/lib/demo-fixtures";
import { cn } from "@/lib/utils";

export function DemoRescueQueueSection() {
  const [candidates, setCandidates] = useState<DemoQueueCandidate[]>(DEMO_QUEUE_CANDIDATES);
  const [selectedId, setSelectedId] = useState<string | null>("dq_maya");
  const [editMessages, setEditMessages] = useState<Record<string, string>>({});
  const [showSimulated, setShowSimulated] = useState<string | null>(null);

  const selected = candidates.find((c) => c.id === selectedId) ?? null;

  function handleApprove(id: string) {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, state: "approved" } : c));
    setShowSimulated(id);
    setTimeout(() => setShowSimulated(null), 3000);
  }

  function handleSchedule(id: string) {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, state: "scheduled" } : c));
    setShowSimulated(id);
    setTimeout(() => setShowSimulated(null), 3000);
  }

  function handleDismiss(id: string) {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, state: "dismissed" } : c));
  }

  function handleUndo(id: string) {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, state: "awaiting_approval" } : c));
    setShowSimulated(null);
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "bg-[var(--critical)] text-white";
      case "high": return "bg-[var(--warning)] text-white";
      case "medium": return "bg-[var(--info)] text-white";
      default: return "bg-[var(--ink-muted)] text-white";
    }
  };

  const stateLabel = (s: string) => {
    switch (s) {
      case "awaiting_approval": return "Awaiting approval";
      case "approved": return "Approved";
      case "scheduled": return "Scheduled";
      case "sent": return "Sent";
      case "responded": return "Responded";
      case "dismissed": return "Dismissed";
      default: return s;
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-0">
      {/* Left: Queue list */}
      <div className="lg:w-[420px] lg:shrink-0 lg:border-r lg:border-[var(--hairline)]">
        <header className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-3">
          <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">Rescue Queue</h2>
          <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
            {candidates.filter((c) => c.state === "awaiting_approval").length} awaiting · {candidates.length} total
          </p>
        </header>
        <div className="divide-y divide-[var(--hairline)]">
          {candidates.map((c) => {
            const isSelected = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors",
                  isSelected ? "bg-[var(--surface)]" : "hover:bg-[var(--canvas-elevated)]",
                  c.state === "dismissed" && "opacity-50",
                )}
              >
                {/* Active indicator */}
                {isSelected && (
                  <span className="absolute left-0 top-0 h-full w-[2px] bg-[var(--recovery-green)]" aria-hidden />
                )}
                <Avatar className="size-9 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)]">
                  <AvatarFallback className="rounded-none bg-[var(--canvas-elevated)] text-[11px] font-medium text-[var(--ink-primary)]">
                    {c.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{c.name}</span>
                    <Badge className={cn("shrink-0 rounded-[2px] px-1.5 py-0 text-[9px] font-semibold uppercase", priorityColor(c.priority))}>
                      {c.priority}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">{c.trigger}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">{c.daysInactive}d inactive</span>
                    <span className="text-[var(--hairline-strong)]">·</span>
                    <span className="font-mono text-[10px] tabular-nums text-[var(--ink-secondary)]">{c.progress}%</span>
                  </div>
                </div>
                {c.state !== "awaiting_approval" && (
                  <span className={cn(
                    "mt-1 shrink-0 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]",
                    c.state === "approved" && "border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] text-[var(--recovery-green)]",
                    c.state === "scheduled" && "border-[var(--info)]/30 bg-[#E8F0FE] text-[var(--info)]",
                    c.state === "dismissed" && "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]",
                  )}>
                    {stateLabel(c.state)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Inspector */}
      <div className="min-w-0 flex-1 bg-[var(--canvas-elevated)]">
        {selected ? (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-[var(--hairline)] px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 shrink-0 rounded-none border border-[var(--hairline)] bg-[var(--surface)]">
                  <AvatarFallback className="rounded-none bg-[var(--surface)] text-[14px] font-medium text-[var(--ink-primary)]">
                    {selected.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">{selected.name}</h3>
                  <p className="text-[12px] text-[var(--ink-muted)]">{selected.course} · ${selected.monthlyValue}/mo</p>
                </div>
                <Badge className={cn("rounded-[2px] px-2 py-0.5 text-[10px] font-semibold uppercase", priorityColor(selected.priority))}>
                  {selected.priority}
                </Badge>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col divide-y divide-[var(--hairline)]">
                {/* Evidence */}
                <section className="px-6 py-4">
                  <h4 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    <MessageSquare className="size-3" /> Why RescueLoop flagged them
                  </h4>
                  <p className="mt-2 text-[14px] font-medium text-[var(--ink-primary)]">{selected.trigger}</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {selected.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--ink-secondary)]">
                        <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--recovery-green)]" />
                        {ev}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Progress */}
                <section className="px-6 py-4">
                  <h4 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    Course progress
                  </h4>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-[4px] flex-1 overflow-hidden bg-[var(--hairline)]">
                      <div className="h-full bg-[var(--recovery-green)]" style={{ width: `${selected.progress}%` }} />
                    </div>
                    <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">{selected.progress}%</span>
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
                    Last activity: {selected.daysInactive} days ago · Renewal: {selected.renewalDate}
                  </p>
                </section>

                {/* Contact History */}
                <section className="px-6 py-4">
                  <h4 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    Contact history
                  </h4>
                  {selected.contactHistory.length === 0 ? (
                    <p className="mt-2 text-[12px] text-[var(--ink-muted)]">No previous contact</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {selected.contactHistory.map((h, i) => (
                        <li key={i} className="text-[12px] text-[var(--ink-secondary)]">· {h}</li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Draft Message */}
                <section className="px-6 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                      <Edit3 className="size-3" /> Draft support message
                    </h4>
                  </div>
                  <Textarea
                    value={editMessages[selected.id] ?? selected.draftMessage}
                    onChange={(e) => setEditMessages((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                    rows={5}
                    className="mt-2 rounded-none border-[var(--hairline)] bg-[var(--surface)] font-sans text-[13px] leading-relaxed text-[var(--ink-primary)] focus-visible:ring-[var(--recovery-green)]/30"
                  />
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                    {(editMessages[selected.id] ?? selected.draftMessage).length} chars
                    {(editMessages[selected.id] ?? selected.draftMessage) !== selected.draftMessage ? " · edited" : " · template"}
                  </p>
                </section>

                {/* Cooldown */}
                <section className="px-6 py-4">
                  <h4 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    <ShieldOff className="size-3" /> Safety & cooldown
                  </h4>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Cooldown</dt>
                      <dd className="mt-1 text-[13px] text-[var(--ink-primary)]">{selected.cooldownUntil ?? "None"}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Quiet hours</dt>
                      <dd className="mt-1 text-[13px] text-[var(--ink-primary)]">20:00–08:00</dd>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 border-t border-[var(--hairline)] bg-[var(--surface)] px-5 py-3">
              {showSimulated === selected.id && (
                <div className="mb-2 flex items-center gap-2 rounded-[4px] bg-[var(--recovery-light)] px-3 py-2 text-[12px] text-[var(--recovery-green)]">
                  <Check className="size-3.5" strokeWidth={2.5} />
                  <span className="font-medium">Simulated approval</span>
                  <span className="text-[var(--ink-muted)]">— Nothing was sent.</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {selected.state === "awaiting_approval" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(selected.id)}
                      className="h-9 flex-1 rounded-none bg-[var(--ink-primary)] text-[var(--canvas)] hover:bg-[var(--ink-primary)]/90"
                    >
                      <Send className="size-3.5" />
                      Approve & send
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSchedule(selected.id)}
                      className="h-9 rounded-none border-[var(--hairline)] bg-[var(--surface)] px-3 text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)]"
                    >
                      <CalendarClock className="size-3.5" />
                      Schedule
                    </Button>
                  </>
                )}
                {(selected.state === "approved" || selected.state === "scheduled") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUndo(selected.id)}
                    className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
                  >
                    <RotateCcw className="size-3.5" />
                    Undo
                  </Button>
                )}
                {selected.state !== "dismissed" && selected.state === "awaiting_approval" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(selected.id)}
                    className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
                  >
                    <X className="size-3.5" />
                    Dismiss
                  </Button>
                )}
                {selected.state === "dismissed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUndo(selected.id)}
                    className="h-8 rounded-none px-3 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)]"
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-[13px] text-[var(--ink-muted)]">
            Select a student to review
          </div>
        )}
      </div>
    </div>
  );
}
