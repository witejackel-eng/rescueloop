"use client";

// ─────────────────────────────────────────────────────────────
// PX06 — Scale Certification Page
// Internal scale certification dashboard.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { BenchmarkResult, MultiTenantBenchmarkResult } from "@/lib/types/scale";
import { ScaleDashboard } from "@/components/rescueloop/scale/scale-dashboard";

export default function ScalePage() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [multiTenantResults, setMultiTenantResults] = useState<MultiTenantBenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/internal/scale");
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
          setMultiTenantResults(data.multiTenantResults);
        }
      } catch {
        // fallback: leave empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--hairline)] border-t-[var(--recovery-green)]" />
          <span className="text-[12px] text-[var(--ink-muted)]">Loading scale certification data…</span>
        </div>
      </div>
    );
  }

  return <ScaleDashboard initialResults={results} initialMultiTenantResults={multiTenantResults} />;
}
