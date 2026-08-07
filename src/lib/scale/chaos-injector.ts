// ─────────────────────────────────────────────────────────────
// PX06 — Chaos Injector
// Fault injection for scale certification testing.
// All scenarios are simulated — no real production impact.
// ─────────────────────────────────────────────────────────────

import type {
  ChaosScenario,
  ChaosScenarioId,
  MetricSet,
} from "@/lib/types/scale";
import { CHAOS_SCENARIOS } from "@/lib/types/scale";

// ── Injection State ──────────────────────────────────────────

export interface ChaosInjectionState {
  activeScenarios: ChaosScenarioId[];
  startedAt: Record<ChaosScenarioId, string>;
  durationMs: Record<ChaosScenarioId, number>;
  injectCount: Record<ChaosScenarioId, number>;
}

export const INITIAL_CHAOS_STATE: ChaosInjectionState = {
  activeScenarios: [],
  startedAt: {} as Record<ChaosScenarioId, string>,
  durationMs: {} as Record<ChaosScenarioId, number>,
  injectCount: {
    provider_delay: 0,
    http_429: 0,
    duplicate_webhook: 0,
    worker_crash: 0,
    db_transient_error: 0,
    redis_outage: 0,
    browser_disconnect: 0,
  },
};

// ── Injection Effects on Metrics ─────────────────────────────

/**
 * Applies chaos effects to a baseline MetricSet.
 * Returns a NEW MetricSet with injected degradation.
 * Pure function — no side effects.
 */
export function applyChaosEffects(
  baseline: MetricSet,
  activeScenarios: ChaosScenarioId[]
): MetricSet {
  if (activeScenarios.length === 0) return baseline;

  // Deep clone
  const result: MetricSet = JSON.parse(JSON.stringify(baseline));

  for (const scenario of activeScenarios) {
    switch (scenario) {
      case "provider_delay":
        // Whop API latency: P50 +500ms, P95 +2000ms, P99 +5000ms
        result.latency.p50 += 500;
        result.latency.p95 += 2000;
        result.latency.p99 += 5000;
        result.latency.max += 8000;
        result.whopRateLimit.totalRequests += 100;
        result.whopRateLimit.backoffApplied += 15;
        result.whopRateLimit.avgBackoffMs += 1200;
        break;

      case "http_429":
        // Rate limited: throughput drops, retries spike
        result.whopRateLimit.rateLimited429 += 45;
        result.whopRateLimit.rateLimitRate = Math.min(1, result.whopRateLimit.rateLimitRate + 0.15);
        result.whopRateLimit.backoffApplied += 45;
        result.whopRateLimit.avgBackoffMs += 3200;
        result.queue.retryCount += 45;
        result.queue.depth += 45;
        result.events.eventsPerSecond = Math.floor(result.events.eventsPerSecond * 0.6);
        break;

      case "duplicate_webhook":
        // Duplicate events detected, no double processing
        result.events.duplicateEvents += 12;
        result.events.totalEvents += 12;
        result.whopRateLimit.totalRequests += 12;
        break;

      case "worker_crash":
        // Jobs lost, retries, queue depth spike
        result.queue.failedJobs += 8;
        result.queue.retryCount += 8;
        result.queue.depth += 15;
        result.queue.maxRetriesExceeded += 2;
        result.latency.p95 += 1500;
        result.latency.p99 += 4000;
        break;

      case "db_transient_error":
        // DB connection drops, query latency spike
        result.db.connectionUsage = Math.min(1, result.db.connectionUsage + 0.2);
        result.db.activeConnections = Math.min(
          result.db.maxConnections,
          result.db.activeConnections + 15
        );
        result.db.slowQueryCount += 25;
        result.db.queryLatency.p50 += 200;
        result.db.queryLatency.p95 += 1500;
        result.db.queryLatency.p99 += 3000;
        result.queue.retryCount += 10;
        break;

      case "redis_outage":
        // Cache miss storm, direct DB load
        result.db.connectionUsage = Math.min(1, result.db.connectionUsage + 0.35);
        result.db.activeConnections = Math.min(
          result.db.maxConnections,
          result.db.activeConnections + 30
        );
        result.db.slowQueryCount += 50;
        result.db.queryLatency.p50 += 100;
        result.db.queryLatency.p95 += 800;
        result.db.queryLatency.p99 += 2000;
        result.latency.p50 += 150;
        result.latency.p95 += 600;
        result.latency.p99 += 1500;
        break;

      case "browser_disconnect":
        // Server continues, minor event drop
        result.events.droppedEvents += 5;
        result.vercel.coldStarts += 2;
        break;
    }
  }

  // Recalculate max if P99 exceeds it
  result.latency.max = Math.max(result.latency.max, result.latency.p99 + 500);

  return result;
}

// ── Scenario Helpers ─────────────────────────────────────────

/** Get all chaos scenario definitions */
export function getAllScenarios(): ChaosScenario[] {
  return [...CHAOS_SCENARIOS];
}

/** Toggle a scenario on/off */
export function toggleScenario(
  scenarios: ChaosScenario[],
  id: ChaosScenarioId
): ChaosScenario[] {
  return scenarios.map((s) =>
    s.id === id ? { ...s, active: !s.active } : s
  );
}

/** Get IDs of all active scenarios */
export function getActiveScenarioIds(scenarios: ChaosScenario[]): ChaosScenarioId[] {
  return scenarios.filter((s) => s.active).map((s) => s.id);
}

/** Severity order for sorting */
export const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Severity color classes */
export function severityColor(severity: ChaosScenario["severity"]): string {
  switch (severity) {
    case "critical":
      return "text-[var(--critical)]";
    case "high":
      return "text-[var(--warning)]";
    case "medium":
      return "text-[var(--info)]";
    case "low":
      return "text-[var(--ink-muted)]";
  }
}

/** Severity dot color */
export function severityDot(severity: ChaosScenario["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-[var(--critical)]";
    case "high":
      return "bg-[var(--warning)]";
    case "medium":
      return "bg-[var(--info)]";
    case "low":
      return "bg-[var(--ink-muted)]";
  }
}
