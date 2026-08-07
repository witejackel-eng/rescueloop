"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Zap, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { useHealthStore } from "@/features/health-engine/health-store";
import { HEALTH_STATUS_META } from "@/lib/types/health";

const STATUS_COLORS: Record<string, string> = {
  healthy: "#147D68",
  degraded: "#C68A1E",
  unhealthy: "#B83D34",
  unknown: "#6A706A",
};

export function StatusBanner() {
  const overallStatus = useHealthStore((s) => s.overallStatus);
  const healthyCount = useHealthStore((s) => s.healthyCount);
  const degradedCount = useHealthStore((s) => s.degradedCount);
  const unhealthyCount = useHealthStore((s) => s.unhealthyCount);
  const actionNeededCount = useHealthStore((s) => s.actionNeededCount);
  const healthMeta = HEALTH_STATUS_META[overallStatus];

  const pieData = [
    { name: "Healthy", value: healthyCount, status: "healthy" },
    { name: "Degraded", value: degradedCount, status: "degraded" },
    { name: "Unhealthy", value: unhealthyCount, status: "unhealthy" },
  ].filter((d) => d.value > 0);

  const total = healthyCount + degradedCount + unhealthyCount;

  const StatusIcon =
    overallStatus === "healthy"
      ? ShieldCheck
      : overallStatus === "degraded"
        ? AlertTriangle
        : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)]"
    >
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#147D68] via-[#C68A1E] to-[#B83D34]" />

      <div className="p-5 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Donut chart */}
            <div className="relative shrink-0 size-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={28}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[entry.status]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[11px] font-semibold text-[var(--ink-primary)]">
                  {total}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusIcon
                  className={`size-4 ${healthMeta.color}`}
                  strokeWidth={2}
                />
                <p className={`text-[16px] font-medium ${healthMeta.color}`}>
                  {overallStatus === "healthy"
                    ? "All systems operational"
                    : overallStatus === "degraded"
                      ? "Some systems degraded"
                      : "Issues detected"}
                </p>
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
                {healthyCount} healthy · {degradedCount} degraded ·{" "}
                {unhealthyCount} unhealthy
                {actionNeededCount > 0 && (
                  <span className="text-[var(--critical)]">
                    {" "}
                    · {actionNeededCount} action needed
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* PX status chips - desktop only */}
          <div className="hidden lg:flex items-center gap-2">
            {["PX01", "PX02", "PX03", "PX04", "PX05", "PX06", "PX07"].map(
              (px) => (
                <div
                  key={px}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--hairline-subtle)] bg-[var(--canvas-elevated)] px-2 py-1"
                >
                  <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
                  <span className="font-mono text-[10px] text-[var(--ink-secondary)]">
                    {px}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
