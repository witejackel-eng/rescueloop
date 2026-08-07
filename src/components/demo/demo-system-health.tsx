"use client";

import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { DEMO_HEALTH_DOMAINS } from "@/lib/demo-fixtures";
import { cn } from "@/lib/utils";

const statusColor = (s: string) => {
  switch (s) {
    case "healthy": return { dot: "bg-[var(--recovery-green)]", bg: "bg-[var(--recovery-light)]", text: "text-[var(--recovery-green)]", border: "border-[var(--recovery-green)]/20" };
    case "degraded": return { dot: "bg-[var(--warning)]", bg: "bg-[var(--warning-light)]", text: "text-[var(--warning)]", border: "border-[var(--warning)]/20" };
    case "unhealthy": return { dot: "bg-[var(--critical)]", bg: "bg-[var(--critical-light)]", text: "text-[var(--critical)]", border: "border-[var(--critical)]/20" };
    default: return { dot: "bg-[var(--ink-muted)]", bg: "bg-[var(--canvas-elevated)]", text: "text-[var(--ink-muted)]", border: "border-[var(--hairline)]" };
  }
};

export function DemoSystemHealthSection() {
  const healthy = DEMO_HEALTH_DOMAINS.filter((d) => d.status === "healthy").length;
  const degraded = DEMO_HEALTH_DOMAINS.filter((d) => d.status === "degraded").length;
  const overallStatus = degraded > 0 ? "degraded" : "healthy";
  const overall = statusColor(overallStatus);

  return (
    <div className="flex flex-col gap-5">
      {/* Overall banner */}
      <div className={cn("rounded-lg border p-4", overall.bg, overall.border)}>
        <div className="flex items-center gap-3">
          <span className={cn("size-3 rounded-full", overall.dot)} />
          <div>
            <p className={cn("text-[14px] font-medium", overall.text)}>
              {overallStatus === "healthy" ? "All systems operational" : "Some systems degraded"}
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
              {healthy} healthy · {degraded} degraded
            </p>
          </div>
        </div>
      </div>

      {/* Simulated label */}
      <p className="text-[12px] italic text-[var(--ink-muted)]">
        Simulated system state — no real infrastructure data
      </p>

      {/* Domain cards */}
      <div className="space-y-3">
        {DEMO_HEALTH_DOMAINS.map((domain) => {
          const meta = statusColor(domain.status);
          return (
            <Card key={domain.domain} className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
              <div className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("size-2 rounded-full", meta.dot)} />
                    <span className="text-[14px] font-medium text-[var(--ink-primary)]">{domain.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-[2px] border px-2 py-0.5 text-[10px] font-medium", meta.bg, meta.border, meta.text)}>
                      {domain.status === "healthy" ? "Healthy" : domain.status === "degraded" ? "Delayed" : "Unhealthy"}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">{domain.lastChecked}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-[13px] text-[var(--ink-secondary)]">{domain.message}</p>
                {domain.details && (
                  <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{domain.details}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
