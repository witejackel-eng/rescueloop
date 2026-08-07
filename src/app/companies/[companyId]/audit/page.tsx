// /companies/[companyId]/audit → /dashboard/[companyId]/audit
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/audit.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/audit`);
}
