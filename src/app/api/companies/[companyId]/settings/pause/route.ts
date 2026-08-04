// POST /api/companies/[companyId]/settings/pause
//
// Toggles the organisation's isPaused flag. When paused, all delivery safety
// checks fail and no interventions are sent. Records an audit log entry.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";

const PauseSchema = z.object({
  paused: z.boolean(),
  reason: z.string().max(300).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    return authErrorToResponse(error);
  }

  let body: z.infer<typeof PauseSchema>;
  try {
    const json = await req.json();
    body = PauseSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { id: true, isPaused: true, status: true },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  if (org.isPaused === body.paused) {
    return NextResponse.json({
      ok: true,
      isPaused: org.isPaused,
      unchanged: true,
    });
  }

  const updated = await db.organization.update({
    where: { id: ctx.organizationId },
    data: { isPaused: body.paused },
  });

  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: body.paused ? "paused" : "resumed",
    objectType: "organization",
    objectId: ctx.organizationId,
    previousState: org.isPaused ? "paused" : "active",
    newState: updated.isPaused ? "paused" : "active",
    reason: body.reason,
  });

  return NextResponse.json({ ok: true, isPaused: updated.isPaused });
}
