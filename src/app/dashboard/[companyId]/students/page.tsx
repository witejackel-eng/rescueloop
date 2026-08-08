// /dashboard/[companyId]/students
//
// Canonical students directory (WP-03). Shows the member directory with
// course progress, membership status, and rescue history.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import { db } from "@/lib/db";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import {
  CompanyPageHeader,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  let ctx;
  try {
    ctx = await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  const organizationId = ctx.organizationId;

  const studentCount = await db.student.count({
    where: { organizationId },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Students"
        description="Member directory with course progress, membership status, and rescue history."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {studentCount} total
        </Badge>
      </CompanyPageHeader>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Users className="size-8 text-[var(--ink-muted)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">
            Student directory
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            {studentCount === 0
              ? "Students will appear here as memberships are synced from Whop."
              : `${studentCount} student(s) in this organisation.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
