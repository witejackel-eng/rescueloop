// POST /api/companies/[companyId]/queue/[interventionId]/approve
//
// Approves an awaiting Activation Rescue intervention:
//  - sets state to "approved"
//  - records approvedById + approvedAt
//  - enqueues the durable delivery job (best-effort — Inngest may be absent)
//  - writes an audit log entry

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { inngest, EVENTS } from "@/server/jobs/client";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";

export async function POST(
  _req: NextRequest,
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

  // Load the intervention, scoped to the admin's organization
  const intervention = await db.intervention.findUnique({
    where: { id: interventionId },
    select: {
      id: true,
      organizationId: true,
      state: true,
      campaignId: true,
    },
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

  // Transition to approved
  const updated = await db.intervention.update({
    where: { id: interventionId },
    data: {
      state: "approved",
      approvedById: ctx.internalUserId,
      approvedAt: new Date(),
    },
  });

  // Audit trail
  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "approved",
    objectType: "intervention",
    objectId: interventionId,
    interventionId,
    previousState: intervention.state,
    newState: "approved",
  });

  // Enqueue delivery (best-effort — do not fail the approval if Inngest is down)
  try {
    await inngest.send({
      name: EVENTS.deliverIntervention,
      data: { interventionId },
    });
  } catch (error) {
    console.error("[approve] Failed to enqueue delivery job", {
      interventionId,
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
  }

  return NextResponse.json({ ok: true, state: updated.state });
}
