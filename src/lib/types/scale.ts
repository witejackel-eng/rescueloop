// ─────────────────────────────────────────────────────────────
// PX06 — Scale Certification Types
// Certifies the $119 Scale tier at 2,500 monitored members.
// Do NOT raise plan limits after testing.
// ─────────────────────────────────────────────────────────────

// ── Load Profiles ────────────────────────────────────────────

/** Named load profile sizes */
export type LoadProfileSize = "small" | "medium" | "max";

/** A synthetic load profile defining test data shape */
export interface LoadProfile {
  size: LoadProfileSize;
  label: string;
  memberCount: number;
  tenantCount: number;
  eventCount: number;
  jobCount: number;
  courseCount: number;
  /** Scale tier limit — always 2,500 */
  scaleMemberCap: 2500;
}

// ── Chaos Scenarios ──────────────────────────────────────────

/** Named chaos/fault injection scenarios */
export type ChaosScenarioId =
  | "provider_delay"
  | "http_429"
  | "duplicate_webhook"
  | "worker_crash"
  | "db_transient_error"
  | "redis_outage"
  | "browser_disconnect";

/** A chaos scenario definition */
export interface ChaosScenario {
  id: ChaosScenarioId;
  label: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  /** Default injection duration in ms */
  defaultDurationMs: number;
  /** Expected impact description */
  expectedImpact: string;
  /** Whether this scenario is currently active */
  active: boolean;
}

// ── Metrics ──────────────────────────────────────────────────

/** Latency distribution at a given percentile */
export interface LatencyDistribution {
  p50: number;  // ms
  p95: number;  // ms
  p99: number;  // ms
  max: number;  // ms
}

/** Database metrics */
export interface DbMetrics {
  connectionUsage: number;    // 0–1 ratio
  activeConnections: number;
  maxConnections: number;
  queryLatency: LatencyDistribution;
  slowQueryCount: number;
}

/** Job queue metrics */
export interface QueueMetrics {
  depth: number;
  pendingJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  retryCount: number;
  maxRetriesExceeded: number;
}

/** Event throughput metrics */
export interface EventMetrics {
  eventsPerSecond: number;
  totalEvents: number;
  droppedEvents: number;
  duplicateEvents: number;
}

/** Memory usage metrics */
export interface MemoryMetrics {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
}

/** Vercel function behavior metrics */
export interface VercelFunctionMetrics {
  coldStarts: number;
  warmInvocations: number;
  avgColdStartMs: number;
  functionDurationMs: LatencyDistribution;
  concurrentInstances: number;
  maxConcurrentInstances: number;
}

/** Whop rate-limit simulation metrics */
export interface WhopRateLimitMetrics {
  totalRequests: number;
  rateLimited429: number;
  rateLimitRate: number;      // 0–1 ratio
  backoffApplied: number;
  avgBackoffMs: number;
}

/** Complete metric set for a benchmark run */
export interface MetricSet {
  latency: LatencyDistribution;
  db: DbMetrics;
  queue: QueueMetrics;
  events: EventMetrics;
  memory: MemoryMetrics;
  vercel: VercelFunctionMetrics;
  whopRateLimit: WhopRateLimitMetrics;
  timestamp: string;
}

// ── Benchmark Results ────────────────────────────────────────

/** SLO status for a given metric */
export type SLOStatus = "within_slo" | "marginal" | "slo_violation";

/** Benchmark SLO targets for the Scale tier */
export interface SLOTargets {
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  dbConnectionMax: number;
  queueDepthMax: number;
  memoryMaxMb: number;
  coldStartMaxMs: number;
  errorRateMax: number;     // 0–1 ratio
}

/** A single benchmark result */
export interface BenchmarkResult {
  id: string;
  loadProfile: LoadProfile;
  chaosScenarios: ChaosScenarioId[];
  metrics: MetricSet;
  sloTargets: SLOTargets;
  /** Computed SLO status per dimension */
  sloStatus: Record<string, SLOStatus>;
  /** Overall pass/fail */
  overallStatus: SLOStatus;
  /** Duration of the benchmark in ms */
  durationMs: number;
  /** Recommendations based on results */
  recommendations: string[];
  timestamp: string;
}

// ── Multi-tenant Benchmark ───────────────────────────────────

/** Multi-tenant benchmark configuration */
export interface MultiTenantConfig {
  label: string;
  tenantCount: number;
  /** Tenant distribution by plan */
  planDistribution: {
    rescue: number;
    growth: number;
    scale: number;
  };
  /** Total aggregate monitored members across all tenants */
  aggregateMembers: number;
}

/** Multi-tenant benchmark result */
export interface MultiTenantBenchmarkResult {
  config: MultiTenantConfig;
  perTenantResults: BenchmarkResult[];
  aggregateMetrics: MetricSet;
  overallStatus: SLOStatus;
  recommendations: string[];
  timestamp: string;
}

// ── Scale Certification ──────────────────────────────────────

/** Scale tier capacity policy — DO NOT CHANGE */
export const SCALE_CAPACITY_POLICY = {
  planName: "Scale",
  planPrice: 119,
  maxMonitoredMembers: 2500,
  /** This cap must NEVER be raised after testing */
  isHardCap: true,
} as const;

/** Default SLO targets for the Scale tier */
export const DEFAULT_SLO_TARGETS: SLOTargets = {
  p50LatencyMs: 200,
  p95LatencyMs: 500,
  p99LatencyMs: 1500,
  dbConnectionMax: 80,
  queueDepthMax: 500,
  memoryMaxMb: 512,
  coldStartMaxMs: 1500,
  errorRateMax: 0.01,
};

/** Load profile definitions */
export const LOAD_PROFILES: Record<LoadProfileSize, LoadProfile> = {
  small: {
    size: "small",
    label: "250 Members",
    memberCount: 250,
    tenantCount: 1,
    eventCount: 1250,
    jobCount: 50,
    courseCount: 3,
    scaleMemberCap: 2500,
  },
  medium: {
    size: "medium",
    label: "1,000 Members",
    memberCount: 1000,
    tenantCount: 1,
    eventCount: 5000,
    jobCount: 200,
    courseCount: 8,
    scaleMemberCap: 2500,
  },
  max: {
    size: "max",
    label: "2,500 Members",
    memberCount: 2500,
    tenantCount: 1,
    eventCount: 12500,
    jobCount: 500,
    courseCount: 15,
    scaleMemberCap: 2500,
  },
};

/** Chaos scenario definitions */
export const CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    id: "provider_delay",
    label: "Provider Delay",
    description: "Simulates Whop API responding with 2–5s latency",
    severity: "medium",
    defaultDurationMs: 30000,
    expectedImpact: "Increased P95/P99 latency, queue depth growth",
    active: false,
  },
  {
    id: "http_429",
    label: "HTTP 429 Rate Limited",
    description: "Simulates Whop API returning 429 rate-limit responses",
    severity: "high",
    defaultDurationMs: 60000,
    expectedImpact: "Backoff activation, reduced throughput, retry count spike",
    active: false,
  },
  {
    id: "duplicate_webhook",
    label: "Duplicate Webhook",
    description: "Sends identical webhooks twice to test idempotency",
    severity: "low",
    defaultDurationMs: 10000,
    expectedImpact: "Duplicate detection, no double-processing if idempotent",
    active: false,
  },
  {
    id: "worker_crash",
    label: "Worker Crash",
    description: "Simulates job worker process crash mid-processing",
    severity: "critical",
    defaultDurationMs: 15000,
    expectedImpact: "Job re-queue, increased retry count, potential data gap",
    active: false,
  },
  {
    id: "db_transient_error",
    label: "DB Transient Error",
    description: "Simulates brief database connection failures",
    severity: "high",
    defaultDurationMs: 20000,
    expectedImpact: "Reconnect attempts, query latency spike, brief data unavailability",
    active: false,
  },
  {
    id: "redis_outage",
    label: "Redis Outage",
    description: "Simulates Redis/cache layer becoming unavailable",
    severity: "critical",
    defaultDurationMs: 30000,
    expectedImpact: "Cache miss storm, direct DB load, rate limiter fallback",
    active: false,
  },
  {
    id: "browser_disconnect",
    label: "Browser Disconnect",
    description: "Simulates client WebSocket disconnection during operation",
    severity: "low",
    defaultDurationMs: 10000,
    expectedImpact: "Server continues processing, reconnection on reconnect",
    active: false,
  },
];

/** Multi-tenant benchmark configurations */
export const MULTI_TENANT_CONFIGS: MultiTenantConfig[] = [
  {
    label: "10 Scale Tenants",
    tenantCount: 10,
    planDistribution: { rescue: 0, growth: 0, scale: 10 },
    aggregateMembers: 25000,
  },
  {
    label: "20 Scale Tenants",
    tenantCount: 20,
    planDistribution: { rescue: 0, growth: 0, scale: 20 },
    aggregateMembers: 50000,
  },
  {
    label: "100 Mixed Tenants",
    tenantCount: 100,
    planDistribution: { rescue: 40, growth: 35, scale: 25 },
    aggregateMembers: 87500,
  },
  {
    label: "100 Tenants / 250k Members",
    tenantCount: 100,
    planDistribution: { rescue: 30, growth: 40, scale: 30 },
    aggregateMembers: 250000,
  },
];

/** Helper: compute SLO status from a value and thresholds */
export function computeSLOStatus(
  value: number,
  withinSlo: number,
  marginal: number
): SLOStatus {
  if (value <= withinSlo) return "within_slo";
  if (value <= marginal) return "marginal";
  return "slo_violation";
}

/** Helper: SLO status color class */
export function sloStatusColor(status: SLOStatus): string {
  switch (status) {
    case "within_slo":
      return "text-[var(--recovery-green)]";
    case "marginal":
      return "text-[var(--warning)]";
    case "slo_violation":
      return "text-[var(--critical)]";
  }
}

/** Helper: SLO status background classes */
export function sloStatusBg(status: SLOStatus): string {
  switch (status) {
    case "within_slo":
      return "bg-[var(--recovery-light)] border-[#C7E6D5] text-[#147D68]";
    case "marginal":
      return "bg-[var(--warning-light)] border-[#E8D5A0] text-[var(--warning)]";
    case "slo_violation":
      return "bg-[var(--critical-light)] border-[#E8B0AC] text-[var(--critical)]";
  }
}

/** Helper: SLO status dot color */
export function sloStatusDot(status: SLOStatus): string {
  switch (status) {
    case "within_slo":
      return "bg-[var(--recovery-green)]";
    case "marginal":
      return "bg-[var(--warning)]";
    case "slo_violation":
      return "bg-[var(--critical)]";
  }
}
