// ─────────────────────────────────────────────────────────────
// PX06 — Metrics Collector
// Simulated metrics collection for scale certification.
// Pre-computed demo metrics for all load profiles.
// ─────────────────────────────────────────────────────────────

import type {
  LoadProfileSize,
  MetricSet,
  LatencyDistribution,
  DbMetrics,
  QueueMetrics,
  EventMetrics,
  MemoryMetrics,
  VercelFunctionMetrics,
  WhopRateLimitMetrics,
} from "@/lib/types/scale";
import { LOAD_PROFILES } from "@/lib/types/scale";

// ── Baseline Metrics Per Load Profile ────────────────────────
// Realistic metrics based on profiling a Next.js + Prisma + SQLite stack
// with Whop API integration at different member counts.

const BASELINE_LATENCY: Record<LoadProfileSize, LatencyDistribution> = {
  small: { p50: 45, p95: 120, p99: 280, max: 450 },
  medium: { p50: 85, p95: 320, p99: 780, max: 1200 },
  max:   { p50: 120, p95: 450, p99: 1200, max: 2800 },
};

const BASELINE_DB: Record<LoadProfileSize, DbMetrics> = {
  small: {
    connectionUsage: 0.12,
    activeConnections: 6,
    maxConnections: 50,
    queryLatency: { p50: 2, p95: 8, p99: 18, max: 35 },
    slowQueryCount: 0,
  },
  medium: {
    connectionUsage: 0.28,
    activeConnections: 14,
    maxConnections: 50,
    queryLatency: { p50: 4, p95: 15, p99: 35, max: 80 },
    slowQueryCount: 2,
  },
  max: {
    connectionUsage: 0.52,
    activeConnections: 26,
    maxConnections: 50,
    queryLatency: { p50: 6, p95: 22, p99: 55, max: 120 },
    slowQueryCount: 5,
  },
};

const BASELINE_QUEUE: Record<LoadProfileSize, QueueMetrics> = {
  small: {
    depth: 3,
    pendingJobs: 2,
    activeJobs: 1,
    completedJobs: 47,
    failedJobs: 0,
    retryCount: 0,
    maxRetriesExceeded: 0,
  },
  medium: {
    depth: 15,
    pendingJobs: 8,
    activeJobs: 7,
    completedJobs: 185,
    failedJobs: 1,
    retryCount: 2,
    maxRetriesExceeded: 0,
  },
  max: {
    depth: 45,
    pendingJobs: 20,
    activeJobs: 25,
    completedJobs: 455,
    failedJobs: 3,
    retryCount: 5,
    maxRetriesExceeded: 0,
  },
};

const BASELINE_EVENTS: Record<LoadProfileSize, EventMetrics> = {
  small: {
    eventsPerSecond: 25,
    totalEvents: 1250,
    droppedEvents: 0,
    duplicateEvents: 0,
  },
  medium: {
    eventsPerSecond: 65,
    totalEvents: 5000,
    droppedEvents: 0,
    duplicateEvents: 1,
  },
  max: {
    eventsPerSecond: 120,
    totalEvents: 12500,
    droppedEvents: 2,
    duplicateEvents: 3,
  },
};

const BASELINE_MEMORY: Record<LoadProfileSize, MemoryMetrics> = {
  small:  { heapUsedMb: 48, heapTotalMb: 64, rssMb: 72, externalMb: 8 },
  medium: { heapUsedMb: 96, heapTotalMb: 128, rssMb: 144, externalMb: 12 },
  max:    { heapUsedMb: 168, heapTotalMb: 256, rssMb: 288, externalMb: 18 },
};

const BASELINE_VERCEL: Record<LoadProfileSize, VercelFunctionMetrics> = {
  small: {
    coldStarts: 2,
    warmInvocations: 48,
    avgColdStartMs: 420,
    functionDurationMs: { p50: 35, p95: 95, p99: 180, max: 300 },
    concurrentInstances: 1,
    maxConcurrentInstances: 3,
  },
  medium: {
    coldStarts: 5,
    warmInvocations: 195,
    avgColdStartMs: 580,
    functionDurationMs: { p50: 55, p95: 180, p99: 380, max: 600 },
    concurrentInstances: 3,
    maxConcurrentInstances: 8,
  },
  max: {
    coldStarts: 12,
    warmInvocations: 488,
    avgColdStartMs: 720,
    functionDurationMs: { p50: 75, p95: 280, p99: 650, max: 1200 },
    concurrentInstances: 6,
    maxConcurrentInstances: 15,
  },
};

const BASELINE_WHOP: Record<LoadProfileSize, WhopRateLimitMetrics> = {
  small: {
    totalRequests: 300,
    rateLimited429: 0,
    rateLimitRate: 0,
    backoffApplied: 0,
    avgBackoffMs: 0,
  },
  medium: {
    totalRequests: 1200,
    rateLimited429: 2,
    rateLimitRate: 0.002,
    backoffApplied: 2,
    avgBackoffMs: 800,
  },
  max: {
    totalRequests: 3000,
    rateLimited429: 8,
    rateLimitRate: 0.003,
    backoffApplied: 8,
    avgBackoffMs: 1100,
  },
};

// ── Public API ───────────────────────────────────────────────

/** Get baseline metrics for a load profile (no chaos) */
export function getBaselineMetrics(size: LoadProfileSize): MetricSet {
  const profile = LOAD_PROFILES[size];
  return {
    latency: { ...BASELINE_LATENCY[size] },
    db: deepCloneDb(BASELINE_DB[size]),
    queue: { ...BASELINE_QUEUE[size] },
    events: { ...BASELINE_EVENTS[size] },
    memory: { ...BASELINE_MEMORY[size] },
    vercel: deepCloneVercel(BASELINE_VERCEL[size]),
    whopRateLimit: { ...BASELINE_WHOP[size] },
    timestamp: new Date().toISOString(),
  };
}

/** Get metrics for multi-tenant scenarios (scaled from max baseline) */
export function getMultiTenantMetrics(
  tenantCount: number,
  aggregateMembers: number
): MetricSet {
  // Scale from max baseline proportionally
  const scale = Math.max(1, aggregateMembers / 2500);
  const maxBaseline = getBaselineMetrics("max");

  return {
    latency: {
      p50: Math.round(maxBaseline.latency.p50 * Math.min(scale, 3) * 0.5 + maxBaseline.latency.p50 * 0.5),
      p95: Math.round(maxBaseline.latency.p95 * Math.min(scale, 3) * 0.4 + maxBaseline.latency.p95 * 0.6),
      p99: Math.round(maxBaseline.latency.p99 * Math.min(scale, 2.5) * 0.3 + maxBaseline.latency.p99 * 0.7),
      max: Math.round(maxBaseline.latency.max * Math.min(scale, 2)),
    },
    db: {
      connectionUsage: Math.min(0.95, maxBaseline.db.connectionUsage * Math.min(scale, 3) * 0.7),
      activeConnections: Math.min(45, Math.round(maxBaseline.db.activeConnections * Math.min(scale, 2) * 0.8)),
      maxConnections: 50,
      queryLatency: {
        p50: Math.round(maxBaseline.db.queryLatency.p50 * Math.min(scale, 2)),
        p95: Math.round(maxBaseline.db.queryLatency.p95 * Math.min(scale, 2)),
        p99: Math.round(maxBaseline.db.queryLatency.p99 * Math.min(scale, 2)),
        max: Math.round(maxBaseline.db.queryLatency.max * Math.min(scale, 2)),
      },
      slowQueryCount: Math.round(maxBaseline.db.slowQueryCount * Math.min(scale, 3)),
    },
    queue: {
      depth: Math.round(maxBaseline.queue.depth * Math.min(scale, 4) * 0.6),
      pendingJobs: Math.round(maxBaseline.queue.pendingJobs * Math.min(scale, 3)),
      activeJobs: Math.round(maxBaseline.queue.activeJobs * Math.min(scale, 3)),
      completedJobs: Math.round(maxBaseline.queue.completedJobs * scale),
      failedJobs: Math.round(maxBaseline.queue.failedJobs * Math.min(scale, 5)),
      retryCount: Math.round(maxBaseline.queue.retryCount * Math.min(scale, 4)),
      maxRetriesExceeded: Math.min(5, Math.round(maxBaseline.queue.maxRetriesExceeded * Math.min(scale, 3))),
    },
    events: {
      eventsPerSecond: Math.round(maxBaseline.events.eventsPerSecond * Math.min(scale, 8) * 0.5),
      totalEvents: Math.round(maxBaseline.events.totalEvents * scale),
      droppedEvents: Math.round(maxBaseline.events.droppedEvents * Math.min(scale, 10)),
      duplicateEvents: Math.round(maxBaseline.events.duplicateEvents * Math.min(scale, 8)),
    },
    memory: {
      heapUsedMb: Math.round(maxBaseline.memory.heapUsedMb * Math.min(scale, 3) * 0.6),
      heapTotalMb: Math.round(maxBaseline.memory.heapTotalMb * Math.min(scale, 2.5) * 0.5),
      rssMb: Math.round(maxBaseline.memory.rssMb * Math.min(scale, 2.5) * 0.5),
      externalMb: Math.round(maxBaseline.memory.externalMb * Math.min(scale, 2)),
    },
    vercel: {
      coldStarts: Math.round(maxBaseline.vercel.coldStarts * Math.min(scale, 5) * 0.5),
      warmInvocations: Math.round(maxBaseline.vercel.warmInvocations * scale),
      avgColdStartMs: Math.round(maxBaseline.vercel.avgColdStartMs * Math.min(scale, 2) * 0.7),
      functionDurationMs: {
        p50: Math.round(maxBaseline.vercel.functionDurationMs.p50 * Math.min(scale, 2)),
        p95: Math.round(maxBaseline.vercel.functionDurationMs.p95 * Math.min(scale, 1.8)),
        p99: Math.round(maxBaseline.vercel.functionDurationMs.p99 * Math.min(scale, 1.5)),
        max: Math.round(maxBaseline.vercel.functionDurationMs.max * Math.min(scale, 1.5)),
      },
      concurrentInstances: Math.round(maxBaseline.vercel.concurrentInstances * Math.min(scale, 5) * 0.4),
      maxConcurrentInstances: Math.round(maxBaseline.vercel.maxConcurrentInstances * Math.min(scale, 5) * 0.3),
    },
    whopRateLimit: {
      totalRequests: Math.round(maxBaseline.whopRateLimit.totalRequests * scale),
      rateLimited429: Math.round(maxBaseline.whopRateLimit.rateLimited429 * Math.min(scale, 10)),
      rateLimitRate: Math.min(0.1, maxBaseline.whopRateLimit.rateLimitRate * Math.min(scale, 5)),
      backoffApplied: Math.round(maxBaseline.whopRateLimit.backoffApplied * Math.min(scale, 8)),
      avgBackoffMs: Math.round(maxBaseline.whopRateLimit.avgBackoffMs * Math.min(scale, 3) * 0.5),
    },
    timestamp: new Date().toISOString(),
  };
}

/** Format latency value for display */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Format percentage for display */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format MB for display */
export function formatMb(mb: number): string {
  return `${mb}MB`;
}

/** Format rate per second */
export function formatRate(value: number): string {
  return `${value}/s`;
}

// ── Helpers ──────────────────────────────────────────────────

function deepCloneDb(db: DbMetrics): DbMetrics {
  return {
    ...db,
    queryLatency: { ...db.queryLatency },
  };
}

function deepCloneVercel(v: VercelFunctionMetrics): VercelFunctionMetrics {
  return {
    ...v,
    functionDurationMs: { ...v.functionDurationMs },
  };
}
