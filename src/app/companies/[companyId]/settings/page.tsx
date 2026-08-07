// /companies/[companyId]/settings → /dashboard/[companyId]/settings
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/settings.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/settings`);
}
