// /companies/[companyId]/insights → /dashboard/[companyId]/insights
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/insights.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InsightsRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/insights`);
}
