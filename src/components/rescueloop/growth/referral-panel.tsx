"use client";

// ─────────────────────────────────────────────────────────────
// PX07 — Referral Panel
// Referral source tracking + case-study consent.
// Minimal — NOT a large affiliate platform.
// ─────────────────────────────────────────────────────────────

import type { FC } from "react";
import type { ReferralAggregate, CaseStudyConsent } from "@/lib/types/growth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";

interface ReferralPanelProps {
  referrals: ReferralAggregate[];
  caseStudies: CaseStudyConsent[];
}

const CHANNEL_LABELS: Record<string, string> = {
  organic: "Organic Search",
  word_of_mouth: "Word of Mouth",
  content: "Content",
  partner: "Partner",
  ad: "Paid Ads",
  community: "Community",
  other: "Other",
};

const CHANNEL_COLORS: Record<string, string> = {
  organic: "text-[var(--recovery-green)]",
  word_of_mouth: "text-[var(--info)]",
  content: "text-[var(--warning)]",
  partner: "text-[var(--ink-primary)]",
  ad: "text-[var(--critical)]",
  community: "text-[var(--ink-secondary)]",
  other: "text-[var(--ink-muted)]",
};

export const ReferralPanel: FC<ReferralPanelProps> = ({ referrals, caseStudies }) => {
  const totalReferrals = referrals.reduce((s, r) => s + r.count, 0);
  const totalConverted = referrals.reduce((s, r) => s + r.converted, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Referral channels */}
      <Card className="border border-[var(--hairline)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Users className="h-4 w-4 text-[var(--ink-secondary)]" />
            Referral Attribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-baseline gap-3">
            <span className="font-mono text-[20px] font-semibold tabular-nums text-[var(--ink-primary)]">
              {totalReferrals}
            </span>
            <span className="text-[11px] text-[var(--ink-muted)]">
              referrals · {totalConverted} converted ({totalReferrals > 0 ? ((totalConverted / totalReferrals) * 100).toFixed(0) : 0}%)
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {referrals.map((r) => {
              const barWidth = totalReferrals > 0 ? (r.count / totalReferrals) * 100 : 0;
              return (
                <div key={r.channel} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-medium ${CHANNEL_COLORS[r.channel] ?? ""}`}>
                      {CHANNEL_LABELS[r.channel] ?? r.channel}
                    </span>
                    <span className="font-mono tabular-nums text-[var(--ink-secondary)]">
                      {r.count} → {r.converted} ({r.conversionRate.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--canvas-elevated)]">
                    <div
                      className="h-full rounded-full bg-[var(--recovery-green)]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Case-study consent */}
      <Card className="border border-[var(--hairline)]">
        <CardHeader>
          <CardTitle className="text-[13px]">Case-Study Consent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {caseStudies.map((cs) => (
              <div
                key={cs.tenantId}
                className="flex items-start justify-between gap-3 rounded-[6px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 py-2 text-[11px]"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink-primary)]">
                      {cs.tenantName}
                    </span>
                    {cs.consentGiven ? (
                      <Badge variant="default" className="text-[9px]">
                        <ExternalLink className="mr-0.5 h-2.5 w-2.5" />
                        Consent
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px]">
                        Pending
                      </Badge>
                    )}
                  </div>
                  {cs.storyHighlight && (
                    <p className="text-[10px] text-[var(--ink-muted)]">
                      {cs.storyHighlight}
                    </p>
                  )}
                </div>
                {cs.consentDate && (
                  <span className="shrink-0 font-mono tabular-nums text-[var(--ink-muted)]">
                    {cs.consentDate}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] italic text-[var(--ink-muted)]">
            Case studies require explicit consent. No story published without approval.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
