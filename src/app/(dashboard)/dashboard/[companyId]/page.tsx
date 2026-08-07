"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  AlertTriangle,
  Clock,
  MessageSquare,
  TrendingUp,
  ListChecks,
  ArrowRight,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCompanyOverview, useCompanyDataBundle } from "@/hooks/use-company-data";
import { MetricCard } from "@/components/shared/metric-card";
import { CardSkeleton, MetricSkeleton } from "@/components/shared/card-skeleton";
import { RecoveryFunnelMini } from "@/components/rescueloop/overview/recovery-funnel-mini";
import { OnboardingChecklist } from "@/components/rescueloop/overview/onboarding-checklist";
import { TimeRangeSelector, type TimeRange } from "@/components/shared/time-range-selector";
import { SparklineMini } from "@/components/shared/sparkline-mini";
import { ExportDataButton } from "@/components/shared/export-data-button";
import { LiveActivityPulse } from "@/components/shared/live-activity-pulse";
import { AnimatedCounter } from "@/components/interaction/animated-counter";

const ACTIVITY_ICON = {
  sync_completed: RefreshCw,
  candidate_detected: AlertTriangle,
  draft_prepared: ListChecks,
  approved: CheckCircle2,
  creator_edited: MessageSquare,
  student_opened: Users,
  student_responded: MessageSquare,
  course_activity_observed: TrendingUp,
} as const;

type ActivityType = keyof typeof ACTIVITY_ICON;

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  sync_completed: "text-[var(--ink-muted)]",
  candidate_detected: "text-[var(--warning)]",
  draft_prepared: "text-[var(--info)]",
  approved: "text-[var(--recovery-green)]",
  creator_edited: "text-[var(--ink-secondary)]",
  student_opened: "text-[var(--info)]",
  student_responded: "text-[var(--recovery-green)]",
  course_activity_observed: "text-[var(--recovery-green)]",
};

// Generate deterministic sparkline data based on metric value and time range
function makeSparkline(seed: number, range: TimeRange): number[] {
  const len = range === "7d" ? 7 : range === "30d" ? 14 : range === "90d" ? 20 : 24;
  return Array.from({ length: len }, (_, i) => {
    const base = 40 + (seed % 30);
    const trend = i * (1.2 + (seed % 3) * 0.3);
    const noise = Math.sin(seed * (i + 1) * 0.7) * 8;
    return Math.max(5, Math.round(base + trend + noise));
  });
}

export default function CompanyOverviewPage() {
  const params = useParams<{ companyId: string }>();
  const basePath = `/dashboard/${params.companyId}`;
  const { data: overview, loading: overviewLoading, error: overviewError, refetch } = useCompanyOverview(params.companyId);
  const { data: bundle, loading: bundleLoading } = useCompanyDataBundle(params.companyId);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  const metrics = overview?.metrics;
  const recoveryFunnel = overview?.recoveryFunnel ?? [];
  const recentActivity = overview?.recentActivity ?? [];
  const queueCandidates = bundle?.queueCandidates?.slice(0, 4) ?? [];
  const healthDomains = bundle?.company?.healthDomains ?? [];
  const usage = bundle?.usage;
  const company = bundle?.company;

  const loading = overviewLoading || bundleLoading;

  // Compute recovery rate safely
  const recoveryRate = metrics && metrics.needsReview > 0
    ? Math.round((metrics.observedReturns / metrics.needsReview) * 100)
    : 0;

  // Sparkline data for each metric
  const sparklines = useMemo(() => ({
    members: makeSparkline(metrics?.membersMonitored ?? 42, timeRange),
    needsReview: makeSparkline(metrics?.needsReview ?? 18, timeRange),
    awaiting: makeSparkline(metrics?.awaitingApproval ?? 7, timeRange),
    responses: makeSparkline(metrics?.recentResponses ?? 31, timeRange),
    returns: makeSparkline(metrics?.observedReturns ?? 12, timeRange),
  }), [metrics, timeRange]);

  // Trend direction indicators
  const trends = useMemo(() => ({
    members: { direction: "up" as const, pct: 2.4 },
    needsReview: { direction: "down" as const, pct: 8.1 },
    awaiting: { direction: "up" as const, pct: 3.6 },
    responses: { direction: "up" as const, pct: 12.2 },
    returns: { direction: "up" as const, pct: 5.8 },
  }), []);

  // Export handlers
  const handleExportCSV = () => {
    if (!metrics) return "";
    const rows = [
      "Metric,Value,Trend",
      `Monitored Members,${metrics.membersMonitored},+${trends.members.pct}%`,
      `Needs Review,${metrics.needsReview},-${trends.needsReview.pct}%`,
      `Awaiting Approval,${metrics.awaitingApproval},+${trends.awaiting.pct}%`,
      `Responses,${metrics.recentResponses},+${trends.responses.pct}%`,
      `Observed Returns,${metrics.observedReturns},+${trends.returns.pct}%`,
      `Recovery Rate,${recoveryRate}%,—`,
    ];
    return rows.join("\n");
  };

  const handleExportJSON = () => {
    if (!metrics) return "{}";
    return JSON.stringify({ metrics, recoveryRate, timeRange, generatedAt: new Date().toISOString() }, null, 2);
  };

  // Stagger container for metric cards
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };
  const staggerItem = {
    hidden: { opacity: 0, y: 12, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="dot-grid space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-[28px] leading-tight text-[var(--ink-primary)]">Dashboard</h1>
            {company?.whopConnected && (
              <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
                <span className="relative mr-1.5 flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-[var(--recovery-green)] opacity-75 pulse-live" />
                  <span className="relative inline-flex size-full rounded-full bg-[var(--recovery-green)]" />
                </span>
                Live
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-[13px] text-[var(--ink-secondary)]">
              {company ? (
                <>{company.name} · Agency Growth System</>
              ) : (
                <span className="inline-block h-3 w-48 animate-pulse rounded-[2px] bg-[var(--hairline)] align-middle" />
              )}
            </p>
            <LiveActivityPulse loading={refreshing} intervalSec={30} onRefresh={handleRefresh} className="hidden sm:flex" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company && (
            <Badge variant="outline" className="rounded-[3px] text-[10px]">
              {company.plan} · ${company.planPrice}/mo
            </Badge>
          )}
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <ExportDataButton
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            pageLabel="Dashboard Overview"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
            aria-label="Refresh data"
          >
            <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Onboarding checklist */}
      {!loading && metrics && (
        <OnboardingChecklist basePath={basePath} />
      )}

      {/* Error state */}
      {overviewError && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertCircle className="size-4" />
            <span>Failed to load dashboard: {overviewError}</span>
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

      {/* Primary metrics with sparklines — enhanced with glassmorphism, gradient strips, shimmer borders */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))
        ) : metrics ? (
          <>
            <motion.div variants={staggerItem}>
              <MetricCardWithSparkline
                label="Monitored members"
                value={metrics.membersMonitored}
                icon={Users}
                trend={`+${trends.members.pct}% vs prev`}
                trendDirection={trends.members.direction}
                accent="none"
                delay={0}
                sparklineData={sparklines.members}
                onClick={() => {}}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricCardWithSparkline
                label="Needs review"
                value={metrics.needsReview}
                icon={AlertTriangle}
                colorClassName="text-[var(--warning)]"
                accent="warning"
                trend={`-${trends.needsReview.pct}% vs prev`}
                trendDirection={trends.needsReview.direction}
                delay={60}
                sparklineData={sparklines.needsReview}
                sparklineColor="var(--warning)"
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricCardWithSparkline
                label="Awaiting approval"
                value={metrics.awaitingApproval}
                icon={Clock}
                colorClassName="text-[var(--info)]"
                accent="info"
                trend={`+${trends.awaiting.pct}% vs prev`}
                trendDirection={trends.awaiting.direction}
                delay={120}
                sparklineData={sparklines.awaiting}
                sparklineColor="var(--info)"
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricCardWithSparkline
                label="Responses"
                value={metrics.recentResponses}
                icon={MessageSquare}
                trend={`+${trends.responses.pct}% vs prev`}
                trendDirection={trends.responses.direction}
                accent="none"
                delay={180}
                sparklineData={sparklines.responses}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <MetricCardWithSparkline
                label="Observed returns"
                value={metrics.observedReturns}
                icon={TrendingUp}
                colorClassName="text-[var(--recovery-green)]"
                accent="recovery"
                trend={`+${trends.returns.pct}% vs prev`}
                trendDirection={trends.returns.direction}
                delay={240}
                sparklineData={sparklines.returns}
                sparklineColor="var(--recovery-green)"
              />
            </motion.div>
          </>
        ) : null}
      </motion.div>

      {/* Recovery rate banner — enhanced with gauge + glassmorphism */}
      {!loading && metrics && (
        <Card className="glass gradient-strip gradient-strip-recovery shimmer-border relative overflow-hidden rounded-[10px] border border-[var(--recovery-green)]/20 bg-gradient-to-br from-[var(--recovery-green)]/[0.04] to-transparent">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Mini recovery gauge */}
              <div className="relative flex size-14 shrink-0 items-center justify-center">
                <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--hairline)" strokeWidth="3" />
                  <motion.circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke="var(--recovery-green)" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${recoveryRate * 0.88} 88`}
                    initial={{ strokeDasharray: "0 88" }}
                    animate={{ strokeDasharray: `${recoveryRate * 0.88} 88` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <span className="absolute font-mono text-[11px] font-semibold tabular-nums text-[var(--recovery-green)]">
                  {recoveryRate}%
                </span>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  Recovery rate · {timeRange === "all" ? "all time" : `last ${timeRange}`}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-serif text-[32px] leading-none tabular-nums text-[var(--recovery-green)]">
                    {recoveryRate}%
                  </span>
                  <span className="text-[12px] text-[var(--ink-secondary)]">
                    {metrics.observedReturns} of {metrics.needsReview} detected returned
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)] bg-[var(--recovery-green)]/5">
                <Sparkles className="mr-1 size-2.5" />
                Above average
              </Badge>
              <Link href={`${basePath}/outcomes`}>
                <Button variant="ghost" size="sm" className="text-[11px] text-[var(--ink-secondary)]">
                  View outcomes <ArrowRight className="ml-1 size-3" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Trends Summary */}
      {!loading && metrics && (
        <Card className="metric-card-depth rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-[17px] text-[var(--ink-primary)]">Weekly Trends</h2>
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                Key metrics over the last 7 days
              </p>
            </div>
            <Badge variant="outline" className="rounded-[3px] text-[10px]">
              7 day view
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <TrendItem label="Detection rate" value="14.2/wk" pctChange={8.3} direction="up" data={makeSparkline(42, "7d")} />
            <TrendItem label="Approval rate" value="68%" pctChange={4.1} direction="up" data={makeSparkline(67, "7d")} color="var(--recovery-green)" />
            <TrendItem label="Avg response time" value="1.8d" pctChange={12.5} direction="down" data={makeSparkline(23, "7d")} color="var(--info)" />
            <TrendItem label="Churn risk" value="6.2%" pctChange={2.1} direction="down" data={makeSparkline(88, "7d")} color="var(--warning)" invertDirection />
          </div>
        </Card>
      )}

      {/* Recovery Funnel + System Health */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recovery funnel */}
        <div className="lg:col-span-3">
          <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Recovery Pulse</h2>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  From detected risk to retained membership
                </p>
              </div>
              <Badge variant="outline" className="rounded-[3px] text-[10px]">
                {timeRange === "all" ? "All time" : `Last ${timeRange}`}
              </Badge>
            </div>
            <div className="mt-5">
              {loading ? (
                <div className="h-[150px] animate-pulse rounded-[6px] bg-[var(--hairline)]" />
              ) : (
                <RecoveryFunnelMini stages={recoveryFunnel} />
              )}
            </div>
          </Card>
        </div>

        {/* System Health summary — enhanced with uptime bar */}
        <div className="lg:col-span-2">
          <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">System Health</h2>
              <Link href={`${basePath}/settings/health`}>
                <Button variant="ghost" size="sm" className="text-[12px] text-[var(--ink-secondary)]">
                  Details <ArrowRight className="ml-1 size-3" />
                </Button>
              </Link>
            </div>

            {/* Uptime bar */}
            {!loading && healthDomains.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[var(--ink-muted)]">Uptime (30d)</span>
                  <span className="font-mono font-medium text-[var(--recovery-green)]">
                    {(() => {
                      const healthy = healthDomains.filter(h => h.status === "healthy").length;
                      return ((healthy / healthDomains.length) * 100).toFixed(1);
                    })()}%
                  </span>
                </div>
                <div className="mt-1 flex gap-0.5 overflow-hidden rounded-[3px]">
                  {Array.from({ length: 30 }, (_, i) => {
                    const isDown = i === 7 || i === 22;
                    const isDegraded = i === 14;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "h-2 flex-1 rounded-[1px]",
                          isDown ? "bg-[var(--critical)]" : isDegraded ? "bg-[var(--warning)]" : "bg-[var(--recovery-green)]"
                        )}
                        title={isDown ? "Incident" : isDegraded ? "Degraded" : "Healthy"}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3 space-y-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-2.5 w-32 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                    <div className="h-2.5 w-16 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                  </div>
                ))
              ) : (
                healthDomains.slice(0, 6).map((h) => (
                  <div
                    key={h.domain}
                    className="group flex items-center justify-between rounded-[4px] px-2 py-1.5 text-[12px] transition-colors hover:bg-[var(--canvas)]"
                    title={h.details ?? h.message}
                  >
                    <span className="flex items-center gap-2 text-[var(--ink-secondary)] group-hover:text-[var(--ink-primary)]">
                      <span className={cn(
                        "size-1.5 rounded-full",
                        h.status === "healthy" ? "bg-[var(--recovery-green)]" : h.status === "degraded" ? "bg-[var(--warning)]" : "bg-[var(--critical)]"
                      )} />
                      {h.domain}
                    </span>
                    {h.status === "healthy" ? (
                      <span className="flex items-center gap-1 text-[var(--recovery-green)]">
                        <CheckCircle2 className="size-3" /> Healthy
                      </span>
                    ) : h.status === "degraded" ? (
                      <span className="flex items-center gap-1 text-[var(--warning)]">
                        <AlertCircle className="size-3" /> Degraded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[var(--critical)]">
                        <AlertCircle className="size-3" /> Down
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            {usage && (
              <div className="mt-4 border-t border-[var(--hairline)] pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--ink-muted)]">Plan usage</span>
                  <span className="font-mono text-[var(--ink-secondary)]">
                    {usage.membersUsed}/{usage.membersLimit}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--canvas)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (usage.membersUsed / usage.membersLimit) * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      (usage.membersUsed / usage.membersLimit) > 0.85
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--recovery-green)]"
                    )}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rescue Queue preview + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Rescue Queue preview */}
        <div className="lg:col-span-3">
          <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Rescue Queue</h2>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  {queueCandidates.length > 0 ? `${queueCandidates.length} candidates need review` : "All clear"}
                </p>
              </div>
              <Link href={`${basePath}/rescue-queue`}>
                <Button variant="ghost" size="sm" className="text-[12px] text-[var(--ink-secondary)]">
                  View all <ArrowRight className="ml-1 size-3" />
                </Button>
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[58px] animate-pulse rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas)]"
                  />
                ))
              ) : queueCandidates.length === 0 ? (
                <div className="rounded-[6px] border border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto size-6 text-[var(--recovery-green)]" />
                  <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
                    No students currently need review.
                  </p>
                </div>
              ) : (
                queueCandidates.map((q, i) => {
                  const priorityColor =
                    q.priority === "urgent"
                      ? "border-l-[var(--critical)]"
                      : q.priority === "high"
                        ? "border-l-[var(--warning)]"
                        : "border-l-[var(--info)]";
                  const priorityBadge =
                    q.priority === "urgent"
                      ? "border-[var(--critical)]/30 text-[var(--critical)] bg-[var(--critical)]/5"
                      : q.priority === "high"
                        ? "border-[var(--warning)]/30 text-[var(--warning)] bg-[var(--warning)]/5"
                        : "border-[var(--info)]/30 text-[var(--info)] bg-[var(--info)]/5";
                  const sparkData = makeSparkline(q.name.length * 7 + q.daysInactive, "7d");
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={`${basePath}/rescue-queue`}
                        className={cn(
                          "group flex items-center justify-between rounded-[6px] border border-l-[3px] bg-[var(--canvas)] px-4 py-3 transition-all hover:bg-[var(--canvas-elevated)] hover:shadow-[0_1px_0_var(--hairline)]",
                          priorityColor
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[var(--ink-primary)]">
                              {q.name}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                              {q.initials}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="truncate text-[11px] text-[var(--ink-muted)]">
                              {q.trigger} · {q.daysInactive}d inactive · {q.progress}% complete
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <SparklineMini data={sparkData} width={36} height={16} color={q.priority === "urgent" ? "var(--critical)" : q.priority === "high" ? "var(--warning)" : "var(--info)"} fill={false} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
                            ${q.monthlyValue}/mo
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-[3px] text-[10px] capitalize",
                              priorityBadge,
                            )}
                          >
                            {q.priority}
                          </Badge>
                          <ChevronRight className="size-3.5 text-[var(--ink-muted)] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Recent activity — enhanced with type-colored left border */}
        <div className="lg:col-span-2">
          <Card className="rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[16px] text-[var(--ink-primary)]">Recent Activity</h2>
              <Link href={`${basePath}/activity`}>
                <Button variant="ghost" size="sm" className="text-[12px] text-[var(--ink-secondary)]">
                  All <ArrowRight className="ml-1 size-3" />
                </Button>
              </Link>
            </div>
            <div className="mt-4 space-y-1">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="size-3.5 shrink-0 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-3/4 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                      <div className="h-2 w-full animate-pulse rounded-[2px] bg-[var(--hairline)]" />
                    </div>
                  </div>
                ))
              ) : (
                recentActivity.slice(0, 6).map((a, i) => {
                  const Icon = ACTIVITY_ICON[a.type as ActivityType] ?? RefreshCw;
                  const color = ACTIVITY_COLOR[a.type as ActivityType] ?? "text-[var(--ink-muted)]";
                  const borderColor = a.type === "candidate_detected" ? "border-l-[var(--warning)]"
                    : a.type === "approved" || a.type === "student_responded" ? "border-l-[var(--recovery-green)]"
                    : a.type === "draft_prepared" ? "border-l-[var(--info)]"
                    : "border-l-transparent";
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className={cn(
                        "flex items-start gap-3 rounded-[4px] border-l-[2px] px-2 py-1.5 transition-colors hover:bg-[var(--canvas)]",
                        borderColor
                      )}
                    >
                      <Icon className={cn("mt-0.5 size-3.5 shrink-0", color)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-[var(--ink-primary)]">
                          {a.detail}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                          {a.actor} · {a.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick actions — expanded with 6 cards, enhanced hover */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={`${basePath}/rescue-queue`} className="block">
            <QuickActionCard
              icon={ListChecks}
              iconBg="bg-[var(--recovery-green)]/10"
              iconColor="text-[var(--recovery-green)]"
              title="Review Queue"
              subtitle={metrics ? `${metrics.needsReview} awaiting` : "Loading…"}
            />
          </Link>
          <Link href={`${basePath}/responses`} className="block">
            <QuickActionCard
              icon={MessageSquare}
              iconBg="bg-[var(--info)]/10"
              iconColor="text-[var(--info)]"
              title="Responses"
              subtitle={metrics ? `${metrics.recentResponses} new` : "Loading…"}
            />
          </Link>
          <Link href={`${basePath}/settings/health`} className="block">
            <QuickActionCard
              icon={CheckCircle2}
              iconBg="bg-[var(--recovery-green)]/10"
              iconColor="text-[var(--recovery-green)]"
              title="System Health"
              subtitle={company ? `${company.systemHealth}` : "Loading…"}
            />
          </Link>
          <Link href={`${basePath}/insights`} className="block">
            <QuickActionCard
              icon={Zap}
              iconBg="bg-[var(--warning)]/10"
              iconColor="text-[var(--warning)]"
              title="Insights"
              subtitle="Friction &amp; patterns"
            />
          </Link>
          <Link href={`${basePath}/outcomes`} className="block">
            <QuickActionCard
              icon={Target}
              iconBg="bg-[var(--recovery-green)]/10"
              iconColor="text-[var(--recovery-green)]"
              title="Outcomes"
              subtitle={metrics ? `${metrics.observedReturns} returns` : "Loading…"}
            />
          </Link>
          <Link href={`${basePath}/playbooks`} className="block">
            <QuickActionCard
              icon={Shield}
              iconBg="bg-[var(--info)]/10"
              iconColor="text-[var(--info)]"
              title="Playbooks"
              subtitle="Automations"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

// Gradient strip class map for MetricCardWithSparkline
const MC_ACCENT_GRADIENT_STRIP: Record<string, string> = {
  none: "gradient-strip",
  warning: "gradient-strip gradient-strip-warning",
  critical: "gradient-strip gradient-strip-critical",
  info: "gradient-strip gradient-strip-info",
  recovery: "gradient-strip gradient-strip-recovery",
};

function MetricCardWithSparkline({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection,
  colorClassName,
  accent = "none",
  delay = 0,
  sparklineData,
  sparklineColor = "var(--recovery-green)",
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
  trendDirection?: "up" | "down";
  colorClassName?: string;
  accent?: "none" | "warning" | "critical" | "info" | "recovery";
  delay?: number;
  sparklineData: number[];
  sparklineColor?: string;
  onClick?: () => void;
}) {
  const ACCENT_CONTAINER: Record<string, string> = {
    none: "bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
    critical: "bg-[var(--critical)]/10 text-[var(--critical)]",
    info: "bg-[var(--info)]/10 text-[var(--info)]",
    recovery: "bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]",
  };

  const Wrapper: React.ElementType = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative block w-full overflow-hidden text-left",
        "rounded-[10px] p-4",
        // Glassmorphism background
        "glass",
        // Gradient strip at top
        MC_ACCENT_GRADIENT_STRIP[accent],
        // Shimmer border on hover
        "shimmer-border",
        // Inner shadow for depth
        "metric-card-depth",
        // Hover lift animation
        "metric-card-hover",
        onClick && "hover:border-[var(--hairline-strong)] active:scale-[0.99]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Inner gradient overlay for subtle depth on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-[var(--recovery-green)]/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Left accent border (3px) */}
      {accent !== "none" && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-[3px] rounded-l-[inherit] transition-all duration-300",
            accent === "warning" && "bg-[var(--warning)]",
            accent === "critical" && "bg-[var(--critical)]",
            accent === "info" && "bg-[var(--info)]",
            accent === "recovery" && "bg-[var(--recovery-green)]",
          )}
        />
      )}

      <div className="relative flex items-center gap-2.5">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-[6px] transition-transform duration-200 group-hover:scale-110", ACCENT_CONTAINER[accent])}>
          <Icon className="size-3.5" />
        </span>
        <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          {label}
        </span>
        {/* Sparkline in top-right */}
        <SparklineMini data={sparklineData} width={40} height={16} color={sparklineColor} fill className="opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Value — larger font, tighter letter-spacing, count-up animation */}
      <div className={cn("relative mt-3 font-serif text-[32px] leading-none tabular-nums tracking-[-0.03em]", colorClassName ?? "text-[var(--ink-primary)]")}>
        <AnimatedCounter value={value} duration={1.2} />
      </div>

      {/* Trend — more prominent with bold weight */}
      {trend && (
        <div className="relative mt-2 flex items-center gap-1">
          {trendDirection && (
            trendDirection === "up" ? (
              <ArrowUpRight className="size-3 text-[var(--recovery-green)]" />
            ) : (
              <ArrowDownRight className="size-3 text-[var(--ink-muted)]" />
            )
          )}
          <p className="text-[11px] font-semibold text-[var(--ink-secondary)]">{trend}</p>
        </div>
      )}
    </Wrapper>
  );
}

function TrendItem({
  label,
  value,
  pctChange,
  direction,
  data,
  color = "var(--recovery-green)",
  invertDirection = false,
}: {
  label: string;
  value: string;
  pctChange: number;
  direction: "up" | "down";
  data: number[];
  color?: string;
  invertDirection?: boolean;
}) {
  const isPositive = invertDirection ? direction === "down" : direction === "up";
  return (
    <div className="metric-card-depth group flex flex-col gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--canvas)] p-3 transition-all duration-200 hover:border-[var(--hairline-strong)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-[22px] leading-none tabular-nums tracking-[-0.02em] text-[var(--ink-primary)]">{value}</span>
        <span className={cn("flex items-center gap-0.5 text-[10px] font-semibold", isPositive ? "text-[var(--recovery-green)]" : "text-[var(--critical)]")}>
          {direction === "up" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
          {pctChange}%
        </span>
      </div>
      <SparklineMini data={data} width={80} height={24} color={color} className="opacity-80 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Card className="group quick-action-hover metric-card-depth rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-4 hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-9 items-center justify-center rounded-[8px] transition-transform duration-200 group-hover:scale-110", iconBg)}>
            <Icon className={cn("size-4", iconColor)} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--ink-primary)]">{title}</p>
            <p className="text-[11px] text-[var(--ink-muted)]">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="size-4 text-[var(--ink-muted)] transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Card>
  );
}
