import "server-only";
// Whop Billing Webhook Handler
//
// Handles billing-related Whop webhooks idempotently.
// Webhook ordering is NOT assumed — we recompute authoritative entitlement.
// Client checkout callback NEVER grants access.

import type { EntitlementState, PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { PLANS, planTierOrder } from "@/lib/usage/plans";

// ─── Types ──────────────────────────────────────────────────────

export interface BillingWebhookPayload {
  eventType: string;
  eventId: string; // for idempotency
  companyId: string;
  membershipId?: string;
  planTier?: string;
  priceCents?: number;
  manageUrl?: string;
}

export interface BillingWebhookResult {
  entitlementState: EntitlementState;
  planTier: PlanTier;
  processed: boolean;
}

// ─── Entitlement state transitions ──────────────────────────────

const MEMBERSHIP_STATE_MAP: Record<string, EntitlementState> = {
  active: "active",
  trialing: "active",
  past_due: "billing_error",
  cancelling: "scheduled_cancel",
  cancelled: "inactive",
  paused_membership: "billing_error",
};

/** Derive entitlement state from Whop membership status */
export function membershipStatusToEntitlement(
  membershipStatus: string,
): EntitlementState {
  return MEMBERSHIP_STATE_MAP[membershipStatus] ?? "inactive";
}

// ─── Webhook handlers ───────────────────────────────────────────

/**
 * Handle payment.succeeded webhook.
 * Idempotent — uses eventId for dedup.
 */
export async function handlePaymentSucceeded(
  payload: BillingWebhookPayload,
): Promise<BillingWebhookResult> {
  const { companyId, eventId, planTier: rawTier } = payload;

  // Check idempotency
  const existing = await db.internalAuditLog.findFirst({
    where: { action: "payment_succeeded", objectId: eventId },
  });
  if (existing) {
    // Already processed — return current state
    const org = await db.organization.findUnique({
      where: { id: companyId },
      select: { planTier: true, entitlementState: true },
    });
    return {
      entitlementState: org?.entitlementState ?? "inactive",
      planTier: (org?.planTier as PlanTier) ?? "rescue",
      processed: false,
    };
  }

  // FAIL CLOSED: If tier is not provided or is not a valid PlanTier,
  // do NOT default to rescue — that would silently grant entitlement.
  const VALID_TIERS: PlanTier[] = ["rescue", "growth", "scale", "internal", "pilot"];
  const planTier = (rawTier && VALID_TIERS.includes(rawTier as PlanTier))
    ? (rawTier as PlanTier)
    : null;

  if (!planTier) {
    // No authoritative tier — do NOT grant entitlement.
    // Return current state unchanged.
    const org = await db.organization.findUnique({
      where: { id: companyId },
      select: { planTier: true, entitlementState: true },
    });
    await recordAuditEvent({
      organizationId: companyId,
      actorId: "whop-billing",
      action: "configuration_changed",
      objectType: "billing",
      objectId: eventId,
      newState: "tier_resolution_failed",
      reason: `payment.succeeded with unmapped tier="${rawTier ?? "missing"}". Entitlement NOT granted.`,
    });
    return {
      entitlementState: org?.entitlementState ?? "inactive",
      planTier: (org?.planTier as PlanTier) ?? "rescue",
      processed: false,
    };
  }

  // Update organization entitlement
  const org = await db.organization.update({
    where: { id: companyId },
    data: {
      planTier: planTier as string,
      entitlementState: "active",
    },
  });

  // Audit
  await recordAuditEvent({
    organizationId: companyId,
    actorId: "whop-billing",
    action: "updated",
    objectType: "billing",
    objectId: eventId,
    newState: `active/${planTier}`,
    reason: "Whop payment.succeeded",
  });

  return {
    entitlementState: "active",
    planTier,
    processed: true,
  };
}

/**
 * Handle payment.failed webhook.
 * Transitions to billing_error with grace period.
 */
export async function handlePaymentFailed(
  payload: BillingWebhookPayload,
): Promise<BillingWebhookResult> {
  const { companyId, eventId } = payload;

  const existing = await db.internalAuditLog.findFirst({
    where: { action: "payment_failed", objectId: eventId },
  });
  if (existing) {
    const org = await db.organization.findUnique({
      where: { id: companyId },
      select: { planTier: true, entitlementState: true },
    });
    return {
      entitlementState: org?.entitlementState ?? "billing_error",
      planTier: (org?.planTier as PlanTier) ?? "rescue",
      processed: false,
    };
  }

  // Set grace period (7 days)
  const gracePeriodEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const org = await db.organization.update({
    where: { id: companyId },
    data: {
      entitlementState: "billing_error",
      billingGracePeriodEnds: gracePeriodEnds,
    },
  });

  await recordAuditEvent({
    organizationId: companyId,
    actorId: "whop-billing",
    action: "updated",
    objectType: "billing",
    objectId: eventId,
    newState: "billing_error",
    reason: "Whop payment.failed — grace period until " + gracePeriodEnds.toISOString(),
  });

  return {
    entitlementState: "billing_error",
    planTier: org.planTier as PlanTier,
    processed: true,
  };
}

/**
 * Handle membership.activated webhook.
 * Activates entitlement for the plan tier.
 */
export async function handleMembershipActivated(
  payload: BillingWebhookPayload,
): Promise<BillingWebhookResult> {
  const { companyId, eventId, planTier: rawTier, manageUrl } = payload;

  const existing = await db.internalAuditLog.findFirst({
    where: { action: "membership_activated", objectId: eventId },
  });
  if (existing) {
    const org = await db.organization.findUnique({
      where: { id: companyId },
      select: { planTier: true, entitlementState: true },
    });
    return {
      entitlementState: org?.entitlementState ?? "active",
      planTier: (org?.planTier as PlanTier) ?? "rescue",
      processed: false,
    };
  }

  // FAIL CLOSED: If tier is not provided or is not a valid PlanTier,
  // do NOT default to rescue — that would silently grant entitlement.
  const VALID_TIERS: PlanTier[] = ["rescue", "growth", "scale", "internal", "pilot"];
  const planTier = (rawTier && VALID_TIERS.includes(rawTier as PlanTier))
    ? (rawTier as PlanTier)
    : null;

  if (!planTier) {
    // No authoritative tier — do NOT grant entitlement.
    await recordAuditEvent({
      organizationId: companyId,
      actorId: "whop-billing",
      action: "configuration_changed",
      objectType: "billing",
      objectId: eventId,
      newState: "tier_resolution_failed",
      reason: `membership.activated with unmapped tier="${rawTier ?? "missing"}". Entitlement NOT granted.`,
    });
    return {
      entitlementState: "inactive",
      planTier: "rescue",
      processed: false,
    };
  }

  await db.organization.update({
    where: { id: companyId },
    data: {
      planTier: planTier as string,
      entitlementState: "active",
      billingGracePeriodEnds: null,
      ...(manageUrl ? { billingManageUrl: manageUrl } : {}),
    },
  });

  await recordAuditEvent({
    organizationId: companyId,
    actorId: "whop-billing",
    action: "updated",
    objectType: "billing",
    objectId: eventId,
    newState: `active/${planTier}`,
    reason: "Whop membership.activated",
  });

  return { entitlementState: "active", planTier, processed: true };
}

/**
 * Handle membership.deactivated webhook.
 * Transitions to inactive. Downgrade does NOT delete historical data.
 */
export async function handleMembershipDeactivated(
  payload: BillingWebhookPayload,
): Promise<BillingWebhookResult> {
  const { companyId, eventId } = payload;

  const existing = await db.internalAuditLog.findFirst({
    where: { action: "membership_deactivated", objectId: eventId },
  });
  if (existing) {
    const org = await db.organization.findUnique({
      where: { id: companyId },
      select: { planTier: true, entitlementState: true },
    });
    return {
      entitlementState: org?.entitlementState ?? "inactive",
      planTier: (org?.planTier as PlanTier) ?? "rescue",
      processed: false,
    };
  }

  // Downgrade to rescue tier but DO NOT delete historical data
  const org = await db.organization.update({
    where: { id: companyId },
    data: {
      entitlementState: "inactive",
      // Keep planTier for reference but entitlement is inactive
    },
  });

  await recordAuditEvent({
    organizationId: companyId,
    actorId: "whop-billing",
    action: "updated",
    objectType: "billing",
    objectId: eventId,
    newState: "inactive",
    reason: "Whop membership.deactivated — historical data preserved, new use restricted",
  });

  return { entitlementState: "inactive", planTier: org.planTier as PlanTier, processed: true };
}

/**
 * Route a billing webhook to the appropriate handler.
 * This is the main entry point from the Whop webhook receiver.
 */
export async function handleBillingWebhook(
  payload: BillingWebhookPayload,
): Promise<BillingWebhookResult> {
  switch (payload.eventType) {
    case "payment.succeeded":
      return handlePaymentSucceeded(payload);
    case "payment.failed":
      return handlePaymentFailed(payload);
    case "membership.activated":
      return handleMembershipActivated(payload);
    case "membership.deactivated":
      return handleMembershipDeactivated(payload);
    default:
      // Unknown billing event — don't change entitlement
      const org = await db.organization.findUnique({
        where: { id: payload.companyId },
        select: { planTier: true, entitlementState: true },
      });
      return {
        entitlementState: org?.entitlementState ?? "inactive",
        planTier: (org?.planTier as PlanTier) ?? "rescue",
        processed: false,
      };
  }
}
