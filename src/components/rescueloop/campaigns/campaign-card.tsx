import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Flag,
  Footprints,
  ShieldAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/shared/status-pills";
import type { Campaign, CampaignType } from "@/lib/types";

const CAMPAIGN_ICONS: Record<CampaignType, LucideIcon> = {
  activation_rescue: Zap,
  early_progress_rescue: Footprints,
  mid_course_rescue: Compass,
  near_finish_rescue: Flag,
  cancellation_rescue: ShieldAlert,
};

const CAMPAIGN_ACCENTS: Record<CampaignType, string> = {
  activation_rescue: "bg-[#E8F5EF] text-[#147D68]",
  early_progress_rescue: "bg-[#E8F0FE] text-[#4C7ECF]",
  mid_course_rescue: "bg-[#FEF3E2] text-[#D89222]",
  near_finish_rescue: "bg-[#E8F5EF] text-[#27966A]",
  cancellation_rescue: "bg-[#F4E8E6] text-[#C64D45]",
};

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  activation_rescue: "Activation rescue",
  early_progress_rescue: "Early progress rescue",
  mid_course_rescue: "Mid-course rescue",
  near_finish_rescue: "Near-finish rescue",
  cancellation_rescue: "Cancellation rescue",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const Icon = CAMPAIGN_ICONS[campaign.type];
  const accent = CAMPAIGN_ACCENTS[campaign.type];
  const isActive = campaign.status === "active";

  return (
    <Card className="gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent}`}
            >
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-[#171A17]">
                {campaign.name}
              </h3>
              <p className="mt-0.5 text-xs text-[#6A706A]">
                {CAMPAIGN_TYPE_LABELS[campaign.type]}
              </p>
            </div>
          </div>
          <StatusPill
            className={
              isActive
                ? "border-[#C7E6D5] bg-[#E8F5EF] text-[#27966A]"
                : "border-[#E3E5DF] bg-[#F0F2EC] text-[#6A706A]"
            }
            dot
            dotColor={isActive ? "bg-[#27966A]" : "bg-[#6A706A]"}
          >
            {isActive ? "Active" : "Paused"}
          </StatusPill>
        </div>

        {/* Badges row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-[#E3E5DF] bg-[#F8F8F5] font-medium text-[#6A706A]"
          >
            {campaign.approvalMode === "automatic"
              ? "Automatic"
              : "Manual approval"}
          </Badge>
          {campaign.type === "cancellation_rescue" && (
            <Badge
              variant="outline"
              className="border-[#F5E0C2] bg-[#FEF3E2] font-medium text-[#D89222]"
            >
              Defaults to manual approval
            </Badge>
          )}
        </div>

        {/* Stats 2x2 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatTile label="Students detected" value={campaign.studentsDetected} />
          <StatTile label="Interventions sent" value={campaign.interventionsSent} />
          <StatTile label="Students resumed" value={campaign.studentsResumed} />
          <StatTile label="Rescue rate" value={`${campaign.rescueRate}%`} />
        </div>

        {/* Rescue-rate progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-[#6A706A]">
            <span>Rescue rate</span>
            <span className="tabular-mono font-medium text-[#171A17]">
              {campaign.rescueRate}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F0F2EC]">
            <div
              className="h-full rounded-full bg-[#147D68] transition-all"
              style={{ width: `${Math.min(100, campaign.rescueRate)}%` }}
            />
          </div>
        </div>

        {/* Action */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-4 w-full gap-1.5 border-[#E3E5DF] text-[#171A17] hover:bg-[#F8F8F5]"
        >
          <Link href={`/campaigns/${campaign.id}`}>
            Edit campaign
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-[#E3E5DF] bg-[#F8F8F5] px-3 py-2">
      <p className="text-xs text-[#6A706A]">{label}</p>
      <p className="tabular-mono mt-0.5 text-base font-semibold text-[#171A17]">
        {value}
      </p>
    </div>
  );
}
