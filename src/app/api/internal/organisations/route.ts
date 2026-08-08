import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const orgs = await db.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isPaused: true,
          planTier: true,
          createdAt: true,
          installations: { select: { status: true }, take: 1 },
          members: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = orgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        isPaused: org.isPaused,
        planTier: org.planTier,
        installationStatus: org.installations[0]?.status ?? null,
        memberCount: org.members.length,
        createdAt: org.createdAt.toISOString(),
      }));

      return NextResponse.json(result);
    } catch (err) {
      console.error("[internal/organisations] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { action, organizationId, reason } = body;

      if (!organizationId || !reason) {
        return NextResponse.json(
          { error: "organizationId and reason are required" },
          { status: 400 },
        );
      }

      if (action !== "pause" && action !== "resume") {
        return NextResponse.json(
          { error: "Action must be 'pause' or 'resume'" },
          { status: 400 },
        );
      }

      const org = await db.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org) {
        return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
      }

      const previousState = org.isPaused ? "paused" : "active";
      const newState = action === "pause" ? "paused" : "active";

      if ((action === "pause" && org.isPaused) || (action === "resume" && !org.isPaused)) {
        return NextResponse.json(
          { error: `Organisation is already ${newState}` },
          { status: 409 },
        );
      }

      await db.organization.update({
        where: { id: organizationId },
        data: {
          isPaused: action === "pause",
          status: action === "pause" ? "paused" : "active",
        },
      });

      await recordInternalAudit({
        actorId,
        action: `organisations.${action}`,
        objectType: "organization",
        objectId: organizationId,
        tenantScope: organizationId,
        previousState,
        newState,
        reason,
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[internal/organisations] Error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
