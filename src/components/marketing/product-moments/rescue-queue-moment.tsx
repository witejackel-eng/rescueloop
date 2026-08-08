"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, ShieldCheck, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { scrollReveal, staggerContainer, easeReveal } from "@/design-system/motion";
import { ScrollReveal } from "@/components/marketing/shared/scroll-reveal";
import { SectionEyebrow } from "@/components/marketing/shared/section-eyebrow";

// ── Queue data ──────────────────────────────────────────────

interface QueueRow {
  id: string;
  name: string;
  initials: string;
  trigger: string;
  progress: number;
  daysInactive: number;
  priority: "high" | "urgent" | "medium";
  momentum: "slowing" | "stopped" | "steady";
  membershipValue: number;
  evidence?: {
    previousPace: string;
    lastActivity: string;
    lastIntervention: string;
    remindersAllowed: boolean;
  };
}

const QUEUE_ROWS: QueueRow[] = [
  {
    id: "q1",
    name: "Maya Thompson",
    initials: "MT",
    trigger: "Mid-course stall",
    progress: 38,
    daysInactive: 8,
    priority: "high",
    momentum: "slowing",
    membershipValue: 79,
    evidence: {
      previousPace: "3.2 lessons/week",
      lastActivity: "No activity since Module 4",
      lastIntervention: "No recent intervention",
      remindersAllowed: true,
    },
  },
  {
    id: "q2",
    name: "Devon Park",
    initials: "DP",
    trigger: "Near renewal",
    progress: 62,
    daysInactive: 4,
    priority: "urgent",
    momentum: "stopped",
    membershipValue: 79,
  },
  {
    id: "q3",
    name: "Sara Klein",
    initials: "SK",
    trigger: "Early stall",
    progress: 14,
    daysInactive: 12,
    priority: "medium",
    momentum: "slowing",
    membershipValue: 49,
  },
  {
    id: "q4",
    name: "Jamal Wright",
    initials: "JW",
    trigger: "Cancellation review",
    progress: 47,
    daysInactive: 6,
    priority: "urgent",
    momentum: "stopped",
    membershipValue: 79,
  },
];

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  urgent: {
    bg: "bg-[var(--critical-light)]",
    text: "text-[var(--critical)]",
    border: "border-[var(--critical)]/20",
  },
  high: {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    border: "border-[var(--warning)]/20",
  },
  medium: {
    bg: "bg-[var(--recovery-light)]",
    text: "text-[var(--info)]",
    border: "border-[var(--info)]/20",
  },
};

const MOMENTUM_DOT: Record<string, string> = {
  stopped: "bg-[var(--critical)]",
  slowing: "bg-[var(--warning)]",
  steady: "bg-[var(--info)]",
};

// ── Component ───────────────────────────────────────────────

export function RescueQueueMoment() {
  const reduced = useReducedMotion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <section
      id="rescue-queue-moment"
      className="border-t border-[var(--hairline)] bg-[var(--section-white)] py-20 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <ScrollReveal>
          <SectionEyebrow>Rescue Queue</SectionEyebrow>
          <h2 className="mt-6 max-w-[28ch] font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
            Every at-risk member in one{" "}
            <span className="italic text-[var(--ink-secondary)]">reviewable list.</span>
          </h2>
          <p className="mt-6 max-w-[56ch] text-[15px] leading-relaxed text-[var(--ink-secondary)] lg:text-[16px]">
            No churn scores, no guesswork. Each row shows the evidence — progress,
            inactivity, and renewal proximity — so you approve with confidence. Expand
            any row to inspect the full signal before anything is sent.
          </p>
        </ScrollReveal>

        {/* Product surface */}
        <ScrollReveal delay={0.15}>
          <div className="mt-14 border border-[var(--hairline)] bg-[var(--surface)] shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Awaiting approval
                </span>
                <span className="inline-flex items-center justify-center rounded-none border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
                  4
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)] sm:flex">
                  <Clock className="size-3" />
                  Last synced just now
                </span>
                <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--recovery-green)] sm:flex">
                  <ShieldCheck className="size-3" />
                  Manual approval
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div className="hidden border-b border-[var(--hairline)] px-5 lg:flex lg:items-center lg:gap-0">
              <div className="w-[220px] shrink-0 py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Member
              </div>
              <div className="w-[140px] shrink-0 py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Trigger
              </div>
              <div className="w-[160px] shrink-0 py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Progress
              </div>
              <div className="w-[100px] shrink-0 py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Inactive
              </div>
              <div className="flex-1 py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Value
              </div>
              <div className="w-[80px] shrink-0 py-2 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Priority
              </div>
            </div>

            {/* Rows */}
            <div>
              {QUEUE_ROWS.map((row, idx) => {
                const isExpanded = expandedId === row.id;
                const pStyle = PRIORITY_STYLES[row.priority];
                const hasEvidence = !!row.evidence;

                return (
                  <div key={row.id}>
                    <motion.button
                      type="button"
                      onClick={() => hasEvidence && toggleExpand(row.id)}
                      initial={reduced ? false : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{
                        duration: 0.5,
                        delay: idx * 0.08,
                        ease: easeReveal,
                      }}
                      className={cn(
                        "group flex w-full flex-col border-b border-[var(--hairline)] text-left transition-colors last:border-b-0",
                        "lg:flex-row lg:items-center lg:gap-0",
                        hasEvidence && "cursor-pointer",
                        hasEvidence && !isExpanded && "hover:bg-[var(--canvas-elevated)]",
                      )}
                      aria-expanded={hasEvidence ? isExpanded : undefined}
                      aria-label={`${row.name}, ${row.trigger}, ${row.priority} priority${hasEvidence ? ". Click to expand evidence." : ""}`}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-3 px-5 py-3 lg:w-[220px] lg:shrink-0 lg:py-2.5 lg:pr-4">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center border border-[var(--hairline)] bg-[var(--canvas-elevated)] font-mono text-[11px] uppercase",
                            isExpanded
                              ? "border-[var(--recovery-green)]/40 bg-[var(--recovery-light)] text-[var(--recovery-green)]"
                              : "text-[var(--ink-secondary)]",
                          )}
                        >
                          {row.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[14px] font-medium text-[var(--ink-primary)]">
                              {row.name}
                            </span>
                            <span
                              className={cn(
                                "size-1.5 rounded-full lg:hidden",
                                MOMENTUM_DOT[row.momentum],
                              )}
                            />
                            {hasEvidence && (
                              <ChevronDown
                                className={cn(
                                  "ml-auto size-3.5 text-[var(--ink-muted)] transition-transform lg:hidden",
                                  isExpanded && "rotate-180",
                                )}
                              />
                            )}
                          </div>
                          <div className="truncate text-[12px] text-[var(--ink-muted)] lg:hidden">
                            {row.trigger}
                          </div>
                        </div>
                      </div>

                      {/* Trigger — desktop */}
                      <div className="hidden lg:block lg:w-[140px] lg:shrink-0 lg:py-2.5 lg:pr-4">
                        <span className="text-[13px] text-[var(--ink-secondary)]">
                          {row.trigger}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2 px-5 pb-3 lg:w-[160px] lg:shrink-0 lg:py-2.5 lg:pr-4 lg:pb-0">
                        <div className="h-[3px] flex-1 overflow-hidden bg-[var(--hairline)]">
                          <div
                            className="h-full bg-[var(--recovery-green)] transition-[width] duration-300"
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span className="w-9 text-right font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
                          {row.progress}%
                        </span>
                      </div>

                      {/* Inactive — mobile inline, desktop column */}
                      <div className="flex items-center justify-between px-5 pb-3 lg:w-[100px] lg:shrink-0 lg:py-2.5 lg:pr-4 lg:pb-0">
                        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)] lg:hidden">
                          Inactive
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[11px] tabular-nums",
                            row.daysInactive >= 7
                              ? "text-[var(--critical)]"
                              : row.daysInactive >= 5
                                ? "text-[var(--warning)]"
                                : "text-[var(--ink-secondary)]",
                          )}
                        >
                          {row.daysInactive}d
                        </span>
                      </div>

                      {/* Value — desktop */}
                      <div className="hidden lg:block lg:flex-1 lg:py-2.5 lg:pr-4">
                        <span className="font-mono text-[12px] tabular-nums text-[var(--ink-secondary)]">
                          ${row.membershipValue}/mo
                        </span>
                      </div>

                      {/* Priority + expand chevron */}
                      <div className="flex items-center gap-2 px-5 pb-3 lg:w-[80px] lg:shrink-0 lg:justify-end lg:py-2.5 lg:pb-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-none border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]",
                            pStyle.bg,
                            pStyle.text,
                            pStyle.border,
                          )}
                        >
                          {row.priority.toUpperCase()}
                        </span>
                        {hasEvidence && (
                          <ChevronDown
                            className={cn(
                              "hidden size-3.5 text-[var(--ink-muted)] transition-transform lg:block",
                              isExpanded && "rotate-180",
                            )}
                          />
                        )}
                      </div>
                    </motion.button>

                    {/* Evidence panel */}
                    <AnimatePresence>
                      {isExpanded && row.evidence && (
                        <motion.div
                          initial={reduced ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: easeReveal }}
                          className="overflow-hidden border-b border-[var(--hairline)] bg-[var(--canvas-elevated)]"
                        >
                          <div className="grid grid-cols-1 gap-0 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:py-3">
                            <EvidenceItem
                              label="Previous pace"
                              value={row.evidence.previousPace}
                              mono
                            />
                            <EvidenceItem
                              label="Last activity"
                              value={row.evidence.lastActivity}
                            />
                            <EvidenceItem
                              label="Last intervention"
                              value={row.evidence.lastIntervention}
                            />
                            <div className="flex items-center gap-2 px-0 py-2 sm:px-3 lg:py-0">
                              <Bell className="size-3 text-[var(--recovery-green)]" />
                              <span className="text-[12px] text-[var(--ink-secondary)]">
                                Reminders allowed
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between border-t border-[var(--hairline)] px-5 py-3">
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                4 interventions · $286/mo represented
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Sorted by priority
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── Evidence item ───────────────────────────────────────────

function EvidenceItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-0 py-2 sm:px-3 lg:py-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-[13px] text-[var(--ink-primary)]",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </div>
    </div>
  );
}
