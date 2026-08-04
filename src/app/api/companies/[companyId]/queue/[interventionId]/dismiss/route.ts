// POST /api/companies/[companyId]/queue/[interventionId]/dismiss
//
// Dismisses an awaiting intervention:
//  - sets state to "dismissed"
//  - writes an audit log entry

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";

const DismissSchema = z.object({
  reason: z.string().max(500).optional(),
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

  // Optional JSON body (reason)
  let reason: string | undefined;
  try {
    const json = await req.json();
    const parsed = DismissSchema.parse(json);
    reason = parsed.reason;
  } catch {
    // Body is optional — ignore parse failures
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

  const updated = await db.intervention.update({
    where: { id: interventionId },
    data: { state: "dismissed" },
  });

  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "dismissed",
    objectType: "intervention",
    objectId: interventionId,
    interventionId,
    previousState: intervention.state,
    newState: "dismissed",
    reason,
  });

  return NextResponse.json({ ok: true, state: updated.state });
}
