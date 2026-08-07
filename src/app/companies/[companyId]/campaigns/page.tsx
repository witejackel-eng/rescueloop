// /companies/[companyId]/campaigns → /dashboard/[companyId]/campaigns
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/campaigns.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampaignsRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/campaigns`);
}
