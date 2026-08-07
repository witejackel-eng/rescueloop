import Link from "next/link";
import {
  ChevronRight,
  Compass,
  Flag,
  Footprints,
  ShieldAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignType } from "@/lib/types";

export const CAMPAIGN_ICONS: Record<CampaignType, LucideIcon> = {
  activation_rescue: Zap,
  early_progress_rescue: Footprints,
  mid_course_rescue: Compass,
  near_finish_rescue: Flag,
  cancellation_rescue: ShieldAlert,
};

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  activation_rescue: "Activation rescue",
  early_progress_rescue: "Early progress rescue",
  mid_course_rescue: "Mid-course rescue",
  near_finish_rescue: "Near-finish rescue",
  cancellation_rescue: "Cancellation rescue",
};

interface CampaignListRowProps {
  campaign: Campaign;
}

export function CampaignListRow({ campaign }: CampaignListRowProps) {
  const Icon = CAMPAIGN_ICONS[campaign.type];
  const isActive = campaign.status === "active";
  const isCancellation = campaign.type === "cancellation_rescue";

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="press group relative flex flex-col gap-4 border-b border-[var(--hairline)] bg-[var(--surface)] px-4 py-4 transition-colors hover:bg-[var(--canvas-elevated)] lg:flex-row lg:items-stretch lg:gap-6 lg:px-5 lg:py-5"
    >
      {/* Left: icon + name + approval mode */}
      <div className="flex min-w-0 flex-1 items-start gap-3 lg:w-[280px] lg:flex-none">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink-primary)]">
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[18px] leading-tight text-[var(--ink-primary)]">
            {campaign.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {CAMPAIGN_TYPE_LABELS[campaign.type]}
            </span>
            <span className="text-[var(--ink-muted)]">·</span>
            <span
              className={cn(
                "inline-flex items-center rounded-[2px] border px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.08em]",
                campaign.approvalMode === "automatic"
                  ? "border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink-secondary)]"
                  : "border-[var(--warning-light)] bg-[var(--warning-light)] text-[var(--warning)]",
              )}
            >
              {campaign.approvalMode === "automatic" ? "Automatic" : "Manual approval"}
            </span>
            {isCancellation && (
              <span className="text-[11px] italic text-[var(--warning)]">
                Defaults to manual approval
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: 4 stats with 1px dividers */}
      <div className="grid flex-1 grid-cols-2 divide-x divide-[var(--hairline)] border-y border-[var(--hairline)] lg:grid-cols-4 lg:border-x lg:border-y-0">
        <Stat label="Detected" value={campaign.studentsDetected} />
        <Stat label="Sent" value={campaign.interventionsSent} />
        <Stat label="Resumed" value={campaign.studentsResumed} />
        <Stat label="Rescue rate" value={campaign.rescueRate} suffix="%" />
      </div>

      {/* Right: status + chevron */}
      <div className="flex items-center justify-between gap-3 lg:w-[140px] lg:flex-none lg:justify-end">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isActive ? "bg-[var(--recovery-green)]" : "bg-[var(--ink-muted)]",
            )}
            aria-hidden
          />
          <span className="text-[12px] text-[var(--ink-secondary)]">
            {isActive ? "Active" : "Paused"}
          </span>
        </div>
        <ChevronRight className="size-4 text-[var(--ink-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--ink-primary)]" />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 lg:py-1.5">
      <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
        {label}
      </span>
      <span className="font-mono text-[16px] tabular-nums text-[var(--ink-primary)]">
        {value}
        {suffix && <span className="text-[var(--ink-muted)]">{suffix}</span>}
      </span>
    </div>
  );
}
