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

// ── GET /api/operations/[id] — Get single operation ─────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const row = await db.operation.findUnique({ where: { id } });

    if (!row) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ operation: deserializeRow(row) });
  } catch (error) {
    console.error("Failed to get operation:", error);
    return NextResponse.json(
      { error: "Failed to get operation" },
      { status: 500 },
    );
  }
}

// ── PATCH /api/operations/[id] — Update operation ───────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Verify operation exists
    const existing = await db.operation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 },
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.stages !== undefined)
      updateData.stages = JSON.stringify(body.stages);
    if (body.currentStageIndex !== undefined)
      updateData.currentStageIndex = body.currentStageIndex;
    if (body.persistenceState !== undefined)
      updateData.persistenceState = body.persistenceState;
    if (body.providerState !== undefined)
      updateData.providerState = JSON.stringify(body.providerState);
    if (body.candidatePreview !== undefined)
      updateData.candidatePreview = body.candidatePreview
        ? JSON.stringify(body.candidatePreview)
        : null;
    if (body.completedAt !== undefined)
      updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null;

    const row = await db.operation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ operation: deserializeRow(row) });
  } catch (error) {
    console.error("Failed to update operation:", error);
    return NextResponse.json(
      { error: "Failed to update operation" },
      { status: 500 },
    );
  }
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
