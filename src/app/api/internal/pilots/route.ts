import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";

const VALID_TRANSITIONS: Record<string, string[]> = {
  New: ["Reviewing", "Rejected"],
  Reviewing: ["Qualified", "Rejected"],
  Qualified: ["Contacted", "Rejected"],
  Contacted: ["Accepted", "Rejected", "Withdrawn"],
  Accepted: [],
  Rejected: [],
  Withdrawn: [],
};

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const apps = await db.pilotApplication.findMany({
        select: {
          id: true,
          fullName: true,
          businessName: true,
          email: true,
          whopBusinessUrl: true,
          approximatePayingMembers: true,
          courses: true,
          typicalMembershipPrice: true,
          monthlyNewMembers: true,
          currentFollowUpProcess: true,
          primaryRetentionConcern: true,
          preferredPilotTiming: true,
          reviewStatus: true,
          reviewNotes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(
        apps.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      console.error("[internal/pilots] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { action, id, newStatus, reason } = body;

      if (action !== "transition" || !id || !newStatus || !reason) {
        return NextResponse.json({ error: "Invalid request: action, id, newStatus, and reason are required" }, { status: 400 });
      }

      const app = await db.pilotApplication.findUnique({ where: { id } });
      if (!app) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      const allowed = VALID_TRANSITIONS[app.reviewStatus] ?? [];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json(
          { error: `Invalid transition: ${app.reviewStatus} → ${newStatus}` },
          { status: 400 },
        );
      }

      const previousStatus = app.reviewStatus;

      await db.pilotApplication.update({
        where: { id },
        data: {
          reviewStatus: newStatus,
          reviewedAt: new Date(),
          reviewedBy: actorId,
          reviewNotes: reason,
        },
      });

      await recordInternalAudit({
        actorId,
        action: `pilot.transition.${newStatus.toLowerCase()}`,
        objectType: "pilot_application",
        objectId: id,
        previousState: previousStatus,
        newState: newStatus,
        reason,
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[internal/pilots] Error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
