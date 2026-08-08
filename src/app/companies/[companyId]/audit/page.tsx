// Legacy redirect: /companies/[companyId]/audit → /dashboard/[companyId]/activity
import { redirect } from "next/navigation";

export default async function LegacyAuditRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/activity`);
}
