"use client";

// ─────────────────────────────────────────────────────────────
// PX06 — Scale Certification Dashboard
// Main dashboard composing all scale certification panels.
// Data-dense operator console aesthetic.
// ─────────────────────────────────────────────────────────────

import { useState, type FC } from "react";
import type {
  LoadProfileSize,
  ChaosScenario,
  ChaosScenarioId,
  BenchmarkResult,
  MultiTenantBenchmarkResult,
} from "@/lib/types/scale";
import { CHAOS_SCENARIOS, SCALE_CAPACITY_POLICY } from "@/lib/types/scale";
import { LoadProfileSelector } from "./load-profile-selector";
import { BenchmarkResults } from "./benchmark-results";
import { ChaosPanel } from "./chaos-panel";
import { MetricsPanel } from "./metrics-panel";
import { runBenchmark, getDemoBenchmarkResults, getDemoMultiTenantResults } from "@/lib/scale/benchmark-runner";
import { getBaselineMetrics } from "@/lib/scale/metrics-collector";
import { toggleScenario, getActiveScenarioIds } from "@/lib/scale/chaos-injector";
import { Badge } from "@/components/ui/badge";
import { Shield, Play, RotateCcw, Lock } from "lucide-react";

interface ScaleDashboardProps {
  initialResults?: BenchmarkResult[];
  initialMultiTenantResults?: MultiTenantBenchmarkResult[];
}

export const ScaleDashboard: FC<ScaleDashboardProps> = ({
  initialResults,
  initialMultiTenantResults,
}) => {
  // Load profile selection
  const [selectedProfile, setSelectedProfile] = useState<LoadProfileSize>("max");

  // Chaos scenarios
  const [scenarios, setScenarios] = useState<ChaosScenario[]>(
    CHAOS_SCENARIOS.map((s) => ({ ...s }))
  );

  // Benchmark results
  const [results, setResults] = useState<BenchmarkResult[]>(
    initialResults ?? getDemoBenchmarkResults()
  );
  const [multiTenantResults, setMultiTenantResults] = useState<MultiTenantBenchmarkResult[]>(
    initialMultiTenantResults ?? getDemoMultiTenantResults()
  );

  // Current run metrics (for live metrics panel)
  const [currentMetrics, setCurrentMetrics] = useState(
    getBaselineMetrics("max")
  );

  // Running state
  const [isRunning, setIsRunning] = useState(false);

  // Handle chaos toggle
  const handleChaosToggle = (id: ChaosScenarioId) => {
    setScenarios((prev) => toggleScenario(prev, id));
  };

  // Run benchmark
  const handleRunBenchmark = () => {
    setIsRunning(true);

    // Simulate async benchmark execution
    setTimeout(() => {
      const activeChaos = getActiveScenarioIds(scenarios);
      const newResult = runBenchmark(selectedProfile, activeChaos);
      const newMetrics = newResult.metrics;

      setResults((prev) => [newResult, ...prev.slice(0, 20)]);
      setCurrentMetrics(newMetrics);
      setIsRunning(false);
    }, 800);
  };

  // Reset to baseline
  const handleReset = () => {
    setScenarios(CHAOS_SCENARIOS.map((s) => ({ ...s, active: false })));
    setResults(getDemoBenchmarkResults());
    setMultiTenantResults(getDemoMultiTenantResults());
    setCurrentMetrics(getBaselineMetrics(selectedProfile));
  };

  // Get latest result for profile
  const latestBaseline = results.find(
    (r) => r.loadProfile.size === selectedProfile && r.chaosScenarios.length === 0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
              Scale Certification
            </h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              PX06
            </Badge>
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--ink-muted)]">
            Certifying the $119 Scale tier at 2,500 monitored members
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Capacity Policy Badge */}
          <div className="flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5">
            <Lock className="h-3 w-3 text-[var(--critical)]" />
            <span className="font-mono text-[10px] text-[var(--ink-secondary)]">
              Hard cap: {SCALE_CAPACITY_POLICY.maxMonitoredMembers.toLocaleString()} members
            </span>
          </div>
        </div>
      </header>

      {/* Capacity Policy Banner */}
      <div className="rounded-lg border border-[#E8B0AC] bg-[var(--critical-light)] px-4 py-3">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--critical)]" />
          <div className="text-[11px]">
            <p className="font-medium text-[var(--critical)]">
              Capacity Policy — Do NOT raise plan limits after testing
            </p>
            <p className="mt-1 text-[var(--ink-secondary)]">
              The Scale tier is certified at{" "}
              <span className="font-mono font-medium">{SCALE_CAPACITY_POLICY.maxMonitoredMembers.toLocaleString()}</span>{" "}
              monitored members (${SCALE_CAPACITY_POLICY.planPrice}/mo).
              Testing validates this limit. Results produce recommendations only —
              they do NOT change customer entitlement or raise the hard cap.
            </p>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LoadProfileSelector selected={selectedProfile} onSelect={setSelectedProfile} />
        <ChaosPanel scenarios={scenarios} onToggle={handleChaosToggle} />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleRunBenchmark}
          disabled={isRunning}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-medium text-white transition-all ${
            isRunning
              ? "bg-[var(--ink-muted)] cursor-not-allowed"
              : "bg-[var(--ink-primary)] hover:opacity-90"
          }`}
        >
          {isRunning ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Running…
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Run Benchmark
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-4 py-2 text-[12px] font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        {latestBaseline && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-[var(--ink-muted)]">Latest SLO:</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              latestBaseline.overallStatus === "within_slo"
                ? "bg-[var(--recovery-light)] border-[#C7E6D5] text-[#147D68]"
                : latestBaseline.overallStatus === "marginal"
                  ? "bg-[var(--warning-light)] border-[#E8D5A0] text-[var(--warning)]"
                  : "bg-[var(--critical-light)] border-[#E8B0AC] text-[var(--critical)]"
            }`}>
              {latestBaseline.overallStatus === "within_slo" ? "Pass" : latestBaseline.overallStatus === "marginal" ? "Marginal" : "Fail"}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Benchmark Results (2 cols) */}
        <div className="xl:col-span-2">
          <BenchmarkResults
            results={results}
            multiTenantResults={multiTenantResults}
          />
        </div>

        {/* Metrics Panel (1 col) */}
        <div className="xl:col-span-1">
          <div className="sticky top-4">
            <h3 className="mb-3 font-serif text-[16px] text-[var(--ink-primary)]">
              Live Metrics
            </h3>
            <MetricsPanel metrics={currentMetrics} />
          </div>
        </div>
      </div>
    </div>
  );
};
