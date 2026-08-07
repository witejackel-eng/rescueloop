// /companies/[companyId]/students → /dashboard/[companyId]/students
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/students.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentsRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/students`);
}
