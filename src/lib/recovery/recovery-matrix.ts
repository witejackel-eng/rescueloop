// ─────────────────────────────────────────────────────────────
// PX04 – Recovery Matrix
// Defines how each failure type is handled in RescueLoop
// ─────────────────────────────────────────────────────────────

import type { FailureType, RecoveryAction, RecoveryRule } from "@/lib/types/operations-internal";

/**
 * The canonical retry/recovery matrix for RescueLoop.
 * Every failure type that can occur in the system maps to a
 * specific recovery action with bounded retry parameters.
 */
export const RECOVERY_MATRIX: Record<FailureType, RecoveryRule> = {
  whop_api_429: {
    failureType: "whop_api_429",
    recoveryAction: "exponential_backoff",
    maxRetries: 8,
    baseDelayMs: 1_000,
    maxDelayMs: 120_000,
    description:
      "Whop API rate limit (429). Apply exponential backoff starting at 1 s, capped at 2 min, up to 8 retries.",
  },
  whop_api_5xx: {
    failureType: "whop_api_5xx",
    recoveryAction: "retry_with_jitter",
    maxRetries: 5,
    baseDelayMs: 2_000,
    maxDelayMs: 60_000,
    description:
      "Whop API server error (5xx). Retry with full jitter between 2 s and 60 s, up to 5 retries.",
  },
  webhook_timeout: {
    failureType: "webhook_timeout",
    recoveryAction: "retry_and_dead_letter",
    maxRetries: 3,
    baseDelayMs: 5_000,
    maxDelayMs: 30_000,
    description:
      "Webhook delivery timed out. Retry up to 3 times with 5 s base delay; if all fail, move to dead-letter queue.",
  },
  db_connection_error: {
    failureType: "db_connection_error",
    recoveryAction: "reconnect_and_retry",
    maxRetries: 4,
    baseDelayMs: 500,
    maxDelayMs: 10_000,
    description:
      "Database connection lost. Reconnect with exponential backoff (500 ms base), then retry the operation up to 4 times.",
  },
  permission_revoked: {
    failureType: "permission_revoked",
    recoveryAction: "flag_and_notify",
    maxRetries: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    description:
      "OAuth permission revoked by creator. Flag the tenant, notify the creator, and halt automated operations until re-authorized.",
  },
};

/**
 * Resolve the recovery rule for a given failure type.
 * Returns undefined for unknown failure types.
 */
export function getRecoveryRule(failureType: FailureType): RecoveryRule | undefined {
  return RECOVERY_MATRIX[failureType];
}

/**
 * List all recovery rules (for display in diagnostics).
 */
export function getAllRecoveryRules(): RecoveryRule[] {
  return Object.values(RECOVERY_MATRIX);
}

/**
 * Map a failure type to its recovery action label for display.
 */
export const RECOVERY_ACTION_LABELS: Record<RecoveryAction, string> = {
  exponential_backoff: "Exponential Backoff",
  retry_with_jitter: "Retry with Jitter",
  retry_and_dead_letter: "Retry → Dead Letter",
  reconnect_and_retry: "Reconnect + Retry",
  flag_and_notify: "Flag & Notify",
};

/**
 * Human-readable failure type labels.
 */
export const FAILURE_TYPE_LABELS: Record<FailureType, string> = {
  whop_api_429: "Whop API Rate Limit (429)",
  whop_api_5xx: "Whop API Server Error (5xx)",
  webhook_timeout: "Webhook Timeout",
  db_connection_error: "DB Connection Error",
  permission_revoked: "Permission Revoked",
};
