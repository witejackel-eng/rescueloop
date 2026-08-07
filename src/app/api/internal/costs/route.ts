// ─────────────────────────────────────────────────────────────
// PX05 — Cost Guardrails API
// Returns per-tenant cost estimates + summary.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getDemoCostEstimates, getDemoCostSummary } from "@/lib/cost/cost-calculator";

export async function GET() {
  const estimates = getDemoCostEstimates();
  const summary = getDemoCostSummary();

  return NextResponse.json({
    estimates,
    summary,
    meta: {
      source: "demo",
      disclaimer: "Internal planning estimates — not accounting truth",
      rateCardVersion: 3,
    },
  });
}
