// Durable synchronization record-keeping.
//
// Tracks SyncExecution, SyncStage, SyncCheckpoint, and ReconciliationRun
// records so every sync operation is observable, resumable, and auditable.
//
// A checkpoint is persisted after every successfully committed page.
// A failure on page N must resume from page N+1 or the last safe provider cursor.

import "server-only";
import { db } from "@/lib/db";

// ─── SyncExecution ──────────────────────────────────────────

export interface CreateSyncExecutionParams {
  orgId: string;
  provider?: string;
  trigger: "manual" | "scheduled" | "webhook" | "resumption";
  requestedBy?: string;
  environment?: string;
  jobId?: string;
}

/**
 * Create a new SyncExecution record in `running` state.
 */
export async function createSyncExecution(params: CreateSyncExecutionParams) {
  return db.syncExecution.create({
    data: {
      organizationId: params.orgId,
      provider: params.provider ?? "whop",
      environment: params.environment ?? "production",
      trigger: params.trigger,
      requestedBy: params.requestedBy,
      state: "running",
      jobId: params.jobId,
    },
  });
}

/**
 * Mark a SyncExecution as completed or failed.
 */
export async function completeSyncExecution(
  execId: string,
  state: "completed" | "failed" | "cancelled",
  error?: string,
) {
  return db.syncExecution.update({
    where: { id: execId },
    data: {
      state,
      completedAt: new Date(),
      errorSummary: error ?? null,
    },
  });
}

// ─── SyncStage ──────────────────────────────────────────────

export interface SyncStageResults {
  pagesProcessed: number;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  retryCount?: number;
}

/**
 * Create a new SyncStage record in `running` state.
 */
export async function createSyncStage(
  execId: string,
  resourceType: string,
) {
  return db.syncStage.create({
    data: {
      syncExecutionId: execId,
      resourceType,
      state: "running",
    },
  });
}

/**
 * Mark a SyncStage as completed or failed with aggregate counts.
 */
export async function completeSyncStage(
  stageId: string,
  results: SyncStageResults,
  state: "completed" | "failed" = "completed",
) {
  return db.syncStage.update({
    where: { id: stageId },
    data: {
      state,
      completedAt: new Date(),
      pagesProcessed: results.pagesProcessed,
      recordsRead: results.recordsRead,
      recordsCreated: results.recordsCreated,
      recordsUpdated: results.recordsUpdated,
      recordsSkipped: results.recordsSkipped,
      retryCount: results.retryCount ?? 0,
    },
  });
}

// ─── SyncCheckpoint ─────────────────────────────────────────

/**
 * Persist a checkpoint after a successfully committed page.
 *
 * Uses upsert on the (organizationId, resource) unique constraint
 * so the checkpoint is always the latest for a given resource.
 */
export async function persistCheckpoint(
  orgId: string,
  resource: string,
  cursor: string | null,
  watermark: string | null,
  execId: string,
  lastCompletedPage: number,
) {
  return db.syncCheckpoint.upsert({
    where: {
      organizationId_resource: {
        organizationId: orgId,
        resource,
      },
    },
    create: {
      organizationId: orgId,
      syncExecutionId: execId,
      resource,
      cursor,
      sourceWatermark: watermark,
      lastCompletedPage,
    },
    update: {
      syncExecutionId: execId,
      cursor,
      sourceWatermark: watermark,
      lastCompletedPage,
    },
  });
}

/**
 * Retrieve the latest checkpoint for a resource so that
 * a failed sync can resume from the last safe position.
 */
export async function getLatestCheckpoint(
  orgId: string,
  resource: string,
) {
  return db.syncCheckpoint.findUnique({
    where: {
      organizationId_resource: {
        organizationId: orgId,
        resource,
      },
    },
  });
}

// ─── ReconciliationRun ──────────────────────────────────────

/**
 * Create a ReconciliationRun record.
 */
export async function createReconciliationRun(
  orgId: string,
  courseId: string,
  execId?: string,
) {
  return db.reconciliationRun.create({
    data: {
      organizationId: orgId,
      courseId,
      syncExecutionId: execId,
      state: "running",
    },
  });
}

/**
 * Complete a ReconciliationRun with classification summary.
 */
export async function completeReconciliationRun(
  runId: string,
  summary: {
    matched: number;
    membershipWithoutCourseActivity: number;
    courseActivityWithoutMembership: number;
    unmappedProduct: number;
    missingSourceFields: number;
    staleSourceRecord: number;
  },
  state: "completed" | "failed" = "completed",
) {
  return db.reconciliationRun.update({
    where: { id: runId },
    data: {
      state,
      completedAt: new Date(),
      ...summary,
    },
  });
}
