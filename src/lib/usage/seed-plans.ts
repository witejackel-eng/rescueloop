import "server-only";
// Plan seeder.
//
// Upserts the plan definitions from `./plans` into the `plans` table.
// Idempotent: safe to call repeatedly during migrations, deploy setup, or
// from an admin script. Each call writes the latest constant values back
// into the row so updating a limit in `plans.ts` and re-running `seedPlans`
// is enough to roll out the change.

import { db } from "@/lib/db";
import { PLANS } from "./plans";

export async function seedPlans(): Promise<void> {
  await db.$transaction(
    Object.values(PLANS).map((plan) =>
      db.plan.upsert({
        where: { tier: plan.tier },
        create: {
          tier: plan.tier,
          name: plan.name,
          maxMonitoredMembers: plan.maxMonitoredMembers,
          maxCourses: plan.maxCourses,
          maxCampaigns: plan.maxCampaigns,
          maxSeats: plan.maxSeats,
          maxCandidatesEvaluated: plan.maxCandidatesEvaluated,
          maxInterventionsCreated: plan.maxInterventionsCreated,
          maxNotificationsAccepted: plan.maxNotificationsAccepted,
          maxStoredEvents: plan.maxStoredEvents,
          maxExports: plan.maxExports,
          priceCents: plan.priceCents,
          currency: "USD",
        },
        update: {
          name: plan.name,
          maxMonitoredMembers: plan.maxMonitoredMembers,
          maxCourses: plan.maxCourses,
          maxCampaigns: plan.maxCampaigns,
          maxSeats: plan.maxSeats,
          maxCandidatesEvaluated: plan.maxCandidatesEvaluated,
          maxInterventionsCreated: plan.maxInterventionsCreated,
          maxNotificationsAccepted: plan.maxNotificationsAccepted,
          maxStoredEvents: plan.maxStoredEvents,
          maxExports: plan.maxExports,
          priceCents: plan.priceCents,
          currency: "USD",
        },
      }),
    ),
  );
}
