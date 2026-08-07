// /companies/[companyId]/onboarding
//
// Server component. Verifies the viewer is a Whop admin for this company,
// then loads real Whop courses + DB products and renders the onboarding
// form (client component). The form posts to
// /api/companies/[companyId]/onboarding which creates the mapping + campaign.

import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  InstallationMissingError,
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
} from "@/lib/auth/whop-auth";
import { fetchOnboardingData } from "@/lib/whop/onboarding-data";
import { OnboardingForm } from "@/components/rescueloop/company/onboarding-form";
import {
  AuthErrorCard,
  CompanyPageHeader,
  InstallationRequiredCard,
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

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    // Installation-missing is a distinct, recoverable state
    if (error instanceof InstallationMissingError) {
      return (
        <div className="mx-auto max-w-3xl">
          <InstallationRequiredCard companyId={companyId} />
        </div>
      );
    }
    // Auth / availability errors
    if (error instanceof MissingTokenError) {
      return (
        <AuthErrorCard
          title="Sign in required"
          description="Open this page from your Whop dashboard to verify your admin access."
          hint="Missing Whop user token"
        />
      );
    }
    if (error instanceof InvalidTokenError) {
      return (
        <AuthErrorCard
          title="Session expired"
          description="Your Whop session has expired. Please reopen this page from your Whop dashboard."
          hint="Invalid or expired token"
        />
      );
    }
    if (error instanceof WhopUnavailableError) {
      return (
        <AuthErrorCard
          title="Whop is unavailable"
          description="We couldn't reach Whop to verify your access. Please try again in a moment."
          hint="Authentication service unavailable"
        />
      );
    }
    if (error instanceof InsufficientAccessError) {
      return (
        <AuthErrorCard
          title="Admin access required"
          description="Only company admins can configure RescueLoop. Ask a company admin to open this page."
          hint={error.message}
        />
      );
    }
    throw error;
  }

  // Authenticated — fetch Whop + DB data (graceful degradation)
  const data = await fetchOnboardingData(companyId, ctx.organizationId);

  return (
    <div className="mx-auto max-w-3xl">
      <CompanyPageHeader
        title="Set up Activation Rescue"
        description="Map a Whop course to a paid product and configure your safety rules. Nothing sends until you approve it."
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

      <OnboardingForm
        companyId={companyId}
        courses={data.courses}
        products={data.products}
        experiences={data.experiences}
        existingMappings={data.existingMappings}
        whopUnavailable={data.whopUnavailable}
      />
    </div>
  );
}
