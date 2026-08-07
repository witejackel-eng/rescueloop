"use client";

// ─────────────────────────────────────────────────────────────
// PX07 — Growth Instrumentation Page
// Privacy-safe funnel tracking dashboard.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type {
  FunnelAnalysis,
  ReferralAggregate,
  CaseStudyConsent,
} from "@/lib/types/growth";
import { GrowthDashboard } from "@/components/rescueloop/growth/growth-dashboard";

export default function GrowthPage() {
  const [funnel, setFunnel] = useState<FunnelAnalysis | null>(null);
  const [referrals, setReferrals] = useState<ReferralAggregate[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudyConsent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/internal/growth");
        if (res.ok) {
          const data = await res.json();
          setFunnel(data.funnel);
          setReferrals(data.referrals);
          setCaseStudies(data.caseStudies);
        }
      } catch {
        // fallback: leave empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !funnel) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--hairline)] border-t-[var(--recovery-green)]" />
          <span className="text-[12px] text-[var(--ink-muted)]">Loading growth data…</span>
        </div>
      </div>
    );
  }

  return (
    <GrowthDashboard
      funnel={funnel}
      referrals={referrals}
      caseStudies={caseStudies}
    />
  );
}
