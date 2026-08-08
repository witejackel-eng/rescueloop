// POST /api/dashboard/[companyId]/billing/checkout
//
// Creates a real Whop checkout configuration via the official
// `client.checkoutConfigurations.create()` Stable API and returns the
// `purchase_url` for the browser to open.
//
// IMPORTANT: The browser-side checkout completion callback NEVER grants
// access. The redirect_url points to a read-only "Processing" route.
// Entitlement is granted exclusively by the verified Whop webhook
// handler (`src/app/api/webhooks/whop/route.ts` → `handleMembershipActivated`).
//
// See docs/implementation/V1_FINAL_GAP_AUDIT.md → GAP-2.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getWhopClient, isWhopReady } from "@/lib/whop/client";
import {
  getBillingEnv,
  getWhopPlanIdForTier,
  BillingConfigurationError,
} from "@/lib/billing/plans";
import { PLANS } from "@/lib/usage/plans";
import { recordAuditEvent } from "@/lib/audit";
import { checkRateLimitOrReject, RATE_LIMITS } from "@/lib/rate-limit/rate-limiter";
import type { PlanTier } from "@prisma/client";

export const runtime = "nodejs";

const CheckoutSchema = z.object({
  planTier: z.enum(["rescue", "growth", "scale"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ───────────────────────────────
  let context;
  try {
    context = await requireCompanyAccess(companyId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // ─── Rate limiting (plan mutation — 5 req/min per org) ────
  const rateLimitResponse = await checkRateLimitOrReject(
    context.organizationId,
    RATE_LIMITS.planMutation,
  );
  if (rateLimitResponse) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many checkout requests. Please try again later." } },
      { status: 429 },
    );
  }

  // ─── Request validation ────────────────────────────────────
  let body: z.infer<typeof CheckoutSchema>;
  try {
    body = CheckoutSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── Whop must be configured ───────────────────────────────
  if (!isWhopReady()) {
    return NextResponse.json(
      {
        error: {
          code: "WHOP_NOT_CONFIGURED",
          message:
            "Whop integration is not configured for this environment.",
        },
      },
      { status: 503 },
    );
  }

  // ─── Resolve plan_id + redirect_url ────────────────────────
  let planId: string;
  let redirectUrl: string;
  try {
    planId = getWhopPlanIdForTier(body.planTier as PlanTier);
  } catch (error) {
    if (error instanceof BillingConfigurationError) {
      return NextResponse.json(
        {
          error: {
            code: "BILLING_NOT_CONFIGURED",
            message: error.message,
          },
        },
        { status: 503 },
      );
    }
    throw error;
  }

  try {
    const billingEnv = getBillingEnv();
    const appUrl = process.env.APP_URL ?? "";
    const base = billingEnv.WHOP_CHECKOUT_RETURN_URL
      ? billingEnv.WHOP_CHECKOUT_RETURN_URL
      : `${appUrl}/dashboard/${encodeURIComponent(companyId)}/billing/processing`;
    redirectUrl = base;
  } catch (error) {
    if (error instanceof BillingConfigurationError) {
      return NextResponse.json(
        {
          error: {
            code: "BILLING_NOT_CONFIGURED",
            message: error.message,
          },
        },
        { status: 503 },
      );
    }
    throw error;
  }

  const plan = PLANS[body.planTier];

  // ─── Build metadata for webhook tenant mapping ─────────────
  // These fields let the webhook handler map the resulting
  // membership/payment event back to the correct RescueLoop tenant
  // without trusting the browser callback.
  const metadata = {
    rescueloop_organization_id: context.organizationId,
    rescueloop_company_id: companyId,
    rescueloop_plan_tier: body.planTier,
    rescueloop_price_cents: plan.priceCents,
  };

  // ─── Create the Whop checkout configuration ────────────────
  // Uses the official Stable API:
  //   client.checkoutConfigurations.create({
  //     plan_id, redirect_url, metadata, mode: "payment"
  //   }) → { id, purchase_url, ... }
  //
  // The `purchase_url` is what the browser opens. The browser
  // completing that flow does NOT grant entitlement — only the
  // webhook does.
  let checkoutConfig;
  try {
    const client = getWhopClient();
    checkoutConfig = await client.checkoutConfigurations.create({
      plan_id: planId,
      redirect_url: redirectUrl,
      metadata,
      mode: "payment",
    });
  } catch (error) {
    console.error("[billing/checkout] Whop checkout creation failed", {
      type: error instanceof Error ? error.constructor.name : "unknown",
      planTier: body.planTier,
    });
    return NextResponse.json(
      {
        error: {
          code: "WHOP_CHECKOUT_FAILED",
          message:
            "Whop checkout could not be created. Please try again or contact support.",
        },
      },
      { status: 502 },
    );
  }

  const purchaseUrl = checkoutConfig.purchase_url ?? null;
  if (!purchaseUrl) {
    console.error("[billing/checkout] Whop returned no purchase_url", {
      checkoutConfigId: checkoutConfig.id,
      planTier: body.planTier,
    });
    return NextResponse.json(
      {
        error: {
          code: "WHOP_CHECKOUT_NO_URL",
          message:
            "Whop returned a checkout configuration without a purchase URL.",
        },
      },
      { status: 502 },
    );
  }

  // ─── Audit (no secrets) ─────────────────────────────────────
  try {
    await recordAuditEvent({
      organizationId: context.organizationId,
      actorId: "whop-billing",
      action: "created",
      objectType: "billing.checkout",
      objectId: checkoutConfig.id,
      newState: `checkout_initiated/${body.planTier}`,
      reason: "Creator initiated Whop checkout. Entitlement pending webhook.",
    });
  } catch {
    // Audit failures must not block checkout return.
  }

  return NextResponse.json({
    ok: true,
    planTier: body.planTier,
    priceCents: plan.priceCents,
    organizationId: context.organizationId,
    checkoutConfigurationId: checkoutConfig.id,
    checkoutUrl: purchaseUrl,
    // Re-state the truth contract for the client:
    // Browser completion shows "Processing" — webhook grants access.
    message:
      "Checkout initiated. Access will be granted once the Whop webhook confirms payment.",
  });
}
