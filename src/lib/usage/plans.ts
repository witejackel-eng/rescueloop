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
    priceCents: 2900,
  },
  growth: {
    tier: "growth",
    name: "Growth",
    maxMonitoredMembers: 1000,
    maxCourses: 10,
    maxCampaigns: 10,
    maxSeats: 5,
    priceCents: 5900,
  },
  scale: {
    tier: "scale",
    name: "Scale",
    maxMonitoredMembers: 2500,
    maxCourses: 50,
    maxCampaigns: 50,
    maxSeats: 15,
    priceCents: 11900,
  },
  internal: {
    tier: "internal",
    name: "Internal",
    maxMonitoredMembers: 100000,
    maxCourses: 1000,
    maxCampaigns: 1000,
    maxSeats: 100,
    priceCents: 0,
  },
  pilot: {
    tier: "pilot",
    name: "Pilot",
    maxMonitoredMembers: 500,
    maxCourses: 5,
    maxCampaigns: 5,
    maxSeats: 3,
    priceCents: 0,
  },
} as const satisfies Record<PlanTier, PlanDefinition>;

export type PlanKey = keyof typeof PLANS;

// Metrics tracked by the usage metering service. Only a subset are enforced
// (see `enforcement.ts`). The others are tracked for analytics / future
// billing tiers but do not block operations.
export type MetricKey =
  | "monitored_members"
  | "candidates_evaluated"
  | "interventions_created"
  | "notifications_accepted"
  | "stored_events"
  | "team_members"
  | "exports";
