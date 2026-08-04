// POST /api/companies/[companyId]/queue/[interventionId]/schedule
//
// Schedules an intervention for a future delivery time:
//  - sets state to "scheduled" with scheduledFor
//  - writes an audit log entry

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";

const ScheduleSchema = z.object({
  scheduledFor: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ companyId: string; interventionId: string }>;
  },
) {
  const { companyId, interventionId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    return authErrorToResponse(error);
  }

  let body: z.infer<typeof ScheduleSchema>;
  try {
    const json = await req.json();
    body = ScheduleSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scheduledFor = new Date(body.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime())) {
    return NextResponse.json(
      { error: "Invalid scheduledFor date" },
      { status: 422 },
    );
  }

  if (scheduledFor <= new Date()) {
    return NextResponse.json(
      { error: "scheduledFor must be in the future" },
      { status: 422 },
    );
  }

  const intervention = await db.intervention.findUnique({
    where: { id: interventionId },
    select: { id: true, organizationId: true, state: true },
  });

  if (!intervention || intervention.organizationId !== ctx.organizationId) {
    return NextResponse.json(
      { error: "Intervention not found" },
      { status: 404 },
    );
  }

  if (intervention.state !== "awaiting_approval") {
    return NextResponse.json(
      {
        error: "Intervention is not awaiting approval",
        currentState: intervention.state,
      },
      { status: 409 },
    );
  }

  const updated = await db.intervention.update({
    where: { id: interventionId },
    data: {
      state: "scheduled",
      scheduledFor,
      approvedById: ctx.internalUserId,
      approvedAt: new Date(),
    },
  });

  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "scheduled",
    objectType: "intervention",
    objectId: interventionId,
    interventionId,
    previousState: intervention.state,
    newState: "scheduled",
    reason: `Scheduled for ${scheduledFor.toISOString()}`,
    metadata: { scheduledFor: scheduledFor.toISOString() },
  });

  return NextResponse.json({
    ok: true,
    state: updated.state,
    scheduledFor: updated.scheduledFor,
  });
}
