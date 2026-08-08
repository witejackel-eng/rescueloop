// Legacy redirect: /companies/[companyId]/students → /dashboard/[companyId]/students
import { redirect } from "next/navigation";

export default async function LegacyStudentsRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  redirect(`/dashboard/${companyId}/students`);
}
