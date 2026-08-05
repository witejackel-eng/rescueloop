// /companies/[companyId]/overview
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// a placeholder. The full database-backed recovery pulse + system status
// lands in Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Overview"
      description="Recovery pulse, system status, and the next creator action — at a glance."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={LayoutDashboard}
    >
      A live recovery pulse (active interventions, students recovered,
      revenue retained this period), system-status indicators (Whop sync
      health, installation state, automation mode), and a prioritised
      list of the next creator actions awaiting your review.
    </CompanyStubCard>
  );
}
