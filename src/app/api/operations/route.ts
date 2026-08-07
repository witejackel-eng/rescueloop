import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type {
  Operation,
  OperationStage,
  OperationStatus,
  PersistenceState,
  ProviderState,
  CandidatePreview,
} from "@/lib/types/operations";

// ── GET /api/operations — List all operations ───────────────
export async function GET() {
  try {
    const rows = await db.operation.findMany({
      orderBy: { createdAt: "desc" },
    });

    const operations: Operation[] = rows.map(deserializeRow);
    return NextResponse.json({ operations });
  } catch (error) {
    console.error("Failed to list operations:", error);
    return NextResponse.json(
      { error: "Failed to list operations" },
      { status: 500 },
    );
  }
}

// ── POST /api/operations — Create operation ─────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type as string | undefined;
    const meta = body.meta as Record<string, unknown> | undefined;

    if (!type) {
      return NextResponse.json(
        { error: "Missing required field: type" },
        { status: 400 },
      );
    }

    // Default stages based on type
    const stages: OperationStage[] = getDefaultStages(type);

    const row = await db.operation.create({
      data: {
        type,
        status: "pending",
        stages: JSON.stringify(stages),
        currentStageIndex: 0,
        persistenceState: "not_persisted",
        providerState: JSON.stringify({ type: "healthy" }),
        candidatePreview: null,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });

    return NextResponse.json({ operation: deserializeRow(row) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create operation:", error);
    return NextResponse.json(
      { error: "Failed to create operation" },
      { status: 500 },
    );
  }
}

// ── Default stages for operation types ──────────────────────
function getDefaultStages(type: string): OperationStage[] {
  if (type === "whop_sync") {
    return [
      { id: "connecting", label: "Connecting", status: "pending", processed: 0, total: 1 },
      { id: "fetching_members", label: "Fetching members", status: "pending", processed: 0, total: 0 },
      { id: "fetching_courses", label: "Fetching courses", status: "pending", processed: 0, total: 0 },
      { id: "evaluating", label: "Evaluating", status: "pending", processed: 0, total: 0 },
      { id: "complete", label: "Complete", status: "pending", processed: 0, total: 1 },
    ];
  }
  if (type === "bulk_evaluate") {
    return [
      { id: "loading", label: "Loading students", status: "pending", processed: 0, total: 0 },
      { id: "evaluating", label: "Evaluating risk", status: "pending", processed: 0, total: 0 },
      { id: "complete", label: "Complete", status: "pending", processed: 0, total: 1 },
    ];
  }
  // Generic
  return [
    { id: "preparing", label: "Preparing", status: "pending", processed: 0, total: 1 },
    { id: "processing", label: "Processing", status: "pending", processed: 0, total: 0 },
    { id: "complete", label: "Complete", status: "pending", processed: 0, total: 1 },
  ];
}

// ── Deserialize DB row → Operation ──────────────────────────
function deserializeRow(row: {
  id: string;
  type: string;
  status: string;
  stages: string;
  currentStageIndex: number;
  persistenceState: string;
  providerState: string;
  candidatePreview: string | null;
  meta: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): Operation {
  return {
    id: row.id,
    type: row.type,
    status: row.status as OperationStatus,
    stages: JSON.parse(row.stages) as OperationStage[],
    currentStageIndex: row.currentStageIndex,
    persistenceState: row.persistenceState as PersistenceState,
    providerState: JSON.parse(row.providerState) as ProviderState,
    candidatePreview: row.candidatePreview
      ? (JSON.parse(row.candidatePreview) as CandidatePreview)
      : undefined,
    meta: row.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? undefined,
  };
}
