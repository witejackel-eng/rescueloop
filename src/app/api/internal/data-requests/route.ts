import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const requests = await db.dataDeletionRequest.findMany({
        select: {
          id: true,
          organizationId: true,
          status: true,
          reason: true,
          requestedAt: true,
          completedAt: true,
          organization: { select: { name: true } },
        },
        orderBy: { requestedAt: "desc" },
        take: 100,
      });

      return NextResponse.json(
        requests.map((r) => ({
          id: r.id,
          organizationId: r.organizationId,
          organizationName: r.organization.name,
          status: r.status,
          reason: r.reason,
          requestedAt: r.requestedAt.toISOString(),
          completedAt: r.completedAt?.toISOString() ?? null,
        })),
      );
    } catch (err) {
      console.error("[internal/data-requests] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}
