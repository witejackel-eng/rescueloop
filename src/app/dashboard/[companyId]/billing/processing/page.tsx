// /dashboard/[companyId]/billing/processing
//
// READ-ONLY post-checkout landing page. Whop redirects here after the
// browser-side checkout completes.
//
// CRITICAL INVARIANT: This page does NOT grant entitlement.
// It renders a "Processing" UI and links to the dashboard so the
// creator can refresh. The authoritative entitlement grant happens
// exclusively in the verified Whop webhook handler
// (`src/app/api/webhooks/whop/route.ts` → `handleMembershipActivated`).
//
// The page calls `requireCompanyAccess()` only to render the standard
// workspace shell — it does NOT perform any mutation and does NOT
// inspect checkout state to upgrade the user.

import "server-only";
import Link from "next/link";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingProcessingPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-10">
          <div className="flex items-center gap-3">
            <Clock className="size-6 text-[var(--recovery-green)]" />
            <h1 className="font-serif text-2xl text-[var(--ink-primary)]">
              Processing your subscription
            </h1>
          </div>

          <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
            Whop has received your checkout. RescueLoop is waiting for the
            verified Whop webhook to confirm payment before activating
            your plan. This usually takes a few seconds.
          </p>

          <p className="text-[13px] leading-relaxed text-[var(--ink-muted)]">
            You can return to the dashboard and refresh — your plan will
            appear active once the webhook arrives. The browser completing
            checkout alone does not grant access.
          </p>

          <div className="mt-2 flex items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 py-2">
            <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
              Tenant
            </span>
            <span className="font-mono text-[12px] text-[var(--ink-primary)]">
              {ctx.organizationId}
            </span>
          </div>

          <Link
            href={`${basePath}/settings`}
            className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--recovery-green)] hover:underline"
          >
            Back to dashboard <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
