// /dashboard/[companyId]/settings/health
//
// System Health page (PX02). Shows real health signals from the
// company-scoped /api/dashboard/[companyId]/health endpoint.
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
import { HealthSignalsClient } from "./health-client";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage({
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
        title="System Health"
        description="Real-time health signals from your RescueLoop integration, sync pipeline, and billing."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          <Activity className="mr-1 size-3" />
          Health
        </Badge>
      </CompanyPageHeader>

      {/* ── Info card ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health Signals</CardTitle>
        </CardHeader>
        <CardContent className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          <p>
            These signals are derived from your real database state. They reflect the
            current status of your Whop installation, sync pipeline, webhook processing,
            outbox delivery, subscription, and usage counters.
          </p>
          <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
            Signals are computed on each page load. No cached or fixture data is used.
          </p>
        </CardContent>
      </Card>

      {/* ── Client component fetches and renders health signals ── */}
      <HealthSignalsClient companyId={companyId} />
    </div>
  );
}
