// /dashboard/[companyId]/usage
//
// Canonical usage page (WP-03). Plan limits + consumption.

import "server-only";
import { resolveStrictCompanyAuth, renderCompanyAuthError } from "@/lib/auth/strict-company-auth";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsagePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  try {
    await resolveStrictCompanyAuth(companyId);
  } catch (error) {
    const rendered = renderCompanyAuthError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Usage"
        description="Plan limits and consumption for this organisation."
      >
        <Badge variant="outline" className="font-mono text-[11px]">Usage</Badge>
      </CompanyPageHeader>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Gauge className="size-8 text-[var(--ink-muted)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">Plan usage</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            Monitored members, team seats, and intervention volumes will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
