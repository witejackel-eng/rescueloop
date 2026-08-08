// API route: POST /api/onboarding/progress
// Persists onboarding progress to the DB for leave-and-return support.
// Also handles GET to load existing progress.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger({ route: "/api/onboarding/progress" });

// ─── GET: Load onboarding progress ──────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const organizationId = searchParams.get("organizationId");

  if (!companyId) {
    return NextResponse.json(
      { error: "companyId is required" },
      { status: 400 },
    );
  }

  try {
    // Find the onboarding progress row
    const progress = organizationId
      ? await db.onboardingProgress.findUnique({
          where: {
            organizationId_companyId: { organizationId, companyId },
          },
        })
      : await db.onboardingProgress.findFirst({
          where: { companyId },
        });

    if (!progress) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      currentStep: progress.currentStep,
      stepsJson: progress.stepsJson,
      syncProgressJson: progress.syncProgressJson,
      completedAt: progress.completedAt,
      updatedAt: progress.updatedAt,
    });
  } catch (error) {
    log.error("Failed to load onboarding progress", {
      action: "GET",
      companyId,
      organizationId: organizationId ?? undefined,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });

    return NextResponse.json(
      { error: "Failed to load progress" },
      { status: 500 },
    );
  }
}

// ─── POST: Save onboarding progress ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, organizationId, currentStep, stepsJson, syncProgressJson } =
      body;

    if (!companyId || !organizationId || !currentStep || !stepsJson) {
      return NextResponse.json(
        { error: "Missing required fields: companyId, organizationId, currentStep, stepsJson" },
        { status: 400 },
      );
    }

    const progress = await db.onboardingProgress.upsert({
      where: {
        organizationId_companyId: { organizationId, companyId },
      },
      create: {
        organizationId,
        companyId,
        currentStep,
        stepsJson,
        syncProgressJson: syncProgressJson ?? null,
      },
      update: {
        currentStep,
        stepsJson,
        syncProgressJson: syncProgressJson ?? undefined,
        completedAt: currentStep === "complete" ? new Date() : undefined,
      },
    });

    log.info("Saved onboarding progress", {
      action: "POST",
      companyId,
      organizationId,
      currentStep,
    });

    return NextResponse.json({
      id: progress.id,
      currentStep: progress.currentStep,
      updatedAt: progress.updatedAt,
    });
  } catch (error) {
    log.error("Failed to save onboarding progress", {
      action: "POST",
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });

    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 },
    );
  }
}
