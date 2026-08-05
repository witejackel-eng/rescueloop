// /companies/[companyId]/usage
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// a plan-usage placeholder. The full database-backed usage tracking lands
// in Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { Gauge } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsagePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Usage"
      description="Plan limits, monthly consumption, and overage warnings."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={Gauge}
    >
      The current plan tier, monthly limits (interventions sent, students
      monitored, webhooks processed), consumption this billing period,
      and projected overage. Includes a usage sparkline and a CTA to
      upgrade when approaching the limit.
    </CompanyStubCard>
  );
}
