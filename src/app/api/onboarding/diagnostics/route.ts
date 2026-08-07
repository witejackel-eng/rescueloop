// API route: GET /api/onboarding/diagnostics
// Runs permission diagnostics for the onboarding access_check step.
// Returns safe diagnostic results (no secrets or raw payloads).

import { NextRequest, NextResponse } from "next/server";
import { runDiagnostics } from "@/lib/onboarding/permission-diagnostics";
import { trackDiagnosticResult } from "@/lib/onboarding/analytics";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger({ route: "/api/onboarding/diagnostics" });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const organizationId = searchParams.get("organizationId");

  if (!companyId || !organizationId) {
    return NextResponse.json(
      { error: "companyId and organizationId are required" },
      { status: 400 },
    );
  }

  try {
    const report = await runDiagnostics(companyId, organizationId);

    // Track each diagnostic result as an analytics event
    for (const result of report.results) {
      trackDiagnosticResult(
        companyId,
        organizationId,
        result.category,
        result.status,
        result.requiresOwnerHelp,
      );
    }

    // Return safe results — the runDiagnostics function already
    // ensures no secrets or raw payloads are included
    return NextResponse.json({
      results: report.results,
      overallStatus: report.overallStatus,
      canProceedToMapping: report.canProceedToMapping,
      checkedAt: report.checkedAt,
    });
  } catch (error) {
    log.error("Diagnostics failed", {
      action: "GET",
      companyId,
      organizationId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });

    return NextResponse.json(
      { error: "Diagnostics failed. Please try again." },
      { status: 500 },
    );
  }
}
