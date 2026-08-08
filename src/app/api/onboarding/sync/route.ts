// API route: POST /api/onboarding/sync
// Triggers the first sync for the onboarding flow.
// Returns the initial sync progress so the client can show stages.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createInitialSyncProgress,
  serializeSyncProgress,
  SyncStage,
} from "@/lib/onboarding/sync-progress";
import { trackOnboardingEvent } from "@/lib/onboarding/analytics";
import { createLogger } from "@/lib/observability/logger";
import { sendInngestEvent, EVENTS } from "@/server/jobs/client";

const log = createLogger({ route: "/api/onboarding/sync" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, organizationId } = body;

    if (!companyId || !organizationId) {
      return NextResponse.json(
        { error: "companyId and organizationId are required" },
        { status: 400 },
      );
    }

    // Create initial sync progress
    const progress = createInitialSyncProgress();

    // Start the first stage
    const updatedProgress = {
      ...progress,
      stages: progress.stages.map((s) =>
        s.stage === SyncStage.CompanyRefs
          ? { ...s, status: "in_progress" as const, startedAt: new Date().toISOString() }
          : s,
      ),
      currentStage: SyncStage.CompanyRefs,
    };

    // Persist to DB
    const syncProgressJson = serializeSyncProgress(updatedProgress);
    await db.onboardingProgress.upsert({
      where: {
        organizationId_companyId: { organizationId, companyId },
      },
      create: {
        organizationId,
        companyId,
        currentStep: "first_sync",
        stepsJson: JSON.stringify({ currentStep: "first_sync" }),
        syncProgressJson,
      },
      update: {
        currentStep: "first_sync",
        syncProgressJson,
      },
    });

    // Track analytics
    trackOnboardingEvent("sync_started", companyId, {
      organizationId,
      stageCount: updatedProgress.stages.length,
    });

    log.info("First sync initiated", {
      action: "POST",
      companyId,
      organizationId,
    });

    // Dispatch sync job via Inngest
    const dispatchResult = await sendInngestEvent(EVENTS.syncMemberships, {
      organizationId,
      trigger: "onboarding",
    });

    if (dispatchResult.state === "unconfigured") {
      log.warn("Inngest not configured — sync not dispatched", {
        action: "POST",
        companyId,
        organizationId,
      });
    }

    return NextResponse.json({
      syncProgress: updatedProgress,
      message: "Sync started. Poll /api/onboarding/progress for updates.",
    });
  } catch (error) {
    log.error("Failed to start sync", {
      action: "POST",
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });

    return NextResponse.json(
      { error: "Failed to start sync. Please try again." },
      { status: 500 },
    );
  }
}
