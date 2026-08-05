// /companies/[companyId]/students
//
// Server Component stub. Calls requireCompanyAdmin(companyId) and renders
// a student-list placeholder. The full database-backed directory lands in
// Phase 2.

import { resolveStubAuth } from "@/components/shell/resolve-stub-auth";
import { CompanyStubCard } from "@/components/shell/company-stub-card";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const auth = await resolveStubAuth(companyId);

  return (
    <CompanyStubCard
      title="Students"
      description="Member directory with course progress, membership status, and rescue history."
      status={auth.status}
      statusNote={auth.statusNote}
      icon={Users}
    >
      A searchable, filterable table of every member synced from Whop —
      name, email, membership status, course progress, last activity,
      risk segment, and the count of past interventions. Clicking a row
      opens the student inspector with their full rescue history.
    </CompanyStubCard>
  );
}
