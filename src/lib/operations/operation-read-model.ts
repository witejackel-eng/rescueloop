// Operation Read Model — server-only module.
//
// Reads persisted database state and normalizes it into a unified
// operation status format. This is the SINGLE source of truth for
// how operations (sync, onboarding, reconciliation, export, deletion)
// are presented to the frontend.
//
// CRITICAL RULES:
//   - No fake values. No random progress. No fabricated percentages.
//   - A percentage is allowed ONLY when both completedUnits and totalUnits
//     are real persisted values.
//   - Otherwise show stage-based progress (the `stage` string).
//   - canRetry is true only when state is "failed" and the operation type supports retry.
//   - canLeaveSafely is true when state is terminal OR when the operation is persisted
//     (always true for server-side ops since they're in DB).
//   - providerDelay is true when the last sync stage had retryCount > 0.

import "server-only";
import { db } from "@/lib/db";

// ─── Read model types ────────────────────────────────────────

export interface OperationReadModel {
  id: string;
  type: "sync" | "onboarding" | "reconciliation" | "export" | "deletion";
  state: "pending" | "running" | "completed" | "failed" | "cancelled";
  stage: string; // Human-readable current stage label
  completedUnits: number | null; // null when not measurable
  totalUnits: number | null; // null when not measurable
  startedAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
  retryAfter: string | null; // ISO timestamp for provider backoff
  providerDelay: boolean; // Whop rate limit / 429
  canRetry: boolean;
  canLeaveSafely: boolean;
  message: string | null; // Error or status message
  // Stage breakdown for sync operations
  stages?: OperationStageRead[];
  // Metadata
  trigger?: string;
  provider?: string;
}

export interface OperationStageRead {
  id: string;
  resource: string;
  state: "pending" | "running" | "completed" | "failed" | "skipped";
  completedAt: string | null;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  pagesProcessed: number;
}

// ─── Internal helpers ────────────────────────────────────────

function syncExecutionStateToReadState(
  state: string,
): OperationReadModel["state"] {
  switch (state) {
    case "pending":
      return "pending";
    case "running":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function syncStageStateToReadState(
  state: string,
): OperationStageRead["state"] {
  switch (state) {
    case "pending":
      return "pending";
    case "running":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "skipped":
      return "skipped";
    default:
      return "pending";
  }
}

function dataDeletionStatusToReadState(
  status: string,
): OperationReadModel["state"] {
  switch (status) {
    case "requested":
    case "verified":
    case "scheduled":
      return "pending";
    case "processing":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function dataExportStatusToReadState(
  status: string,
): OperationReadModel["state"] {
  switch (status) {
    case "Requested":
      return "pending";
    case "Processing":
      return "running";
    case "Completed":
      return "completed";
    case "Failed":
      return "failed";
    case "Expired":
      return "cancelled";
    default:
      return "pending";
  }
}

function reconciliationStateToReadState(
  state: string,
): OperationReadModel["state"] {
  switch (state) {
    case "pending":
      return "pending";
    case "running":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

function determineSyncStage(stages: { state: string; resourceType: string }[]): string {
  // Find the currently running stage, or the last completed/failed stage
  const runningStage = stages.find((s) => s.state === "running");
  if (runningStage) {
    return `Syncing ${runningStage.resourceType}`;
  }

  const failedStage = stages.find((s) => s.state === "failed");
  if (failedStage) {
    return `Failed at ${failedStage.resourceType}`;
  }

  const lastCompletedStage = [...stages]
    .reverse()
    .find((s) => s.state === "completed");
  if (lastCompletedStage) {
    return `Completed ${lastCompletedStage.resourceType}`;
  }

  if (stages.length > 0 && stages.every((s) => s.state === "pending")) {
    return "Waiting to start";
  }

  return "Preparing sync";
}

// ─── SyncExecution → OperationReadModel ──────────────────────

async function buildSyncOperation(execution: {
  id: string;
  organizationId: string;
  provider: string;
  trigger: string;
  state: string;
  startedAt: Date;
  completedAt: Date | null;
  errorSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Promise<OperationReadModel> {
  // Fetch stages for this execution
  const stages = await db.syncStage.findMany({
    where: { syncExecutionId: execution.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      resourceType: true,
      state: true,
      completedAt: true,
      recordsRead: true,
      recordsCreated: true,
      recordsUpdated: true,
      pagesProcessed: true,
      retryCount: true,
    },
  });

  const state = syncExecutionStateToReadState(execution.state);
  const stageLabel = determineSyncStage(stages);

  // Check for provider delay (rate limiting): any stage with retryCount > 0
  const providerDelay = stages.some((s) => s.retryCount > 0);

  // Compute progress: only if we have real data
  // For sync, totalUnits is the sum of recordsRead for completed+running stages
  // and completedUnits is recordsCreated + recordsUpdated
  // BUT: we can only show a meaningful percentage when we know total
  // For sync operations, we don't have a reliable total count until all pages
  // are processed. So we show null/null unless all stages are completed.
  let completedUnits: number | null = null;
  let totalUnits: number | null = null;

  // If the sync is completed, we can compute totals from the stages
  if (state === "completed" || state === "failed") {
    completedUnits = stages.reduce(
      (sum, s) => sum + s.recordsCreated + s.recordsUpdated,
      0,
    );
    totalUnits = stages.reduce((sum, s) => sum + s.recordsRead, 0);
    // If totalUnits is 0, set both to null (not measurable)
    if (totalUnits === 0) {
      completedUnits = null;
      totalUnits = null;
    }
  }

  // Retry after: if provider delay, compute a reasonable backoff
  // We don't have the exact retry-after from Whop, so we check if any
  // stage has retryCount > 0 and set retryAfter to a near-future timestamp
  let retryAfter: string | null = null;
  if (providerDelay && state === "running") {
    // Estimate 60 seconds from now — the actual retry window is managed by Inngest
    const retryDate = new Date(execution.updatedAt.getTime() + 60_000);
    retryAfter = retryDate.toISOString();
  }

  const canRetry = state === "failed";
  const canLeaveSafely = true; // All server-side ops are persisted

  const operationStages: OperationStageRead[] = stages.map((s) => ({
    id: s.id,
    resource: s.resourceType,
    state: syncStageStateToReadState(s.state),
    completedAt: s.completedAt?.toISOString() ?? null,
    recordsRead: s.recordsRead,
    recordsCreated: s.recordsCreated,
    recordsUpdated: s.recordsUpdated,
    pagesProcessed: s.pagesProcessed,
  }));

  return {
    id: execution.id,
    type: "sync",
    state,
    stage: stageLabel,
    completedUnits,
    totalUnits,
    startedAt: execution.startedAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
    completedAt: execution.completedAt?.toISOString() ?? null,
    retryAfter,
    providerDelay,
    canRetry,
    canLeaveSafely,
    message: execution.errorSummary,
    stages: operationStages,
    trigger: execution.trigger,
    provider: execution.provider,
  };
}

// ─── OnboardingProgress → OperationReadModel ─────────────────

function buildOnboardingOperation(progress: {
  id: string;
  currentStep: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): OperationReadModel {
  const isComplete = progress.completedAt !== null;
  const state: OperationReadModel["state"] = isComplete
    ? "completed"
    : "running";

  return {
    id: progress.id,
    type: "onboarding",
    state,
    stage: isComplete
      ? "Onboarding complete"
      : `Onboarding: ${progress.currentStep}`,
    completedUnits: null,
    totalUnits: null,
    startedAt: progress.createdAt.toISOString(),
    updatedAt: progress.updatedAt.toISOString(),
    completedAt: progress.completedAt?.toISOString() ?? null,
    retryAfter: null,
    providerDelay: false,
    canRetry: false, // Onboarding doesn't support retry via this API
    canLeaveSafely: true,
    message: null,
    trigger: "onboarding",
  };
}

// ─── DataDeletionRequest → OperationReadModel ────────────────

function buildDeletionOperation(deletion: {
  id: string;
  status: string;
  reason: string | null;
  requestedAt: Date;
  completedAt: Date | null;
  verifiedAt: Date | null;
  scheduledAt: Date | null;
  processedAt: Date | null;
}): OperationReadModel {
  const state = dataDeletionStatusToReadState(deletion.status);

  let stageLabel: string;
  switch (deletion.status) {
    case "requested":
      stageLabel = "Deletion requested";
      break;
    case "verified":
      stageLabel = "Deletion verified";
      break;
    case "scheduled":
      stageLabel = "Deletion scheduled";
      break;
    case "processing":
      stageLabel = "Deleting data";
      break;
    case "completed":
      stageLabel = "Data deleted";
      break;
    case "failed":
      stageLabel = "Deletion failed";
      break;
    case "cancelled":
      stageLabel = "Deletion cancelled";
      break;
    default:
      stageLabel = "Deletion pending";
  }

  return {
    id: deletion.id,
    type: "deletion",
    state,
    stage: stageLabel,
    completedUnits: null,
    totalUnits: null,
    startedAt: deletion.requestedAt.toISOString(),
    updatedAt: (deletion.processedAt ?? deletion.scheduledAt ?? deletion.requestedAt).toISOString(),
    completedAt: deletion.completedAt?.toISOString() ?? null,
    retryAfter: null,
    providerDelay: false,
    canRetry: false, // Deletion doesn't support retry via this API
    canLeaveSafely: true,
    message: deletion.reason,
    trigger: "manual",
  };
}

// ─── DataExportRequest → OperationReadModel ──────────────────

function buildExportOperation(exportReq: {
  id: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  downloadExpiresAt: Date;
}): OperationReadModel {
  const state = dataExportStatusToReadState(exportReq.status);

  let stageLabel: string;
  switch (exportReq.status) {
    case "Requested":
      stageLabel = "Export requested";
      break;
    case "Processing":
      stageLabel = "Generating export";
      break;
    case "Completed":
      stageLabel = "Export ready";
      break;
    case "Failed":
      stageLabel = "Export failed";
      break;
    case "Expired":
      stageLabel = "Export expired";
      break;
    default:
      stageLabel = "Export pending";
  }

  return {
    id: exportReq.id,
    type: "export",
    state,
    stage: stageLabel,
    completedUnits: null,
    totalUnits: null,
    startedAt: exportReq.createdAt.toISOString(),
    updatedAt: exportReq.createdAt.toISOString(),
    completedAt: exportReq.completedAt?.toISOString() ?? null,
    retryAfter: null,
    providerDelay: false,
    canRetry: state === "failed",
    canLeaveSafely: true,
    message: null,
    trigger: "manual",
  };
}

// ─── ReconciliationRun → OperationReadModel ─────────────────

function buildReconciliationOperation(recon: {
  id: string;
  state: string;
  startedAt: Date;
  completedAt: Date | null;
  totalEvaluated: number;
  matched: number;
  createdAt: Date;
  updatedAt: Date;
}): OperationReadModel {
  const state = reconciliationStateToReadState(recon.state);

  return {
    id: recon.id,
    type: "reconciliation",
    state,
    stage:
      state === "completed"
        ? "Reconciliation complete"
        : state === "running"
          ? "Reconciling data"
          : state === "failed"
            ? "Reconciliation failed"
            : "Reconciliation pending",
    completedUnits: recon.totalEvaluated > 0 ? recon.matched : null,
    totalUnits: recon.totalEvaluated > 0 ? recon.totalEvaluated : null,
    startedAt: recon.startedAt.toISOString(),
    updatedAt: recon.updatedAt.toISOString(),
    completedAt: recon.completedAt?.toISOString() ?? null,
    retryAfter: null,
    providerDelay: false,
    canRetry: state === "failed",
    canLeaveSafely: true,
    message: null,
    trigger: "scheduled",
  };
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Get all operations for an organization (most recent first).
 * Combines sync, onboarding, export, deletion, and reconciliation operations.
 */
export async function getOrganizationOperations(
  orgId: string,
): Promise<OperationReadModel[]> {
  const operations: OperationReadModel[] = [];

  // Fetch sync executions (most recent first, limit 20)
  const syncExecutions = await db.syncExecution.findMany({
    where: { organizationId: orgId },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      organizationId: true,
      provider: true,
      trigger: true,
      state: true,
      startedAt: true,
      completedAt: true,
      errorSummary: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  for (const exec of syncExecutions) {
    operations.push(await buildSyncOperation(exec));
  }

  // Fetch onboarding progress
  const onboardingProgress = await db.onboardingProgress.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      currentStep: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  for (const progress of onboardingProgress) {
    operations.push(buildOnboardingOperation(progress));
  }

  // Fetch data export requests
  const exportRequests = await db.dataExportRequest.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
      downloadExpiresAt: true,
    },
  });

  for (const exportReq of exportRequests) {
    operations.push(buildExportOperation(exportReq));
  }

  // Fetch data deletion requests
  const deletionRequests = await db.dataDeletionRequest.findMany({
    where: { organizationId: orgId },
    orderBy: { requestedAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      reason: true,
      requestedAt: true,
      completedAt: true,
      verifiedAt: true,
      scheduledAt: true,
      processedAt: true,
    },
  });

  for (const deletion of deletionRequests) {
    operations.push(buildDeletionOperation(deletion));
  }

  // Fetch reconciliation runs
  const reconRuns = await db.reconciliationRun.findMany({
    where: { organizationId: orgId },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      id: true,
      state: true,
      startedAt: true,
      completedAt: true,
      totalEvaluated: true,
      matched: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  for (const recon of reconRuns) {
    operations.push(buildReconciliationOperation(recon));
  }

  // Sort all operations by startedAt descending
  operations.sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return bTime - aTime;
  });

  return operations;
}

/**
 * Get a single operation by ID.
 * Searches across all operation types for the given ID.
 */
export async function getOperation(
  orgId: string,
  operationId: string,
): Promise<OperationReadModel | null> {
  // Try SyncExecution
  const syncExec = await db.syncExecution.findFirst({
    where: { id: operationId, organizationId: orgId },
    select: {
      id: true,
      organizationId: true,
      provider: true,
      trigger: true,
      state: true,
      startedAt: true,
      completedAt: true,
      errorSummary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (syncExec) {
    return buildSyncOperation(syncExec);
  }

  // Try OnboardingProgress
  const onboarding = await db.onboardingProgress.findFirst({
    where: { id: operationId, organizationId: orgId },
    select: {
      id: true,
      currentStep: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (onboarding) {
    return buildOnboardingOperation(onboarding);
  }

  // Try DataExportRequest
  const exportReq = await db.dataExportRequest.findFirst({
    where: { id: operationId, organizationId: orgId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
      downloadExpiresAt: true,
    },
  });
  if (exportReq) {
    return buildExportOperation(exportReq);
  }

  // Try DataDeletionRequest
  const deletion = await db.dataDeletionRequest.findFirst({
    where: { id: operationId, organizationId: orgId },
    select: {
      id: true,
      status: true,
      reason: true,
      requestedAt: true,
      completedAt: true,
      verifiedAt: true,
      scheduledAt: true,
      processedAt: true,
    },
  });
  if (deletion) {
    return buildDeletionOperation(deletion);
  }

  // Try ReconciliationRun
  const recon = await db.reconciliationRun.findFirst({
    where: { id: operationId, organizationId: orgId },
    select: {
      id: true,
      state: true,
      startedAt: true,
      completedAt: true,
      totalEvaluated: true,
      matched: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (recon) {
    return buildReconciliationOperation(recon);
  }

  return null;
}

/**
 * Get the latest sync operation for an org (most commonly needed).
 */
export async function getLatestSyncOperation(
  orgId: string,
): Promise<OperationReadModel | null> {
  const latestExec = await db.syncExecution.findFirst({
    where: { organizationId: orgId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      organizationId: true,
      provider: true,
      trigger: true,
      state: true,
      startedAt: true,
      completedAt: true,
      errorSummary: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!latestExec) {
    return null;
  }

  return buildSyncOperation(latestExec);
}

/**
 * Get extended sync data including stages, checkpoints, and webhook activity.
 * Used by the sync status page.
 */
export async function getSyncDetail(
  orgId: string,
): Promise<{
  execution: OperationReadModel | null;
  checkpoints: {
    resource: string;
    cursor: string | null;
    sourceWatermark: string | null;
    lastCompletedPage: number;
  }[];
  latestWebhook: {
    eventType: string;
    status: string;
    receivedAt: string;
    lastError: string | null;
  } | null;
} | null> {
  const latestExec = await db.syncExecution.findFirst({
    where: { organizationId: orgId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      organizationId: true,
      provider: true,
      trigger: true,
      state: true,
      startedAt: true,
      completedAt: true,
      errorSummary: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!latestExec) {
    // No sync has occurred yet — return null execution but still
    // check for webhook activity
    const latestWebhook = await db.webhookReceipt.findFirst({
      where: { organizationId: orgId },
      orderBy: { receivedAt: "desc" },
      select: {
        eventType: true,
        status: true,
        receivedAt: true,
        lastError: true,
      },
    });

    return {
      execution: null,
      checkpoints: [],
      latestWebhook: latestWebhook
        ? {
            eventType: latestWebhook.eventType,
            status: latestWebhook.status,
            receivedAt: latestWebhook.receivedAt.toISOString(),
            lastError: latestWebhook.lastError,
          }
        : null,
    };
  }

  const execution = await buildSyncOperation(latestExec);

  // Fetch checkpoints
  const checkpoints = await db.syncCheckpoint.findMany({
    where: { syncExecutionId: latestExec.id },
    orderBy: { resource: "asc" },
    select: {
      resource: true,
      cursor: true,
      sourceWatermark: true,
      lastCompletedPage: true,
    },
  });

  // Fetch latest webhook
  const latestWebhook = await db.webhookReceipt.findFirst({
    where: { organizationId: orgId },
    orderBy: { receivedAt: "desc" },
    select: {
      eventType: true,
      status: true,
      receivedAt: true,
      lastError: true,
    },
  });

  return {
    execution,
    checkpoints: checkpoints.map((cp) => ({
      resource: cp.resource,
      cursor: cp.cursor,
      sourceWatermark: cp.sourceWatermark,
      lastCompletedPage: cp.lastCompletedPage,
    })),
    latestWebhook: latestWebhook
      ? {
          eventType: latestWebhook.eventType,
          status: latestWebhook.status,
          receivedAt: latestWebhook.receivedAt.toISOString(),
          lastError: latestWebhook.lastError,
        }
      : null,
  };
}
