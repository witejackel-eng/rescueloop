// /dashboard/[companyId]/onboarding
//
// Canonical onboarding journey (WP-03). Server component verifies admin access,
// fetches Whop onboarding data, then renders the multi-step OnboardingJourney.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { fetchOnboardingData } from "@/lib/whop/onboarding-data";
import { OnboardingJourney } from "@/components/rescueloop/onboarding/onboarding-journey";
import {
  CompanyPageHeader,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
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

  // Fixture mode — still need companyId for the journey component
  if (ctx.mode === "fixture") {
    return (
      <div className="mx-auto max-w-3xl">
        <CompanyPageHeader
          title="Set up Activation Rescue"
          description="Configure your rescue campaign step by step. Nothing sends until you approve it."
        />
        <OnboardingJourney
          companyId={companyId}
          courses={[]}
          products={[]}
          existingMappings={[]}
          whopUnavailable={true}
        />
      </div>
    );
  }

  // Connected mode — fetch real data
  const data = await fetchOnboardingData(companyId, ctx.organizationId);

  return (
    <div className="mx-auto max-w-3xl">
      <CompanyPageHeader
        title="Set up Activation Rescue"
        description="Configure your rescue campaign step by step. Nothing sends until you approve it."
      />

      {/* Safety promise banner */}
      <Card className="mb-6 border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/30">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--recovery-green)]" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-medium text-[var(--ink-primary)]">
              Nothing will be sent automatically.
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              Every Activation Rescue candidate lands in your queue for review.
              You approve, schedule, or dismiss each one.
            </p>
          </div>
        </CardContent>
      </Card>

      <OnboardingJourney
        companyId={companyId}
        courses={data.courses.map((c) => ({ id: c.id, title: c.title }))}
        products={data.products.map((p) => ({ id: p.id, title: p.title }))}
        existingMappings={data.existingMappings.map((m) => ({
          courseId: m.courseId,
          productId: m.productId,
          courseName: m.courseName,
          productName: m.productName,
        }))}
        whopUnavailable={data.whopUnavailable}
      />
    </div>
  );
}
