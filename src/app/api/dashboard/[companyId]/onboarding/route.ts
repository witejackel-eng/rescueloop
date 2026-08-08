// /api/dashboard/[companyId]/onboarding
//
// GET: Returns current onboarding state + progress for the company.
// POST: Advances onboarding to the next step.
//
// Both validate Whop admin access.
// Never sends real notifications during onboarding.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  requireCompanyAdmin,
  authErrorToResponse,
} from "@/lib/auth/whop-auth";
import {
  isFixtureMode,
  getFixtureOnboardingState,
} from "@/lib/onboarding/mode-guard";

// ── Onboarding step enum ──────────────────────────────────────
const OnboardingStep = z.enum([
  "access",
  "course-mapped",
  "sync",
  "threshold",
  "candidates",
  "complete",
]);

type OnboardingStep = z.infer<typeof OnboardingStep>;

// ── GET handler ───────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  // Fixture mode: return simulated state
  if (isFixtureMode()) {
    const fixtureState = getFixtureOnboardingState(7);
    return NextResponse.json({
      ok: true,
      mode: "fixture",
      step: fixtureState.step,
      companyId: fixtureState.companyId,
      companyName: fixtureState.companyName,
      totalMembers: fixtureState.totalMembers,
      syncedAt: fixtureState.syncedAt,
      coursesConnected: fixtureState.coursesConnected,
      safetyExclusions: fixtureState.safetyExclusions,
      candidates: fixtureState.candidates,
      progress: {
        access: true,
        courseMapped: true,
        sync: true,
        threshold: false,
        candidates: false,
        complete: false,
      },
    });
  }

  // Connected mode: verify admin access
  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    return authErrorToResponse(error);
  }

  // Determine onboarding state from DB
  const organization = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  // Look up onboarding progress
  const onboardingProgress = await db.onboardingProgress.findUnique({
    where: {
      organizationId_companyId: {
        organizationId: ctx.organizationId,
        companyId,
      },
    },
  });

  // Get last sync time
  const lastSync = await db.syncExecution.findFirst({
    where: {
      organizationId: ctx.organizationId,
      state: "completed",
    },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  // Count courses, mappings, and members
  const [courseCount, mappingCount, memberCount] = await Promise.all([
    db.course.count({
      where: { organizationId: ctx.organizationId },
    }),
    db.productCourseMapping.count({
      where: {
        organizationId: ctx.organizationId,
        isConfirmed: true,
      },
    }),
    db.membership.count({
      where: { organizationId: ctx.organizationId },
    }),
  ]);

  // Derive progress from data state
  const hasAccess = true; // If we got here, access is verified
  const hasCourseMapped = mappingCount > 0;
  const hasSync = memberCount > 0;
  const currentStep: OnboardingStep =
    (onboardingProgress?.currentStep as OnboardingStep) ?? "access";

  // Parse stored step states
  let stepsData: Record<string, boolean> = {};
  if (onboardingProgress?.stepsJson) {
    try {
      stepsData = JSON.parse(onboardingProgress.stepsJson);
    } catch {
      // Ignore malformed JSON
    }
  }

  return NextResponse.json({
    ok: true,
    mode: "connected",
    step: currentStep,
    companyId,
    companyName: organization.name,
    totalMembers: memberCount,
    syncedAt: lastSync?.completedAt?.toISOString() ?? null,
    coursesConnected: courseCount,
    safetyExclusions: 0, // Computed from campaign rules
    progress: {
      access: hasAccess,
      courseMapped: hasCourseMapped,
      sync: hasSync,
      threshold:
        stepsData.threshold ??
        (currentStep === "threshold" ||
          currentStep === "candidates" ||
          currentStep === "complete"),
      candidates:
        stepsData.candidates ??
        (currentStep === "candidates" || currentStep === "complete"),
      complete: currentStep === "complete",
    },
  });
}

// ── POST handler ──────────────────────────────────────────────
const AdvanceSchema = z.object({
  step: OnboardingStep,
  // Threshold configuration (sent when advancing to "candidates")
  thresholdDays: z.number().int().min(1).max(90).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  // Fixture mode: return simulated advancement
  if (isFixtureMode()) {
    let body: z.infer<typeof AdvanceSchema>;
    try {
      const json = await req.json();
      body = AdvanceSchema.parse(json);
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const fixtureState = getFixtureOnboardingState(body.thresholdDays ?? 7);
    return NextResponse.json({
      ok: true,
      mode: "fixture",
      previousStep: "threshold",
      currentStep: body.step,
      candidateCount: fixtureState.candidates.length,
      // IMPORTANT: No notifications sent during onboarding
      notificationsSent: 0,
    });
  }

  // Connected mode: verify admin access
  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    return authErrorToResponse(error);
  }

  // Parse request body
  let body: z.infer<typeof AdvanceSchema>;
  try {
    const json = await req.json();
    body = AdvanceSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Read current onboarding progress
  const existingProgress = await db.onboardingProgress.findUnique({
    where: {
      organizationId_companyId: {
        organizationId: ctx.organizationId,
        companyId,
      },
    },
  });

  const previousStep: OnboardingStep =
    (existingProgress?.currentStep as OnboardingStep) ?? "access";

  // Build updated steps JSON
  let stepsData: Record<string, boolean> = {};
  if (existingProgress?.stepsJson) {
    try {
      stepsData = JSON.parse(existingProgress.stepsJson);
    } catch {
      // Ignore malformed JSON
    }
  }
  // Mark the new step as completed
  stepsData[body.step] = true;
  if (body.step === "complete") {
    stepsData.access = true;
    stepsData["course-mapped"] = true;
    stepsData.sync = true;
    stepsData.threshold = true;
    stepsData.candidates = true;
    stepsData.complete = true;
  }

  // Upsert the onboarding progress
  const completedAt = body.step === "complete" ? new Date() : null;

  await db.onboardingProgress.upsert({
    where: {
      organizationId_companyId: {
        organizationId: ctx.organizationId,
        companyId,
      },
    },
    create: {
      organizationId: ctx.organizationId,
      companyId,
      currentStep: body.step,
      stepsJson: JSON.stringify(stepsData),
      completedAt,
    },
    update: {
      currentStep: body.step,
      stepsJson: JSON.stringify(stepsData),
      completedAt,
    },
  });

  // Count candidates at the configured threshold (if applicable)
  let candidateCount = 0;
  if (body.step === "candidates" && body.thresholdDays) {
    // Find students with course states showing inactivity beyond threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - body.thresholdDays);

    candidateCount = await db.studentCourseState.count({
      where: {
        organizationId: ctx.organizationId,
        lastActivityAt: { lte: thresholdDate },
        student: {
          memberships: {
            some: {
              organizationId: ctx.organizationId,
              status: "active",
            },
          },
        },
      },
    });
  }

  // NEVER send real notifications during onboarding.
  // This is enforced by design — onboarding only advances state,
  // it never triggers the intervention engine.

  return NextResponse.json({
    ok: true,
    mode: "connected",
    previousStep,
    currentStep: body.step,
    candidateCount,
    // Safety guarantee: zero notifications during onboarding
    notificationsSent: 0,
  });
}
