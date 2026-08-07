// Legacy redirect: /companies/[companyId]/usage → /dashboard/[companyId]/usage
import { redirect } from "next/navigation";

export default async function LegacyUsageRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/usage`);
}
