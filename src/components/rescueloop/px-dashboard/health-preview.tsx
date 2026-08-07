"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Clock, AlertCircle } from "lucide-react";
import { useHealthStore } from "@/features/health-engine/health-store";
import { HEALTH_STATUS_META } from "@/lib/types/health";
import type { HealthSignal } from "@/lib/types/health";

const STATUS_COLORS: Record<string, string> = {
  healthy: "#147D68",
  degraded: "#C68A1E",
  unhealthy: "#B83D34",
  unknown: "#6A706A",
};

// ── Recent health events timeline ──────────────────────────
const HEALTH_EVENTS = [
  {
    time: "12 min ago",
    event: "Webhook delivery failed",
    severity: "unhealthy" as const,
  },
  {
    time: "15 min ago",
    event: "Membership sync delayed",
    severity: "degraded" as const,
  },
  {
    time: "18 min ago",
    event: "Data freshness below threshold",
    severity: "degraded" as const,
  },
  {
    time: "45 min ago",
    event: "All systems recovered",
    severity: "healthy" as const,
  },
  {
    time: "1h ago",
    event: "Webhook reconnected",
    severity: "healthy" as const,
  },
];

export function HealthPreview() {
  const signals = useHealthStore((s) => s.signals);
  const healthyCount = useHealthStore((s) => s.healthyCount);
  const degradedCount = useHealthStore((s) => s.degradedCount);
  const unhealthyCount = useHealthStore((s) => s.unhealthyCount);

  const pieData = [
    { name: "Healthy", value: healthyCount, status: "healthy" },
    { name: "Degraded", value: degradedCount, status: "degraded" },
    { name: "Unhealthy", value: unhealthyCount, status: "unhealthy" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Health distribution chart + summary */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Donut chart card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5 backdrop-blur-sm"
        >
          <p className="text-[12px] font-medium text-[var(--ink-secondary)] mb-3">
            Health Distribution
          </p>
          <div className="relative size-40 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--ink-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-[24px] font-semibold text-[var(--ink-primary)] tabular-nums">
                {healthyCount}/{signals.length}
              </span>
              <span className="text-[10px] text-[var(--ink-muted)]">healthy</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[d.status] }}
                />
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Signal cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {signals.map((signal, i) => (
            <HealthSignalCard key={signal.domain} signal={signal} index={i} />
          ))}
        </div>
      </div>

      {/* Recent health events timeline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="size-4 text-[var(--ink-muted)]" strokeWidth={2} />
          <p className="text-[13px] font-medium text-[var(--ink-primary)]">
            Recent Events
          </p>
        </div>
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--hairline)]" />
          {HEALTH_EVENTS.map((event, i) => {
            const meta = HEALTH_STATUS_META[event.severity];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="relative flex items-center gap-3 py-2 pl-5"
              >
                <span
                  className={`absolute left-0 size-[15px] rounded-full border-2 border-[var(--surface)] ${meta.dot}`}
                />
                <span className="flex-1 text-[12px] text-[var(--ink-primary)]">
                  {event.event}
                </span>
                <span className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
                  {event.time}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ── Individual signal card with glass-morphism and pulse ────
function HealthSignalCard({
  signal,
  index,
}: {
  signal: HealthSignal;
  index: number;
}) {
  const meta = HEALTH_STATUS_META[signal.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group relative rounded-xl border border-[var(--hairline)] bg-[var(--surface)]/80 p-4 backdrop-blur-sm transition-shadow hover:shadow-md"
    >
      {/* Status bar accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ backgroundColor: STATUS_COLORS[signal.status] }}
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-[var(--ink-primary)]">
          {signal.label}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}
        >
          {/* Pulse for unhealthy */}
          {signal.status === "unhealthy" && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--critical)] opacity-75" />
              <span className="relative inline-flex size-full rounded-full bg-[var(--critical)]" />
            </span>
          )}
          {signal.status !== "unhealthy" && (
            <span className={`size-1.5 rounded-full ${meta.dot}`} />
          )}
          {meta.label}
        </span>
      </div>
      <p className="text-[12px] text-[var(--ink-muted)] line-clamp-2">
        {signal.details}
      </p>
      {signal.impact && (
        <p className="mt-2 text-[11px] text-[var(--warning)]">{signal.impact}</p>
      )}
      {signal.actionRequired && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[var(--critical)]">
          <AlertCircle className="size-3" strokeWidth={2} />
          Action required
        </div>
      )}
    </motion.div>
  );
}
