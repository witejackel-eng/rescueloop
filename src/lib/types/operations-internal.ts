// ─────────────────────────────────────────────────────────────
// PX03 – Exception Operations internal types
// PX04 – Self-Healing diagnostic types
// ─────────────────────────────────────────────────────────────

// ── Exception categories ─────────────────────────────────────

export type ExceptionCategory =
  | "permission_failure"
  | "stalled_sync"
  | "dead_letter"
  | "billing_issue"
  | "webhook_lag"
  | "high_cost_tenant";

export type ExceptionSeverity = "low" | "medium" | "high" | "critical";

export type ExceptionStatus = "open" | "investigating" | "recovering" | "resolved" | "escalated";

export interface ExceptionSignal {
  id: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  orgId: string;
  orgName: string;
  title: string;
  description: string;
  occurredAt: string;
  lastSeenAt: string;
  count: number;
  recoverable: boolean;
  recoveryStrategy?: string;
  metadata: Record<string, string>;
}

// ── Exception dashboard summary ─────────────────────────────

export interface ExceptionSummary {
  healthyTenants: number;
  needingAction: number;
  permissionFailures: number;
  stalledSyncs: number;
  deadLetters: number;
  billingIssues: number;
  webhookLags: number;
  highCostTenants: number;
}

// ── Org 360 view ────────────────────────────────────────────

export type OrgHealthStatus = "healthy" | "degraded" | "critical";

export interface Org360 {
  orgId: string;
  orgName: string;
  healthStatus: OrgHealthStatus;
  memberCount: number;
  activeInterventions: number;
  recoveryRate: number;
  monthlySpend: number;
  signals: ExceptionSignal[];
  recentEvents: AuditEntry[];
}

// ── Audit log ───────────────────────────────────────────────

export type AuditAction =
  | "retry_operation"
  | "force_sync"
  | "resend_webhook"
  | "escalate"
  | "suppress"
  | "revoke_permission"
  | "grant_permission"
  | "update_billing"
  | "flag_high_cost"
  | "purge_dead_letter"
  | "run_diagnostics";

export type AuditResult = "success" | "failed" | "pending" | "idempotent_noop";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: string;
  targetOrgId: string;
  targetResourceId: string;
  result: AuditResult;
  details: string;
  idempotencyKey: string;
}

// ── Recovery matrix (PX04) ──────────────────────────────────

export type FailureType =
  | "whop_api_429"
  | "whop_api_5xx"
  | "webhook_timeout"
  | "db_connection_error"
  | "permission_revoked";

export type RecoveryAction =
  | "exponential_backoff"
  | "retry_with_jitter"
  | "retry_and_dead_letter"
  | "reconnect_and_retry"
  | "flag_and_notify";

export interface RecoveryRule {
  failureType: FailureType;
  recoveryAction: RecoveryAction;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  description: string;
}

// ── Diagnostics (PX04) ──────────────────────────────────────

export type DiagnosticSeverity = "info" | "warning" | "error" | "critical";

export interface DiagnosticEntry {
  id: string;
  errorId: string;
  timestamp: string;
  severity: DiagnosticSeverity;
  category: ExceptionCategory | "system" | "recovery";
  title: string;
  description: string;
  context: Record<string, string>; // no sensitive data
  recoverySuggestion: string;
  recoveryRule?: RecoveryRule;
  recoveryStatus: "none" | "in_progress" | "succeeded" | "failed" | "max_retries_exceeded";
  retryCount: number;
  maxRetries: number;
  lastRetryAt: string | null;
  nextRetryAt: string | null;
}

export interface DiagnosticBundle {
  exportedAt: string;
  environment: string;
  diagnostics: DiagnosticEntry[];
  recoveryMatrix: RecoveryRule[];
  summary: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

// ── Rate limiting ───────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfterMs?: number;
}

export interface RateLimiterConfig {
  key: string;
  limit: number;
  windowMs: number;
}

// ── Operator action payload ─────────────────────────────────

export interface OperatorAction {
  action: AuditAction;
  targetOrgId: string;
  targetResourceId: string;
  idempotencyKey: string;
  params?: Record<string, string>;
}
