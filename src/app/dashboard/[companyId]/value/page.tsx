// /dashboard/[companyId]/value
//
// Canonical value/attribution page (WP06). Attribution ledger + ROI.
// Now wired up with the Value Ledger API and live data.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Badge } from "@/components/ui/badge";
import { ValuePageClient } from "@/components/rescueloop/value/value-page-client";

export const dynamic = "force-dynamic";

export default async function ValuePage({
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
        title="Value"
        description="Attribution ledger and ROI for your Activation Rescue campaigns."
      >
        <Badge variant="outline" className="font-mono text-[11px]">Value</Badge>
      </CompanyPageHeader>

      <ValuePageClient companyId={companyId} />
    </div>
  );
}
