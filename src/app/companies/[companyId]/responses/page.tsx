// Legacy redirect: /companies/[companyId]/responses → /dashboard/[companyId]/responses
import { redirect } from "next/navigation";

export default async function LegacyResponsesRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/responses`);
}
