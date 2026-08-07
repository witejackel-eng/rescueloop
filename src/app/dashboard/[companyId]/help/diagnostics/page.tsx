// /dashboard/[companyId]/help/diagnostics
//
// Creator-facing diagnostics page (PX04). Shows safe diagnostic info
// for this company — all secrets are redacted server-side.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiagnosticsClient } from "./diagnostics-client";
import { Stethoscope } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  try {
    await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <CompanyPageHeader
        title="Diagnostics"
        description="Safe diagnostic information for your RescueLoop integration. All secrets are redacted."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          <Stethoscope className="mr-1 size-3" />
          Diagnostics
        </Badge>
      </CompanyPageHeader>

      {/* ── Info card ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diagnostic Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          <p>
            This page shows safe, redacted diagnostic information for your
            organization. It can be shared with support to troubleshoot issues.
          </p>
          <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
            <p className="font-mono text-[12px] text-[var(--ink-muted)]">
              All secrets, tokens, API keys, and credentials are redacted before
              leaving the server. No raw secrets are ever included in the response.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Client component fetches and renders diagnostics ── */}
      <DiagnosticsClient companyId={companyId} />
    </div>
  );
}
