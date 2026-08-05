// Inngest client for durable job processing.
//
// LAZY INITIALIZATION: the client is NOT constructed at module import
// time. Use getInngestClient() to construct it on first call.
//
// Inngest is chosen because:
// - Native Next.js integration via API route
// - Built-in retry with exponential backoff
// - Idempotency via event keys
// - Step functions for multi-step workflows
// - Serverless-friendly (no persistent workers needed)
// - Free tier sufficient for private pilot

import "server-only";
import { Inngest } from "inngest";
import { getInngestEnv, isInngestConfigured, ConfigurationError } from "@/lib/env/server";

// ─── Typed dispatch result ────────────────────────────────────
// Replaces the silent-void contract so the outbox can make
// truthful state transitions.

export type JobDispatchResult =
  | { state: "accepted"; externalEventId: string }
  | { state: "unconfigured"; retryable: false }
  | { state: "failed"; retryable: boolean; errorCode: string };

let cachedClient: Inngest | null = null;

/**
 * Get the Inngest client.
 *
 * Constructs on first call, then caches. Throws ConfigurationError
 * if Inngest is not configured — safe to expose in API responses.
 */
export function getInngestClient(): Inngest {
  if (cachedClient) return cachedClient;

  const env = getInngestEnv();

  cachedClient = new Inngest({
    id: "rescueloop",
    apiKey: env.INNGEST_EVENT_KEY,
  });

  return cachedClient;
}

/**
 * Check whether Inngest is configured.
 */
export function isInngestReady(): boolean {
  return isInngestConfigured();
}

/**
 * Send an event to Inngest. Returns a typed JobDispatchResult so callers
 * (especially the outbox) can make truthful state transitions.
 *
 * - "accepted"    → Inngest accepted the event (returns the Inngest event ID)
 * - "unconfigured" → Inngest env vars are missing; not retryable
 * - "failed"      → Inngest rejected or network error; retryable depends on error
 */
export async function sendInngestEvent(
  name: string,
  data: Record<string, unknown>,
): Promise<JobDispatchResult> {
  if (!isInngestConfigured()) {
    // Graceful degradation — the event is not sent, but we report it so the
    // outbox never falsely marks the event as dispatched.
    return { state: "unconfigured", retryable: false };
  }

  try {
    const client = getInngestClient();
    const result = await client.send({ name, data });
    // Inngest send() returns an array of { id: string } for each event
    const externalEventId =
      Array.isArray(result) && result.length > 0
        ? result[0].id
        : typeof result === "object" && result !== null && "id" in result
          ? (result as { id: string }).id
          : `inngest-${Date.now()}`;
    return { state: "accepted", externalEventId };
  } catch (error) {
    const errorCode =
      error instanceof Error ? error.message : String(error);

    // Network / rate-limit errors are retryable; auth / schema errors are not.
    const retryable = isRetryableError(error);

    return { state: "failed", retryable, errorCode };
  }
}

/**
 * Heuristic to decide if an Inngest send failure is worth retrying.
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return true; // unknown → assume retryable
  const msg = error.message.toLowerCase();
  // Non-retryable: auth, key, forbidden, schema, validation
  if (
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("invalid api key") ||
    msg.includes("schema") ||
    msg.includes("validation")
  ) {
    return false;
  }
  return true;
}

// Event names (these don't require initialization — safe to export at module level)
export const EVENTS = {
  webhookReceived: "whop/webhook.received",
  syncMemberships: "sync/memberships.requested",
  syncCourseProgress: "sync/course-progress.requested",
  detectEligibility: "detect/eligibility.requested",
  deliverIntervention: "deliver/intervention.requested",
  projectOutcome: "project/outcome.requested",
} as const;

export type { ConfigurationError } from "@/lib/env/server";
