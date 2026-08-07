// Legacy redirect: /companies/[companyId]/onboarding → /dashboard/[companyId]/onboarding
import { redirect } from "next/navigation";

export default async function LegacyOnboardingRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/onboarding`);
}
