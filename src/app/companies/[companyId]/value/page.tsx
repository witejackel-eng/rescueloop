// /companies/[companyId]/value → /dashboard/[companyId]/value
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/value.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ValueRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/value`);
}
