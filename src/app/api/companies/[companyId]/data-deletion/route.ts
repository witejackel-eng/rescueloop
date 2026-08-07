// POST /api/companies/[companyId]/data-deletion
//
// Request data deletion for the organisation.
// Creates a DataDeletionRequest and dispatches a durable job.
//
// Deletion stages: Requested → Verified → Scheduled → Processing → Completed/Failed/Cancelled

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import { sendInngestEvent } from "@/server/jobs/client";
import {
  checkRateLimitOrReject,
  RATE_LIMITS,
  RateLimiter,
} from "@/lib/rate-limit/rate-limiter";

const DeletionRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
  /** Confirmation string — must be the organisation name to prevent accidental deletion */
  confirmWithName: z.string().min(1),
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

  // ─── Rate limiting (5 req/min per org for plan mutations) ──
  const deletionRateLimitKey = RateLimiter.buildKey("plan-mutation", ctx.organizationId);
  const deletionRateLimitRejection = await checkRateLimitOrReject(
    deletionRateLimitKey,
    RATE_LIMITS.planMutation,
  );
  if (deletionRateLimitRejection) return deletionRateLimitRejection;

  let body: z.infer<typeof DeletionRequestSchema>;
  try {
    const json = await req.json();
    body = DeletionRequestSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Verify confirmation — user must type the exact organisation name
  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { name: true },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  if (body.confirmWithName !== org.name) {
    return NextResponse.json(
      { error: "Confirmation name does not match organization name" },
      { status: 422 },
    );
  }

  // Check for an existing in-progress deletion request
  const existing = await db.dataDeletionRequest.findFirst({
    where: {
      organizationId: ctx.organizationId,
      status: { in: ["requested", "verified", "scheduled", "processing"] },
    },
    orderBy: { requestedAt: "desc" },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: "A deletion request is already in progress",
        requestId: existing.id,
        status: existing.status,
      },
      { status: 409 },
    );
  }

  // Create the deletion request
  const deletionRequest = await db.dataDeletionRequest.create({
    data: {
      organizationId: ctx.organizationId,
      requestedById: ctx.internalUserId ?? ctx.whopUserId,
      reason: body.reason,
    },
  });

  // Dispatch durable job for deletion processing
  await sendInngestEvent("deletion/data.requested", {
    deletionRequestId: deletionRequest.id,
    organizationId: ctx.organizationId,
  });

  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "created",
    objectType: "data_deletion_request",
    objectId: deletionRequest.id,
    reason: body.reason,
  });

  return NextResponse.json(
    {
      ok: true,
      requestId: deletionRequest.id,
      status: deletionRequest.status,
      message:
        "Deletion request created. A grace period applies before processing begins. " +
        "You may cancel the request before it is scheduled.",
    },
    { status: 202 },
  );
}
