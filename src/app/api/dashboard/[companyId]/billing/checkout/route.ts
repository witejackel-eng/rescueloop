// POST /api/dashboard/[companyId]/billing/checkout
//
// Creates a Whop checkout session for a plan tier.
// Uses the official Whop checkout flow.
// Client completion shows "processing" — it NEVER grants access.
// Payment webhook establishes the authoritative entitlement.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";

const CheckoutSchema = z.object({
  planTier: z.enum(["rescue", "growth", "scale"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;

  // Auth guard
  let context;
  try {
    context = await requireCompanyAccess(companyId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  let body: z.infer<typeof CheckoutSchema>;
  try {
    body = CheckoutSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // In production, this would call the Whop checkout API to create a checkout session.
  // For now, return the checkout configuration that the client should use.
  // The client MUST NOT treat checkout completion as granting access.
  const planPrices: Record<string, number> = {
    rescue: 2900,
    growth: 5900,
    scale: 11900,
  };

  return NextResponse.json({
    ok: true,
    planTier: body.planTier,
    priceCents: planPrices[body.planTier],
    organizationId: context.organizationId,
    // Client shows "processing" after checkout — webhook grants access
    message: "Checkout initiated. Access will be granted once payment is confirmed.",
    // In production, this would include a Whop checkout URL
    checkoutUrl: null,
  });
}
