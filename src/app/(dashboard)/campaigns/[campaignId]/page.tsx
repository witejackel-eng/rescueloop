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
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="font-serif text-[24px] text-[var(--ink-primary)]">
          Campaign not found
        </p>
        <p className="max-w-sm text-[13px] text-[var(--ink-muted)]">
          The campaign you&apos;re looking for doesn&apos;t exist or has been
          archived.
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-[2px]">
          <Link href="/campaigns">
            <ArrowLeft className="size-3.5" />
            Back to Campaign Studio
          </Link>
        </Button>
      </div>
    );
  }

  return <CampaignEditor campaign={campaign} />;
}
