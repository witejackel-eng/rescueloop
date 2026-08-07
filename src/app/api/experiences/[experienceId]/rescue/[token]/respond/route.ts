// POST /api/experiences/[experienceId]/rescue/[token]/respond
//
// Records a student's response to an Activation Rescue intervention.
// Uses the opaque student access token (NOT the companyId admin auth) — the
// token carries the interventionId + studentId + organizationId.
//
// WP05 enhancements:
// - Uses enhanced non-enumerating token validation via requireStudentInterventionAccess
// - validateAndConsumeToken marks the token as consumed on first use
// - stop_reminders → immediate Suppression + token revocation
// - stuck → requires blockerType
// - Updates intervention outcomeState based on response
// - Records audit event
// - Returns success with appropriate next-step info
// - Never logs raw token values

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { revokeStudentTokens, validateAndConsumeToken } from "@/lib/crypto/student-access-tokens";
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

// Next-step info returned to the student after response
const NEXT_STEP_MAP: Record<
  z.infer<typeof RespondSchema>["responseType"],
  { message: string; canContinueCourse: boolean }
> = {
  continue_course: {
    message: "Your spot is saved. The next lesson is ready whenever you are.",
    canContinueCourse: true,
  },
  stuck: {
    message: "We'll use this to send you the right help. You'll hear from us soon.",
    canContinueCourse: true,
  },
  remind_later: {
    message: "We'll send one gentle nudge at the time you chose. No pressure.",
    canContinueCourse: true,
  },
  already_completed: {
    message: "We've noted you've completed this. We won't send further reminders for it.",
    canContinueCourse: false,
  },
  human_help: {
    message: "Someone will reach out personally to help you move forward.",
    canContinueCourse: true,
  },
  stop_reminders: {
    message: "We won't send you any further messages about this course.",
    canContinueCourse: false,
  },
};

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ experienceId: string; token: string }>;
  },
) {
  const { token, experienceId } = await params;

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

  // ─── Token validation ───────────────────────────────────────
  // Use the enhanced auth flow that validates token, expiry, revocation,
  // tenant linkage, and suppression state.
  let access;
  try {
    access = await requireStudentInterventionAccess(token);
  } catch (error) {
    return authErrorToResponse(error);
  }

  // ─── Mark token as consumed (one-time response) ────────────
  // validateAndConsumeToken is idempotent — if already consumed, it
  // returns successfully with consumedJustNow = false.
  try {
    await validateAndConsumeToken(token, { expectedExperienceId: experienceId });
  } catch {
    // Non-enumerating error — token is invalid/expired/revoked
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: 403 },
    );
  }

  // ─── Parse + validate the body ──────────────────────────────
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

  // ─── Cross-field validation ─────────────────────────────────
  // If responseType is stuck, blockerType is required
  if (body.responseType === "stuck" && !body.blockerType) {
    return NextResponse.json(
      { error: "blockerType is required for a stuck response" },
      { status: 422 },
    );
  }

  // ─── Load the intervention ──────────────────────────────────
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

    // 4. For "stop_reminders" — immediately create a Suppression (organization scope)
    //    No dark patterns — this is immediate and irrevocable from the student side.
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
  //    This ensures the student cannot use any other token to access
  //    interventions from this organization.
  let revokedTokens = 0;
  if (isStopReminders) {
    revokedTokens = await revokeStudentTokens({
      organizationId: intervention.organizationId,
      studentId: intervention.studentId,
    });
  }

  // 7. Audit log — never includes raw token or sensitive note content
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
      noteProvided: !!body.note,
    },
  });

  // 8. Return success with next-step info
  const nextStep = NEXT_STEP_MAP[body.responseType];

  return NextResponse.json({
    ok: true,
    responseType: body.responseType,
    outcomeState,
    interventionState: result.updated.state,
    nextStep,
    revokedTokens,
  });
}
