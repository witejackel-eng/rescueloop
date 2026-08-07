// POST /api/companies/[companyId]/onboarding
//
// Creates the Product + Course records (upserted from Whop data), confirms the
// ProductCourseMapping, and creates an Activation Rescue campaign with the
// admin-configured safety settings. Manual approval is always mandatory in the
// private pilot — the route forces approvalMode = "manual".

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import {
  checkRateLimitOrReject,
  getClientIp,
  RATE_LIMITS,
  RateLimiter,
} from "@/lib/rate-limit/rate-limiter";

const OnboardingSchema = z.object({
  // Whop identifiers — used to upsert Product / Course rows
  whopProductId: z.string().min(1),
  productName: z.string().min(1).max(200),
  whopCourseId: z.string().min(1),
  courseName: z.string().min(1).max(200),
  externalExperienceId: z.string().min(1).optional().nullable(),
  lessonCount: z.number().int().min(0).max(100000).optional().default(0),

  // Safety configuration
  activationDelayDays: z.number().int().min(1).max(90).default(7),
  cooldownDays: z.number().int().min(1).max(90).default(14),
  maxMessagesPerStudent: z.number().int().min(1).max(10).default(2),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("20:00"),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("08:00"),

  // Optional custom message template
  messageTemplate: z.string().max(2000).optional().default(""),
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

  // ─── Rate limiting (20 req/min per IP for auth-sensitive) ──
  const ip = getClientIp(req);
  const rateLimitKey = RateLimiter.buildKey("auth-sensitive", ip);
  const rateLimitRejection = await checkRateLimitOrReject(
    rateLimitKey,
    RATE_LIMITS.authSensitive,
  );
  if (rateLimitRejection) return rateLimitRejection;


  // Parse + validate the JSON body
  let body: z.infer<typeof OnboardingSchema>;
  try {
    const json = await req.json();
    body = OnboardingSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Upsert the Product (keyed by whopProductId)
  const product = await db.product.upsert({
    where: { whopProductId: body.whopProductId },
    create: {
      organizationId: ctx.organizationId,
      whopProductId: body.whopProductId,
      name: body.productName,
    },
    update: {
      name: body.productName,
    },
  });

  // Upsert the Course. There's no compound unique on (organizationId,
  // externalCourseId), so we findFirst then create-or-update.
  const existingCourse = await db.course.findFirst({
    where: {
      organizationId: ctx.organizationId,
      externalCourseId: body.whopCourseId,
    },
    select: { id: true },
  });
  const course = existingCourse
    ? await db.course.update({
        where: { id: existingCourse.id },
        data: {
          name: body.courseName,
          lessonCount: body.lessonCount,
          ...(body.externalExperienceId
            ? { externalExperienceId: body.externalExperienceId }
            : {}),
        },
      })
    : await db.course.create({
        data: {
          organizationId: ctx.organizationId,
          externalCourseId: body.whopCourseId,
          externalExperienceId: body.externalExperienceId ?? null,
          name: body.courseName,
          lessonCount: body.lessonCount,
        },
      });

  // Create or update the ProductCourseMapping (confirmed)
  const mapping = await db.productCourseMapping.upsert({
    where: { productId_courseId: { productId: product.id, courseId: course.id } },
    create: {
      organizationId: ctx.organizationId,
      productId: product.id,
      courseId: course.id,
      activationDelayDays: body.activationDelayDays,
      isConfirmed: true,
    },
    update: {
      activationDelayDays: body.activationDelayDays,
      isConfirmed: true,
    },
  });

  // Create the Activation Rescue campaign (manual approval always)
  const campaign = await db.campaign.create({
    data: {
      organizationId: ctx.organizationId,
      type: "activation_rescue",
      name: `Activation Rescue — ${course.name}`,
      status: "active",
      approvalMode: "manual", // Always manual in the private pilot
      maxMessagesPerStudent: body.maxMessagesPerStudent,
      cooldownDays: body.cooldownDays,
      quietHoursStart: body.quietHoursStart,
      quietHoursEnd: body.quietHoursEnd,
      stopAfterResponse: true,
      stopAfterProgress: true,
      stopAfterMembershipEnd: true,
      messageTemplate:
        body.messageTemplate ||
        "Hi {first_name} — wanted to check in on {course_name}. You're not far from your next lesson. Pick up where you left off whenever you're ready.",
    },
  });

  // Version 1 snapshot of the campaign rules
  const version = await db.campaignVersion.create({
    data: {
      campaignId: campaign.id,
      versionNumber: 1,
      rulesJson: {
        activationDelayDays: body.activationDelayDays,
        cooldownDays: body.cooldownDays,
        maxMessagesPerStudent: body.maxMessagesPerStudent,
        quietHoursStart: body.quietHoursStart,
        quietHoursEnd: body.quietHoursEnd,
        approvalMode: "manual",
      },
      messageTemplate: campaign.messageTemplate,
    },
  });

  // Audit log entries
  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "created",
    objectType: "product_course_mapping",
    objectId: mapping.id,
    newState: "confirmed",
    reason: "Onboarding completed",
    metadata: {
      productId: product.id,
      courseId: course.id,
      activationDelayDays: body.activationDelayDays,
    },
  });

  await recordAuditEvent({
    organizationId: ctx.organizationId,
    actorId: ctx.internalUserId ?? ctx.whopUserId,
    action: "created",
    objectType: "campaign",
    objectId: campaign.id,
    newState: "active",
    reason: "Onboarding completed — Activation Rescue campaign created",
    metadata: {
      campaignVersionId: version.id,
      cooldownDays: body.cooldownDays,
      maxMessagesPerStudent: body.maxMessagesPerStudent,
      quietHours: [body.quietHoursStart, body.quietHoursEnd],
    },
  });

  return NextResponse.json(
    {
      ok: true,
      productId: product.id,
      courseId: course.id,
      mappingId: mapping.id,
      campaignId: campaign.id,
      campaignVersionId: version.id,
    },
    { status: 201 },
  );
}
