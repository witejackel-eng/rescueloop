// /dashboard/[companyId]/responses
//
// Canonical responses page (WP-03). Shows student response records.

import "server-only";
import { resolveStrictCompanyAuth, renderCompanyAuthError } from "@/lib/auth/strict-company-auth";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareReply } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  try {
    await resolveStrictCompanyAuth(companyId);
  } catch (error) {
    const rendered = renderCompanyAuthError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Creator response centre"
        description="Every student response, with the intervention that prompted it."
      >
        <Badge variant="outline" className="font-mono text-[12px]">
          Responses
        </Badge>
      </CompanyPageHeader>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <MessageSquareReply className="size-8 text-[var(--ink-muted)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">
            Response centre
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            When students respond to an Activation Rescue message, their replies will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
