// /companies/[companyId]/queue → /dashboard/[companyId]/rescue-queue
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/rescue-queue.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QueueRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/rescue-queue`);
}
