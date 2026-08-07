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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export default function InsightsPage() {
  const params = useParams<{ companyId: string }>();
  const reduced = useReducedMotion();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);

  const friction = bundle?.frictionPoints ?? [];
  const responsePatterns = bundle?.responsePatterns;
  const activation = bundle?.activationPatterns;
  const metrics = bundle?.overview?.metrics;

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

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Friction chart */}
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
