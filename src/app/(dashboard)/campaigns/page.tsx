import {
  PageHeader,
  SectionHeader,
} from "@/components/shared/layout-primitives";
import { CAMPAIGNS } from "@/lib/mock-data";
import { CampaignCard } from "@/components/rescueloop/campaigns/campaign-card";
import { CreateCampaignButton } from "@/components/rescueloop/campaigns/create-campaign-button";

export default function CampaignsPage() {
  const activeCount = CAMPAIGNS.filter((c) => c.status === "active").length;

  return (
    <div className="pb-4">
      <PageHeader
        title="Campaigns"
        description="Automated recovery interventions with safety controls"
        actions={<CreateCampaignButton />}
      />

      <SectionHeader
        title="All campaigns"
        description={`${activeCount} of ${CAMPAIGNS.length} campaigns active`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPAIGNS.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}
