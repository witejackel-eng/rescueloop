// /companies/[companyId]/sync → /dashboard/[companyId]/sync
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/sync.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SyncRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/sync`);
}
