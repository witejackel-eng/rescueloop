import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/auth/internal-route-helpers";
import { recordInternalAudit } from "@/lib/auth/internal-audit";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  return withInternalAuth(request, async () => {
    try {
      const jobs = await db.jobExecution.findMany({
        where: { status: { in: ["pending", "running", "failed"] } },
        select: {
          id: true,
          organizationId: true,
          jobType: true,
          status: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json(
        jobs.map((j) => ({
          ...j,
          startedAt: j.startedAt?.toISOString() ?? null,
          completedAt: j.completedAt?.toISOString() ?? null,
          createdAt: j.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      console.error("[internal/jobs] DB error:", err);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withInternalAuth(request, async ({ actorId }) => {
    try {
      const body = await request.json();
      const { action, id, reason } = body;

      if (action !== "retry" || !id || !reason) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      const job = await db.jobExecution.findUnique({ where: { id } });
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const previousState = job.status;

      await db.jobExecution.update({
        where: { id },
        data: { status: "pending", errorMessage: null },
      });

      await recordInternalAudit({
        actorId,
        action: "jobs.retry",
        objectType: "job_execution",
        objectId: id,
        tenantScope: job.organizationId,
        previousState,
        newState: "pending",
        reason,
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[internal/jobs] Error:", err);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
  });
}
