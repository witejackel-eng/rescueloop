import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";
import type { PlanTier } from "@prisma/client";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const counters = await db.usageCounter.findMany({
        select: {
          id: true,
          organizationId: true,
          metric: true,
          period: true,
          count: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      });

      // Enrich with org name, plan, and limit info
      const orgIds = [...new Set(counters.map((c) => c.organizationId))];
      const orgs = await db.organization.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, name: true, planTier: true },
      });
      const orgMap = new Map(orgs.map((o) => [o.id, o]));

      const plans = await db.plan.findMany({
        select: { tier: true, maxMonitoredMembers: true },
      });
      const planMap = new Map(plans.map((p) => [p.tier, p]));

      const result = counters.map((c) => {
        const org = orgMap.get(c.organizationId);
        const plan = planMap.get((org?.planTier ?? "rescue") as PlanTier);
        // Simple limit inference based on metric
        let limit: number | null = null;
        if (c.metric === "monitored_members" && plan) {
          limit = plan.maxMonitoredMembers;
        }

        return {
          id: c.id,
          organizationId: c.organizationId,
          organizationName: org?.name ?? "Unknown",
          planTier: org?.planTier ?? "rescue",
          metric: c.metric,
          period: c.period,
          count: c.count,
          limit,
          overriddenBy: null as string | null, // would come from SubscriptionEntitlement overrides
        };
      });

      return NextResponse.json(result);
    } catch (err) {
      console.error("[internal/usage] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { action, organizationId, newLimit, reason } = body;

      if (action !== "override" || !organizationId || newLimit == null || !reason) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      // Record the override in audit log
      await recordInternalAudit({
        actorId,
        action: "usage.override",
        objectType: "organization",
        objectId: organizationId,
        tenantScope: organizationId,
        newState: String(newLimit),
        reason,
      });

      // In a full implementation, this would update SubscriptionEntitlement
      // or a separate Override table. For now the audit log is the source of truth.
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[internal/usage] Error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
