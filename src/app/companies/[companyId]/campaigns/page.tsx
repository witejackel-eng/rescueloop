// /companies/[companyId]/campaigns
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// a campaigns placeholder. The full database-backed campaign editor
// lands in Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Campaigns"
      description="Rescue campaigns, message templates, and audience rules."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={Megaphone}
    >
      A list of campaigns (Activation Rescue, Early-Progress Rescue,
      Mid-Course Rescue, etc.) with status, audience size, interventions
      sent, and rescue rate. The campaign editor (rules, message
      template, safety config, version history) opens inline.
    </CompanyStubCard>
  );
}
