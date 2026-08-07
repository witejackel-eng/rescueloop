import { NextResponse } from "next/server";
import { DEMO_DIAGNOSTICS } from "@/lib/demo-operations-data";
import { getAllRecoveryRules } from "@/lib/recovery/recovery-matrix";

export async function GET() {
  const diagnostics = DEMO_DIAGNOSTICS;
  const recoveryMatrix = getAllRecoveryRules();

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const d of diagnostics) {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    diagnostics,
    recoveryMatrix,
    summary: {
      total: diagnostics.length,
      byCategory,
      bySeverity,
    },
  });
}
