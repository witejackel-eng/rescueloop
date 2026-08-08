"use client";

// ─────────────────────────────────────────────────────────────
// PX06 — Benchmark Results
// Table + charts showing benchmark outcomes with SLO coloring.
// ─────────────────────────────────────────────────────────────

import { type FC } from "react";
import type { BenchmarkResult, MultiTenantBenchmarkResult, SLOStatus } from "@/lib/types/scale";
import { sloStatusColor, sloStatusBg, sloStatusDot } from "@/lib/types/scale";
import { formatLatency } from "@/lib/scale/metrics-collector";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface BenchmarkResultsProps {
  results: BenchmarkResult[];
  multiTenantResults: MultiTenantBenchmarkResult[];
}

const SLO_ICON: Record<SLOStatus, React.ComponentType<{ className?: string }>> = {
  within_slo: CheckCircle2,
  marginal: AlertTriangle,
  slo_violation: XCircle,
};

const SLO_LABEL: Record<SLOStatus, string> = {
  within_slo: "Pass",
  marginal: "Marginal",
  slo_violation: "Fail",
};

function SLOBadge({ status }: { status: SLOStatus }) {
  const Icon = SLO_ICON[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium ${sloStatusBg(status)}`}>
      <span className={`size-1 rounded-full ${sloStatusDot(status)}`} />
      {SLO_LABEL[status]}
    </span>
  );
}

export const BenchmarkResults: FC<BenchmarkResultsProps> = ({
  results,
  multiTenantResults,
}) => {
  // Latency bar chart data
  const latencyData = results
    .filter((r) => r.chaosScenarios.length === 0)
    .map((r) => ({
      name: r.loadProfile.label,
      p50: r.metrics.latency.p50,
      p95: r.metrics.latency.p95,
      p99: r.metrics.latency.p99,
    }));

  // Chaos impact data (max profile with various chaos)
  const chaosData = results
    .filter((r) => r.loadProfile.size === "max" && r.chaosScenarios.length > 0)
    .slice(0, 7)
    .map((r) => ({
      name: r.chaosScenarios[0]?.replace(/_/g, " ") ?? "combined",
      p99: r.metrics.latency.p99,
      status: r.overallStatus,
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Baseline Results Table */}
      <div className="flex flex-col gap-3">
        <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
          Baseline Benchmarks
        </h3>
        <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                  <th className="px-3 py-2 text-left font-medium">Profile</th>
                  <th className="px-3 py-2 text-right font-medium">P50</th>
                  <th className="px-3 py-2 text-right font-medium">P95</th>
                  <th className="px-3 py-2 text-right font-medium">P99</th>
                  <th className="px-3 py-2 text-right font-medium">DB Conn</th>
                  <th className="px-3 py-2 text-right font-medium">Queue</th>
                  <th className="px-3 py-2 text-right font-medium">Mem</th>
                  <th className="px-3 py-2 text-right font-medium">Evt/s</th>
                  <th className="px-3 py-2 text-center font-medium">SLO</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .filter((r) => r.chaosScenarios.length === 0)
                  .map((r) => (
                    <tr key={r.id} className="border-b border-[var(--hairline)] last:border-0">
                      <td className="px-3 py-2.5 font-medium text-[var(--ink-primary)]">
                        {r.loadProfile.label}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {formatLatency(r.metrics.latency.p50)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {formatLatency(r.metrics.latency.p95)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${sloStatusColor(r.sloStatus.p99Latency ?? "within_slo")}`}>
                        {formatLatency(r.metrics.latency.p99)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {(r.metrics.db.connectionUsage * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {r.metrics.queue.depth}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {r.metrics.memory.heapUsedMb}MB
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {r.metrics.events.eventsPerSecond}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <SLOBadge status={r.overallStatus} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Latency Distribution Chart */}
      <div className="flex flex-col gap-3">
        <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
          Latency Distribution
        </h3>
        <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={latencyData} barGap={2}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
                axisLine={{ stroke: "var(--hairline)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
                axisLine={{ stroke: "var(--hairline)" }}
                tickLine={false}
                tickFormatter={(v: number) => `${v}ms`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  border: "1px solid var(--hairline)",
                  borderRadius: 6,
                  backgroundColor: "var(--surface)",
                }}
                formatter={(value: number) => [`${value}ms`]}
              />
              <Bar dataKey="p50" name="P50" radius={[2, 2, 0, 0]}>
                {latencyData.map((_, i) => (
                  <Cell key={i} fill="#147D68" />
                ))}
              </Bar>
              <Bar dataKey="p95" name="P95" radius={[2, 2, 0, 0]}>
                {latencyData.map((_, i) => (
                  <Cell key={i} fill="#C68A1E" />
                ))}
              </Bar>
              <Bar dataKey="p99" name="P99" radius={[2, 2, 0, 0]}>
                {latencyData.map((_, i) => (
                  <Cell key={i} fill="#B83D34" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chaos Impact Results */}
      {chaosData.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
            Chaos Impact (2,500 members)
          </h3>
          <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--hairline)] text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                    <th className="px-3 py-2 text-left font-medium">Scenario</th>
                    <th className="px-3 py-2 text-right font-medium">P99 Latency</th>
                    <th className="px-3 py-2 text-right font-medium">Retries</th>
                    <th className="px-3 py-2 text-right font-medium">Queue Depth</th>
                    <th className="px-3 py-2 text-right font-medium">429s</th>
                    <th className="px-3 py-2 text-center font-medium">SLO</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .filter((r) => r.loadProfile.size === "max" && r.chaosScenarios.length > 0)
                    .map((r) => (
                      <tr key={r.id} className="border-b border-[var(--hairline)] last:border-0">
                        <td className="px-3 py-2.5 font-medium text-[var(--ink-primary)] capitalize">
                          {r.chaosScenarios.join(" + ").replace(/_/g, " ")}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${sloStatusColor(r.sloStatus.p99Latency ?? "within_slo")}`}>
                          {formatLatency(r.metrics.latency.p99)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                          {r.metrics.queue.retryCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                          {r.metrics.queue.depth}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                          {r.metrics.whopRateLimit.rateLimited429}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <SLOBadge status={r.overallStatus} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Tenant Results */}
      {multiTenantResults.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
            Multi-Tenant Benchmarks
          </h3>
          <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--hairline)] text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                    <th className="px-3 py-2 text-left font-medium">Config</th>
                    <th className="px-3 py-2 text-right font-medium">Tenants</th>
                    <th className="px-3 py-2 text-right font-medium">Members</th>
                    <th className="px-3 py-2 text-right font-medium">P50</th>
                    <th className="px-3 py-2 text-right font-medium">P99</th>
                    <th className="px-3 py-2 text-right font-medium">DB %</th>
                    <th className="px-3 py-2 text-right font-medium">Mem</th>
                    <th className="px-3 py-2 text-center font-medium">SLO</th>
                  </tr>
                </thead>
                <tbody>
                  {multiTenantResults.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--hairline)] last:border-0">
                      <td className="px-3 py-2.5 font-medium text-[var(--ink-primary)]">
                        {r.config.label}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {r.config.tenantCount}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {r.config.aggregateMembers.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {formatLatency(r.aggregateMetrics.latency.p50)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${sloStatusColor(r.overallStatus)}`}>
                        {formatLatency(r.aggregateMetrics.latency.p99)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {(r.aggregateMetrics.db.connectionUsage * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-secondary)]">
                        {r.aggregateMetrics.memory.heapUsedMb}MB
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <SLOBadge status={r.overallStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
            Recommendations
          </h3>
          <div className="space-y-1.5">
            {results
              .filter((r) => r.chaosScenarios.length === 0)
              .flatMap((r) => r.recommendations)
              .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
              .map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-[11px]"
                >
                  <span className={`mt-0.5 shrink-0 size-1.5 rounded-full ${
                    rec.includes("NOT") ? "bg-[var(--critical)]" : "bg-[var(--recovery-green)]"
                  }`} />
                  <span className="text-[var(--ink-secondary)]">{rec}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
