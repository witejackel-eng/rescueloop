"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  DollarSign,
  TrendingUp,
  Heart,
  ChevronRight,
  ExternalLink,
  Zap,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import { useHealthStore } from "@/features/health-engine/health-store";
import { HEALTH_STATUS_META } from "@/lib/types/health";

// ─────────────────────────────────────────────────────────────
// RescueLoop Production + Scale Dashboard
// Showcases all PX packages: PX01–PX07
// ─────────────────────────────────────────────────────────────

type TabId = "health" | "operations" | "exceptions" | "diagnostics" | "costs" | "scale" | "growth";

interface TabDef {
  id: TabId;
  label: string;
  px: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  description: string;
  route: string;
}

const TABS: TabDef[] = [
  {
    id: "health",
    label: "System Health",
    px: "PX02",
    icon: Heart,
    description: "Real-time status of all connected systems and services",
    route: "/settings/health",
  },
  {
    id: "operations",
    label: "Operation Progress",
    px: "PX01",
    icon: Activity,
    description: "Trustworthy long-running operation tracking with persisted progress",
    route: "/overview",
  },
  {
    id: "exceptions",
    label: "Exception Console",
    px: "PX03",
    icon: AlertTriangle,
    description: "Consolidated internal operations with Org 360 and audit trail",
    route: "/internal",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    px: "PX04",
    icon: Wrench,
    description: "Self-healing recovery matrix, retry strategies, and diagnostic export",
    route: "/help/diagnostics",
  },
  {
    id: "costs",
    label: "Cost Guardrails",
    px: "PX05",
    icon: DollarSign,
    description: "Per-tenant cost estimation, margin model, and high-cost alerts",
    route: "/internal/costs",
  },
  {
    id: "scale",
    label: "Scale Certification",
    px: "PX06",
    icon: Gauge,
    description: "Synthetic load fixtures, multi-tenant benchmarks, and chaos certification at 2,500 members",
    route: "/internal/scale",
  },
  {
    id: "growth",
    label: "Growth Funnel",
    px: "PX07",
    icon: TrendingUp,
    description: "Privacy-safe business funnel tracking and referral attribution",
    route: "/internal/growth",
  },
];

export default function ProductionDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("health");
  const active = TABS.find((t) => t.id === activeTab)!;

  // Health summary from store
  const overallStatus = useHealthStore((s) => s.overallStatus);
  const healthyCount = useHealthStore((s) => s.healthyCount);
  const degradedCount = useHealthStore((s) => s.degradedCount);
  const unhealthyCount = useHealthStore((s) => s.unhealthyCount);
  const actionNeededCount = useHealthStore((s) => s.actionNeededCount);
  const healthMeta = HEALTH_STATUS_META[overallStatus];

  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--ink-primary)]">
              <Zap className="size-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-serif text-[28px] leading-tight text-[var(--ink-primary)]">
                RescueLoop
              </h1>
              <p className="text-[13px] text-[var(--ink-muted)]">
                Production + Scale Operating Layer
              </p>
            </div>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`mb-6 rounded-xl border p-5 ${healthMeta.bg} ${healthMeta.border}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`size-4 rounded-full ${healthMeta.dot}`} />
              <div>
                <p className={`text-[16px] font-medium ${healthMeta.color}`}>
                  {overallStatus === "healthy"
                    ? "All systems operational"
                    : overallStatus === "degraded"
                      ? "Some systems degraded"
                      : "Issues detected"}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
                  {healthyCount} healthy · {degradedCount} degraded · {unhealthyCount} unhealthy
                  {actionNeededCount > 0 && (
                    <span className="text-[var(--critical-red)]"> · {actionNeededCount} action needed</span>
                  )}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <MiniStat label="PX01" status="done" />
              <MiniStat label="PX02" status="done" />
              <MiniStat label="PX03" status="done" />
              <MiniStat label="PX04" status="done" />
              <MiniStat label="PX05" status="done" />
              <MiniStat label="PX06" status="done" />
              <MiniStat label="PX07" status="done" />
            </div>
          </div>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium transition-all ${
                    isActive
                      ? "bg-[var(--ink-primary)] text-white shadow-sm"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--canvas)]"
                  }`}
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`inline sm:hidden ${isActive ? "text-white/80" : "text-[var(--ink-muted)]"}`}>{tab.px}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Active tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <TabContent tab={active} />
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-12 border-t border-[var(--hairline)] pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--ink-muted)]">
            <p>RescueLoop v1.0 — Production + Scale Operating Layer</p>
            <div className="flex items-center gap-4">
              <Link href="/overview" className="hover:text-[var(--ink-primary)] transition-colors">Overview</Link>
              <Link href="/rescue-queue" className="hover:text-[var(--ink-primary)] transition-colors">Rescue Queue</Link>
              <Link href="/settings/health" className="hover:text-[var(--ink-primary)] transition-colors">System Health</Link>
              <Link href="/internal" className="hover:text-[var(--ink-primary)] transition-colors">Internal</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MiniStat({ label, status }: { label: string; status: "done" | "partial" | "pending" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`size-2 rounded-full ${
          status === "done"
            ? "bg-[var(--recovery-green)]"
            : status === "partial"
              ? "bg-[var(--warning-amber)]"
              : "bg-[var(--ink-muted)]"
        }`}
      />
      <span className="font-mono text-[11px] text-[var(--ink-secondary)]">{label}</span>
    </div>
  );
}

function TabContent({ tab }: { tab: TabDef }) {
  return (
    <div className="space-y-6">
      {/* Feature header */}
      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--canvas-elevated)] border border-[var(--hairline)]">
              <tab.icon className="size-6 text-[var(--ink-primary)]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">{tab.label}</h2>
                <span className="rounded-md bg-[var(--canvas-elevated)] border border-[var(--hairline)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">
                  {tab.px}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-[var(--ink-muted)] max-w-xl">
                {tab.description}
              </p>
            </div>
          </div>
          <Link
            href={tab.route}
            className="flex items-center gap-1.5 rounded-md bg-[var(--ink-primary)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90"
          >
            Open
            <ExternalLink className="size-3" strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Feature details based on tab */}
      {tab.id === "health" && <HealthPreview />}
      {tab.id === "operations" && <OperationsPreview />}
      {tab.id === "exceptions" && <ExceptionsPreview />}
      {tab.id === "diagnostics" && <DiagnosticsPreview />}
      {tab.id === "costs" && <CostsPreview />}
      {tab.id === "scale" && <ScalePreview />}
      {tab.id === "growth" && <GrowthPreview />}
    </div>
  );
}

// ── Preview panels ───────────────────────────────────────────

function HealthPreview() {
  const signals = useHealthStore((s) => s.signals);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {signals.map((signal) => {
        const meta = HEALTH_STATUS_META[signal.status];
        return (
          <div
            key={signal.domain}
            className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-[var(--ink-primary)]">{signal.label}</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}>
                <span className={`size-1 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <p className="text-[12px] text-[var(--ink-muted)] line-clamp-2">{signal.details}</p>
            {signal.actionRequired && (
              <p className="mt-2 text-[11px] font-medium text-[var(--critical-red)]">Action required</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OperationsPreview() {
  const stages = [
    { name: "Connecting to Whop", progress: 100 },
    { name: "Fetching members", progress: 100 },
    { name: "Fetching courses", progress: 100 },
    { name: "Evaluating candidates", progress: 72 },
    { name: "Complete", progress: 0 },
  ];
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="size-2 rounded-full bg-[var(--recovery-green)] animate-pulse" />
        <span className="text-[13px] font-medium text-[var(--ink-primary)]">First Whop Sync — In Progress</span>
      </div>
      <div className="space-y-3">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`flex size-6 items-center justify-center rounded-full text-[11px] font-medium ${
              stage.progress === 100
                ? "bg-[var(--recovery-green)] text-white"
                : stage.progress > 0
                  ? "bg-[var(--warning-amber)] text-white"
                  : "bg-[var(--canvas-elevated)] text-[var(--ink-muted)] border border-[var(--hairline)]"
            }`}>
              {stage.progress === 100 ? "✓" : stage.progress > 0 ? `${stage.progress}%` : i + 1}
            </div>
            <span className={`text-[13px] ${stage.progress === 100 ? "text-[var(--ink-primary)]" : stage.progress > 0 ? "text-[var(--ink-secondary)]" : "text-[var(--ink-muted)]"}`}>
              {stage.name}
            </span>
            {stage.progress > 0 && stage.progress < 100 && (
              <span className="ml-auto font-mono text-[11px] text-[var(--ink-muted)]">{stage.progress}%</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-md bg-[#E8F5EF] border border-[#C7E6D5] px-3 py-2">
        <ShieldCheck className="size-3.5 text-[#147D68]" strokeWidth={2} />
        <span className="text-[12px] text-[#147D68]">Safe to leave — progress is persisted</span>
      </div>
    </div>
  );
}

function ExceptionsPreview() {
  const exceptions = [
    { type: "Permission failure", org: "CourseMaster Pro", severity: "high", age: "2h ago" },
    { type: "Stalled sync", org: "LearnVault Academy", severity: "medium", age: "45m ago" },
    { type: "Dead letter", org: "SkillForge Hub", severity: "low", age: "1h ago" },
    { type: "Webhook lag", org: "CourseMaster Pro", severity: "high", age: "12m ago" },
  ];
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--hairline)]">
        <span className="text-[13px] font-medium text-[var(--ink-primary)]">Active Exceptions (4)</span>
      </div>
      <div className="divide-y divide-[var(--hairline)]">
        {exceptions.map((exc, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`size-2 rounded-full ${
                exc.severity === "high" ? "bg-[var(--critical-red)]" : exc.severity === "medium" ? "bg-[var(--warning-amber)]" : "bg-[var(--ink-muted)]"
              }`} />
              <div>
                <span className="text-[13px] text-[var(--ink-primary)]">{exc.type}</span>
                <span className="ml-2 text-[11px] text-[var(--ink-muted)]">{exc.org}</span>
              </div>
            </div>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">{exc.age}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosticsPreview() {
  const recoveryRules = [
    { trigger: "Whop API 429", strategy: "Exponential backoff", status: "configured" },
    { trigger: "Whop API 5xx", strategy: "Retry with jitter", status: "configured" },
    { trigger: "Webhook timeout", strategy: "Retry + dead letter", status: "configured" },
    { trigger: "DB connection error", strategy: "Reconnect + retry", status: "configured" },
    { trigger: "Permission revoked", strategy: "Flag + notify creator", status: "configured" },
  ];
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--hairline)]">
        <span className="text-[13px] font-medium text-[var(--ink-primary)]">Recovery Matrix</span>
      </div>
      <div className="divide-y divide-[var(--hairline)]">
        {recoveryRules.map((rule, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-[13px] text-[var(--ink-primary)]">{rule.trigger}</span>
              <span className="ml-2 text-[11px] text-[var(--ink-muted)]">→ {rule.strategy}</span>
            </div>
            <span className="rounded-full bg-[#E8F5EF] border border-[#C7E6D5] px-2 py-0.5 text-[10px] text-[#147D68]">
              {rule.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostsPreview() {
  const tenants = [
    { name: "CourseMaster Pro", plan: "Scale $119", members: 2100, margin: 72 },
    { name: "LearnVault Academy", plan: "Growth $59", members: 850, margin: 64 },
    { name: "SkillForge Hub", plan: "Rescue $29", members: 200, margin: 48 },
    { name: "PeakLearning Co", plan: "Scale $119", members: 1800, margin: 31 },
  ];
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--hairline)]">
        <span className="text-[13px] font-medium text-[var(--ink-primary)]">Tenant Cost Overview</span>
      </div>
      <div className="divide-y divide-[var(--hairline)]">
        {tenants.map((t, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-[13px] text-[var(--ink-primary)]">{t.name}</span>
              <span className="ml-2 text-[11px] text-[var(--ink-muted)]">{t.plan} · {t.members.toLocaleString()} members</span>
            </div>
            <span className={`font-mono text-[12px] tabular-nums ${
              t.margin > 60 ? "text-[var(--recovery-green)]" : t.margin > 30 ? "text-[var(--warning-amber)]" : "text-[var(--critical-red)]"
            }`}>
              {t.margin}% margin
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScalePreview() {
  const profiles = [
    { label: "250 Members", p50: "45ms", p95: "120ms", p99: "280ms", status: "pass" },
    { label: "1,000 Members", p50: "85ms", p95: "320ms", p99: "780ms", status: "pass" },
    { label: "2,500 Members", p50: "120ms", p95: "450ms", p99: "1.2s", status: "pass" },
  ];
  const chaosScenarios = [
    { name: "Provider Delay", severity: "medium", impact: "P99 +5s" },
    { name: "HTTP 429", severity: "high", impact: "Throughput ↓40%" },
    { name: "Duplicate Webhook", severity: "low", impact: "Idempotent" },
    { name: "Worker Crash", severity: "critical", impact: "Jobs re-queued" },
    { name: "DB Transient Error", severity: "high", impact: "Query latency ↑" },
    { name: "Redis Outage", severity: "critical", impact: "Cache miss storm" },
    { name: "Browser Disconnect", severity: "low", impact: "Server continues" },
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Load Profiles */}
      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--hairline)]">
          <span className="text-[13px] font-medium text-[var(--ink-primary)]">Baseline Benchmarks</span>
          <span className="ml-2 text-[11px] text-[var(--ink-muted)]">Scale tier — 2,500 member cap</span>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          {profiles.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-[13px] text-[var(--ink-primary)]">{p.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">P50 {p.p50}</span>
                <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">P95 {p.p95}</span>
                <span className="font-mono text-[11px] text-[var(--ink-secondary)] tabular-nums">P99 {p.p99}</span>
                <span className="rounded-full bg-[#E8F5EF] border border-[#C7E6D5] px-2 py-0.5 text-[9px] text-[#147D68]">
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chaos Scenarios */}
      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--hairline)]">
          <span className="text-[13px] font-medium text-[var(--ink-primary)]">Chaos Scenarios (7)</span>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          {chaosScenarios.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${
                  s.severity === "critical" ? "bg-[var(--critical)]" : s.severity === "high" ? "bg-[var(--warning)]" : s.severity === "medium" ? "bg-[var(--info)]" : "bg-[var(--ink-muted)]"
                }`} />
                <span className="text-[13px] text-[var(--ink-primary)]">{s.name}</span>
              </div>
              <span className="text-[11px] text-[var(--ink-muted)]">{s.impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GrowthPreview() {
  const steps = [
    { step: "Install", count: 20 },
    { step: "Permission complete", count: 18 },
    { step: "First sync", count: 16 },
    { step: "First candidate", count: 12 },
    { step: "First review", count: 8 },
    { step: "First approval", count: 6 },
    { step: "First notification", count: 4 },
    { step: "Subscription", count: 2 },
  ];
  const max = steps[0].count;
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-6">
      <div className="mb-4">
        <span className="text-[13px] font-medium text-[var(--ink-primary)]">Activation Funnel</span>
        <span className="ml-2 text-[11px] text-[var(--ink-muted)]">20 installs → 2 subscriptions (10% conversion)</span>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-32 text-[12px] text-[var(--ink-muted)] truncate">{s.step}</span>
            <div className="flex-1 h-5 bg-[var(--canvas-elevated)] rounded-sm overflow-hidden">
              <div
                className="h-full bg-[var(--ink-primary)] rounded-sm transition-all"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-[var(--ink-secondary)] tabular-nums w-6 text-right">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


