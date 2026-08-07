// /companies/[companyId]/usage → /dashboard/[companyId]/usage
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/usage.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsageRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/usage`);
}
