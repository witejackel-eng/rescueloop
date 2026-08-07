// /dashboard/[companyId]/insights
//
// Canonical insights page (WP-03). Friction findings, course funnels,
// and recommended next actions.

import "server-only";
import { redirect } from "next/navigation";
import { getProviderMode } from "@/providers";
import { resolveStrictCompanyAuth, renderCompanyAuthError } from "@/lib/auth/strict-company-auth";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const mode = getProviderMode();

  if (mode === "unconfigured") {
    redirect("/onboarding");
  }

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
        title="Insights"
        description="Friction findings, course funnels, and recommended next actions."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          Insights
        </Badge>
      </CompanyPageHeader>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <BarChart3 className="size-8 text-[var(--ink-muted)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">
            Course insights
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            Insights will appear as students interact with your courses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
