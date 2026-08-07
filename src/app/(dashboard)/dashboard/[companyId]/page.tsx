"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCompanyOverview, useCompanyDataBundle } from "@/hooks/use-company-data";
import { MetricCard } from "@/components/shared/metric-card";
import { CardSkeleton, MetricSkeleton } from "@/components/shared/card-skeleton";
import { RecoveryFunnelMini } from "@/components/rescueloop/overview/recovery-funnel-mini";
import { OnboardingChecklist } from "@/components/rescueloop/overview/onboarding-checklist";

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

export default function CompanyOverviewPage() {
  const params = useParams<{ companyId: string }>();
  const basePath = `/dashboard/${params.companyId}`;
  const { data: overview, loading: overviewLoading, error: overviewError, refetch } = useCompanyOverview(params.companyId);
  const { data: bundle, loading: bundleLoading } = useCompanyDataBundle(params.companyId);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-[28px] leading-tight text-[var(--ink-primary)]">Dashboard</h1>
            {company?.whopConnected && (
              <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
                <Wifi className="mr-1 size-3" /> Live
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            {company ? (
              <>{company.name} · Agency Growth System</>
            ) : (
              <span className="inline-block h-3 w-48 animate-pulse rounded-[2px] bg-[var(--hairline)] align-middle" />
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {company && (
            <Badge variant="outline" className="rounded-[3px] text-[10px]">
              {company.plan} · ${company.planPrice}/mo
            </Badge>
          )}
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

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))
        ) : metrics ? (
          <>
            <MetricCard
              label="Monitored members"
              value={metrics.membersMonitored}
              icon={Users}
              trend={`+${Math.max(1, Math.floor(metrics.membersMonitored * 0.016))} this week`}
              accent="none"
              delay={0}
              onClick={() => {}}
            />
            <MetricCard
              label="Needs review"
              value={metrics.needsReview}
              icon={AlertTriangle}
              colorClassName="text-[var(--warning)]"
              accent="warning"
              trend="Awaiting creator action"
              delay={60}
            />
            <MetricCard
              label="Awaiting approval"
              value={metrics.awaitingApproval}
              icon={Clock}
              colorClassName="text-[var(--info)]"
              accent="info"
              trend="Drafts ready to review"
              delay={120}
            />
            <MetricCard
              label="Responses"
              value={metrics.recentResponses}
              icon={MessageSquare}
              trend="+4 today"
              accent="none"
              delay={180}
            />
            <MetricCard
              label="Observed returns"
              value={metrics.observedReturns}
              icon={TrendingUp}
              colorClassName="text-[var(--recovery-green)]"
              accent="recovery"
              trend="Confirmed + observed"
              delay={240}
            />
          </>
        ) : null}
      </div>

      {/* Recovery rate banner */}
      {!loading && metrics && (
        <Card className="relative overflow-hidden rounded-[10px] border border-[var(--recovery-green)]/20 bg-gradient-to-br from-[var(--recovery-green)]/[0.04] to-transparent">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-[10px] bg-[var(--recovery-green)]/10 ring-1 ring-[var(--recovery-green)]/20">
                <TrendingUp className="size-5 text-[var(--recovery-green)]" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  Recovery rate · last 30 days
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-serif text-[32px] leading-none tabular-nums text-[var(--recovery-green)]">
                    {Math.round((metrics.observedReturns / metrics.needsReview) * 100)}%
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

      {/* Recovery Funnel + System Health */}
      <div className="grid gap-6 lg:grid-cols-5">
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
                Last 30 days
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

        {/* System Health summary */}
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
            <div className="mt-4 space-y-1">
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
      <div className="grid gap-6 lg:grid-cols-5">
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
                          <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">
                            {q.trigger} · {q.daysInactive}d inactive · {q.progress}% complete
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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

        {/* Recent activity */}
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
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="flex items-start gap-3 rounded-[4px] px-2 py-1.5 transition-colors hover:bg-[var(--canvas)]"
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

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href={`${basePath}/rescue-queue`} className="block">
            <Card className="group rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-[8px] bg-[var(--recovery-green)]/10">
                    <ListChecks className="size-4 text-[var(--recovery-green)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--ink-primary)]">Review Queue</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {metrics ? `${metrics.needsReview} awaiting` : "Loading…"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[var(--ink-muted)] transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
          <Link href={`${basePath}/responses`} className="block">
            <Card className="group rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-[8px] bg-[var(--info)]/10">
                    <MessageSquare className="size-4 text-[var(--info)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--ink-primary)]">Responses</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {metrics ? `${metrics.recentResponses} new` : "Loading…"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[var(--ink-muted)] transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
          <Link href={`${basePath}/settings/health`} className="block">
            <Card className="group rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)] hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-[8px] bg-[var(--recovery-green)]/10">
                    <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--ink-primary)]">System Health</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {company ? `${company.systemHealth}` : "Loading…"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[var(--ink-muted)] transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
