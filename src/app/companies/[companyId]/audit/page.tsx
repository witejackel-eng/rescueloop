// /companies/[companyId]/audit
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// an audit-log placeholder. The full database-backed audit log lands in
// Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Audit log"
      description="Immutable, append-only record of every state-changing action."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={ScrollText}
    >
      Every state-changing action (approve, dismiss, schedule, suppress,
      pause, resume, onboarding, response) with actor, timestamp,
      previous state, new state, and reason. Filterable by action type,
      actor, and object. Exportable for compliance review.
    </CompanyStubCard>
  );
}
