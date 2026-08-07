// ─────────────────────────────────────────────────────────────
// PX07 — Growth Instrumentation API
// Returns funnel analysis + referral aggregates + case studies.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getDemoFunnelAnalysis } from "@/lib/growth/funnel-tracker";
import { getDemoReferralAggregates, DEMO_CASE_STUDIES } from "@/lib/growth/referral";

export async function GET() {
  const funnel = getDemoFunnelAnalysis();
  const referrals = getDemoReferralAggregates();
  const caseStudies = DEMO_CASE_STUDIES;

  return NextResponse.json({
    funnel,
    referrals,
    caseStudies,
    meta: {
      source: "demo",
      privacy: "All events are privacy-safe. No raw PII.",
    },
  });
}
