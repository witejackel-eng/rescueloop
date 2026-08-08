"use client";

// ─────────────────────────────────────────────────────────────
// PX06 — Metrics Panel
// Detailed metrics visualization for a benchmark run.
// Data-dense operator console aesthetic.
// ─────────────────────────────────────────────────────────────

import { type FC } from "react";
import type { MetricSet, SLOStatus } from "@/lib/types/scale";
import { computeSLOStatus, sloStatusColor } from "@/lib/types/scale";
import { formatLatency, formatPercent, formatMb, formatRate } from "@/lib/scale/metrics-collector";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, Database, Layers, Cpu, Cloud, Zap } from "lucide-react";

interface MetricsPanelProps {
  metrics: MetricSet;
}

function MetricRow({
  label,
  value,
  status,
  icon: Icon,
}: {
  label: string;
  value: string;
  status?: SLOStatus;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
        <span className="text-[10px] text-[var(--ink-muted)]">{label}</span>
      </div>
      <span className={`font-mono text-[12px] tabular-nums ${status ? sloStatusColor(status) : "text-[var(--ink-secondary)]"}`}>
        {value}
      </span>
    </div>
  );
}

export const MetricsPanel: FC<MetricsPanelProps> = ({ metrics }) => {
  // Build mini sparkline data (simulated time series)
  const sparkData = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    p50: metrics.latency.p50 * (0.8 + Math.sin(i * 0.5) * 0.2),
    p95: metrics.latency.p95 * (0.7 + Math.sin(i * 0.3) * 0.3),
    p99: metrics.latency.p99 * (0.6 + Math.sin(i * 0.2) * 0.4),
  }));

  // DB connection usage data
  const dbData = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    usage: metrics.db.connectionUsage * (0.7 + Math.sin(i * 0.4) * 0.3) * 100,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Latency Section */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
          <h4 className="text-[12px] font-medium text-[var(--ink-primary)]">Latency</h4>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          <MetricRow
            label="P50"
            value={formatLatency(metrics.latency.p50)}
            status={computeSLOStatus(metrics.latency.p50, 200, 300)}
            icon={Clock}
          />
          <MetricRow
            label="P95"
            value={formatLatency(metrics.latency.p95)}
            status={computeSLOStatus(metrics.latency.p95, 500, 750)}
            icon={Clock}
          />
          <MetricRow
            label="P99"
            value={formatLatency(metrics.latency.p99)}
            status={computeSLOStatus(metrics.latency.p99, 1500, 2250)}
            icon={Clock}
          />
          <MetricRow
            label="Max"
            value={formatLatency(metrics.latency.max)}
            icon={Clock}
          />
        </div>
        {/* Sparkline */}
        <div className="mt-3 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="p99Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B83D34" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#B83D34" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontSize: 10,
                  border: "1px solid var(--hairline)",
                  borderRadius: 4,
                  backgroundColor: "var(--surface)",
                  padding: "4px 8px",
                }}
                formatter={(value: number) => [`${Math.round(value)}ms`]}
              />
              <Area type="monotone" dataKey="p99" stroke="#B83D34" fill="url(#p99Grad)" strokeWidth={1} />
              <Area type="monotone" dataKey="p95" stroke="#C68A1E" fill="none" strokeWidth={1} strokeDasharray="3 2" />
              <Area type="monotone" dataKey="p50" stroke="#147D68" fill="none" strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Database Section */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-[var(--ink-muted)]" />
          <h4 className="text-[12px] font-medium text-[var(--ink-primary)]">Database</h4>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          <MetricRow
            label="Connection usage"
            value={formatPercent(metrics.db.connectionUsage)}
            status={computeSLOStatus(metrics.db.connectionUsage * 100, 80, 104)}
            icon={Database}
          />
          <MetricRow
            label="Active / Max conns"
            value={`${metrics.db.activeConnections} / ${metrics.db.maxConnections}`}
            icon={Database}
          />
          <MetricRow
            label="Query P50 / P99"
            value={`${formatLatency(metrics.db.queryLatency.p50)} / ${formatLatency(metrics.db.queryLatency.p99)}`}
            icon={Database}
          />
          <MetricRow
            label="Slow queries"
            value={metrics.db.slowQueryCount.toString()}
            icon={Database}
          />
        </div>
        {/* DB usage sparkline */}
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dbData}>
              <defs>
                <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#147D68" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#147D68" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  fontSize: 10,
                  border: "1px solid var(--hairline)",
                  borderRadius: 4,
                  backgroundColor: "var(--surface)",
                  padding: "4px 8px",
                }}
                formatter={(value: number) => [`${Math.round(value)}%`]}
              />
              <Area type="monotone" dataKey="usage" stroke="#147D68" fill="url(#dbGrad)" strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Queue Section */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-[var(--ink-muted)]" />
          <h4 className="text-[12px] font-medium text-[var(--ink-primary)]">Job Queue</h4>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          <MetricRow label="Depth" value={metrics.queue.depth.toString()} icon={Layers} />
          <MetricRow label="Active / Pending" value={`${metrics.queue.activeJobs} / ${metrics.queue.pendingJobs}`} icon={Layers} />
          <MetricRow label="Completed" value={metrics.queue.completedJobs.toString()} icon={Layers} />
          <MetricRow label="Failed / Retries" value={`${metrics.queue.failedJobs} / ${metrics.queue.retryCount}`} icon={Layers} />
          <MetricRow label="Max retries exceeded" value={metrics.queue.maxRetriesExceeded.toString()} icon={Layers} />
        </div>
      </div>

      {/* Events Section */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-[var(--ink-muted)]" />
          <h4 className="text-[12px] font-medium text-[var(--ink-primary)]">Events</h4>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          <MetricRow label="Throughput" value={formatRate(metrics.events.eventsPerSecond)} icon={Zap} />
          <MetricRow label="Total events" value={metrics.events.totalEvents.toLocaleString()} icon={Zap} />
          <MetricRow label="Dropped / Duplicates" value={`${metrics.events.droppedEvents} / ${metrics.events.duplicateEvents}`} icon={Zap} />
        </div>
      </div>

      {/* Memory Section */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-[var(--ink-muted)]" />
          <h4 className="text-[12px] font-medium text-[var(--ink-primary)]">Memory</h4>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          <MetricRow
            label="Heap used"
            value={formatMb(metrics.memory.heapUsedMb)}
            status={computeSLOStatus(metrics.memory.heapUsedMb, 512, 614)}
            icon={Cpu}
          />
          <MetricRow label="Heap total" value={formatMb(metrics.memory.heapTotalMb)} icon={Cpu} />
          <MetricRow label="RSS" value={formatMb(metrics.memory.rssMb)} icon={Cpu} />
          <MetricRow label="External" value={formatMb(metrics.memory.externalMb)} icon={Cpu} />
        </div>
      </div>

      {/* Vercel Functions Section */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="h-4 w-4 text-[var(--ink-muted)]" />
          <h4 className="text-[12px] font-medium text-[var(--ink-primary)]">Vercel Functions</h4>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          <MetricRow label="Cold starts" value={metrics.vercel.coldStarts.toString()} icon={Cloud} />
          <MetricRow label="Warm invocations" value={metrics.vercel.warmInvocations.toString()} icon={Cloud} />
          <MetricRow label="Avg cold start" value={formatLatency(metrics.vercel.avgColdStartMs)} icon={Cloud} />
          <MetricRow label="Duration P50 / P99" value={`${formatLatency(metrics.vercel.functionDurationMs.p50)} / ${formatLatency(metrics.vercel.functionDurationMs.p99)}`} icon={Cloud} />
          <MetricRow label="Concurrent / Max" value={`${metrics.vercel.concurrentInstances} / ${metrics.vercel.maxConcurrentInstances}`} icon={Cloud} />
        </div>
      </div>

      {/* Whop Rate Limits Section */}
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-[var(--warning)]" />
          <h4 className="text-[12px] font-medium text-[var(--ink-primary)]">Whop Rate Limits</h4>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          <MetricRow label="Total requests" value={metrics.whopRateLimit.totalRequests.toString()} icon={Zap} />
          <MetricRow label="429 responses" value={metrics.whopRateLimit.rateLimited429.toString()} icon={Zap} />
          <MetricRow label="Rate limit rate" value={formatPercent(metrics.whopRateLimit.rateLimitRate)} icon={Zap} />
          <MetricRow label="Backoffs applied" value={metrics.whopRateLimit.backoffApplied.toString()} icon={Zap} />
          <MetricRow label="Avg backoff" value={formatLatency(metrics.whopRateLimit.avgBackoffMs)} icon={Zap} />
        </div>
      </div>
    </div>
  );
};
