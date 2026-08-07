import "server-only";
// Plan definitions for RescueLoop.
//
// These constants mirror the `Plan` Prisma model. The `seedPlans()` helper in
// `./seed-plans` upserts them into the database; the `enforcement.ts` module
// reads them at runtime to decide whether a metric is over limit.
//
// The `tier` literal of each entry MUST match a value of the `PlanTier` enum
// in `prisma/schema.prisma`. The enum values are: rescue, growth, scale,
// internal, pilot.

import type { PlanTier } from "@prisma/client";

export interface PlanDefinition {
  readonly tier: PlanTier;
  readonly name: string;
  readonly maxMonitoredMembers: number;
  readonly maxCourses: number;
  readonly maxCampaigns: number;
  readonly maxSeats: number;
  readonly maxCandidatesEvaluated: number;
  readonly maxInterventionsCreated: number;
  readonly maxNotificationsAccepted: number;
  readonly maxStoredEvents: number;
  readonly maxExports: number;
  readonly priceCents: number;
}

export const PLANS = {
  rescue: {
    tier: "rescue",
    name: "Rescue",
    maxMonitoredMembers: 250,
    maxCourses: 1,
    maxCampaigns: 3,
    maxSeats: 1,
    maxCandidatesEvaluated: 500,
    maxInterventionsCreated: 200,
    maxNotificationsAccepted: 200,
    maxStoredEvents: 50_000,
    maxExports: 5,
    priceCents: 2900,
  },
  growth: {
    tier: "growth",
    name: "Growth",
    maxMonitoredMembers: 1000,
    maxCourses: 10,
    maxCampaigns: 10,
    maxSeats: 5,
    maxCandidatesEvaluated: 5_000,
    maxInterventionsCreated: 2_000,
    maxNotificationsAccepted: 2_000,
    maxStoredEvents: 250_000,
    maxExports: 25,
    priceCents: 5900,
  },
  scale: {
    tier: "scale",
    name: "Scale",
    maxMonitoredMembers: 2500,
    maxCourses: 50,
    maxCampaigns: 50,
    maxSeats: 15,
    maxCandidatesEvaluated: 25_000,
    maxInterventionsCreated: 10_000,
    maxNotificationsAccepted: 10_000,
    maxStoredEvents: 1_000_000,
    maxExports: 100,
    priceCents: 11900,
  },
  internal: {
    tier: "internal",
    name: "Internal",
    maxMonitoredMembers: 100_000,
    maxCourses: 1_000,
    maxCampaigns: 1_000,
    maxSeats: 100,
    maxCandidatesEvaluated: 1_000_000,
    maxInterventionsCreated: 500_000,
    maxNotificationsAccepted: 500_000,
    maxStoredEvents: 50_000_000,
    maxExports: 10_000,
    priceCents: 0,
  },
  pilot: {
    tier: "pilot",
    name: "Pilot",
    maxMonitoredMembers: 500,
    maxCourses: 5,
    maxCampaigns: 5,
    maxSeats: 3,
    maxCandidatesEvaluated: 2_000,
    maxInterventionsCreated: 500,
    maxNotificationsAccepted: 500,
    maxStoredEvents: 100_000,
    maxExports: 10,
    priceCents: 0,
  },
} as const satisfies Record<PlanTier, PlanDefinition>;

export type PlanKey = keyof typeof PLANS;

// Metrics tracked by the usage metering service. All are now enforced
// (see `enforcement.ts`). Each metric maps to a limit field on PlanDefinition.
export type MetricKey =
  | "courses"
  | "monitored_members"
  | "active_campaigns"
  | "team_members"
  | "candidates_evaluated"
  | "interventions_created"
  | "notifications_accepted"
  | "stored_events"
  | "exports";
