// PostHog analytics — only active when NEXT_PUBLIC_POSTHOG_KEY is configured.
//
// IMPORTANT RULES:
//   - Only for non-sensitive creator-product events
//   - Do NOT send student free-text responses to analytics
//   - Do NOT send personal data (emails, names, tokens)
//   - All events are organization-scoped

import { getPublicEnv } from "@/lib/env/server";

let initialized = false;
let posthogClient: any = null;

interface PostHogEvent {
  event: string;
  organizationId: string;
  properties?: Record<string, unknown>;
}

// Allowed event names — explicit allowlist to prevent accidental PII leaks
const ALLOWED_EVENTS = new Set([
  // Creator / product events
  "organization.created",
  "organization.onboarding_completed",
  "organization.paused",
  "organization.resumed",
  "campaign.created",
  "campaign.activated",
  "campaign.paused",
  "campaign.archived",
  "intervention.approved",
  "intervention.delivered",
  "intervention.dismissed",
  "intervention.suppressed",
  "sync.completed",
  "sync.failed",
  "export.requested",
  "export.completed",
  "deletion.requested",
  "deletion.completed",
  // Usage events (no PII)
  "plan.enforcement_triggered",
  "plan.limit_reached",
  "plan.upgraded",
  // Pilot events
  "pilot.application_submitted",
  "pilot.application_reviewed",
  "pilot.application_accepted",
]) as Set<string>;

/**
 * Initialize PostHog if NEXT_PUBLIC_POSTHOG_KEY is configured.
 * Safe to call multiple times — will only initialize once.
 */
export function initPostHog(): void {
  if (initialized) return;

  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) return;

  // Dynamic import to avoid bundling PostHog when not configured
  try {
    // PostHog server-side usage via posthog-node would go here.
    // For now, we use the browser SDK pattern with server-side capture.
    initialized = true;
  } catch {
    // PostHog not available — graceful degradation
  }
}

/**
 * Track a safe analytics event.
 * Only events in the explicit allowlist are sent.
 * Student free-text responses are NEVER included.
 */
export function trackEvent(params: PostHogEvent): void {
  if (!initialized) return;

  // Enforce allowlist
  if (!ALLOWED_EVENTS.has(params.event)) {
    return;
  }

  // Sanitize properties — remove any potential PII
  const safeProperties = sanitizeProperties(params.properties ?? {});

  try {
    // In production, this would call posthog.capture()
    // posthogClient?.capture({
    //   distinctId: params.organizationId,
    //   event: params.event,
    //   properties: {
    //     organizationId: params.organizationId,
    //     ...safeProperties,
    //   },
    // });
  } catch {
    // Never let analytics failures affect application behavior
  }
}

/**
 * Identify an organization in PostHog for cohort analysis.
 * Only sets non-sensitive properties.
 */
export function identifyOrganization(params: {
  organizationId: string;
  planTier: string;
  memberCount: number;
  courseCount: number;
  campaignCount: number;
}): void {
  if (!initialized) return;

  try {
    // In production:
    // posthogClient?.identify({
    //   distinctId: params.organizationId,
    //   properties: {
    //     planTier: params.planTier,
    //     memberCount: params.memberCount,
    //     courseCount: params.courseCount,
    //     campaignCount: params.campaignCount,
    //   },
    // });
    void params; // Suppress unused warning
  } catch {
    // Never let analytics failures affect application behavior
  }
}

/**
 * Sanitize event properties by removing potentially sensitive fields.
 */
function sanitizeProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const FORBIDDEN_KEYS = new Set([
    "email",
    "name",
    "token",
    "tokenHash",
    "secret",
    "password",
    "note",
    "messageContent",
    "messagePreview",
    "messageEdited",
    "payloadJson",
    "whopUserId",
    "ipAddress",
    "userAgent",
  ]);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (typeof value === "string" && value.length > 200) {
      // Truncate suspiciously long string values
      result[key] = value.substring(0, 200) + "...[truncated]";
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Shutdown PostHog client gracefully.
 */
export async function shutdownPostHog(): Promise<void> {
  if (!initialized || !posthogClient) return;
  try {
    // posthogClient?.shutdown();
  } catch {
    // Best effort
  }
}
