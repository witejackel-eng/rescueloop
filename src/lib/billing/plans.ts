import "server-only";
// Billing environment + plan configuration.
//
// Single source of truth mapping a RescueLoop plan tier → Whop plan ID
// and a checkout redirect URL. The Whop plan IDs are environment-specific
// (e.g. dev/preview/prod each have their own Whop plans) but they are
// NOT secrets — they appear in the browser during checkout.
//
// The checkout route uses this module to resolve the plan_id passed to
// `client.checkoutConfigurations.create({ plan_id, redirect_url, metadata })`.
// The webhook handler resolves the inverse mapping (Whop plan_id →
// RescueLoop tier) by inspecting metadata + the plan lookup table.

import { z } from "zod";
import type { PlanTier } from "@prisma/client";

// ─── Environment schema ───────────────────────────────────────

const billingEnvSchema = z.object({
  // Whop plan IDs (`plan_*`). Required for checkout to function.
  WHOP_RESCUE_PLAN_ID: z.string().trim().min(1),
  WHOP_GROWTH_PLAN_ID: z.string().trim().min(1),
  WHOP_SCALE_PLAN_ID: z.string().trim().min(1),
  // Optional override for the post-checkout redirect. Defaults to
  // `${APP_URL}/dashboard/[companyId]/billing/processing`.
  WHOP_CHECKOUT_RETURN_URL: z.string().url().optional(),
});

export type BillingEnv = z.infer<typeof billingEnvSchema>;

export class BillingConfigurationError extends Error {
  readonly code = "BILLING_NOT_CONFIGURED" as const;
  constructor(message: string) {
    super(message);
    this.name = "BillingConfigurationError";
  }
}

let cached: BillingEnv | null = null;

/**
 * Returns the billing env or throws BillingConfigurationError if any
 * required variable is missing. The error message lists which variables
 * are missing — it never includes secret values.
 */
export function getBillingEnv(): BillingEnv {
  if (cached) return cached;
  const result = billingEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = Object.keys(result.error.flatten().fieldErrors).join(", ");
    throw new BillingConfigurationError(
      `Billing is not configured. Missing env: ${missing}. ` +
        `Set WHOP_RESCUE_PLAN_ID, WHOP_GROWTH_PLAN_ID, WHOP_SCALE_PLAN_ID ` +
        `in the Vercel project environment. Plan IDs are not secrets — ` +
        `they are visible in the Whop dashboard.`,
    );
  }
  cached = result.data;
  return cached;
}

export function isBillingConfigured(): boolean {
  return billingEnvSchema.safeParse(process.env).success;
}

// ─── Plan tier → Whop plan ID ─────────────────────────────────

const TIER_TO_PLAN_ID: Record<PlanTier, string> = {
  rescue: "WHOP_RESCUE_PLAN_ID",
  growth: "WHOP_GROWTH_PLAN_ID",
  scale: "WHOP_SCALE_PLAN_ID",
  // internal/pilot plans are not billable through Whop checkout.
  internal: "",
  pilot: "",
};

/**
 * Resolve a RescueLoop plan tier to its configured Whop plan ID.
 * Throws BillingConfigurationError if billing env is unset.
 */
export function getWhopPlanIdForTier(tier: PlanTier): string {
  const env = getBillingEnv();
  const key = TIER_TO_PLAN_ID[tier];
  if (!key) {
    throw new BillingConfigurationError(
      `Plan tier "${tier}" is not billable through Whop checkout.`,
    );
  }
  return env[key as keyof BillingEnv] as string;
}

/**
 * Inverse lookup: Whop plan_id → RescueLoop plan tier. Used by the
 * webhook handler to map an incoming membership/payment event back to
 * the RescueLoop tier that should be granted.
 *
 * Falls back to `null` if the plan_id doesn't match any configured tier
 * (e.g. an unrelated product the same Whop company sells).
 */
export function getTierForWhopPlanId(planId: string): PlanTier | null {
  if (!isBillingConfigured()) return null;
  const env = getBillingEnv();
  if (env.WHOP_RESCUE_PLAN_ID === planId) return "rescue";
  if (env.WHOP_GROWTH_PLAN_ID === planId) return "growth";
  if (env.WHOP_SCALE_PLAN_ID === planId) return "scale";
  return null;
}
