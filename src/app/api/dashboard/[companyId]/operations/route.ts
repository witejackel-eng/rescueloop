// GET /api/dashboard/[companyId]/operations
//
// Returns all operations for the company, most recent first.
// In fixture mode, returns empty array (no real operations).
// In connected mode, uses the operation read model to query persisted state.
//
// FAIL-CLOSED: Uses requireCompanyAccess() — never returns data without auth.

import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getOrganizationOperations } from "@/lib/operations/operation-read-model";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  let context;
  try {
    context = await requireCompanyAccess(companyId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fixture mode has no real operations
  if (context.mode === "fixture") {
    return NextResponse.json({ operations: [] });
  }

  // Connected mode — query real operations
  try {
    const operations = await getOrganizationOperations(context.organizationId);
    return NextResponse.json({ operations });
  } catch (error) {
    console.error("[api/dashboard/operations] DB error:", error);
    return NextResponse.json(
      { error: "Failed to load operations" },
      { status: 500 },
    );
  }
}
