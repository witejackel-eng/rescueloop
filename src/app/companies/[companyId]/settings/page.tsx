// Legacy redirect: /companies/[companyId]/settings → /dashboard/[companyId]/settings
import { redirect } from "next/navigation";

export default async function LegacySettingsRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/settings`);
}
