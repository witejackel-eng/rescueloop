// Legacy redirect: /companies/[companyId]/queue → /dashboard/[companyId]/rescue-queue
import { redirect } from "next/navigation";

export default async function LegacyQueueRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/rescue-queue`);
}
