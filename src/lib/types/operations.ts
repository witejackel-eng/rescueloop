// ─────────────────────────────────────────────────────────────
// PX01 — Async Trust UX: Operation types
// Every long-running operation has real persisted progress.
// No fake ETAs. No cosmetic percentage without a real denominator.
// ─────────────────────────────────────────────────────────────

// ── Sync stages for the first Whop sync ─────────────────────
export type SyncStage =
  | "connecting"
  | "fetching_members"
  | "fetching_courses"
  | "evaluating"
  | "complete";

export const SYNC_STAGES: SyncStage[] = [
  "connecting",
  "fetching_members",
  "fetching_courses",
  "evaluating",
  "complete",
];

export const syncStageMeta: Record<
  SyncStage,
  { label: string; description: string }
> = {
  connecting: {
    label: "Connecting",
    description: "Establishing connection to Whop",
  },
  fetching_members: {
    label: "Fetching members",
    description: "Downloading member list from Whop",
  },
  fetching_courses: {
    label: "Fetching courses",
    description: "Downloading course progress data",
  },
  evaluating: {
    label: "Evaluating",
    description: "Running risk detection on imported data",
  },
  complete: {
    label: "Complete",
    description: "Sync finished successfully",
  },
};

// ── General operation stages ────────────────────────────────
export type OperationStageStatus = "pending" | "active" | "complete" | "failed";

export interface OperationStage {
  id: string;
  label: string;
  status: OperationStageStatus;
  /** Real count of items processed in this stage */
  processed: number;
  /** Real total items for this stage (the denominator) */
  total: number;
  /** Optional error message if status is "failed" */
  error?: string;
}

// ── Provider state ──────────────────────────────────────────
export type ProviderState =
  | { type: "healthy" }
  | { type: "delayed"; since: string; reason: string }
  | { type: "retrying"; attempt: number; maxAttempts: number; nextRetryAt: string }
  | { type: "permission_required"; permission: string; actionUrl: string }
  | { type: "disconnected"; reason: string; reconnectUrl?: string };

// ── Candidate preview ───────────────────────────────────────
/** First useful candidate — shown before total completion
 *  so the user gets value immediately. */
export interface CandidatePreview {
  id: string;
  name: string;
  riskSegment: string;
  monthlyValue: number;
  recommendedAction: string;
}

// ── Operation status ────────────────────────────────────────
export type OperationStatus =
  | "pending"
  | "running"
  | "complete"
  | "failed"
  | "cancelled";

// ── Persistence state (determines safe-to-leave) ────────────
export type PersistenceState = "not_persisted" | "persisted" | "persisting";

// ── Operation (the full object) ─────────────────────────────
export interface Operation {
  id: string;
  type: string;
  status: OperationStatus;
  /** Labeled stages with real counts */
  stages: OperationStage[];
  /** Current stage index */
  currentStageIndex: number;
  /** Whether progress is persisted to the server */
  persistenceState: PersistenceState;
  /** Provider connection state */
  providerState: ProviderState;
  /** First useful candidate preview (may appear before full completion) */
  candidatePreview?: CandidatePreview;
  /** When the operation was created */
  createdAt: string;
  /** When the operation was last updated */
  updatedAt: string;
  /** When the operation completed (if complete) */
  completedAt?: string;
  /** Operation-specific metadata */
  meta?: Record<string, unknown>;
}

// ── API request/response shapes ─────────────────────────────
export interface CreateOperationRequest {
  type: string;
  meta?: Record<string, unknown>;
}

export interface UpdateOperationRequest {
  status?: OperationStatus;
  stages?: OperationStage[];
  currentStageIndex?: number;
  persistenceState?: PersistenceState;
  providerState?: ProviderState;
  candidatePreview?: CandidatePreview | null;
  completedAt?: string;
}

// ── Helpers ─────────────────────────────────────────────────
/** Compute overall processed/total across all stages. */
export function operationCounts(op: Operation): {
  processed: number;
  total: number;
} {
  let processed = 0;
  let total = 0;
  for (const stage of op.stages) {
    processed += stage.processed;
    total += stage.total;
  }
  return { processed, total };
}

/** Is it safe for the user to leave the page? */
export function isSafeToLeave(op: Operation): boolean {
  if (op.status === "complete" || op.status === "failed" || op.status === "cancelled") {
    return true;
  }
  return op.persistenceState === "persisted";
}

/** Is the operation in a provider-delayed state that requires action? */
export function requiresUserAction(op: Operation): boolean {
  const ps = op.providerState;
  return ps.type === "permission_required" || ps.type === "disconnected";
}
