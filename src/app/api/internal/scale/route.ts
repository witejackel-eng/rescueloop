// ─────────────────────────────────────────────────────────────
// PX06 — Scale Certification API
// Returns pre-computed benchmark results and multi-tenant data.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getDemoBenchmarkResults, getDemoMultiTenantResults, getBenchmarkSummary } from "@/lib/scale/benchmark-runner";

export async function GET() {
  const results = getDemoBenchmarkResults();
  const multiTenantResults = getDemoMultiTenantResults();
  const summary = getBenchmarkSummary();

  return NextResponse.json({
    results,
    multiTenantResults,
    summary,
    meta: {
      source: "demo",
      disclaimer: "Scale certification — recommendations only, does NOT change plan limits",
      scaleMemberCap: 2500,
      isHardCap: true,
    },
  });
}
