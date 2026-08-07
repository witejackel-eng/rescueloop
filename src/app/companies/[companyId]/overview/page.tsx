// Legacy redirect: /companies/[companyId]/overview → /dashboard/[companyId]
import { redirect } from "next/navigation";

export default async function LegacyOverviewRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}`);
}
