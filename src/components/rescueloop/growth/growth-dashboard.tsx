"use client";

// ─────────────────────────────────────────────────────────────
// PX07 — Growth Dashboard
// Overview combining funnel analysis, referral attribution,
// and case-study consent tracking.
// ─────────────────────────────────────────────────────────────

import type { FC } from "react";
import type {
  FunnelAnalysis,
  ReferralAggregate,
  CaseStudyConsent,
} from "@/lib/types/growth";
import { FunnelVisualization } from "./funnel-visualization";
import { ReferralPanel } from "./referral-panel";
import { Shield } from "lucide-react";

interface GrowthDashboardProps {
  funnel: FunnelAnalysis;
  referrals: ReferralAggregate[];
  caseStudies: CaseStudyConsent[];
}

export const GrowthDashboard: FC<GrowthDashboardProps> = ({
  funnel,
  referrals,
  caseStudies,
}) => {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header>
        <h1 className="font-serif text-[24px] leading-none text-[var(--ink-primary)]">
          Growth Instrumentation
        </h1>
        <p className="mt-1.5 text-[12px] text-[var(--ink-muted)]">
          Privacy-safe funnel tracking · No raw PII collected
        </p>
      </header>

      {/* Privacy notice */}
      <div className="flex items-center gap-2 rounded-[6px] border border-[var(--recovery-light)] bg-[var(--recovery-light)] px-3 py-2 text-[11px] text-[var(--recovery-green)]">
        <Shield className="h-3.5 w-3.5 shrink-0" />
        <span>
          All events are privacy-safe. No raw student messages, no blocker free text,
          no tokens/secrets, no unnecessary PII.
        </span>
      </div>

      {/* Funnel visualization */}
      <section>
        <h2 className="mb-3 text-[14px] font-semibold text-[var(--ink-primary)]">
          Activation Funnel
        </h2>
        <FunnelVisualization analysis={funnel} />
      </section>

      {/* Referral + case studies */}
      <section>
        <h2 className="mb-3 text-[14px] font-semibold text-[var(--ink-primary)]">
          Referral Attribution
        </h2>
        <ReferralPanel referrals={referrals} caseStudies={caseStudies} />
      </section>
    </div>
  );
};
