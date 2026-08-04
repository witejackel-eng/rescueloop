import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCampaignById } from "@/lib/mock-data";
import { CampaignEditor } from "@/components/rescueloop/campaigns/campaign-editor";
import { Button } from "@/components/ui/button";

export default async function CampaignEditorPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const campaign = getCampaignById(campaignId);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-sm text-[#6A706A]">Campaign not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/campaigns">
            <ArrowLeft className="size-3.5" />
            Back to campaigns
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6A706A] transition-colors hover:text-[#171A17]"
      >
        <ArrowLeft className="size-3.5" />
        Back to campaigns
      </Link>

      <div className="mt-4">
        <CampaignEditor campaign={campaign} />
      </div>
    </div>
  );
}
