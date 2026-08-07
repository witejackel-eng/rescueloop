// Legacy redirect: /companies/[companyId]/insights → /dashboard/[companyId]/insights
import { redirect } from "next/navigation";

export default async function LegacyInsightsRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/insights`);
}
