// /companies/[companyId]/responses → /dashboard/[companyId]/responses
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/responses.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResponsesRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/responses`);
}
