"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useHealthStore } from "@/features/health-engine/health-store";
import { HEALTH_STATUS_META } from "@/lib/types/health";
import type { HealthStatus } from "@/lib/types/health";
import { HealthDomainCard } from "./health-domain-card";

export function SystemHealthPage() {
  const signals = useHealthStore((s) => s.signals);
  const checkedAt = useHealthStore((s) => s.checkedAt);
  const overallStatus = useHealthStore((s) => s.overallStatus);
  const healthyCount = useHealthStore((s) => s.healthyCount);
  const degradedCount = useHealthStore((s) => s.degradedCount);
  const unhealthyCount = useHealthStore((s) => s.unhealthyCount);
  const actionNeededCount = useHealthStore((s) => s.actionNeededCount);
  const refreshHealth = useHealthStore((s) => s.refreshHealth);

  const meta = HEALTH_STATUS_META[overallStatus];

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">
              System Health
            </h1>
            <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
              Real-time status of all connected systems and services
            </p>
          </div>
          <button
            onClick={refreshHealth}
            className="flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 text-[12px] text-[var(--ink-secondary)] transition-colors hover:bg-[var(--canvas)]"
          >
            <RefreshCw className="size-3" strokeWidth={2} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Overall status banner */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`mb-6 rounded-lg border p-4 ${meta.bg} ${meta.border}`}
      >
        <div className="flex items-center gap-3">
          <span className={`size-3 rounded-full ${meta.dot}`} />
          <div>
            <p className={`text-[14px] font-medium ${meta.color}`}>
              {overallStatus === "healthy"
                ? "All systems operational"
                : overallStatus === "degraded"
                  ? "Some systems degraded"
                  : overallStatus === "unhealthy"
                    ? "Issues detected"
                    : "Status unknown"}
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
              {healthyCount} healthy · {degradedCount} degraded · {unhealthyCount} unhealthy
              {actionNeededCount > 0 && ` · ${actionNeededCount} action needed`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex gap-4"
      >
        <StatusPill status="healthy" count={healthyCount} />
        <StatusPill status="degraded" count={degradedCount} />
        <StatusPill status="unhealthy" count={unhealthyCount} />
      </motion.div>

      {/* Domain cards */}
      <div className="space-y-3">
        {signals.map((signal, i) => (
          <motion.div
            key={signal.domain}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
          >
            <HealthDomainCard signal={signal} />
          </motion.div>
        ))}
      </div>

      {/* Last checked */}
      <p className="mt-6 text-center text-[11px] text-[var(--ink-muted)]">
        Last checked {timeAgo(checkedAt)}
      </p>
    </div>
  );
}

function StatusPill({ status, count }: { status: HealthStatus; count: number }) {
  const meta = HEALTH_STATUS_META[status];
  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${meta.bg} ${meta.border}`}>
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      <span className={`text-[12px] font-medium ${meta.color}`}>{meta.label}</span>
      <span className={`font-mono text-[12px] tabular-nums ${meta.color}`}>{count}</span>
    </div>
  );
}
