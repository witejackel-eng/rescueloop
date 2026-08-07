// ─────────────────────────────────────────────────────────────
// PX06 — Benchmark Runner
// Executes scale benchmarks and produces pre-computed demo results.
// Certifies correctness before speed. Returns recommendations only.
// ─────────────────────────────────────────────────────────────

import type {
  LoadProfileSize,
  ChaosScenarioId,
  BenchmarkResult,
  MultiTenantBenchmarkResult,
  SLOStatus,
  SLOTargets,
  MetricSet,
} from "@/lib/types/scale";
import {
  LOAD_PROFILES,
  DEFAULT_SLO_TARGETS,
  MULTI_TENANT_CONFIGS,
  computeSLOStatus,
} from "@/lib/types/scale";
import { getBaselineMetrics, getMultiTenantMetrics } from "./metrics-collector";
import { applyChaosEffects } from "./chaos-injector";

// ── SLO Evaluation ───────────────────────────────────────────

function evaluateSLOs(
  metrics: MetricSet,
  targets: SLOTargets
): Record<string, SLOStatus> {
  return {
    p50Latency: computeSLOStatus(metrics.latency.p50, targets.p50LatencyMs, targets.p50LatencyMs * 1.5),
    p95Latency: computeSLOStatus(metrics.latency.p95, targets.p95LatencyMs, targets.p95LatencyMs * 1.5),
    p99Latency: computeSLOStatus(metrics.latency.p99, targets.p99LatencyMs, targets.p99LatencyMs * 1.5),
    dbConnections: computeSLOStatus(metrics.db.connectionUsage * 100, targets.dbConnectionMax, targets.dbConnectionMax * 1.3),
    queueDepth: computeSLOStatus(metrics.queue.depth, targets.queueDepthMax, targets.queueDepthMax * 1.5),
    memory: computeSLOStatus(metrics.memory.heapUsedMb, targets.memoryMaxMb, targets.memoryMaxMb * 1.2),
    coldStart: computeSLOStatus(metrics.vercel.avgColdStartMs, targets.coldStartMaxMs, targets.coldStartMaxMs * 1.5),
    errorRate: computeSLOStatus(
      metrics.queue.failedJobs / Math.max(1, metrics.queue.completedJobs + metrics.queue.failedJobs),
      targets.errorRateMax,
      targets.errorRateMax * 3
    ),
  };
}

function overallSLOStatus(statuses: Record<string, SLOStatus>): SLOStatus {
  const values = Object.values(statuses);
  if (values.some((s) => s === "slo_violation")) return "slo_violation";
  if (values.some((s) => s === "marginal")) return "marginal";
  return "within_slo";
}

function generateRecommendations(
  profile: LoadProfileSize,
  metrics: MetricSet,
  sloStatuses: Record<string, SLOStatus>,
  chaosScenarios: ChaosScenarioId[]
): string[] {
  const recs: string[] = [];

  if (sloStatuses.p99Latency !== "within_slo") {
    recs.push("P99 latency exceeds SLO — consider adding read replicas or query caching");
  }
  if (sloStatuses.p95Latency === "marginal") {
    recs.push("P95 latency is marginal — monitor closely under peak load");
  }
  if (sloStatuses.dbConnections !== "within_slo") {
    recs.push("DB connection usage high — increase pool size or add connection pooling");
  }
  if (sloStatuses.queueDepth !== "within_slo") {
    recs.push("Queue depth exceeds SLO — add worker capacity or reduce job processing time");
  }
  if (sloStatuses.memory === "marginal") {
    recs.push("Memory usage approaching limit — profile heap for retained objects");
  }
  if (metrics.vercel.coldStarts > 10) {
    recs.push("High cold start count — consider function warming strategy");
  }
  if (metrics.whopRateLimit.rateLimited429 > 20) {
    recs.push("Whop rate limiting detected — implement request queuing and backoff");
  }
  if (chaosScenarios.includes("redis_outage") && metrics.db.slowQueryCount > 30) {
    recs.push("Redis outage causes cache miss storm — ensure graceful degradation");
  }
  if (chaosScenarios.includes("http_429") && metrics.queue.retryCount > 30) {
    recs.push("429 responses cause retry spike — respect Retry-After header");
  }
  if (chaosScenarios.includes("worker_crash") && metrics.queue.maxRetriesExceeded > 0) {
    recs.push("Worker crashes cause max-retry exceeded — add dead letter queue");
  }

  if (recs.length === 0) {
    recs.push("All SLOs within target — system is certified at this scale");
  }

  // Always remind about the hard cap
  recs.push("Scale tier hard cap: 2,500 monitored members — do NOT raise after testing");

  return recs;
}

// ── Single-Tenant Benchmark ──────────────────────────────────

/** Run a benchmark for a single load profile with optional chaos */
export function runBenchmark(
  size: LoadProfileSize,
  chaosScenarios: ChaosScenarioId[] = [],
  targets: SLOTargets = DEFAULT_SLO_TARGETS
): BenchmarkResult {
  const profile = LOAD_PROFILES[size];
  let metrics = getBaselineMetrics(size);

  // Apply chaos effects
  if (chaosScenarios.length > 0) {
    metrics = applyChaosEffects(metrics, chaosScenarios);
  }

  const sloStatuses = evaluateSLOs(metrics, targets);
  const overall = overallSLOStatus(sloStatuses);

  // Simulate benchmark duration
  const baseDuration = { small: 5200, medium: 18500, max: 42000 }[size];
  const chaosDuration = chaosScenarios.length * 8000;
  const recommendations = generateRecommendations(size, metrics, sloStatuses, chaosScenarios);

  return {
    id: `bench-${size}-${Date.now()}`,
    loadProfile: profile,
    chaosScenarios,
    metrics,
    sloTargets: targets,
    sloStatus: sloStatuses,
    overallStatus: overall,
    durationMs: baseDuration + chaosDuration,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// ── Multi-Tenant Benchmark ───────────────────────────────────

/** Run a multi-tenant benchmark by config index */
export function runMultiTenantBenchmark(
  configIndex: number,
  chaosScenarios: ChaosScenarioId[] = [],
  targets: SLOTargets = DEFAULT_SLO_TARGETS
): MultiTenantBenchmarkResult {
  const config = MULTI_TENANT_CONFIGS[configIndex] ?? MULTI_TENANT_CONFIGS[0];

  // Generate per-tenant results for Scale tenants
  const perTenantResults: BenchmarkResult[] = [];
  const scaleTenantCount = config.planDistribution.scale;

  for (let i = 0; i < Math.min(scaleTenantCount, 5); i++) {
    // Sample a few representative tenants
    perTenantResults.push(runBenchmark("max", chaosScenarios, targets));
  }

  // Aggregate metrics for all tenants
  let aggregateMetrics = getMultiTenantMetrics(
    config.tenantCount,
    config.aggregateMembers
  );

  if (chaosScenarios.length > 0) {
    aggregateMetrics = applyChaosEffects(aggregateMetrics, chaosScenarios);
  }

  const sloStatuses = evaluateSLOs(aggregateMetrics, targets);
  const overall = overallSLOStatus(sloStatuses);

  const recommendations: string[] = [];
  if (overall !== "within_slo") {
    recommendations.push(`Multi-tenant aggregate SLO status: ${overall}`);
  }
  if (aggregateMetrics.db.connectionUsage > 0.7) {
    recommendations.push("Aggregate DB connection usage high across tenants — consider per-tenant connection limits");
  }
  if (aggregateMetrics.vercel.concurrentInstances > 10) {
    recommendations.push("High concurrent Vercel function instances — verify concurrency limits");
  }
  if (config.aggregateMembers > 100000) {
    recommendations.push("Large aggregate member count — ensure batch processing is used for sync operations");
  }
  recommendations.push("Scale tier hard cap: 2,500 monitored members per tenant — do NOT raise");

  return {
    config,
    perTenantResults,
    aggregateMetrics,
    overallStatus: overall,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// ── Pre-computed Demo Results ────────────────────────────────

/** Get all pre-computed benchmark results for the dashboard */
export function getDemoBenchmarkResults(): BenchmarkResult[] {
  const sizes: LoadProfileSize[] = ["small", "medium", "max"];
  const results: BenchmarkResult[] = [];

  // Baseline runs (no chaos)
  for (const size of sizes) {
    results.push(runBenchmark(size));
  }

  // Max scale with individual chaos scenarios
  const singleChaos: ChaosScenarioId[] = [
    "provider_delay",
    "http_429",
    "duplicate_webhook",
    "worker_crash",
    "db_transient_error",
    "redis_outage",
    "browser_disconnect",
  ];
  for (const chaos of singleChaos) {
    results.push(runBenchmark("max", [chaos]));
  }

  // Max scale with combined chaos
  results.push(runBenchmark("max", ["provider_delay", "http_429"]));
  results.push(runBenchmark("max", ["db_transient_error", "redis_outage"]));
  results.push(runBenchmark("max", ["worker_crash", "db_transient_error", "redis_outage"]));

  return results;
}

/** Get all multi-tenant benchmark results */
export function getDemoMultiTenantResults(): MultiTenantBenchmarkResult[] {
  return MULTI_TENANT_CONFIGS.map((_, i) => runMultiTenantBenchmark(i));
}

/** Get a summary of all benchmarks for quick display */
export function getBenchmarkSummary() {
  const baselineResults = (["small", "medium", "max"] as LoadProfileSize[]).map(
    (size) => runBenchmark(size)
  );

  const multiTenantResults = getDemoMultiTenantResults();

  return {
    baselineResults,
    multiTenantResults,
    capacityPolicy: {
      planName: "Scale",
      price: 119,
      maxMembers: 2500,
      isHardCap: true,
    },
    totalBenchmarksRun: baselineResults.length + multiTenantResults.length,
    sloPassRate: baselineResults.filter((r) => r.overallStatus === "within_slo").length / baselineResults.length,
  };
}
