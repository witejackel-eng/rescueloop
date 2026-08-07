// Redis-backed rate limiting abstraction.
//
// Uses @upstash/ratelimit + @upstash/redis for production.
// Falls back to an in-memory adapter for tests.
//
// Rate-limit keys use appropriate combinations of:
//   IP, Organisation, User, Student token hash, Route/action
//
// IMPORTANT: Raw student tokens are NEVER used in Redis keys.
//   Only the SHA-256 token hash is used.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isUpstashConfigured, getUpstashEnv } from "@/lib/env/server";

// ─── Rate limit configurations ──────────────────────────────

export interface RateLimitConfig {
  /** Unique identifier for this rate limit */
  id: string;
  /** Maximum number of requests in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export const RATE_LIMITS = {
  /** Pilot applications — 10 req/min per IP */
  pilotApplication: { id: "pilot-app", limit: 10, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Manual sync — 5 req/min per org */
  manualSync: { id: "manual-sync", limit: 5, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Auth-sensitive routes — 20 req/min per IP */
  authSensitive: { id: "auth-sensitive", limit: 20, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Student token access — 30 req/min per token hash */
  studentTokenAccess: { id: "student-token", limit: 30, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Student responses — 10 req/min per token hash */
  studentResponse: { id: "student-response", limit: 10, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Data exports — 3 req/min per org */
  dataExport: { id: "data-export", limit: 3, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Internal retry actions — 20 req/min per IP */
  internalRetry: { id: "internal-retry", limit: 20, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Plan mutations — 5 req/min per org */
  planMutation: { id: "plan-mutation", limit: 5, windowSeconds: 60 } satisfies RateLimitConfig,
} as const;

// ─── Abstract RateLimiter ───────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

export abstract class RateLimiter {
  /**
   * Check if a request is within rate limits.
   * Returns success=true if the request is allowed.
   */
  abstract check(key: string, config: RateLimitConfig): Promise<RateLimitResult>;

  /**
   * Build a rate-limit key from components.
   * Components are joined with ":" — never includes raw tokens.
   */
  static buildKey(...components: string[]): string {
    return components.join(":");
  }
}

// ─── Upstash Redis adapter ──────────────────────────────────

let cachedRedis: Redis | null = null;
const ratelimitInstances = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (cachedRedis) return cachedRedis;

  if (!isUpstashConfigured()) return null;

  const env = getUpstashEnv();
  cachedRedis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return cachedRedis;
}

function getRatelimit(config: RateLimitConfig): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${config.id}:${config.limit}:${config.windowSeconds}`;
  let instance = ratelimitInstances.get(cacheKey);
  if (instance) return instance;

  instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
    prefix: `rescueloop:rl:${config.id}`,
  });

  ratelimitInstances.set(cacheKey, instance);
  return instance;
}

export class UpstashRateLimiter extends RateLimiter {
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const ratelimit = getRatelimit(config);

    if (!ratelimit) {
      // Redis not configured — allow all requests (fail open)
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit,
        reset: new Date(Date.now() + config.windowSeconds * 1000),
      };
    }

    const result = await ratelimit.limit(key);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  }
}

// ─── In-memory test adapter ─────────────────────────────────

interface MemoryBucket {
  tokens: number;
  resetAt: number;
}

export class InMemoryRateLimiter extends RateLimiter {
  private buckets = new Map<string, MemoryBucket>();

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const bucketKey = `${config.id}:${key}`;

    let bucket = this.buckets.get(bucketKey);

    // Reset bucket if window has expired
    if (!bucket || now >= bucket.resetAt) {
      bucket = {
        tokens: config.limit,
        resetAt: now + windowMs,
      };
      this.buckets.set(bucketKey, bucket);
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return {
        success: true,
        limit: config.limit,
        remaining: bucket.tokens,
        reset: new Date(bucket.resetAt),
      };
    }

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: new Date(bucket.resetAt),
    };
  }

  /** Reset all buckets — useful between tests */
  reset(): void {
    this.buckets.clear();
  }
}

// ─── Singleton accessor ─────────────────────────────────────

let globalLimiter: RateLimiter | null = null;

/**
 * Get the application rate limiter.
 * Uses Upstash in production, in-memory in test/dev if Redis is not configured.
 */
export function getRateLimiter(): RateLimiter {
  if (globalLimiter) return globalLimiter;

  if (isUpstashConfigured()) {
    globalLimiter = new UpstashRateLimiter();
  } else {
    globalLimiter = new InMemoryRateLimiter();
  }

  return globalLimiter;
}

/**
 * Set a custom rate limiter — useful for testing.
 */
export function setRateLimiter(limiter: RateLimiter): void {
  globalLimiter = limiter;
}

// ─── Convenience helpers ────────────────────────────────────

/**
 * Check rate limit and return a Next.js-compatible Response if limited.
 * Returns null if the request is allowed.
 */
export async function checkRateLimitOrReject(
  key: string,
  config: RateLimitConfig,
): Promise<Response | null> {
  const limiter = getRateLimiter();
  const result = await limiter.check(key, config);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
        },
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
          "x-ratelimit-limit": result.limit.toString(),
          "x-ratelimit-remaining": result.remaining.toString(),
          "x-ratelimit-reset": result.reset.toISOString(),
        },
      },
    );
  }

  return null;
}

/**
 * Extract a client IP from a Next.js request.
 * Checks X-Forwarded-For, X-Real-IP, then falls back to "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}
