// PATCH /api/companies/[companyId]/queue/[interventionId]/edit
//
// Edits a draft or awaiting-approval intervention's message content.
// If the intervention was previously approved, the approval is
// invalidated and the state reverts to "awaiting_approval" —
// this ensures no unreviewed message changes reach students.
//
// Allowed states: drafted, awaiting_approval, approved
// Disallowed states: dismissed, stopped, scheduled, queued, etc.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  checkRateLimitOrReject,
  getClientIp,
  RATE_LIMITS,
  RateLimiter,
} from "@/lib/rate-limit/rate-limiter";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";

const EditSchema = z.object({
  messageContent: z.string().min(1).max(4000),
});

/** States where editing is allowed */
const EDITABLE_STATES = new Set(["drafted", "awaiting_approval", "approved"]);

export async function PATCH(
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

  // ─── Rate limiting (20 req/min per IP for auth-sensitive) ──
  const ip = getClientIp(req);
  const rateLimitKey = RateLimiter.buildKey("auth-sensitive", ip);
  const rateLimitRejection = await checkRateLimitOrReject(
    rateLimitKey,
    RATE_LIMITS.authSensitive,
  );
  if (rateLimitRejection) return rateLimitRejection;

  // ─── Parse request body ────────────────────────────────────
  let body: z.infer<typeof EditSchema>;
  try {
    const json = await req.json();
    body = EditSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ─── Load intervention ─────────────────────────────────────
  const intervention = await db.intervention.findUnique({
    where: { id: interventionId },
    select: {
      id: true,
      organizationId: true,
      state: true,
      messagePreview: true,
      messageEdited: true,
      approvedById: true,
      approvedAt: true,
    },
  });

  if (!intervention || intervention.organizationId !== ctx.organizationId) {
    return NextResponse.json(
      { error: "Intervention not found" },
      { status: 404 },
    );
  }

  // ─── State guard ───────────────────────────────────────────
  if (!EDITABLE_STATES.has(intervention.state)) {
    return NextResponse.json(
      {
        error: "Intervention cannot be edited in its current state",
        currentState: intervention.state,
        allowedStates: [...EDITABLE_STATES],
      },
      { status: 409 },
    );
  }

  // ─── Apply edit ────────────────────────────────────────────
  const wasApproved = intervention.state === "approved";

  const updated = await db.intervention.update({
    where: { id: interventionId },
    data: {
      messagePreview: body.messageContent,
      messageEdited: new Date().toISOString(),
      // Invalidate approval if the message was already approved
      ...(wasApproved
        ? {
            state: "awaiting_approval" as const,
            approvedById: null,
            approvedAt: null,
          }
        : {}),
    },
  });

  // ─── Audit trail ───────────────────────────────────────────
  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "updated",
    objectType: "intervention",
    objectId: interventionId,
    interventionId,
    previousState: intervention.state,
    newState: wasApproved ? "awaiting_approval" : intervention.state,
    reason: wasApproved
      ? "Message edited after approval — approval invalidated"
      : "Message edited",
    metadata: {
      fieldChanged: "messagePreview",
      approvalInvalidated: wasApproved,
      previousState: intervention.state,
    },
  });

  return NextResponse.json({
    ok: true,
    state: updated.state,
    messageEdited: updated.messageEdited,
    approvalInvalidated: wasApproved,
  });
}
