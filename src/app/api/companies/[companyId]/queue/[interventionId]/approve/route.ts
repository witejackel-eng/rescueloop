// POST /api/companies/[companyId]/queue/[interventionId]/approve
//
// Approves an awaiting Activation Rescue intervention:
//  - performs a full send-time safety re-check first
//  - sets state to "approved"
//  - records approvedById + approvedAt
//  - enqueues the durable delivery job (best-effort — Inngest may be absent)
//  - writes an audit log entry
//
// If the safety re-check fails, returns 409 with the failed checks.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  checkRateLimitOrReject,
  getClientIp,
  RATE_LIMITS,
  RateLimiter,
} from "@/lib/rate-limit/rate-limiter";
import { getInngestClient, EVENTS } from "@/server/jobs/client";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import { performSafetyRecheck } from "@/lib/eligibility/safety-recheck";

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

  // Load the intervention, scoped to the admin's organization
  const intervention = await db.intervention.findUnique({
    where: { id: interventionId },
    select: {
      id: true,
      organizationId: true,
      state: true,
      campaignId: true,
      studentId: true,
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

  // ─── Send-time safety re-check ─────────────────────────────
  // Before allowing approval, verify that the conditions that made
  // the student eligible still hold. If any check fails, reject
  // the approval with 409 and the list of failed checks.
  const safetyResult = await performSafetyRecheck({
    interventionId: intervention.id,
    organizationId: intervention.organizationId,
    studentId: intervention.studentId,
    campaignId: intervention.campaignId,
  });

  if (!safetyResult.safe) {
    const failedChecks = safetyResult.checks.filter((c) => !c.passed);
    return NextResponse.json(
      {
        error: "Safety re-check failed — approval denied",
        failedChecks,
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
    await getInngestClient().send({
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
