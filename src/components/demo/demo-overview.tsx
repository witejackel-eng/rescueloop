"use client";

import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DEMO_METRICS, DEMO_RECOVERY_FUNNEL, DEMO_LESSON_BARS } from "@/lib/demo-fixtures";

export function DemoOverviewSection() {
  const usagePct = (DEMO_METRICS.membersMonitored / DEMO_METRICS.planMembers) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Members monitored" value={DEMO_METRICS.membersMonitored} />
        <MetricCard label="Needs review" value={DEMO_METRICS.needsReview} accent="warning" />
        <MetricCard label="Awaiting approval" value={DEMO_METRICS.awaitingApproval} accent="critical" />
        <MetricCard label="Recent responses" value={DEMO_METRICS.recentResponses} />
        <MetricCard label="Observed returns" value={DEMO_METRICS.observedReturns} accent="recovery" />
      </div>

      {/* Recovery Pulse */}
      <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <header className="border-b border-[var(--hairline)] px-5 py-4">
          <h2 className="font-serif text-[20px] leading-none text-[var(--ink-primary)]">
            Recovery Pulse
          </h2>
          <p className="mt-1.5 text-[12px] text-[var(--ink-muted)]">
            From detected risk to retained member · last 30 days
          </p>
        </header>
        <div className="overflow-x-auto">
          <div className="flex min-w-[760px] items-stretch px-5 py-5">
            {DEMO_RECOVERY_FUNNEL.map((stage, i) => {
              const max = DEMO_RECOVERY_FUNNEL[0].count;
              const barWidthPct = (stage.count / max) * 100;
              return (
                <div key={stage.stage} className="flex items-stretch" style={{ flex: "0 0 auto" }}>
                  <button
                    type="button"
                    className="flex w-[100px] flex-col gap-2 border border-transparent p-2.5 text-left hover:bg-[var(--canvas-elevated)]"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                      {stage.stage}
                    </span>
                    <span className="font-mono tabular-nums text-[24px] leading-none text-[var(--ink-primary)]">
                      {stage.count}
                    </span>
                    <div className="mt-auto h-[3px] w-full bg-[var(--hairline-subtle)]">
                      <div className="h-full bg-[var(--recovery-green)]" style={{ width: `${barWidthPct}%` }} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left */}
        <div className="flex flex-col gap-6">
          {/* Rescue Queue preview */}
          <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <header className="border-b border-[var(--hairline)] px-5 py-3">
              <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">Rescue Queue</h3>
              <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
                {DEMO_METRICS.needsReview} students need review · {DEMO_METRICS.awaitingApproval} awaiting approval
              </p>
            </header>
            <div className="divide-y divide-[var(--hairline)]">
              {[
                { name: "Maya Thompson", trigger: "Mid-course stall", priority: "high", days: 8 },
                { name: "Devon Park", trigger: "Inactive near renewal", priority: "urgent", days: 12 },
                { name: "Sara Klein", trigger: "Never started / stalled early", priority: "medium", days: 15 },
                { name: "Jamal Wright", trigger: "Review required", priority: "high", days: 5 },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--canvas-elevated)]">
                  <span className={`size-1.5 rounded-full shrink-0 ${item.priority === "urgent" ? "bg-[var(--critical)]" : item.priority === "high" ? "bg-[var(--warning)]" : "bg-[var(--info)]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-[var(--ink-primary)]">{item.name}</p>
                    <p className="text-[12px] text-[var(--ink-muted)]">{item.trigger}</p>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">{item.days}d inactive</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Course friction preview */}
          <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <header className="border-b border-[var(--hairline)] px-5 py-3">
              <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">Course Friction Signal</h3>
            </header>
            <div className="px-5 py-4">
              <div className="flex h-14 items-end gap-1.5">
                {DEMO_LESSON_BARS.map((l) => {
                  const max = Math.max(...DEMO_LESSON_BARS.map((b) => b.stallRate));
                  const heightPct = (l.stallRate / max) * 100;
                  const isL7 = l.lesson === "L7";
                  return (
                    <div key={l.lesson} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <div className="flex w-full items-end justify-center" style={{ height: "100%" }}>
                        <div
                          className={`w-full ${isL7 ? "bg-[var(--warning)]" : "bg-[var(--ink-primary)]/15"}`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className={`font-mono text-[9px] tabular-nums ${isL7 ? "text-[var(--warning)]" : "text-[var(--ink-muted)]"}`}>
                        {l.lesson}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[12px] text-[var(--ink-secondary)]">
                Lesson 7 stall rate <span className="font-mono tabular-nums text-[var(--warning)]">24%</span> —{" "}
                <span className="font-mono tabular-nums text-[var(--ink-primary)]">2.4×</span> course average
              </p>
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <header className="border-b border-[var(--hairline)] px-5 py-3">
              <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">Recent Activity</h3>
            </header>
            <div className="divide-y divide-[var(--hairline)]">
              {[
                { actor: "Liam Chen", detail: "Responded: Continue course", time: "3 hours ago" },
                { actor: "You", detail: "Approved intervention for Devon Park", time: "1 hour ago" },
                { actor: "RescueLoop", detail: "Maya Thompson flagged: Mid-course stall", time: "18 min ago" },
                { actor: "System", detail: "Membership sync completed — 742 members", time: "2 min ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--canvas-elevated)]">
                  <span className="size-1.5 rounded-full bg-[var(--recovery-green)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[var(--ink-primary)]"><span className="font-medium">{item.actor}</span></p>
                    <p className="text-[12px] text-[var(--ink-muted)]">{item.detail}</p>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)] shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-6">
          {/* System Health summary */}
          <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <header className="border-b border-[var(--hairline)] px-4 py-3">
              <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">System Health</h3>
            </header>
            <div className="divide-y divide-[var(--hairline)]">
              {[
                { domain: "Whop connection", status: "healthy" },
                { domain: "Membership sync", status: "healthy" },
                { domain: "Webhooks", status: "healthy" },
                { domain: "Billing", status: "degraded" },
              ].map((item) => (
                <div key={item.domain} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-[12px] text-[var(--ink-muted)]">{item.domain}</span>
                  <span className="flex items-center gap-1.5 text-[12px]">
                    <span className={`size-1.5 rounded-full ${item.status === "healthy" ? "bg-[var(--recovery-green)]" : "bg-[var(--warning)]"}`} />
                    <span className={item.status === "healthy" ? "text-[var(--recovery-green)]" : "text-[var(--warning)]"}>
                      {item.status === "healthy" ? "Healthy" : "Delayed"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Plan usage */}
          <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <header className="border-b border-[var(--hairline)] px-4 py-3">
              <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">Plan Usage</h3>
            </header>
            <div className="px-4 py-4 flex flex-col gap-4">
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[12px] text-[var(--ink-muted)]">Monitored members</span>
                  <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                    {DEMO_METRICS.membersMonitored} / {DEMO_METRICS.planMembers}
                  </span>
                </div>
                <div className="h-[3px] w-full bg-[var(--hairline-subtle)]">
                  <div className="h-full bg-[var(--ink-primary)]" style={{ width: `${usagePct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[12px] text-[var(--ink-muted)]">Interventions this month</span>
                  <span className="font-mono text-[12px] tabular-nums text-[var(--ink-primary)]">
                    {DEMO_METRICS.usedInterventions} / {DEMO_METRICS.planInterventions}
                  </span>
                </div>
                <div className="h-[3px] w-full bg-[var(--hairline-subtle)]">
                  <div className="h-full bg-[var(--recovery-green)]" style={{ width: `${(DEMO_METRICS.usedInterventions / DEMO_METRICS.planInterventions) * 100}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Illustrative outcome */}
          <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <header className="border-b border-[var(--hairline)] px-4 py-3">
              <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">Illustrative Recovered Value</h3>
            </header>
            <div className="px-4 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Confirmed recovered value
              </p>
              <p className="mt-2 font-serif text-[48px] leading-none text-[var(--ink-primary)]">
                $0
              </p>
              <p className="mt-3 text-[11px] italic text-[var(--ink-muted)]">
                All values explicitly illustrative — no real customer results
              </p>
              <div className="mt-4 flex items-center gap-1.5 rounded-[3px] bg-[var(--recovery-light)] px-2 py-1 text-[12px] text-[var(--recovery-green)]">
                <TrendingUp className="size-3" strokeWidth={2.25} />
                <span>7 students returned</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: number; accent?: "warning" | "critical" | "recovery" }) {
  const accentColor = accent === "critical" ? "text-[var(--critical)]" : accent === "warning" ? "text-[var(--warning)]" : accent === "recovery" ? "text-[var(--recovery-green)]" : "text-[var(--ink-primary)]";
  return (
    <Card className="border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">{label}</p>
      <p className={`mt-1.5 font-mono tabular-nums text-[28px] leading-none ${accentColor}`}>{value}</p>
    </Card>
  );
}
