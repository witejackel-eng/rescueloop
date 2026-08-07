// ─────────────────────────────────────────────────────────────
// PX04 – Rate Limiter
// Upstash-compatible abstraction for distributed rate limiting.
// In production, this delegates to a Redis/Upstash backend.
// In development/demo, uses an in-memory fallback.
// ─────────────────────────────────────────────────────────────

import type { RateLimiterConfig, RateLimitResult } from "@/lib/types/operations-internal";

// ── In-memory fallback (dev/demo only) ──────────────────────

interface Bucket {
  tokens: number;
  resetAt: number; // epoch ms
}

const inMemoryStore = new Map<string, Bucket>();

/**
 * Reset the in-memory store (for tests / demo).
 */
export function resetInMemoryStore(): void {
  inMemoryStore.clear();
}

// ── Upstash-compatible Redis interface ──────────────────────

/**
 * Minimal Redis interface compatible with Upstash REST API.
 * In production, you would inject the real Upstash client.
 */
export interface UpstashRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number; px?: number }): Promise<"OK" | null>;
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<number>;
}

let redisClient: UpstashRedis | null = null;

/**
 * Configure the Redis client for production rate limiting.
 * If not called, in-memory fallback is used (NOT suitable for multi-instance production).
 */
export function configureRateLimiterRedis(client: UpstashRedis): void {
  redisClient = client;
}

// ── Core rate limiter ───────────────────────────────────────

/**
 * Check a rate limit. Uses Upstash Redis if configured,
 * otherwise falls back to in-memory (single-instance only).
 *
 * This is a sliding-window counter implementation:
 * - Key = config.key
 * - Value = current count in the window
 * - TTL = window duration
 *
 * IMPORTANT: In production, you MUST configure Redis via
 * configureRateLimiterRedis() before any rate-limited
 * operations. The in-memory fallback does NOT coordinate
 * across multiple server instances.
 */
export async function checkRateLimit(config: RateLimiterConfig): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = new Date(now + config.windowMs).toISOString();

  if (redisClient) {
    return checkWithRedis(config, resetAt);
  }

  return checkInMemory(config, now, resetAt);
}

async function checkWithRedis(
  config: RateLimiterConfig,
  resetAt: string,
): Promise<RateLimitResult> {
  const client = redisClient!;
  const current = await client.get(config.key);

  if (current === null) {
    // Window doesn't exist yet — start fresh
    await client.set(config.key, "1", { px: config.windowMs });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  const count = parseInt(current, 10);

  if (count >= config.limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterMs: config.windowMs,
    };
  }

  // Increment and allow
  const newCount = await client.incr(config.key);
  return {
    allowed: newCount <= config.limit,
    remaining: Math.max(0, config.limit - newCount),
    resetAt,
  };
}

function checkInMemory(
  config: RateLimiterConfig,
  now: number,
  resetAt: string,
): RateLimitResult {
  let bucket = inMemoryStore.get(config.key);

  // Reset bucket if window expired
  if (bucket && bucket.resetAt <= now) {
    bucket = undefined;
  }

  if (!bucket) {
    bucket = { tokens: 0, resetAt: now + config.windowMs };
    inMemoryStore.set(config.key, bucket);
  }

  if (bucket.tokens >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterMs: bucket.resetAt - now,
    };
  }

  bucket.tokens += 1;
  return {
    allowed: true,
    remaining: config.limit - bucket.tokens,
    resetAt,
  };
}

// ── Predefined rate limit configs for safety-sensitive ops ──

export const RATE_LIMITS = {
  /** Operator actions — max 30/min per operator */
  operatorAction: (operatorId: string): RateLimiterConfig => ({
    key: `rl:op_action:${operatorId}`,
    limit: 30,
    windowMs: 60_000,
  }),

  /** Webhook delivery — max 100/min per org */
  webhookDelivery: (orgId: string): RateLimiterConfig => ({
    key: `rl:webhook:${orgId}`,
    limit: 100,
    windowMs: 60_000,
  }),

  /** API sync — max 10/min per org */
  apiSync: (orgId: string): RateLimiterConfig => ({
    key: `rl:sync:${orgId}`,
    limit: 10,
    windowMs: 60_000,
  }),

  /** Diagnostic export — max 5/hour per operator */
  diagnosticExport: (operatorId: string): RateLimiterConfig => ({
    key: `rl:diag_export:${operatorId}`,
    limit: 5,
    windowMs: 3_600_000,
  }),
} as const;
