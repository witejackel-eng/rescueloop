// /companies/[companyId]/insights
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// an insights placeholder. The full database-backed friction explorer +
// course funnel lands in Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Insights"
      description="Friction findings, course funnels, and recommended next actions."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={BarChart3}
    >
      The friction explorer (lessons with the highest stall rate,
      aggregated from student blocker responses), the course funnel
      (drop-off per lesson), and a recommendation workflow that turns
      findings into campaign-rule changes.
    </CompanyStubCard>
  );
}
