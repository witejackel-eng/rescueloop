// Legacy redirect: /companies/[companyId]/campaigns → /dashboard/[companyId]/playbooks
import { redirect } from "next/navigation";

export default async function LegacyCampaignsRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/playbooks`);
}
