"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Users,
  TrendingUp,
  Activity,
  Gauge,
  TrendingDown,
  Zap,
  Flame,
  AlertOctagon,
  Frown,
  Meh,
  Smile,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PlaybookRecommender } from "@/components/rescueloop/insights/playbook-recommender";

// ── Risk score derivation from member data ─────────────────────
function deriveRiskScore(member: {
  status: string;
  progress: number;
  membership: string;
  suppressed: boolean;
}): number {
  let score = 0;
  // Status contribution
  if (member.status === "needs_attention") score += 40;
  else if (member.status === "paused_reminders") score += 50;
  else if (member.status === "responded") score += 15;
  else score += 5; // active
  // Progress contribution (lower progress = higher risk)
  score += Math.round((100 - member.progress) * 0.35);
  // Membership contribution
  if (member.membership === "cancelling") score += 20;
  else if (member.membership === "cancelled") score += 25;
  else if (member.membership === "paused_membership") score += 15;
  // Suppressed penalty
  if (member.suppressed) score += 10;
  return Math.min(100, Math.max(0, score));
}

const RISK_BINS = [
  { label: "0–20", min: 0, max: 20, color: "bg-[var(--recovery-green)]", textColor: "text-[var(--recovery-green)]" },
  { label: "21–40", min: 21, max: 40, color: "bg-[#5A9E6F]", textColor: "text-[#5A9E6F]" },
  { label: "41–60", min: 41, max: 60, color: "bg-[var(--warning)]", textColor: "text-[var(--warning)]" },
  { label: "61–80", min: 61, max: 80, color: "bg-[#D4652A]", textColor: "text-[#D4652A]" },
  { label: "81–100", min: 81, max: 100, color: "bg-[var(--critical)]", textColor: "text-[var(--critical)]" },
];

// ── Severity icon for friction points ──────────────────────────
function severityConfig(stallRate: number) {
  if (stallRate >= 20) return { icon: Flame, color: "text-[var(--critical)]", bg: "bg-[var(--critical)]/10", barColor: "bg-[var(--critical)]" };
  if (stallRate >= 15) return { icon: AlertOctagon, color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10", barColor: "bg-[var(--warning)]" };
  if (stallRate >= 10) return { icon: AlertTriangle, color: "text-[#D4652A]", bg: "bg-[#D4652A]/10", barColor: "bg-[#D4652A]" };
  return { icon: Zap, color: "text-[var(--info)]", bg: "bg-[var(--info)]/10", barColor: "bg-[var(--info)]" };
}

export default function InsightsPage() {
  const params = useParams<{ companyId: string }>();
  const reduced = useReducedMotion();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);

  const friction = bundle?.frictionPoints ?? [];
  const responsePatterns = bundle?.responsePatterns;
  const activation = bundle?.activationPatterns;
  const metrics = bundle?.overview?.metrics;
  const members = bundle?.members ?? [];

  const maxStallRate = useMemo(
    () => Math.max(...friction.map((f) => f.stallRate), 1),
    [friction],
  );

  const responseTotal = responsePatterns
    ? responsePatterns.continueCourse + responsePatterns.needHelp + responsePatterns.blocked + responsePatterns.stopReminders
    : 0;

  const responseBreakdown = useMemo(() => {
    if (!responsePatterns || responseTotal === 0) return [];
    return [
      { label: "Continue course", value: responsePatterns.continueCourse, color: "bg-[var(--recovery-green)]" },
      { label: "Need help", value: responsePatterns.needHelp, color: "bg-[var(--warning)]" },
      { label: "Blocked", value: responsePatterns.blocked, color: "bg-[var(--critical)]" },
      { label: "Stop reminders", value: responsePatterns.stopReminders, color: "bg-[var(--ink-muted)]" },
    ];
  }, [responsePatterns, responseTotal]);

  // ── Risk score distribution ─────────────────────────────────
  const riskDistribution = useMemo(() => {
    if (members.length === 0) return RISK_BINS.map((b) => ({ ...b, count: 0, pct: 0 }));
    const scores = members.map(deriveRiskScore);
    return RISK_BINS.map((bin) => {
      const count = scores.filter((s) => s >= bin.min && s <= bin.max).length;
      return { ...bin, count, pct: Math.round((count / members.length) * 100) };
    });
  }, [members]);

  const maxDistCount = useMemo(() => Math.max(...riskDistribution.map((d) => d.count), 1), [riskDistribution]);

  // ── Top 5 friction points ───────────────────────────────────
  const topFriction = useMemo(
    () => [...friction].sort((a, b) => b.stallRate - a.stallRate).slice(0, 5),
    [friction],
  );

  // ── Recovery velocity (simulated from outcomes + funnel) ────
  const recoveryVelocity = useMemo(() => {
    if (!bundle) return { days: 0, trend: 0 };
    // Derived from funnel: (Detected → Resumed) ratio gives recovery speed
    const funnel = bundle.overview.recoveryFunnel;
    const detected = funnel.find((f) => f.stage === "Detected")?.count ?? 1;
    const resumed = funnel.find((f) => f.stage === "Resumed")?.count ?? 0;
    // Average days from detection to resolution (simulated)
    const recoveryRate = resumed / detected;
    const avgDays = Math.round(14 - recoveryRate * 10); // higher rate → faster
    const trend = recoveryRate > 0.25 ? 1 : recoveryRate > 0.15 ? 0 : -1; // improving / stable / declining
    return { days: Math.max(2, avgDays), trend };
  }, [bundle]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Insights</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            Course friction analysis and student behavior patterns
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
          aria-label="Refresh insights"
        >
          <RefreshCw className="mr-1 size-3" />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertTriangle className="size-4" />
            <span>Failed to load insights: {error}</span>
            <Button variant="ghost" size="sm" onClick={refetch} className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Top stats */}
      {!loading && metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Monitored", value: metrics.membersMonitored, icon: Users, color: "text-[var(--ink-primary)]", border: "before:bg-[var(--ink-secondary)]", iconBg: "bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]" },
            { label: "Detected", value: metrics.needsReview, icon: AlertTriangle, color: "text-[var(--warning)]", border: "before:bg-[var(--warning)]", iconBg: "bg-[var(--warning)]/10 text-[var(--warning)]" },
            { label: "Returned", value: metrics.observedReturns, icon: TrendingUp, color: "text-[var(--recovery-green)]", border: "before:bg-[var(--recovery-green)]", iconBg: "bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]" },
            { label: "Responses", value: metrics.recentResponses, icon: Activity, color: "text-[var(--info)]", border: "before:bg-[var(--info)]", iconBg: "bg-[var(--info)]/10 text-[var(--info)]" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className={cn(
                "relative overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-3",
                "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
                s.border,
              )}>
                <div className="flex items-center gap-2 pl-1 text-[var(--ink-muted)]">
                  <span className={cn("flex size-6 items-center justify-center rounded-[5px]", s.iconBg)}>
                    <Icon className="size-3" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em]">{s.label}</span>
                </div>
                <div className={cn("mt-2 pl-1 font-serif text-[24px] leading-none tabular-nums", s.color)}>
                  {s.value}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Playbook Recommendations */}
      {!loading && metrics && (
        <PlaybookRecommender />
      )}

      {/* ── NEW: Risk Score Distribution + Recovery Velocity row ── */}
      {!loading && members.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Risk Score Distribution */}
          <div className="lg:col-span-3">
            <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-[6px] bg-[var(--canvas-elevated)]">
                  <Smile className="size-3.5 text-[var(--recovery-green)]" />
                </div>
                <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Risk Score Distribution</h2>
                <Badge variant="outline" className="ml-auto rounded-[3px] text-[10px]">
                  {members.length} students
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                Student risk segmentation across the monitored population
              </p>

              <div className="mt-5 space-y-3">
                {riskDistribution.map((bin, i) => {
                  const barWidth = (bin.count / maxDistCount) * 100;
                  const faceIcon = bin.min >= 61 ? Frown : bin.min >= 41 ? Meh : Smile;
                  const FaceIcon = faceIcon;
                  return (
                    <div key={bin.label} className="group">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-2 text-[var(--ink-secondary)]">
                          <FaceIcon className={cn("size-3", bin.textColor)} />
                          <span className="font-mono tabular-nums">{bin.label}</span>
                        </span>
                        <span className="font-mono tabular-nums text-[var(--ink-muted)]">
                          {bin.count} · {bin.pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-[8px] overflow-hidden rounded-[3px] bg-[var(--hairline)]">
                        <motion.div
                          initial={reduced ? false : { width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                          className={cn("h-full rounded-[3px]", bin.color)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[10px] text-[var(--ink-muted)]">
                Scores derived from activity, progress, and membership signals
              </p>
            </Card>
          </div>

          {/* Recovery Velocity */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-[6px] bg-[var(--recovery-green)]/10">
                  <Gauge className="size-3.5 text-[var(--recovery-green)]" />
                </div>
                <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Recovery Velocity</h2>
              </div>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                Avg. time from detection to resolution
              </p>

              <div className="mt-5 flex items-end gap-3">
                <span className="font-serif text-[42px] leading-none tabular-nums text-[var(--ink-primary)]">
                  {recoveryVelocity.days}
                </span>
                <span className="mb-1 text-[13px] text-[var(--ink-secondary)]">days</span>
                <div className={cn(
                  "mb-1.5 ml-auto flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] font-semibold",
                  recoveryVelocity.trend > 0
                    ? "bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]"
                    : recoveryVelocity.trend < 0
                      ? "bg-[var(--critical)]/10 text-[var(--critical)]"
                      : "bg-[var(--warning)]/10 text-[var(--warning)]",
                )}>
                  {recoveryVelocity.trend > 0 && <TrendingUp className="size-3" />}
                  {recoveryVelocity.trend === 0 && <TrendingDown className="size-3" />}
                  {recoveryVelocity.trend < 0 && <TrendingDown className="size-3" />}
                  {recoveryVelocity.trend > 0 ? "Improving" : recoveryVelocity.trend === 0 ? "Stable" : "Declining"}
                </div>
              </div>

              {/* Speedometer-style visual */}
              <div className="mt-4 relative h-[6px] overflow-hidden rounded-full bg-[var(--hairline)]">
                <motion.div
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${Math.min(100, (14 - recoveryVelocity.days) / 12 * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "h-full rounded-full",
                    recoveryVelocity.trend > 0 ? "bg-[var(--recovery-green)]" : recoveryVelocity.trend === 0 ? "bg-[var(--warning)]" : "bg-[var(--critical)]",
                  )}
                />
                <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--hairline-strong)]" />
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] text-[var(--ink-muted)]">
                <span>Slow (14d)</span>
                <span>Fast (2d)</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[6px] bg-[var(--canvas)] p-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Detection rate</p>
                  <p className="mt-1 font-mono text-[14px] tabular-nums text-[var(--ink-primary)]">
                    {metrics?.needsReview ?? 0}
                  </p>
                </div>
                <div className="rounded-[6px] bg-[var(--canvas)] p-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Resumed</p>
                  <p className="mt-1 font-mono text-[14px] tabular-nums text-[var(--recovery-green)]">
                    {metrics?.observedReturns ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── NEW: Top Friction Points Card ── */}
      {!loading && topFriction.length > 0 && (
        <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-[6px] bg-[var(--warning)]/10">
              <Flame className="size-3.5 text-[var(--warning)]" />
            </div>
            <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Top Friction Points</h2>
            <Badge variant="outline" className="ml-auto rounded-[3px] text-[10px]">
              Top {topFriction.length}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
            Highest stall concentration lessons ranked by severity
          </p>

          <div className="mt-5 space-y-3">
            {topFriction.map((f, i) => {
              const sev = severityConfig(f.stallRate);
              const SevIcon = sev.icon;
              const barPct = (f.stallRate / maxStallRate) * 100;
              const avgPct = (f.courseAverage / maxStallRate) * 100;
              return (
                <motion.div
                  key={f.lesson}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)] p-3 transition-colors hover:bg-[var(--canvas-elevated)]"
                >
                  <div className="flex items-start gap-3">
                    {/* Severity icon */}
                    <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-[6px]", sev.bg)}>
                      <SevIcon className={cn("size-3.5", sev.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                            {f.lesson}
                          </span>
                          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                            {f.affectedStudents} students · Course avg: {f.courseAverage}%
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={cn("font-serif text-[20px] tabular-nums", sev.color)}>
                            {f.stallRate}%
                          </span>
                          <p className={cn("text-[10px]", sev.color)}>
                            {(f.stallRate / f.courseAverage).toFixed(1)}× avg
                          </p>
                        </div>
                      </div>
                      {/* Animated bars */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-10 shrink-0 font-mono text-[9px] uppercase text-[var(--ink-muted)]">stall</span>
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--hairline)]">
                            <motion.div
                              initial={reduced ? false : { width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                              className={cn("h-full rounded-full", sev.barColor)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-10 shrink-0 font-mono text-[9px] uppercase text-[var(--ink-muted)]">avg</span>
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--hairline)]">
                            <motion.div
                              initial={reduced ? false : { width: 0 }}
                              animate={{ width: `${avgPct}%` }}
                              transition={{ duration: 0.6, delay: i * 0.06 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full bg-[var(--ink-muted)]/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-4 text-[10px] text-[var(--ink-muted)]">
            Severity: <span className="text-[var(--critical)]">Critical ≥20%</span> · <span className="text-[var(--warning)]">High ≥15%</span> · <span className="text-[#D4652A]">Medium ≥10%</span> · <span className="text-[var(--info)]">Low &lt;10%</span>
          </p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Friction chart (original) */}
        <div className="lg:col-span-3">
          {loading ? (
            <CardSkeleton rows={5} />
          ) : (
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-[var(--warning)]" />
                <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Course Friction</h2>
                <Badge variant="outline" className="ml-auto rounded-[3px] text-[10px]">
                  {friction.length} hotspots
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                Highest stall concentration by lesson — sorted by impact
              </p>

              <div className="mt-5 space-y-3">
                {friction.map((f, i) => {
                  const barWidth = (f.stallRate / maxStallRate) * 100;
                  const avgWidth = (f.courseAverage / maxStallRate) * 100;
                  const multiplier = (f.stallRate / f.courseAverage).toFixed(1);
                  return (
                    <div
                      key={f.lesson}
                      className="group rounded-[6px] border border-l-[3px] border-l-[var(--warning)]/60 bg-[var(--canvas)] p-3 transition-colors hover:bg-[var(--canvas-elevated)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                            {f.lesson}
                          </span>
                          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                            {f.affectedStudents} students affected · Course avg: {f.courseAverage}%
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-serif text-[20px] text-[var(--warning)] tabular-nums">
                            {f.stallRate}%
                          </span>
                          <p className="text-[10px] text-[var(--warning)]">{multiplier}× avg</p>
                        </div>
                      </div>
                      {/* Bar */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-10 shrink-0 font-mono text-[9px] uppercase text-[var(--ink-muted)]">stall</span>
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--hairline)]">
                            <motion.div
                              initial={reduced ? false : { width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full bg-[var(--warning)]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-10 shrink-0 font-mono text-[9px] uppercase text-[var(--ink-muted)]">avg</span>
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--hairline)]">
                            <motion.div
                              initial={reduced ? false : { width: 0 }}
                              animate={{ width: `${avgWidth}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full bg-[var(--ink-muted)]/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[10px] text-[var(--ink-muted)]">
                Sample size: {metrics?.membersMonitored ?? 0} students · Data is illustrative
              </p>
            </Card>
          )}
        </div>

        {/* Side: response patterns + activation */}
        <div className="space-y-5 lg:col-span-2">
          {loading ? (
            <CardSkeleton rows={4} />
          ) : (
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Response Patterns</h2>
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                How students respond to interventions
              </p>

              {/* Stacked bar */}
              {responseTotal > 0 && (
                <div className="mt-4">
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--canvas)]">
                    {responseBreakdown.map((r) => (
                      <motion.div
                        key={r.label}
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${(r.value / responseTotal) * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className={r.color}
                      />
                    ))}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {responseBreakdown.map((r) => {
                      const pct = Math.round((r.value / responseTotal) * 100);
                      return (
                        <div key={r.label} className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-[var(--ink-secondary)]">
                            <span className={cn("size-1.5 rounded-full", r.color)} />
                            {r.label}
                          </span>
                          <span className="font-mono tabular-nums text-[var(--ink-muted)]">
                            {r.value} · {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {loading ? (
            <CardSkeleton rows={5} />
          ) : activation ? (
            <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-[var(--info)]" />
                <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Activation</h2>
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                Student engagement breakdown
              </p>

              <div className="mt-4 space-y-2.5">
                {[
                  { label: "Actively progressing", value: activation.activelyProgressing, color: "bg-[var(--recovery-green)]", text: "text-[var(--recovery-green)]" },
                  { label: "Started but stalled", value: activation.startedButStalled, color: "bg-[var(--warning)]", text: "text-[var(--warning)]" },
                  { label: "Never started", value: activation.neverStarted, color: "bg-[var(--critical)]", text: "text-[var(--critical)]" },
                  { label: "Near completion", value: activation.nearCompletion, color: "bg-[var(--info)]", text: "text-[var(--info)]" },
                ].map((row) => {
                  const pct = Math.round((row.value / activation.totalStudents) * 100);
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--ink-secondary)]">{row.label}</span>
                        <span className="font-mono tabular-nums text-[var(--ink-muted)]">
                          {row.value} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-[4px] overflow-hidden rounded-full bg-[var(--hairline)]">
                        <motion.div
                          initial={reduced ? false : { width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={cn("h-full rounded-full", row.color)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-[var(--ink-muted)]">
                No guaranteed recommendations · Methodology: cohort comparison
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
