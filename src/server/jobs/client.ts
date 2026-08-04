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
 * Send an event to Inngest. Returns silently if Inngest is not configured
 * (for graceful degradation in environments without job processing).
 */
export async function sendInngestEvent(name: string, data: Record<string, unknown>): Promise<void> {
  if (!isInngestConfigured()) {
    // Graceful degradation — the event is not sent, but no error is thrown.
    // This allows webhook ingestion to acknowledge even without a job provider.
    return;
  }
  const client = getInngestClient();
  await client.send({ name, data });
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
