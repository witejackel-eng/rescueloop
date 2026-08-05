// POST /api/experiences/[experienceId]/rescue/[token]/respond
//
// Records a student's response to an Activation Rescue intervention.
// Uses the opaque student access token (NOT the companyId admin auth) — the
// token carries the interventionId + studentId + organizationId.
//
// For each response type:
//  - continue_course  → outcomeState "responded"
//  - stuck            → outcomeState "responded" + blockerType recorded
//                       (also creates a BlockerResponse row for analytics)
//  - remind_later     → outcomeState "reminded_later" + ReminderRequest row
//  - already_completed→ outcomeState "already_completed"
//  - human_help       → outcomeState "requested_help" (high priority flag)
//  - stop_reminders   → outcomeState "opted_out" + Suppression + revoke tokens
//
// Always writes an audit log entry. Sets intervention.state = "responded"
// (or "stopped" for stop_reminders).

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { revokeStudentTokens } from "@/lib/crypto/student-access-tokens";
import {
  requireStudentInterventionAccess,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import {
  checkRateLimitOrReject,
  RATE_LIMITS,
  RateLimiter,
} from "@/lib/rate-limit/rate-limiter";

const RespondSchema = z.object({
  responseType: z.enum([
    "continue_course",
    "stuck",
    "remind_later",
    "already_completed",
    "human_help",
    "stop_reminders",
  ]),
  blockerType: z
    .enum([
      "lack_of_time",
      "material_difficult",
      "unsure_next_step",
      "expected_something_different",
      "technical_problem",
      "needs_creator_help",
    ])
    .optional(),
  remindInHours: z.number().int().min(1).max(168).optional(), // up to 7 days
  note: z.string().max(2000).optional(),
});

// Map response type → intervention outcomeState
const OUTCOME_MAP: Record<
  z.infer<typeof RespondSchema>["responseType"],
  // OutcomeState enum values
  | "responded"
  | "reminded_later"
  | "requested_help"
  | "opted_out"
  | "already_completed"
> = {
  continue_course: "responded",
  stuck: "responded",
  remind_later: "reminded_later",
  already_completed: "already_completed",
  human_help: "requested_help",
  stop_reminders: "opted_out",
};

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ experienceId: string; token: string }>;
  },
) {
  const { token } = await params;

  // ─── Rate limiting (10 req/min per token hash) ──────────────
  // We hash the token before using it as a rate-limit key.
  // Raw student tokens are NEVER used in Redis keys.
  const tokenHashForRateLimit = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  ).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  );
  const rateLimitKey = RateLimiter.buildKey("student-response", tokenHashForRateLimit);
  const rateLimitRejection = await checkRateLimitOrReject(
    rateLimitKey,
    RATE_LIMITS.studentResponse,
  );
  if (rateLimitRejection) return rateLimitRejection;

  let access;
  try {
    access = await requireStudentInterventionAccess(token);
  } catch (error) {
    return authErrorToResponse(error);
  }

  // Parse + validate the body
  let body: z.infer<typeof RespondSchema>;
  try {
    const json = await req.json();
    body = RespondSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Cross-field validation
  if (body.responseType === "stuck" && !body.blockerType) {
    return NextResponse.json(
      { error: "blockerType is required for a stuck response" },
      { status: 422 },
    );
  }

  // Load the intervention
  const intervention = await db.intervention.findUnique({
    where: { id: access.interventionId },
    select: {
      id: true,
      organizationId: true,
      studentId: true,
      state: true,
      outcomeState: true,
      campaignId: true,
      priority: true,
    },
  });

  if (!intervention) {
    return NextResponse.json(
      { error: "Intervention not found" },
      { status: 404 },
    );
  }

  // Capture request metadata
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const outcomeState = OUTCOME_MAP[body.responseType];
  const isStopReminders = body.responseType === "stop_reminders";
  const isHumanHelp = body.responseType === "human_help";

  // Run all mutations in a transaction so the response + state change are atomic
  const result = await db.$transaction(async (tx) => {
    // 1. Record the StudentResponse
    const response = await tx.studentResponse.create({
      data: {
        interventionId: intervention.id,
        studentId: intervention.studentId,
        responseType: body.responseType,
        blockerType: body.blockerType ?? null,
        note: body.note ?? null,
        accessTokenId: access.tokenId,
        ipAddress,
        userAgent,
      },
    });

    // 2. For "stuck" — also create a BlockerResponse row (analytics)
    if (body.responseType === "stuck" && body.blockerType) {
      await tx.blockerResponse.create({
        data: {
          organizationId: intervention.organizationId,
          studentId: intervention.studentId,
          blocker: body.blockerType,
          note: body.note ?? null,
          interventionId: intervention.id,
        },
      });
    }

    // 3. For "remind_later" — create a ReminderRequest row
    if (body.responseType === "remind_later") {
      const hours = body.remindInHours ?? 24;
      await tx.reminderRequest.create({
        data: {
          interventionId: intervention.id,
          studentId: intervention.studentId,
          reminderTime: new Date(Date.now() + hours * 60 * 60 * 1000),
        },
      });
    }

    // 4. For "stop_reminders" — create a Suppression (organization scope)
    if (isStopReminders) {
      await tx.suppression.upsert({
        where: {
          organizationId_studentId_scope: {
            organizationId: intervention.organizationId,
            studentId: intervention.studentId,
            scope: "organization",
          },
        },
        create: {
          organizationId: intervention.organizationId,
          studentId: intervention.studentId,
          scope: "organization",
          reason: "student_opt_out",
          interventionId: intervention.id,
        },
        update: {
          reason: "student_opt_out",
          interventionId: intervention.id,
        },
      });
    }

    // 5. Update the intervention outcome + (for stop_reminders) the state.
    // "responded" is an OutcomeState, not an InterventionState — so for
    // non-opt-out responses we leave the intervention state at its current
    // delivery state (notification_accepted / delivered) — only update
    // outcomeState. For stop_reminders we move to "stopped".
    const updated = await tx.intervention.update({
      where: { id: intervention.id },
      data: {
        ...(isStopReminders ? { state: "stopped" as const } : {}),
        outcomeState,
        respondedAt: new Date(),
        // Human-help responses are high priority
        priority: isHumanHelp ? "urgent" : intervention.priority,
      },
    });

    return { response, updated };
  });

  // 6. For stop_reminders — revoke all pending student tokens (outside tx)
  let revokedTokens = 0;
  if (isStopReminders) {
    revokedTokens = await revokeStudentTokens({
      organizationId: intervention.organizationId,
      studentId: intervention.studentId,
    });
  }

  // 7. Audit log
  await recordAuditEvent({
    organizationId: intervention.organizationId,
    actorId: intervention.studentId,
    action: isStopReminders ? "opted_out" : "responded",
    objectType: "intervention",
    objectId: intervention.id,
    interventionId: intervention.id,
    previousState: intervention.state,
    newState: result.updated.state,
    reason: `Student response: ${body.responseType}`,
    metadata: {
      responseId: result.response.id,
      responseType: body.responseType,
      blockerType: body.blockerType ?? null,
      outcomeState,
      remindInHours: body.remindInHours ?? null,
      revokedTokens,
      humanHelp: isHumanHelp,
    },
  });

  return NextResponse.json({
    ok: true,
    responseType: body.responseType,
    outcomeState,
    interventionState: result.updated.state,
    revokedTokens,
  });
}
