// Inngest client for durable job processing.
// Inngest is chosen because:
// - Native Next.js integration via API route
// - Built-in retry with exponential backoff
// - Idempotency via event keys
// - Step functions for multi-step workflows
// - Serverless-friendly (no persistent workers needed)
// - Free tier sufficient for private pilot

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "rescueloop",
  apiKey: process.env.INNGEST_EVENT_KEY,
});

// Event names
export const EVENTS = {
  webhookReceived: "whop/webhook.received",
  syncMemberships: "sync/memberships.requested",
  syncCourseProgress: "sync/course-progress.requested",
  detectEligibility: "detect/eligibility.requested",
  deliverIntervention: "deliver/intervention.requested",
  projectOutcome: "project/outcome.requested",
} as const;
