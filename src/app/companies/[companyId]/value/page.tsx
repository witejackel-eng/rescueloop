// Legacy redirect: /companies/[companyId]/value → /dashboard/[companyId]/value
import { redirect } from "next/navigation";

export default async function LegacyValueRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/value`);
}
