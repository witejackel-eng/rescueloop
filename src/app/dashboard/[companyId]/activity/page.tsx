// /dashboard/[companyId]/activity
//
// Canonical activity feed page (WP-03). Shows recent events, interventions,
// and sync activity.

import "server-only";
import { resolveStrictCompanyAuth, renderCompanyAuthError } from "@/lib/auth/strict-company-auth";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
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
        title="Activity"
        description="Recent events, interventions, and sync activity."
      >
        <Badge variant="outline" className="font-mono text-[11px]">Activity</Badge>
      </CompanyPageHeader>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Activity className="size-8 text-[var(--ink-muted)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">Activity feed</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            Recent rescue activity, sync events, and admin actions will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
