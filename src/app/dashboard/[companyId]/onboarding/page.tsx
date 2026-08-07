// /dashboard/[companyId]/onboarding
//
// Canonical onboarding journey (WP-03). Server component verifies admin access,
// fetches Whop onboarding data, then renders the multi-step OnboardingJourney
// client component implementing: Access → Connection → Mapping → Sync →
// Threshold → Preview → Complete.

import "server-only";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  InstallationMissingError,
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
} from "@/lib/auth/whop-auth";
import { fetchOnboardingData } from "@/lib/whop/onboarding-data";
import { OnboardingJourney } from "@/components/rescueloop/onboarding/onboarding-journey";
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
    if (error instanceof InstallationMissingError) {
      return (
        <div className="mx-auto max-w-3xl">
          <InstallationRequiredCard companyId={companyId} />
        </div>
      );
    }
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
