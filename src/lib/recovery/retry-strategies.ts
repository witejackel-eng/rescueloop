// ─────────────────────────────────────────────────────────────
// PX04 – Retry Strategies
// Exponential backoff, jitter, and delay calculators
// ─────────────────────────────────────────────────────────────

/**
 * Calculate exponential backoff delay.
 * Formula: min(baseDelay * 2^attempt, maxDelay)
 */
export function exponentialBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, maxDelayMs);
}

/**
 * Calculate exponential backoff with full jitter.
 * Formula: random(0, min(baseDelay * 2^attempt, maxDelay))
 * Jitter prevents thundering-herd retries after a burst failure.
 */
export function exponentialBackoffWithJitter(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const ceiling = exponentialBackoff(attempt, baseDelayMs, maxDelayMs);
  return Math.floor(Math.random() * ceiling);
}

/**
 * Calculate decorrelated jitter delay.
 * More spread than full jitter, avoids clustering.
 * Formula: random(baseDelay, min(prevDelay * 3, maxDelay))
 */
export function decorrelatedJitter(
  prevDelayMs: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const ceiling = Math.min(prevDelayMs * 3, maxDelayMs);
  return baseDelayMs + Math.floor(Math.random() * (ceiling - baseDelayMs));
}

/**
 * Calculate constant delay with jitter (for simple retry-with-jitter).
 * Formula: random(baseDelay, maxDelay)
 */
export function constantWithJitter(
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  if (maxDelayMs <= baseDelayMs) return baseDelayMs;
  return baseDelayMs + Math.floor(Math.random() * (maxDelayMs - baseDelayMs));
}

/**
 * Determine whether a retry should be attempted based on
 * current attempt count and the maximum allowed retries.
 */
export function shouldRetry(attempt: number, maxRetries: number): boolean {
  return attempt < maxRetries;
}

/**
 * Compute the delay for the next retry based on the recovery action.
 */
export function computeRetryDelay(
  attempt: number,
  action: "exponential_backoff" | "retry_with_jitter" | "retry_and_dead_letter" | "reconnect_and_retry" | "flag_and_notify",
  baseDelayMs: number,
  maxDelayMs: number,
  prevDelayMs?: number,
): number {
  switch (action) {
    case "exponential_backoff":
      return exponentialBackoff(attempt, baseDelayMs, maxDelayMs);
    case "retry_with_jitter":
      return exponentialBackoffWithJitter(attempt, baseDelayMs, maxDelayMs);
    case "retry_and_dead_letter":
      return exponentialBackoffWithJitter(attempt, baseDelayMs, maxDelayMs);
    case "reconnect_and_retry":
      return prevDelayMs !== undefined
        ? decorrelatedJitter(prevDelayMs, baseDelayMs, maxDelayMs)
        : exponentialBackoff(attempt, baseDelayMs, maxDelayMs);
    case "flag_and_notify":
      return 0; // no retry for permission revoked
    default:
      return baseDelayMs;
  }
}

/**
 * Format a delay in milliseconds to a human-readable string.
 */
export function formatDelay(ms: number): string {
  if (ms === 0) return "immediate";
  if (ms < 1_000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}
