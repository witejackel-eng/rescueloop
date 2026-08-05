// POST /api/companies/[companyId]/queue/[interventionId]/suppress
//
// Creates an organization-scoped Suppression for the intervention's student
// (treats this as an admin-initiated opt-out). Future eligibility checks will
// skip this student. Writes an audit log entry.

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
import { revokeStudentTokens } from "@/lib/crypto/student-access-tokens";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";

const SuppressSchema = z.object({
  reason: z.string().max(200).optional().default("admin_initiated"),
  scope: z.enum(["organization", "course"]).optional().default("organization"),
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

  // ─── Rate limiting (20 req/min per IP for auth-sensitive) ──
  const ip = getClientIp(req);
  const rateLimitKey = RateLimiter.buildKey("auth-sensitive", ip);
  const rateLimitRejection = await checkRateLimitOrReject(
    rateLimitKey,
    RATE_LIMITS.authSensitive,
  );
  if (rateLimitRejection) return rateLimitRejection;

  let body: z.infer<typeof SuppressSchema>;
  try {
    const json = await req.json();
    body = SuppressSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intervention = await db.intervention.findUnique({
    where: { id: interventionId },
    select: { id: true, organizationId: true, studentId: true, state: true },
  });

  if (!intervention || intervention.organizationId !== ctx.organizationId) {
    return NextResponse.json(
      { error: "Intervention not found" },
      { status: 404 },
    );
  }

  // Upsert the suppression (unique on [organizationId, studentId, scope])
  const suppression = await db.suppression.upsert({
    where: {
      organizationId_studentId_scope: {
        organizationId: ctx.organizationId,
        studentId: intervention.studentId,
        scope: body.scope,
      },
    },
    create: {
      organizationId: ctx.organizationId,
      studentId: intervention.studentId,
      scope: body.scope,
      reason: body.reason,
      interventionId,
    },
    update: {
      reason: body.reason,
      interventionId,
    },
  });

  // Revoke any pending student access tokens for this student
  const revokedCount = await revokeStudentTokens({
    organizationId: ctx.organizationId,
    studentId: intervention.studentId,
  });

  // Stop the intervention if it was still pending
  if (
    intervention.state === "awaiting_approval" ||
    intervention.state === "approved" ||
    intervention.state === "scheduled"
  ) {
    await db.intervention.update({
      where: { id: interventionId },
      data: { state: "stopped" },
    });
  }

  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "suppressed",
    objectType: "student",
    objectId: intervention.studentId,
    interventionId,
    previousState: intervention.state,
    newState: "suppressed",
    reason: body.reason,
    metadata: {
      scope: body.scope,
      suppressionId: suppression.id,
      revokedTokens: revokedCount,
    },
  });

  return NextResponse.json({
    ok: true,
    suppressionId: suppression.id,
    revokedTokens: revokedCount,
  });
}
