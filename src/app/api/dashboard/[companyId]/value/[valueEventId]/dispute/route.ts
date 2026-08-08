// PATCH /api/dashboard/[companyId]/value/[valueEventId]/dispute
//
// Value Dispute API — allows creator to dispute, exclude, or restore value entries.
//
// Accepts: { action: "dispute" | "exclude" | "restore", reason: string }
// Updates ValueEvent excluded/disputed state.
// Audit event is created for every action.
// Attribution changes are versioned; historical results not silently rewritten.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import { recordAuditEvent } from "@/lib/audit";

const BodySchema = z.object({
  action: z.enum(["dispute", "exclude", "restore"]),
  reason: z.string().min(1).max(1000),
});

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ companyId: string; valueEventId: string }> },
) {
  const { companyId, valueEventId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    return authErrorToResponse(error);
  }

  // Parse body
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  // Verify the value event exists and belongs to this organization
  const existing = await db.valueEvent.findUnique({
    where: { id: valueEventId },
    select: {
      id: true,
      organizationId: true,
      event: true,
      attributionLevel: true,
      excluded: true,
      disputed: true,
      disputeReason: true,
      amountCents: true,
      policyVersion: true,
      disputedAt: true,
      excludedAt: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Value event not found" },
      { status: 404 },
    );
  }

  if (existing.organizationId !== ctx.organizationId) {
    return NextResponse.json(
      { error: "Value event does not belong to this organization" },
      { status: 403 },
    );
  }

  const now = new Date();

  // Apply the action
  let updated;
  switch (body.action) {
    case "dispute": {
      if (existing.disputed) {
        return NextResponse.json(
          { error: "Value event is already disputed" },
          { status: 409 },
        );
      }
      updated = await db.valueEvent.update({
        where: { id: valueEventId },
        data: {
          disputed: true,
          disputeReason: body.reason,
          disputedAt: now,
        },
      });
      break;
    }
    case "exclude": {
      if (existing.excluded) {
        return NextResponse.json(
          { error: "Value event is already excluded" },
          { status: 409 },
        );
      }
      updated = await db.valueEvent.update({
        where: { id: valueEventId },
        data: {
          excluded: true,
          excludedAt: now,
          // Also mark as disputed if not already
          disputed: existing.disputed || true,
          disputeReason: existing.disputeReason ?? body.reason,
          disputedAt: existing.disputedAt ?? now,
        },
      });
      break;
    }
    case "restore": {
      if (!existing.excluded && !existing.disputed) {
        return NextResponse.json(
          { error: "Value event is not disputed or excluded" },
          { status: 409 },
        );
      }
      updated = await db.valueEvent.update({
        where: { id: valueEventId },
        data: {
          excluded: false,
          disputed: false,
          disputeReason: null,
          disputedAt: null,
          excludedAt: null,
        },
      });
      break;
    }
  }

  // Create audit event
  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.whopUserId,
    action: "configuration_changed",
    objectType: "value_event",
    objectId: valueEventId,
    previousState: `excluded=${existing.excluded},disputed=${existing.disputed}`,
    newState: `excluded=${updated.excluded},disputed=${updated.disputed}`,
    reason: body.reason,
    metadata: {
      action: body.action,
      event: existing.event,
      attributionLevel: existing.attributionLevel,
      amountCents: existing.amountCents,
      policyVersion: existing.policyVersion,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: updated.id,
      excluded: updated.excluded,
      disputed: updated.disputed,
      disputeReason: updated.disputeReason,
      disputedAt: updated.disputedAt?.toISOString() ?? null,
      excludedAt: updated.excludedAt?.toISOString() ?? null,
    },
  });
}
