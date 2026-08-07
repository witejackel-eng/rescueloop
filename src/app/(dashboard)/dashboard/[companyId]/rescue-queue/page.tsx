"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Calendar,
  X,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Filter,
  Wifi,
  MessageSquare,
  History,
  CheckSquare,
  Square,
  Layers,
  Archive,
  Send,
  Download,
  Users,
  DollarSign,
  TrendingUp,
  Zap,
  Target,
  ArrowUpRight,
  Mail,
  Phone,
  Sparkles,
  Shield,
  Flame,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import { SavedViews, type SavedView } from "@/components/shared/saved-views";
import type { DemoQueueCandidate } from "@/lib/demo-fixtures";
import { toast } from "sonner";

type PriorityFilter = "all" | "urgent" | "high" | "medium";

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

// Risk category mapping from trigger
const TRIGGER_TO_RISK: Record<string, string> = {
  "Mid-course stall": "course_stalled",
  "Inactive near renewal": "churn_risk",
  "Never started / stalled early": "engagement_drop",
  "Review required": "payment_failure",
};

const RISK_CATEGORIES = ["churn_risk", "payment_failure", "engagement_drop", "course_stalled"] as const;
const RISK_LABELS: Record<string, string> = {
  churn_risk: "Churn Risk",
  payment_failure: "Payment Failure",
  engagement_drop: "Engagement Drop",
  course_stalled: "Course Stalled",
};
const RISK_COLORS: Record<string, string> = {
  churn_risk: "var(--critical)",
  payment_failure: "var(--warning)",
  engagement_drop: "var(--info)",
  course_stalled: "var(--recovery-green)",
};

const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
const PRIORITY_BG: Record<string, string> = {
  urgent: "var(--critical)",
  high: "var(--warning)",
  medium: "var(--info)",
  low: "var(--recovery-green)",
};

// Pre-seeded saved views for demo
const INITIAL_VIEWS: SavedView[] = [
  { id: "v1", name: "Urgent cancellations", filter: "urgent", count: 4, createdAt: "2d ago", starred: true },
  { id: "v2", name: "Renewal risk", filter: "high", count: 9, createdAt: "1w ago" },
];

// ── Priority Heatmap ──────────────────────────────────────────
function PriorityHeatmap({ candidates }: { candidates: DemoQueueCandidate[] }) {
  const [hovered, setHovered] = useState<{ p: string; r: string } | null>(null);

  const grid = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const p of PRIORITIES) {
      m[p] = {};
      for (const r of RISK_CATEGORIES) m[p][r] = 0;
    }
    for (const c of candidates) {
      const risk = TRIGGER_TO_RISK[c.trigger] ?? "engagement_drop";
      if (m[c.priority]?.[risk] !== undefined) {
        m[c.priority][risk]++;
      }
    }
    return m;
  }, [candidates]);

  const maxCount = useMemo(() => {
    let mx = 0;
    for (const p of PRIORITIES) for (const r of RISK_CATEGORIES) mx = Math.max(mx, grid[p][r]);
    return mx || 1;
  }, [grid]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="size-4 text-[var(--warning)]" />
          <h3 className="font-serif text-[14px] text-[var(--ink-primary)]">Priority × Risk Heatmap</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="min-w-[80px] pb-2 pr-2 text-left text-[9px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  Priority
                </th>
                {RISK_CATEGORIES.map((r) => (
                  <th
                    key={r}
                    className="min-w-[80px] pb-2 text-center text-[9px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]"
                  >
                    {RISK_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRIORITIES.map((p, pi) => (
                <motion.tr
                  key={p}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pi * 0.06, duration: 0.3 }}
                >
                  <td className="pr-2 py-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium capitalize"
                      style={{ color: PRIORITY_BG[p] }}
                    >
                      <span
                        className="inline-block size-1.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_BG[p] }}
                      />
                      {p}
                    </span>
                  </td>
                  {RISK_CATEGORIES.map((r) => {
                    const count = grid[p][r];
                    const intensity = count / maxCount;
                    const isHovered = hovered?.p === p && hovered?.r === r;
                    return (
                      <td key={r} className="py-1 px-1 text-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: pi * 0.06 + 0.1, duration: 0.25, type: "spring", stiffness: 300 }}
                          onMouseEnter={() => setHovered({ p, r })}
                          onMouseLeave={() => setHovered(null)}
                          className={cn(
                            "relative mx-auto flex size-12 items-center justify-center rounded-[6px] font-mono text-[12px] tabular-nums transition-all cursor-default",
                            count > 0 ? "text-white font-semibold" : "text-[var(--ink-muted)]",
                          )}
                          style={{
                            backgroundColor:
                              count > 0
                                ? RISK_COLORS[r]
                                : "var(--canvas)",
                            opacity: count > 0 ? 0.15 + intensity * 0.85 : 1,
                            transform: isHovered ? "scale(1.12)" : "scale(1)",
                          }}
                        >
                          {count}
                          {isHovered && count > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[var(--ink-primary)] px-2 py-0.5 text-[9px] text-white shadow-lg"
                            >
                              {count} candidate{count !== 1 ? "s" : ""} · {RISK_LABELS[r]} · {p}
                            </motion.div>
                          )}
                        </motion.div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Queue Summary Stats Bar ───────────────────────────────────
function QueueSummaryBar({ candidates }: { candidates: DemoQueueCandidate[] }) {
  const stats = useMemo(() => {
    const total = candidates.length;
    const avgInactive = total > 0 ? (candidates.reduce((s, c) => s + c.daysInactive, 0) / total).toFixed(1) : "0";
    const totalValue = candidates.reduce((s, c) => s + c.monthlyValue, 0);
    // Recovery probability: higher for less inactive, higher progress, lower priority
    const avgRecovery =
      total > 0
        ? (
            candidates.reduce((s, c) => {
              const base = c.priority === "urgent" ? 25 : c.priority === "high" ? 45 : c.priority === "medium" ? 65 : 80;
              const progressBonus = c.progress * 0.3;
              const inactivePenalty = c.daysInactive * 0.8;
              return s + Math.min(95, Math.max(5, base + progressBonus - inactivePenalty));
            }, 0) / total
          ).toFixed(0)
        : "0";
    return { total, avgInactive, totalValue, avgRecovery };
  }, [candidates]);

  const items = [
    {
      icon: Users,
      label: "Total Candidates",
      value: String(stats.total),
      color: "var(--ink-primary)",
    },
    {
      icon: Clock,
      label: "Avg Days Inactive",
      value: stats.avgInactive,
      color: "var(--warning)",
    },
    {
      icon: DollarSign,
      label: "Monthly Value at Risk",
      value: `$${stats.totalValue.toLocaleString()}`,
      color: "var(--critical)",
    },
    {
      icon: TrendingUp,
      label: "Avg Recovery Prob.",
      value: `${stats.avgRecovery}%`,
      color: "var(--recovery-green)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Card className="flex items-center gap-3 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-[6px]"
              style={{ backgroundColor: `color-mix(in srgb, ${item.color} 10%, transparent)` }}
            >
              <item.icon className="size-4" style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                {item.label}
              </p>
              <p className="font-mono text-[16px] font-semibold tabular-nums leading-tight text-[var(--ink-primary)]">
                {item.value}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Risk Score Gauge ──────────────────────────────────────────
function RiskScoreGauge({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 75 ? "var(--critical)" : score >= 50 ? "var(--warning)" : score >= 25 ? "var(--info)" : "var(--recovery-green)";
  const label = score >= 75 ? "Critical" : score >= 50 ? "Elevated" : score >= 25 ? "Moderate" : "Low";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative size-24">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="var(--hairline)"
            strokeWidth="6"
          />
          {/* Progress arc */}
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-mono text-[20px] font-bold tabular-nums"
            style={{ color }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <span
        className="rounded-[3px] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.04em]"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)` }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Mini Vertical Timeline ────────────────────────────────────
function MiniTimeline({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="py-2 text-[11px] text-[var(--ink-muted)] italic">
        No previous interactions recorded
      </p>
    );
  }
  return (
    <div className="relative space-y-0">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.25 }}
          className="relative flex gap-3 pb-3"
        >
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "size-2.5 shrink-0 rounded-full border-2 border-[var(--surface)]",
                i === 0 ? "bg-[var(--recovery-green)]" : "bg-[var(--ink-muted)]",
              )}
            />
            {i < items.length - 1 && (
              <div className="w-px flex-1 bg-[var(--hairline)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-snug text-[var(--ink-secondary)]">
              {item}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Suggested Action Card ─────────────────────────────────────
function SuggestedActionCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex w-full items-start gap-2.5 rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-left transition-all hover:border-[var(--hairline-strong)] hover:shadow-[0_2px_8px_-4px_rgba(17,17,15,0.08)]"
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-[4px]"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}
      >
        <Icon className={cn("size-3.5")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[var(--ink-primary)] group-hover:underline">{title}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-[var(--ink-muted)]">{description}</p>
      </div>
      <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-[var(--ink-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.button>
  );
}

// ── Enhanced Inspector Panel ──────────────────────────────────
function InspectorPanel({
  candidate,
  actionState,
  onAction,
}: {
  candidate: DemoQueueCandidate;
  actionState?: string;
  onAction: (action: string) => void;
}) {
  // Compute risk score from candidate data
  const riskScore = useMemo(() => {
    const priorityBase = candidate.priority === "urgent" ? 75 : candidate.priority === "high" ? 55 : candidate.priority === "medium" ? 35 : 15;
    const inactivePenalty = Math.min(20, candidate.daysInactive * 1.2);
    const progressRelief = candidate.progress * 0.15;
    return Math.min(99, Math.max(5, Math.round(priorityBase + inactivePenalty - progressRelief)));
  }, [candidate]);

  // Build timeline items from evidence + contactHistory
  const timelineItems = useMemo(() => {
    const items: string[] = [];
    // Contact history first (most recent)
    for (const h of candidate.contactHistory) items.push(h);
    // Then evidence
    for (const ev of candidate.evidence) items.push(ev);
    return items;
  }, [candidate]);

  // Suggested actions
  const suggestedActions = useMemo(() => {
    const actions = [
      {
        icon: Mail,
        title: "Send personal check-in",
        description: "Draft a personalized message based on their progress and activity pattern.",
        color: "var(--recovery-green)",
        action: "Approved — queued for delivery",
        toastTitle: "Intervention approved",
        toastDesc: "Draft queued for delivery to student.",
      },
    ];

    if (candidate.membershipStatus === "cancelling") {
      actions.push({
        icon: Phone,
        title: "Schedule retention call",
        description: "This student is cancelling — a personal call may retain them.",
        color: "var(--critical)",
        action: "Scheduled — retention call queued",
        toastTitle: "Retention call scheduled",
        toastDesc: "Call has been queued for the account owner.",
      });
    } else if (candidate.daysInactive > 10) {
      actions.push({
        icon: Zap,
        title: "Send re-engagement nudge",
        description: "Quick motivational message with a direct link to their next lesson.",
        color: "var(--warning)",
        action: "Scheduled — re-engagement nudge queued",
        toastTitle: "Re-engagement scheduled",
        toastDesc: "Nudge will be sent at optimal time.",
      });
    } else {
      actions.push({
        icon: Sparkles,
        title: "Offer personalized help",
        description: "Suggest a 1-on-1 session or alternative learning path based on their stall point.",
        color: "var(--info)",
        action: "Approved — help offer queued",
        toastTitle: "Help offer approved",
        toastDesc: "Personalized help message queued for delivery.",
      });
    }

    actions.push({
      icon: Shield,
      title: "Add to cooldown watchlist",
      description: "Pause interventions for 7 days and monitor for natural re-engagement.",
      color: "var(--ink-muted)",
      action: "Dismissed — added to cooldown list",
      toastTitle: "Added to watchlist",
      toastDesc: "Will re-check in 7 days for natural activity.",
    });

    return actions;
  }, [candidate]);

  const stagger = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" as const },
    }),
  };

  return (
    <Card className="sticky top-4 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
      <motion.div
        key={candidate.id}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {/* Header with risk gauge */}
        <motion.div variants={stagger} custom={0} className="flex items-start gap-4">
          <RiskScoreGauge score={riskScore} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-[18px] text-[var(--ink-primary)]">
                {candidate.name}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-[3px] text-[9px] capitalize",
                  candidate.priority === "urgent"
                    ? "border-[var(--critical)]/30 text-[var(--critical)] bg-[var(--critical)]/5"
                    : candidate.priority === "high"
                      ? "border-[var(--warning)]/30 text-[var(--warning)] bg-[var(--warning)]/5"
                      : "border-[var(--info)]/30 text-[var(--info)] bg-[var(--info)]/5",
                )}
              >
                {candidate.priority}
              </Badge>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
              {candidate.course} · ${candidate.monthlyValue}/mo
            </p>
            <p className="mt-1 text-[11px] text-[var(--ink-secondary)]">
              {candidate.trigger}
            </p>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={stagger} custom={1} className="border-t border-[var(--hairline)]" />

        {/* Status row */}
        <motion.div variants={stagger} custom={2} className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Last activity
            </div>
            <div className="mt-0.5 font-mono tabular-nums text-[var(--ink-primary)]">
              {candidate.lastActivity}
            </div>
          </div>
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Progress
            </div>
            <div className="mt-0.5 font-mono tabular-nums text-[var(--ink-primary)]">
              {candidate.progress}%
            </div>
          </div>
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Renewal
            </div>
            <div className="mt-0.5 font-mono tabular-nums text-[var(--ink-primary)]">
              {candidate.renewalDate}
            </div>
          </div>
          <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              Risk segment
            </div>
            <div className="mt-0.5 text-[var(--ink-primary)]">
              {candidate.riskSegment}
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={stagger} custom={3} className="border-t border-[var(--hairline)]" />

        {/* Interaction Timeline */}
        <motion.div variants={stagger} custom={4}>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
            <Activity className="size-3" /> Interaction Timeline
          </span>
          <div className="mt-2">
            <MiniTimeline items={timelineItems} />
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={stagger} custom={5} className="border-t border-[var(--hairline)]" />

        {/* Suggested Actions */}
        <motion.div variants={stagger} custom={6}>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
            <Target className="size-3" /> Suggested Actions
          </span>
          <div className="mt-2 space-y-2">
            {suggestedActions.map((a, i) => (
              <SuggestedActionCard
                key={i}
                icon={a.icon}
                title={a.title}
                description={a.description}
                color={a.color}
                onClick={() => {
                  onAction(a.action);
                  toast.success(a.toastTitle, { description: a.toastDesc });
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={stagger} custom={7} className="border-t border-[var(--hairline)]" />

        {/* Draft message */}
        <motion.div variants={stagger} custom={8}>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
            <MessageSquare className="size-3" /> Draft message
          </span>
          <div className="mt-1.5 rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-[12px] leading-relaxed text-[var(--ink-secondary)]">
            {candidate.draftMessage}
          </div>
        </motion.div>

        {/* Action feedback */}
        {actionState && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden rounded-[4px] bg-[var(--recovery-green)]/10 px-3 py-2 text-[11px] text-[var(--recovery-green)]"
          >
            {actionState}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div variants={stagger} custom={9} className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 rounded-[6px] text-[12px] bg-[var(--recovery-green)] hover:bg-[var(--recovery-green)]/90"
            onClick={() => {
              onAction("Approved — queued for delivery");
              toast.success("Intervention approved", {
                description: "Draft queued for delivery to student.",
              });
            }}
          >
            <CheckCircle2 className="mr-1.5 size-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-[6px] text-[12px]"
            onClick={() => {
              onAction("Scheduled — sending tomorrow at 9am");
              toast.success("Intervention scheduled", {
                description: "Sending tomorrow at 9:00 AM local time.",
              });
            }}
          >
            <Calendar className="mr-1.5 size-3.5" /> Schedule
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-[6px] text-[12px]"
            onClick={() => {
              onAction("Dismissed — added to cooldown list");
              toast.info("Candidate dismissed", {
                description: "Added to cooldown — will re-check in 7 days.",
              });
            }}
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </Button>
        </motion.div>

        {/* Sync hint */}
        <motion.div variants={stagger} custom={10} className="flex items-center gap-1.5 border-t border-[var(--hairline)] pt-3 text-[10px] text-[var(--ink-muted)]">
          <Wifi className="size-3 text-[var(--recovery-green)]" />
          <span>Demo mode — no real messages are sent to students.</span>
        </motion.div>
      </motion.div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function RescueQueuePage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, string>>({});
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>(INITIAL_VIEWS);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const allCandidates = useMemo(() => bundle?.queueCandidates ?? [], [bundle?.queueCandidates]);

  const candidates = useMemo(() => {
    const filtered = priorityFilter === "all"
      ? allCandidates
      : allCandidates.filter((c) => c.priority === priorityFilter);
    return [...filtered].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99),
    );
  }, [allCandidates, priorityFilter]);

  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  function toggleBulkMode() {
    setBulkMode((v) => !v);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(candidates.map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function bulkApprove() {
    toast.success(`Approved ${selectedIds.size} interventions`, {
      description: "Drafts queued for delivery to students.",
    });
    setActionState((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = "Approved — queued for delivery";
      });
      return next;
    });
    clearSelection();
    setBulkMode(false);
  }

  function bulkSchedule() {
    toast.success(`Scheduled ${selectedIds.size} interventions`, {
      description: "Sending tomorrow at 9:00 AM local time.",
    });
    setActionState((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = "Scheduled — sending tomorrow at 9am";
      });
      return next;
    });
    clearSelection();
    setBulkMode(false);
  }

  function bulkDismiss() {
    toast.info(`Dismissed ${selectedIds.size} candidates`, {
      description: "Added to cooldown list — will re-check in 7 days.",
    });
    setActionState((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = "Dismissed — added to cooldown list";
      });
      return next;
    });
    clearSelection();
    setBulkMode(false);
  }

  function priorityColor(priority: string) {
    return priority === "urgent"
      ? "border-[var(--critical)]/30 text-[var(--critical)] bg-[var(--critical)]/5"
      : priority === "high"
        ? "border-[var(--warning)]/30 text-[var(--warning)] bg-[var(--warning)]/5"
        : "border-[var(--info)]/30 text-[var(--info)] bg-[var(--info)]/5";
  }

  function priorityBorder(priority: string) {
    return priority === "urgent"
      ? "border-l-[var(--critical)]"
      : priority === "high"
        ? "border-l-[var(--warning)]"
        : "border-l-[var(--info)]";
  }

  function handleSelectView(view: SavedView) {
    setPriorityFilter(view.filter as PriorityFilter);
    setActiveViewId(view.id);
    toast.success(`Applied view: ${view.name}`, {
      description: `${view.count} students match this view.`,
    });
  }

  function handleSaveView(name: string) {
    const newView: SavedView = {
      id: `v${Date.now()}`,
      name,
      filter: priorityFilter,
      count: candidates.length,
      createdAt: "just now",
    };
    setSavedViews((prev) => [...prev, newView]);
    setActiveViewId(newView.id);
  }

  function handleDeleteView(id: string) {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
    if (activeViewId === id) setActiveViewId(null);
  }

  function handleToggleStar(id: string) {
    setSavedViews((prev) =>
      prev.map((v) => (v.id === id ? { ...v, starred: !v.starred } : v)),
    );
  }

  function handleExportCSV() {
    const headers = ["Name", "Course", "Priority", "Trigger", "Days Inactive", "Progress", "Monthly Value"];
    const rows = candidates.map((c) => [
      c.name,
      c.course,
      c.priority,
      c.trigger,
      String(c.daysInactive),
      `${c.progress}%`,
      `$${c.monthlyValue}`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rescue-queue-${priorityFilter}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export ready", {
      description: `Exported ${candidates.length} students to CSV.`,
    });
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[var(--ink-primary)]">Rescue Queue</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {loading ? (
              <span className="inline-block h-3 w-32 animate-pulse rounded-[2px] bg-[var(--hairline)] align-middle" />
            ) : (
              <>
                {candidates.length} student{candidates.length === 1 ? "" : "s"} need attention
                {bundle?.company?.lastSync && (
                  <span className="ml-2 text-[var(--ink-muted)]">· synced {bundle.company.lastSync}</span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={bulkMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleBulkMode}
            className={cn(
              "h-7 rounded-[6px] px-2 text-[11px]",
              bulkMode && "bg-[var(--ink-primary)] text-white"
            )}
            aria-label="Toggle bulk selection"
          >
            <Layers className="mr-1 size-3" />
            {bulkMode ? "Exit bulk" : "Bulk select"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
            aria-label="Refresh queue"
          >
            <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertTriangle className="size-4" />
            <span>Failed to load queue: {error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Queue Summary Stats Bar */}
      {!loading && allCandidates.length > 0 && (
        <QueueSummaryBar candidates={allCandidates} />
      )}

      {/* Priority Heatmap */}
      {!loading && allCandidates.length > 0 && (
        <PriorityHeatmap candidates={allCandidates} />
      )}

      {/* Priority filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          <Filter className="size-3" /> Filter
        </span>
        {(["all", "urgent", "high", "medium"] as PriorityFilter[]).map((p) => {
          const count =
            p === "all"
              ? allCandidates.length
              : allCandidates.filter((c) => c.priority === p).length;
          const active = priorityFilter === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPriorityFilter(p);
                setActiveViewId(null);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] capitalize transition-all",
                active
                  ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-white"
                  : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
              )}
            >
              {p}
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  active ? "text-white/70" : "text-[var(--ink-muted)]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
        {bulkMode && candidates.length > 0 && (
          <>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-[11px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
              >
                Select all
              </button>
              <span className="text-[var(--hairline-strong)]">·</span>
              <button
                onClick={clearSelection}
                className="text-[11px] font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
              >
                Clear
              </button>
            </div>
          </>
        )}
        {!bulkMode && candidates.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
            aria-label="Export current view as CSV"
          >
            <Download className="size-3" />
            Export CSV
          </button>
        )}
      </div>

      {/* Saved Views */}
      {!bulkMode && (
        <SavedViews
          views={savedViews}
          activeViewId={activeViewId}
          onSelect={handleSelectView}
          onSave={handleSaveView}
          onDelete={handleDeleteView}
          onToggleStar={handleToggleStar}
          currentFilterLabel={priorityFilter === "all" ? "All priorities" : `${priorityFilter} priority`}
          currentCount={candidates.length}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Queue list */}
        <div className="space-y-2.5 lg:col-span-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} showHeader={false} rows={2} className="p-4" />
            ))
          ) : candidates.length === 0 ? (
            <Card className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)]">
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-6 text-[var(--recovery-green)]" />
                <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
                  No students match this filter.
                </p>
              </div>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {candidates.map((c, i) => {
                const isSelected = selectedId === c.id;
                const isChecked = selectedIds.has(c.id);
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <Card
                      className={cn(
                        "relative cursor-pointer rounded-[8px] border border-l-[3px] bg-[var(--surface)] p-4 transition-all",
                        priorityBorder(c.priority),
                        isSelected
                          ? "shadow-[0_0_0_1px_var(--recovery-green)]"
                          : "hover:bg-[var(--canvas-elevated)] hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]",
                        isChecked && "ring-1 ring-[var(--recovery-green)]/30"
                      )}
                      onClick={() => bulkMode ? toggleSelected(c.id) : setSelectedId(c.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          {bulkMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelected(c.id);
                              }}
                              className="mt-0.5 shrink-0"
                              aria-label={isChecked ? "Unselect" : "Select"}
                            >
                              {isChecked ? (
                                <CheckSquare className="size-4 text-[var(--recovery-green)]" />
                              ) : (
                                <Square className="size-4 text-[var(--ink-muted)]" />
                              )}
                            </button>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="size-6 shrink-0 rounded-full bg-[var(--canvas-elevated)] font-mono text-[10px] font-medium leading-6 text-center text-[var(--ink-secondary)]">
                                {c.initials}
                              </span>
                              <span className="text-[14px] font-semibold text-[var(--ink-primary)]">
                                {c.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-[3px] text-[9px] capitalize",
                                  priorityColor(c.priority),
                                )}
                              >
                                {c.priority}
                              </Badge>
                              {c.membershipStatus === "cancelling" && (
                                <Badge
                                  variant="outline"
                                  className="rounded-[3px] text-[9px] border-[var(--critical)]/30 text-[var(--critical)] bg-[var(--critical)]/5"
                                >
                                  Cancelling
                                </Badge>
                              )}
                              {c.membershipStatus === "trialing" && (
                                <Badge
                                  variant="outline"
                                  className="rounded-[3px] text-[9px] border-[var(--info)]/30 text-[var(--info)] bg-[var(--info)]/5"
                                >
                                  Trial
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-[12px] text-[var(--ink-secondary)]">
                              {c.trigger}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
                            ${c.monthlyValue}/mo
                          </span>
                          <ChevronRight
                            className={cn(
                              "size-4 text-[var(--ink-muted)] transition-transform",
                              isSelected && "rotate-90 text-[var(--recovery-green)]",
                            )}
                          />
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-[var(--ink-muted)]">
                        <span className="truncate">{c.course}</span>
                        <span>·</span>
                        <span>{c.daysInactive}d inactive</span>
                        <span>·</span>
                        <span>{c.progress}% complete</span>
                        {c.cooldownUntil && (
                          <>
                            <span>·</span>
                            <span className="text-[var(--warning)]">cooldown {c.cooldownUntil}</span>
                          </>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[var(--hairline)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, Math.min(100, c.progress))}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
                          className={cn(
                            "h-full rounded-full",
                            c.progress < 20 ? "bg-[var(--critical)]" : c.progress < 50 ? "bg-[var(--warning)]" : "bg-[var(--recovery-green)]"
                          )}
                        />
                      </div>

                      {/* Action feedback */}
                      {actionState[c.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 overflow-hidden rounded-[4px] bg-[var(--recovery-green)]/10 px-3 py-2 text-[11px] text-[var(--recovery-green)]"
                        >
                          {actionState[c.id]}
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Inspector */}
        <div className="lg:col-span-2">
          {loading ? (
            <CardSkeleton showHeader rows={6} />
          ) : selected ? (
            <InspectorPanel
              candidate={selected}
              actionState={actionState[selected.id]}
              onAction={(action) =>
                setActionState((prev) => ({
                  ...prev,
                  [selected.id]: action,
                }))
              }
            />
          ) : (
            <Card className="flex h-64 flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[var(--hairline-strong)] bg-[var(--canvas-elevated)] text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--surface)] ring-1 ring-[var(--hairline)]">
                <Clock className="size-6 text-[var(--ink-muted)]" />
              </div>
              <p className="mt-4 text-[13px] font-medium text-[var(--ink-secondary)]">
                Select a candidate to view details
              </p>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                Evidence, contact history, and draft messages will appear here.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {bulkMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 lg:pl-[228px]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="mx-auto max-w-[1200px] px-4 pb-4">
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--hairline-strong)] bg-[var(--ink-primary)] px-4 py-3 text-white shadow-[0_8px_32px_-8px_rgba(17,17,15,0.4)]">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-[6px] bg-white/10">
                    <CheckSquare className="size-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">
                      {selectedIds.size} selected
                    </p>
                    <p className="text-[11px] text-white/60">
                      Choose an action to apply
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={bulkApprove}
                    className="bg-[var(--recovery-green)] text-white hover:bg-[var(--recovery-green)]/90 h-8 px-3 text-[12px]"
                  >
                    <Send className="mr-1 size-3" />
                    Approve all
                  </Button>
                  <Button
                    size="sm"
                    onClick={bulkSchedule}
                    variant="outline"
                    className="h-8 border-white/20 bg-transparent px-3 text-[12px] text-white hover:bg-white/10 hover:text-white"
                  >
                    <Calendar className="mr-1 size-3" />
                    Schedule
                  </Button>
                  <Button
                    size="sm"
                    onClick={bulkDismiss}
                    variant="outline"
                    className="h-8 border-white/20 bg-transparent px-3 text-[12px] text-white hover:bg-white/10 hover:text-white"
                  >
                    <Archive className="mr-1 size-3" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={clearSelection}
                    variant="ghost"
                    className="h-8 px-2 text-[12px] text-white/70 hover:bg-white/10 hover:text-white"
                    aria-label="Clear selection"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
