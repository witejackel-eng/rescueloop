// /dashboard/[companyId]/sync
//
// Canonical sync status page (WP-03). Whop sync health + webhook log.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.
// Uses the operation read model to fetch initial data, then delegates
// to the SyncStatusView client component for polling, retry, and
// interactive features.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MonitorSmartphone } from "lucide-react";
import { getSyncDetail } from "@/lib/operations/operation-read-model";
import { SyncStatusView } from "@/components/rescueloop/sync/sync-status-view";

export const dynamic = "force-dynamic";

export default async function SyncPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  let ctx;
  try {
    ctx = await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  // ─── Fixture mode → demo message ────────────────────────────
  if (ctx.mode === "fixture") {
    return (
      <div className="mx-auto max-w-5xl">
        <CompanyPageHeader
          title="Sync"
          description="Whop sync health and webhook log."
        >
          <Badge variant="outline" className="font-mono text-[11px]">Sync</Badge>
        </CompanyPageHeader>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MonitorSmartphone className="size-8 text-[var(--ink-muted)]" />
            <p className="text-[15px] font-medium text-[var(--ink-primary)]">Demo mode</p>
            <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              Demo mode — no real sync data. Connect Whop to see live sync status.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Connected mode → fetch real sync data ──────────────────
  const syncDetail = await getSyncDetail(ctx.organizationId);

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Sync"
        description="Whop sync health and webhook log."
      >
        <Badge variant="outline" className="font-mono text-[11px]">Sync</Badge>
      </CompanyPageHeader>

      <SyncStatusView
        companyId={companyId}
        initialOperation={syncDetail?.execution ?? null}
        initialCheckpoints={syncDetail?.checkpoints ?? []}
        initialLatestWebhook={syncDetail?.latestWebhook ?? null}
      />
    </div>
  );
}
