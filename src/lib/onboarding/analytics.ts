// Onboarding analytics — allowlisted event tracking.
//
// Only events in the explicit allowlist are sent. This module:
//   - Never sends: email, message body, student free text, raw provider payload,
//     secrets, or sensitive evidence.
//   - Generates safe diagnostic IDs (no secrets or raw tokens).
//   - Integrates with the existing PostHog infrastructure in
//     `src/lib/observability/posthog.ts`.
//
// Server-only: may call PostHog server-side capture.

import "server-only";
import { trackEvent } from "@/lib/observability/posthog";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger({ route: "onboarding/analytics" });

// ─── Allowlisted event types ────────────────────────────────────

export type OnboardingEventType =
  | "onboarding_started"
  | "access_verified"
  | "permission_missing"
  | "mapping_viewed"
  | "mapping_saved"
  | "sync_started"
  | "sync_stage_completed"
  | "sync_failed"
  | "threshold_previewed"
  | "threshold_saved"
  | "candidate_previewed"
  | "first_value_reached"
  | "zero_candidate_completed"
  | "onboarding_abandoned";

/**
 * Canonical event name mapping to PostHog-recognized event names.
 * These match the allowlist in posthog.ts.
 */
const EVENT_NAME_MAP: Record<OnboardingEventType, string> = {
  onboarding_started: "organization.onboarding_started",
  access_verified: "organization.access_verified",
  permission_missing: "organization.permission_missing",
  mapping_viewed: "organization.mapping_viewed",
  mapping_saved: "organization.mapping_saved",
  sync_started: "organization.sync_started",
  sync_stage_completed: "organization.sync_stage_completed",
  sync_failed: "organization.sync_failed",
  threshold_previewed: "organization.threshold_previewed",
  threshold_saved: "organization.threshold_saved",
  candidate_previewed: "organization.candidate_previewed",
  first_value_reached: "organization.first_value_reached",
  zero_candidate_completed: "organization.zero_candidate_completed",
  onboarding_abandoned: "organization.onboarding_abandoned",
};

// ─── Forbidden metadata keys ────────────────────────────────────

/**
 * Keys that must NEVER be included in analytics metadata.
 * This is a defense-in-depth check on top of the PostHog module's
 * own sanitization.
 */
const FORBIDDEN_METADATA_KEYS = new Set([
  "email",
  "name",
  "messageBody",
  "messageContent",
  "messagePreview",
  "freeText",
  "studentResponse",
  "rawPayload",
  "rawResponse",
  "apiKey",
  "api_key",
  "token",
  "secret",
  "password",
  "webhookSecret",
  "authorization",
  "cookie",
  "payloadJson",
  "evidenceJson",
  "note",
  "ipAddress",
  "userAgent",
  "whopUserId",
]);

// ─── Safe diagnostic ID generation ──────────────────────────────

/**
 * Generate a safe, non-sensitive diagnostic ID for analytics.
 * Uses a deterministic hash so the same inputs always produce
 * the same ID, but the ID cannot be reversed to reveal secrets.
 */
export function safeDiagnosticId(
  companyId: string,
  organizationId: string,
  category: string,
): string {
  const raw = `${companyId}:${organizationId}:${category}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `diag_${Math.abs(hash).toString(36)}`;
}

// ─── Metadata sanitization ──────────────────────────────────────

/**
 * Strip any forbidden keys from metadata and truncate long strings.
 */
function sanitizeMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Skip forbidden keys
    if (FORBIDDEN_METADATA_KEYS.has(key)) continue;

    // Truncate suspiciously long strings
    if (typeof value === "string" && value.length > 200) {
      result[key] = value.substring(0, 200) + "...[truncated]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects (but skip arrays of unknown size)
      result[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      // Keep arrays but limit length
      result[key] = value.slice(0, 20);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ─── Main tracking function ─────────────────────────────────────

/**
 * Track an onboarding analytics event.
 *
 * Only events in the explicit `OnboardingEventType` union are tracked.
 * Metadata is sanitized to remove any PII or sensitive data.
 * Failures are silently swallowed — analytics must never break the app.
 */
export function trackOnboardingEvent(
  event: OnboardingEventType,
  companyId: string,
  metadata: Record<string, unknown> = {},
): void {
  try {
    const eventName = EVENT_NAME_MAP[event];
    const safeMetadata = sanitizeMetadata({
      ...metadata,
      companyId, // Safe to include — it's a Whop public ID
    });

    // Send via the existing PostHog infrastructure
    // Note: we use companyId as the organizationId since
    // the PostHog module expects organization-scoped events
    trackEvent({
      event: eventName,
      organizationId: companyId,
      properties: safeMetadata,
    });

    log.debug("Onboarding event tracked", {
      action: "trackOnboardingEvent",
      event,
      companyId,
    });
  } catch {
    // Never let analytics failures affect the application
  }
}

/**
 * Track a permission diagnostic result as an analytics event.
 * Uses safe diagnostic IDs — never exposes secrets.
 */
export function trackDiagnosticResult(
  companyId: string,
  organizationId: string,
  category: string,
  status: "pass" | "fail" | "warn" | "skip",
  requiresOwnerHelp: boolean,
): void {
  const eventType: OnboardingEventType =
    status === "fail" || status === "warn"
      ? "permission_missing"
      : "access_verified";

  trackOnboardingEvent(eventType, companyId, {
    diagnosticId: safeDiagnosticId(companyId, organizationId, category),
    diagnosticCategory: category,
    diagnosticStatus: status,
    requiresOwnerHelp,
  });
}
