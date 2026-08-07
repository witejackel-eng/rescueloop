"use client";

// ─────────────────────────────────────────────────────────────
// PX05 — Cost Guardrails Page
// Internal planning dashboard.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { TenantCostEstimate, CostSummary } from "@/lib/types/cost";
import { CostDashboard } from "@/components/rescueloop/cost/cost-dashboard";

export default function CostsPage() {
  const [estimates, setEstimates] = useState<TenantCostEstimate[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/internal/costs");
        if (res.ok) {
          const data = await res.json();
          setEstimates(data.estimates);
          setSummary(data.summary);
        }
      } catch {
        // fallback: leave empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--hairline)] border-t-[var(--recovery-green)]" />
          <span className="text-[12px] text-[var(--ink-muted)]">Loading cost estimates…</span>
        </div>
      </div>
    );
  }

  return <CostDashboard estimates={estimates} summary={summary} />;
}
