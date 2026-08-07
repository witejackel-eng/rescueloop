"use client";

import { DiagnosticsPageView } from "@/components/rescueloop/diagnostics/diagnostics-page";
import { DEMO_DIAGNOSTICS } from "@/lib/demo-operations-data";
import { getAllRecoveryRules } from "@/lib/recovery/recovery-matrix";
import type { DiagnosticBundle } from "@/lib/types/operations-internal";

function buildDiagnosticBundle(): DiagnosticBundle {
  const diagnostics = DEMO_DIAGNOSTICS;
  const recoveryMatrix = getAllRecoveryRules();

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const d of diagnostics) {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
  }

  return {
    exportedAt: new Date().toISOString(),
    environment: "demo",
    diagnostics,
    recoveryMatrix,
    summary: {
      total: diagnostics.length,
      byCategory,
      bySeverity,
    },
  };
}

export default function DiagnosticsPage() {
  const bundle = buildDiagnosticBundle();

  return <DiagnosticsPageView diagnostics={DEMO_DIAGNOSTICS} bundle={bundle} />;
}
