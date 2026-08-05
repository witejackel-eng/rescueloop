// /companies/[companyId]/sync
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// a sync-status placeholder. The full database-backed sync log lands in
// Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SyncPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Sync status"
      description="Whop webhook receipts, last sync timestamp, and the live integration health."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={RefreshCw}
    >
      The most recent webhook receipts (event type, status, received-at),
      the running sync health (events processed vs. failed), the granted
      Whop scopes, and a manual re-sync trigger for stale data.
    </CompanyStubCard>
  );
}
