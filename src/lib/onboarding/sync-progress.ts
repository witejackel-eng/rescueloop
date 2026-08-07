// Sync progress DB persistence — server-only.
//
// Types and pure functions live in sync-progress-types.ts (client-safe).

import "server-only";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/observability/logger";
import type { SyncProgress } from "./sync-progress-types";
import { serializeSyncProgress, deserializeSyncProgress } from "./sync-progress-types";

// Re-export all types and pure functions for convenience
export * from "./sync-progress-types";

const log = createLogger({ route: "onboarding/sync-progress" });

// ─── DB persistence ─────────────────────────────────────────────

/**
 * Persist sync progress to the OnboardingProgress row in the DB.
 * Creates the row if it doesn't exist; updates if it does.
 */
export async function persistSyncProgress(
  organizationId: string,
  companyId: string,
  progress: SyncProgress,
  currentStep: string,
  stepsJson: string,
): Promise<void> {
  const syncProgressJson = serializeSyncProgress(progress);

  try {
    await db.onboardingProgress.upsert({
      where: {
        organizationId_companyId: { organizationId, companyId },
      },
      create: {
        organizationId,
        companyId,
        currentStep,
        stepsJson,
        syncProgressJson,
      },
      update: {
        currentStep,
        stepsJson,
        syncProgressJson,
      },
    });

    log.debug("Persisted sync progress", {
      action: "persistSyncProgress",
      organizationId,
      companyId,
      currentStage: progress.currentStage,
      recordsProcessed: progress.recordsProcessed,
    });
  } catch (error) {
    log.error("Failed to persist sync progress", {
      action: "persistSyncProgress",
      organizationId,
      companyId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });
    // Don't throw — sync progress persistence is best-effort
  }
}

/**
 * Load sync progress from the DB for resume support.
 * Returns null if no progress row exists.
 */
export async function loadSyncProgress(
  organizationId: string,
  companyId: string,
): Promise<{
  currentStep: string;
  stepsJson: string;
  syncProgress: SyncProgress | null;
  completedAt: Date | null;
} | null> {
  try {
    const row = await db.onboardingProgress.findUnique({
      where: {
        organizationId_companyId: { organizationId, companyId },
      },
    });

    if (!row) return null;

    const syncProgress = row.syncProgressJson
      ? deserializeSyncProgress(row.syncProgressJson)
      : null;

    return {
      currentStep: row.currentStep,
      stepsJson: row.stepsJson,
      syncProgress,
      completedAt: row.completedAt,
    };
  } catch (error) {
    log.warn("Failed to load sync progress", {
      action: "loadSyncProgress",
      organizationId,
      companyId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });
    return null;
  }
}

/**
 * Mark the onboarding as completed in the DB.
 */
export async function markOnboardingComplete(
  organizationId: string,
  companyId: string,
): Promise<void> {
  try {
    await db.onboardingProgress.update({
      where: {
        organizationId_companyId: { organizationId, companyId },
      },
      data: {
        currentStep: "complete",
        completedAt: new Date(),
      },
    });
  } catch (error) {
    log.error("Failed to mark onboarding complete", {
      action: "markOnboardingComplete",
      organizationId,
      companyId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });
  }
}
