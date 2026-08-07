"use client";

// ─────────────────────────────────────────────────────────────
// PX06 — Chaos Panel
// Interactive chaos scenario controls with severity indicators.
// ─────────────────────────────────────────────────────────────

import { type FC } from "react";
import type { ChaosScenario, ChaosScenarioId } from "@/lib/types/scale";
import { CHAOS_SCENARIOS } from "@/lib/types/scale";
import { severityColor, severityDot, SEVERITY_ORDER } from "@/lib/scale/chaos-injector";
import { Zap, ShieldAlert, Wifi, Database, Server, Globe, Monitor } from "lucide-react";

interface ChaosPanelProps {
  scenarios: ChaosScenario[];
  onToggle: (id: ChaosScenarioId) => void;
}

const SCENARIO_ICONS: Record<ChaosScenarioId, React.ComponentType<{ className?: string }>> = {
  provider_delay: Zap,
  http_429: ShieldAlert,
  duplicate_webhook: Wifi,
  worker_crash: Server,
  db_transient_error: Database,
  redis_outage: Globe,
  browser_disconnect: Monitor,
};

export const ChaosPanel: FC<ChaosPanelProps> = ({ scenarios, onToggle }) => {
  const activeCount = scenarios.filter((s) => s.active).length;
  const sortedScenarios = [...scenarios].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
          Chaos Scenarios
        </h3>
        {activeCount > 0 && (
          <span className="rounded-full bg-[var(--warning-light)] border border-[#E8D5A0] px-2 py-0.5 font-mono text-[10px] text-[var(--warning)]">
            {activeCount} active
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {sortedScenarios.map((scenario) => {
          const Icon = SCENARIO_ICONS[scenario.id];
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onToggle(scenario.id)}
              className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                scenario.active
                  ? "border-[var(--warning)] bg-[var(--warning-light)]"
                  : "border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {/* Status indicator */}
              <div className="flex shrink-0 items-center justify-center">
                {scenario.active ? (
                  <span className="size-3 rounded-full bg-[var(--warning)] animate-pulse" />
                ) : (
                  <span className={`size-3 rounded-full border border-[var(--hairline)] bg-[var(--canvas-elevated)]`} />
                )}
              </div>

              {/* Icon */}
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${scenario.active ? "text-[var(--warning)]" : "text-[var(--ink-muted)]"}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-medium ${scenario.active ? "text-[var(--warning)]" : "text-[var(--ink-primary)]"}`}>
                    {scenario.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
                    scenario.severity === "critical"
                      ? "bg-[var(--critical-light)] border-[#E8B0AC] text-[var(--critical)]"
                      : scenario.severity === "high"
                        ? "bg-[var(--warning-light)] border-[#E8D5A0] text-[var(--warning)]"
                        : scenario.severity === "medium"
                          ? "bg-[#E3EDF5] border-[#B8CDE0] text-[var(--info)]"
                          : "bg-[var(--canvas-elevated)] border-[var(--hairline)] text-[var(--ink-muted)]"
                  }`}>
                    <span className={`size-1 rounded-full ${severityDot(scenario.severity)}`} />
                    {scenario.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--ink-muted)] line-clamp-1">
                  {scenario.description}
                </p>
                {scenario.active && (
                  <p className="mt-1 text-[10px] text-[var(--warning)] italic">
                    Impact: {scenario.expectedImpact}
                  </p>
                )}
              </div>

              {/* Duration */}
              <span className="shrink-0 font-mono text-[9px] text-[var(--ink-muted)] tabular-nums">
                {(scenario.defaultDurationMs / 1000).toFixed(0)}s
              </span>
            </button>
          );
        })}
      </div>

      {activeCount > 0 && (
        <p className="text-[10px] italic text-[var(--ink-muted)]">
          Active chaos scenarios degrade metrics. Results show system resilience under fault.
        </p>
      )}
    </div>
  );
};
