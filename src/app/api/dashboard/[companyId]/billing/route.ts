// GET /api/dashboard/[companyId]/billing
//
// Returns current plan, usage, limits, and entitlement state.
// Includes membership manage_url for self-service billing.

import { NextResponse } from "next/server";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { computeEntitlement, getUsageSummary } from "@/lib/billing/entitlement-engine";

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

  // Compute current entitlement
  const entitlement = await computeEntitlement(context.organizationId);

  // Get usage summary for all metrics
  const usage = await getUsageSummary(context.organizationId);

  return NextResponse.json({
    ok: true,
    entitlement: {
      state: entitlement.state,
      planTier: entitlement.planTier,
      billingPeriodEnd: entitlement.billingPeriodEnd,
      gracePeriodEndsAt: entitlement.gracePeriodEndsAt,
      manageUrl: entitlement.manageUrl,
      isPilotOverride: entitlement.isPilotOverride,
    },
    limits: entitlement.limits,
    usage,
  });
}
