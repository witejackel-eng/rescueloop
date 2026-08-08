// Legacy redirect: /companies/[companyId]/sync → /dashboard/[companyId]/sync
import { redirect } from "next/navigation";

export default async function LegacySyncRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/sync`);
}
