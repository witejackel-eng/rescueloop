// /dashboard/[companyId]/insights
//
// Canonical insights page (WP06). Friction findings, course funnels,
// and recommended next actions.
// Now wired up with the Course Intelligence API and live data.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Badge } from "@/components/ui/badge";
import { InsightsPageClient } from "@/components/rescueloop/insights/insights-page-client";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  try {
    await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Insights"
        description="Friction findings, course funnels, and recommended next actions."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          Insights
        </Badge>
      </CompanyPageHeader>

      <InsightsPageClient companyId={companyId} />
    </div>
  );
}
