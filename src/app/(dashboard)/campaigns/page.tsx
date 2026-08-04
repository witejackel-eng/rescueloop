import { Megaphone, ShieldCheck } from "lucide-react";
import { CAMPAIGNS } from "@/lib/mock-data";
import { CampaignListRow } from "@/components/rescueloop/campaigns/campaign-list-row";

// Pull the global safety defaults from the first campaign (they're identical
// across every campaign in the demo dataset). Read as clauses for the
// "Campaign safety overview" panel.
const GLOBAL_SAFETY = CAMPAIGNS[0].safety;

export default function CampaignsPage() {
  const activeCount = CAMPAIGNS.filter((c) => c.status === "active").length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[28px] leading-none text-[var(--ink-primary)]">
            Campaign Studio
          </h1>
          <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
            Five recovery campaigns with safety controls
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[var(--ink-secondary)]">
          <Megaphone className="size-3.5 text-[var(--ink-muted)]" />
          <span className="font-mono tabular-nums text-[var(--ink-primary)]">
            {activeCount}
          </span>
          <span className="text-[var(--ink-muted)]">/</span>
          <span className="font-mono tabular-nums">{CAMPAIGNS.length}</span>
          <span className="text-[var(--ink-muted)]">active</span>
        </div>
      </header>

      {/* Editorial campaign list */}
      <section className="overflow-hidden rounded-none border border-[var(--hairline)] bg-[var(--surface)]">
        {/* List header row (desktop only) */}
        <div className="hidden border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-5 py-2 lg:flex lg:items-center lg:gap-6">
          <span className="w-[280px] shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Campaign
          </span>
          <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Outcomes (all-time)
          </span>
          <span className="w-[140px] shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Status
          </span>
        </div>
        <div>
          {CAMPAIGNS.map((campaign) => (
            <CampaignListRow key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>

      {/* Campaign safety overview */}
      <section className="rounded-none border border-[var(--hairline)] bg-[var(--surface)]">
        <div className="flex items-baseline justify-between border-b border-[var(--hairline)] px-5 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[var(--recovery-green)]" />
            <h2 className="font-serif text-[18px] text-[var(--ink-primary)]">
              Campaign safety overview
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Global defaults
          </span>
        </div>
        <div className="px-5 py-4">
          <p className="font-serif text-[18px] leading-relaxed text-[var(--ink-primary)]">
            Every campaign caps messaging at{" "}
            <Bold>{GLOBAL_SAFETY.maxMessagesPerMember} messages</Bold> per member,
            with a{" "}
            <Bold>{GLOBAL_SAFETY.cooldownDays}-day cooldown</Bold> between
            interventions. Messages pause during quiet hours from{" "}
            <Bold>
              {GLOBAL_SAFETY.quietHoursStart}–{GLOBAL_SAFETY.quietHoursEnd}
            </Bold>
            .
          </p>
          <p className="mt-3 font-serif text-[18px] leading-relaxed text-[var(--ink-primary)]">
            Sending stops automatically when a member{" "}
            {GLOBAL_SAFETY.stopAfterResponse ? (
              <Bold>responds</Bold>
            ) : (
              <span className="text-[var(--ink-muted)] line-through">responds</span>
            )}
            , when their{" "}
            {GLOBAL_SAFETY.stopAfterProgressResumes ? (
              <Bold>progress resumes</Bold>
            ) : (
              <span className="text-[var(--ink-muted)] line-through">progress resumes</span>
            )}
            , or when their{" "}
            {GLOBAL_SAFETY.stopAfterMembershipEnds ? (
              <Bold>membership ends</Bold>
            ) : (
              <span className="text-[var(--ink-muted)] line-through">membership ends</span>
            )}
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[16px] font-medium tabular-nums text-[var(--ink-primary)]">
      {children}
    </span>
  );
}
