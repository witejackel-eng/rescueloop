import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const [
        orgCount,
        activeOrgs,
        pausedOrgs,
        syncFailures,
        outboxBacklog,
        deadLetters,
        pilotTotal,
        pilotNew,
        pilotReviewing,
        failedWebhooks,
      ] = await Promise.all([
        db.organization.count(),
        db.organization.count({ where: { status: "active" } }),
        db.organization.count({ where: { status: "paused" } }),
        db.outboxEvent.count({ where: { state: "failed" } }),
        db.outboxEvent.count({ where: { state: "pending" } }),
        db.deadLetterEvent.count(),
        db.pilotApplication.count(),
        db.pilotApplication.count({ where: { reviewStatus: "New" } }),
        db.pilotApplication.count({ where: { reviewStatus: "Reviewing" } }),
        db.webhookReceipt.count({ where: { status: "failed" } }),
      ]);

      return NextResponse.json({
        organizations: { total: orgCount, active: activeOrgs, paused: pausedOrgs },
        syncFailures,
        outboxBacklog,
        deadLetters,
        pilotApplications: { total: pilotTotal, new: pilotNew, reviewing: pilotReviewing },
        failedWebhooks,
      });
    } catch (err) {
      console.error("[internal/dashboard] DB error:", err);
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }
  });
}
