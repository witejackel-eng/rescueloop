// GET /api/dashboard/[companyId]/operations/[operationId]
//
// Returns a single operation by ID, scoped to the organization.
// In fixture mode, returns 404 (no real operations).
// In connected mode, looks up the operation by ID.
//
// FAIL-CLOSED: Uses requireCompanyAccess() — never returns data without auth.

import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getOperation } from "@/lib/operations/operation-read-model";

export async function GET(
  _req: Request,
  {
    params,
  }: { params: Promise<{ companyId: string; operationId: string }> },
) {
  const { companyId, operationId } = await params;

  let context;
  try {
    context = await requireCompanyAccess(companyId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fixture mode has no real operations
  if (context.mode === "fixture") {
    return NextResponse.json(
      { error: "Operation not found" },
      { status: 404 },
    );
  }

  // Connected mode — look up operation
  try {
    const operation = await getOperation(context.organizationId, operationId);

    if (!operation) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ operation });
  } catch (error) {
    console.error("[api/dashboard/operations/[id]] DB error:", error);
    return NextResponse.json(
      { error: "Failed to load operation" },
      { status: 500 },
    );
  }
}
