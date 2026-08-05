// /companies/[companyId]/value
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// a value-ledger placeholder. The full database-backed attribution engine
// lands in Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ValuePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Value ledger"
      description="Attribution ledger, ROI panel, and the evidence timeline."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={DollarSign}
    >
      The attribution waterfall (confirmed → strongly-associated →
      estimated value), the per-intervention value ledger (revenue
      retained, reversals, recoveries), and the evidence timeline
      showing every value event with its attribution level.
    </CompanyStubCard>
  );
}
