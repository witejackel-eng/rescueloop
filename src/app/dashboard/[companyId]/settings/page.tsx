// /dashboard/[companyId]/settings
//
// Canonical settings page (WP-03). Organisation + safety rules.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
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
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Settings"
        description="Organisation settings, safety rules, and Whop sync health."
      >
        <Badge variant="outline" className="font-mono text-[11px]">Settings</Badge>
      </CompanyPageHeader>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Settings className="size-8 text-[var(--ink-muted)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">Organisation settings</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            Safety rules, campaign status, pause/resume, and sync health for this organisation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
