// Sync progress types and pure functions — client-safe.
//
// DB-touching functions live in sync-progress.ts (server-only).

// ─── Sync stage enum ────────────────────────────────────────────

export enum SyncStage {
  CompanyRefs = "company_refs",
  Memberships = "memberships",
  Members = "members",
  Students = "students",
  Lessons = "lessons",
  Progress = "progress",
  Reconciliation = "reconciliation",
  CandidateEval = "candidate_eval",
}

export const SYNC_STAGE_ORDER: SyncStage[] = [
  SyncStage.CompanyRefs,
  SyncStage.Memberships,
  SyncStage.Members,
  SyncStage.Students,
  SyncStage.Lessons,
  SyncStage.Progress,
  SyncStage.Reconciliation,
  SyncStage.CandidateEval,
];

/** Human-readable labels for each sync stage. */
export const SYNC_STAGE_LABELS: Record<SyncStage, string> = {
  [SyncStage.CompanyRefs]: "Company references",
  [SyncStage.Memberships]: "Membership data",
  [SyncStage.Members]: "Member profiles",
  [SyncStage.Students]: "Student records",
  [SyncStage.Lessons]: "Lesson structure",
  [SyncStage.Progress]: "Progress events",
  [SyncStage.Reconciliation]: "Reconciliation",
  [SyncStage.CandidateEval]: "Candidate evaluation",
};

// ─── Sync progress types ────────────────────────────────────────

export interface StageProgress {
  stage: SyncStage;
  status: "pending" | "in_progress" | "completed" | "failed";
  recordsProcessed: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export interface SyncFailure {
  stage: SyncStage;
  message: string;
  retryable: boolean;
  occurredAt: string;
}

export interface SyncProgress {
  /** Progress for each stage. */
  stages: StageProgress[];
  /** Currently executing stage. */
  currentStage: SyncStage | null;
  /** Total records processed across all stages. */
  recordsProcessed: number;
  /** Total records to process (if known; 0 = unknown). */
  totalRecords: number;
  /** Timestamp of last successful provider response. */
  lastProviderResponseAt: string | null;
  /** Most recent failure, if any. */
  failure: SyncFailure | null;
  /** When the sync started. */
  startedAt: string;
}

// ─── Constants ──────────────────────────────────────────────────

/** Time threshold for stale run detection (30 minutes). */
const STALE_THRESHOLD_MS = 30 * 60 * 1000;

// ─── Factory helpers (pure — client-safe) ───────────────────────

/**
 * Create initial sync progress with all stages pending.
 */
export function createInitialSyncProgress(): SyncProgress {
  const now = new Date().toISOString();
  return {
    stages: SYNC_STAGE_ORDER.map((stage): StageProgress => ({
      stage,
      status: "pending",
      recordsProcessed: 0,
      startedAt: null,
      completedAt: null,
      error: null,
    })),
    currentStage: null,
    recordsProcessed: 0,
    totalRecords: 0,
    lastProviderResponseAt: null,
    failure: null,
    startedAt: now,
  };
}

/**
 * Mark a stage as started.
 */
export function startStage(progress: SyncProgress, stage: SyncStage): SyncProgress {
  const now = new Date().toISOString();
  const stages = progress.stages.map((s) =>
    s.stage === stage
      ? { ...s, status: "in_progress" as const, startedAt: now }
      : s,
  );
  return { ...progress, stages, currentStage: stage };
}

/**
 * Mark a stage as completed with the number of records processed.
 */
export function completeStage(
  progress: SyncProgress,
  stage: SyncStage,
  recordsProcessed: number,
): SyncProgress {
  const now = new Date().toISOString();
  const stages = progress.stages.map((s) =>
    s.stage === stage
      ? {
          ...s,
          status: "completed" as const,
          recordsProcessed,
          completedAt: now,
        }
      : s,
  );

  const totalRecordsProcessed = stages.reduce(
    (sum, s) => sum + s.recordsProcessed,
    0,
  );

  // Advance to next stage
  const currentIdx = SYNC_STAGE_ORDER.indexOf(stage);
  const nextStage =
    currentIdx < SYNC_STAGE_ORDER.length - 1
      ? SYNC_STAGE_ORDER[currentIdx + 1]
      : null;

  return {
    ...progress,
    stages,
    currentStage: nextStage,
    recordsProcessed: totalRecordsProcessed,
    lastProviderResponseAt: now,
  };
}

/**
 * Mark a stage as failed.
 */
export function failStage(
  progress: SyncProgress,
  stage: SyncStage,
  message: string,
  retryable = true,
): SyncProgress {
  const now = new Date().toISOString();
  const stages = progress.stages.map((s) =>
    s.stage === stage
      ? { ...s, status: "failed" as const, error: message }
      : s,
  );

  return {
    ...progress,
    stages,
    failure: { stage, message, retryable, occurredAt: now },
  };
}

/**
 * Check if a sync run is stale (no updates for > 30 minutes).
 */
export function isStaleRun(progress: SyncProgress): boolean {
  const lastUpdate =
    progress.lastProviderResponseAt ?? progress.startedAt;
  if (!lastUpdate) return true;
  return Date.now() - new Date(lastUpdate).getTime() > STALE_THRESHOLD_MS;
}

/**
 * Compute the overall progress fraction (0..1).
 */
export function getSyncProgressFraction(progress: SyncProgress): number {
  const completed = progress.stages.filter(
    (s) => s.status === "completed",
  ).length;
  return completed / progress.stages.length;
}

/**
 * Get the current stage index (0-based).
 */
export function getCurrentStageIndex(progress: SyncProgress): number {
  if (!progress.currentStage) return 0;
  return SYNC_STAGE_ORDER.indexOf(progress.currentStage);
}

// ─── Serialization ──────────────────────────────────────────────

export function serializeSyncProgress(progress: SyncProgress): string {
  return JSON.stringify(progress);
}

export function deserializeSyncProgress(json: string): SyncProgress | null {
  try {
    const parsed = JSON.parse(json) as SyncProgress;
    if (Array.isArray(parsed.stages) && typeof parsed.recordsProcessed === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
