"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";
import { formatCurrency } from "@/lib/format";

// ─── A. Recovery Queue showcase ──────────────────────────────────

interface QueueRow {
  id: string;
  name: string;
  initials: string;
  trigger: string;
  progress: number;
  priority: "low" | "medium" | "high" | "urgent";
  approved?: boolean;
}

const QUEUE_ROWS: QueueRow[] = [
  {
    id: "q1",
    name: "Maya Thompson",
    initials: "MT",
    trigger: "Mid-course stall · 8d inactive",
    progress: 38,
    priority: "high",
  },
  {
    id: "q2",
    name: "Devon Park",
    initials: "DP",
    trigger: "Inactive near renewal · 4d",
    progress: 62,
    priority: "urgent",
  },
  {
    id: "q3",
    name: "Sara Klein",
    initials: "SK",
    trigger: "Started · stalled before 20%",
    progress: 14,
    priority: "medium",
    approved: true,
  },
  {
    id: "q4",
    name: "Jamal Wright",
    initials: "JW",
    trigger: "Cancellation scheduled",
    progress: 47,
    priority: "urgent",
  },
];

const PRIORITY_META: Record<QueueRow["priority"], { label: string; color: string }> = {
  low: { label: "Low", color: "text-[var(--ink-muted)]" },
  medium: { label: "Medium", color: "text-[var(--info)]" },
  high: { label: "High", color: "text-[var(--warning)]" },
  urgent: { label: "Urgent", color: "text-[var(--critical)]" },
};

function RecoveryQueueShowcase() {
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>("q1");
  const [approved, setApproved] = useState<Set<string>>(new Set(["q3"]));

  function toggleRow(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function approve(id: string) {
    setApproved((prev) => new Set(prev).add(id));
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-20 lg:py-20">
      <div className="flex flex-col justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Triage workspace
        </div>
        <h3 className="mt-4 max-w-[16ch] font-serif text-[clamp(1.8rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          Work through at-risk students without opening and closing modals.
        </h3>
        <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Approve, schedule, or dismiss in one motion. The queue is the
          workspace — every action lives inline, with full evidence one click
          away.
        </p>
        <ul className="mt-6 flex flex-col gap-2 text-[14px] text-[var(--ink-secondary)]">
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-[var(--recovery-green)]" /> Select any row to inspect without losing your place.
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-[var(--recovery-green)]" /> Approve once — the student moves to Scheduled.
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-[var(--recovery-green)]" /> Dismiss safely — the decision is logged.
          </li>
        </ul>
      </div>

      {/* UI fragment */}
      <div className="border border-[var(--hairline)] bg-[var(--surface)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Awaiting approval · 4
          </span>
          <span className="font-mono text-[11px] text-[var(--ink-muted)]">click a row</span>
        </div>

        {/* Rows */}
        <div>
          {QUEUE_ROWS.map((row, i) => {
            const isApproved = approved.has(row.id);
            const isSelected = selectedId === row.id;
            return (
              <div key={row.id}>
                <button
                  onClick={() => !isApproved && toggleRow(row.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                    isApproved && "cursor-default opacity-60",
                    isSelected
                      ? "bg-[var(--canvas-elevated)]"
                      : "hover:bg-[var(--canvas-elevated)]",
                  )}
                >
                  <div className="flex size-8 items-center justify-center rounded-[4px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] font-mono text-[11px] text-[var(--ink-secondary)]">
                    {row.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-[14px] font-medium text-[var(--ink-primary)]">
                        {row.name}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.12em]",
                          PRIORITY_META[row.priority].color,
                        )}
                      >
                        {PRIORITY_META[row.priority].label}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[12px] text-[var(--ink-muted)]">
                      {row.trigger}
                    </div>
                    <div className="mt-2 h-1 w-full bg-[var(--hairline-subtle)]">
                      <div
                        className="h-full bg-[var(--recovery-green)]"
                        style={{ width: `${row.progress}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Inline approve action for selected row */}
                <AnimatePresence>
                  {isSelected && !isApproved && (
                    <motion.div
                      initial={reduced ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={standard}
                      className="overflow-hidden border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] text-[var(--ink-secondary)]">
                          Approve to send within safety rules.
                        </span>
                        <button
                          onClick={() => approve(row.id)}
                          className="press inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--ink-primary)] px-3 py-1.5 text-[12px] font-medium text-white"
                        >
                          Approve
                          <ArrowRight className="size-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Approved state transition */}
                <AnimatePresence>
                  {isApproved && (
                    <motion.div
                      initial={reduced ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={standard}
                      className="overflow-hidden border-b border-[var(--hairline)] bg-[var(--recovery-light)]/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 text-[12px] text-[var(--recovery-green)]">
                        <Check className="size-3.5" />
                        <span>Approved · moves to Scheduled</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {i < QUEUE_ROWS.length - 1 && (
                  <div className="border-b border-[var(--hairline)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── B. Campaign Studio showcase ─────────────────────────────────

function CampaignStudioShowcase() {
  const reduced = useReducedMotion();
  const [inactivityDays, setInactivityDays] = useState(7);

  // Mock population stats
  const totalMembers = 742;
  const eligibleBase = 168; // at 7 days
  const eligible = Math.round(eligibleBase + (inactivityDays - 7) * -6);
  const expectedMessages = Math.round(eligible * 0.7);
  const excludedByCooldown = Math.round(eligible * 0.18);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-20 lg:py-20">
      {/* UI fragment on the left this time */}
      <div className="order-2 lg:order-1 border border-[var(--hairline)] bg-[var(--surface)]">
        <div className="border-b border-[var(--hairline)] px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Rule clause
          </span>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[14px] text-[var(--ink-primary)]">
            <span className="text-[var(--ink-secondary)]">progress between</span>
            <span className="rounded-[4px] bg-[var(--canvas-elevated)] px-2 py-0.5 tabular-nums">20%</span>
            <span className="text-[var(--ink-secondary)]">and</span>
            <span className="rounded-[4px] bg-[var(--canvas-elevated)] px-2 py-0.5 tabular-nums">80%</span>
            <span className="text-[var(--ink-secondary)]">·</span>
            <span className="text-[var(--ink-secondary)]">inactive</span>
            <span className="rounded-[4px] bg-[var(--recovery-light)] px-2 py-0.5 tabular-nums text-[var(--recovery-green)]">
              {inactivityDays}+
            </span>
            <span className="text-[var(--ink-secondary)]">days</span>
          </div>

          {/* Slider */}
          <div className="mt-6">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <span>Inactivity threshold</span>
              <span className="tabular-nums text-[var(--ink-primary)]">{inactivityDays} days</span>
            </div>
            <input
              type="range"
              min={7}
              max={14}
              value={inactivityDays}
              onChange={(e) => setInactivityDays(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--recovery-green)]"
              aria-label="Inactivity threshold in days"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--ink-muted)]">
              <span>7d</span>
              <span>14d</span>
            </div>
          </div>

          {/* Live stats */}
          <div className="mt-6 border-t border-[var(--hairline)] pt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Live simulation
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <StatTile label="Eligible members" value={eligible} />
              <StatTile label="Expected messages" value={expectedMessages} suffix=" /wk" />
              <StatTile label="Excluded by cooldown" value={excludedByCooldown} />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
            <span className="size-1.5 animate-pulse rounded-full bg-[var(--recovery-green)]" />
            Updates as you drag — nothing is sent.
          </div>
        </div>
      </div>

      <div className="order-1 flex flex-col justify-center lg:order-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Live audience simulation
        </div>
        <h3 className="mt-4 max-w-[16ch] font-serif text-[clamp(1.8rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          Changing a rule updates who will be contacted — before you send anything.
        </h3>
        <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Drag the inactivity threshold and watch the eligible population, the
          expected weekly messages, and the cooldown exclusions shift in real
          time. You ship a campaign only when you can defend its reach.
        </p>
        <p className="mt-5 max-w-[44ch] text-[13px] text-[var(--ink-muted)]">
          Total monitored members: <span className="font-mono tabular-nums text-[var(--ink-secondary)]">{totalMembers}</span>.
          Numbers below reflect the current rule.
        </p>
      </div>
    </div>
  );
}

function StatTile({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className="border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-1.5 font-serif text-[22px] leading-none tracking-[-0.02em] text-[var(--ink-primary)]">
        <AnimatedCounter
          value={value}
          suffix={suffix}
          duration={reduced ? 0 : 0.5}
          className="!font-serif !tabular-nums"
        />
      </div>
    </div>
  );
}

// ─── C. Value Ledger showcase ────────────────────────────────────

interface Tier {
  id: "confirmed" | "strongly_associated" | "estimated";
  label: string;
  value: number;
  description: string;
  evidence: string;
  tone: "green" | "blue" | "amber";
}

const TIERS: Tier[] = [
  {
    id: "confirmed",
    label: "Confirmed",
    value: 237,
    description: "Directly attributable to a specific intervention.",
    evidence: "Payment received after a documented intervention sequence.",
    tone: "green",
  },
  {
    id: "strongly_associated",
    label: "Strongly associated",
    value: 79,
    description: "Intervention sent, student returned, causal chain not fully isolated.",
    evidence: "Returned within 14 days of an intervention with no other channel touch.",
    tone: "amber",
  },
  {
    id: "estimated",
    label: "Estimated",
    value: 711,
    description: "Modeled projection of retention. Not yet confirmed.",
    evidence: "90-day modeled retained value across the recovered cohort.",
    tone: "blue",
  },
];

function ValueLedgerShowcase() {
  const reduced = useReducedMotion();
  const [expandedId, setExpandedId] = useState<string | null>("confirmed");

  function tierClasses(tone: Tier["tone"]) {
    return {
      accent: tone === "green" ? "bg-[var(--recovery-green)]" : tone === "amber" ? "bg-[var(--warning)]" : "bg-[var(--info)]",
      accentText: tone === "green" ? "text-[var(--recovery-green)]" : tone === "amber" ? "text-[var(--warning)]" : "text-[var(--info)]",
    };
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-20 lg:py-20">
      <div className="flex flex-col justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Attribution you can defend
        </div>
        <h3 className="mt-4 max-w-[18ch] font-serif text-[clamp(1.8rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          Confirmed, strongly associated, and estimated value are never merged into one exaggerated number.
        </h3>
        <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Every recovered dollar is tagged with the strongest evidence you can
          actually defend — to your team, your accountant, and the student.
          Click a tier to see the basis.
        </p>
      </div>

      <div className="border border-[var(--hairline)] bg-[var(--surface)]">
        <div className="border-b border-[var(--hairline)] px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Value ledger · 30 days
          </span>
        </div>

        <div>
          {TIERS.map((tier, i) => {
            const isExpanded = expandedId === tier.id;
            const cls = tierClasses(tier.tone);
            return (
              <div key={tier.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tier.id)}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-[var(--canvas-elevated)]"
                >
                  <span className={cn("h-8 w-1 shrink-0", cls.accent)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px] font-medium text-[var(--ink-primary)]">
                        {tier.label}
                      </span>
                      <span className="font-mono text-[20px] tabular-nums text-[var(--ink-primary)]">
                        {formatCurrency(tier.value)}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] leading-snug text-[var(--ink-secondary)]">
                      {tier.description}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-[var(--ink-muted)] transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={reduced ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={standard}
                      className="overflow-hidden border-t border-[var(--hairline)] bg-[var(--canvas-elevated)]"
                    >
                      <div className="px-5 py-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                          Evidence basis
                        </div>
                        <div className={cn("mt-2 text-[13px] leading-snug", cls.accentText)}>
                          {tier.evidence}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {i < TIERS.length - 1 && (
                  <div className="border-b border-[var(--hairline)]" />
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Total defended value
            </span>
            <span className="font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">
              {formatCurrency(TIERS.reduce((sum, t) => sum + t.value, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────

export function WorkflowShowcase() {
  return (
    <section id="product" className="bg-[var(--canvas)]">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        {/* Section label */}
        <div className="flex items-center gap-2 pt-20 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] lg:pt-32">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          The product
        </div>
        <h2 className="mt-8 max-w-[20ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          Three workspaces. One operating loop.
        </h2>
        <p className="mt-6 max-w-[60ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          RescueLoop is not a dashboard. It is a triage queue, a campaign studio,
          and a defensible value ledger — designed to be worked in, not looked at.
        </p>

        <div className="divide-y divide-[var(--hairline)]">
          <RecoveryQueueShowcase />
          <CampaignStudioShowcase />
          <ValueLedgerShowcase />
        </div>
      </div>
    </section>
  );
}
