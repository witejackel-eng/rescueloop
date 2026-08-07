// /companies/[companyId]/onboarding → /dashboard/[companyId]/onboarding
//
// Legacy redirect (WP-03). The canonical route is now /dashboard/[companyId]/onboarding.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/dashboard/${encodeURIComponent(companyId)}/onboarding`);
}
