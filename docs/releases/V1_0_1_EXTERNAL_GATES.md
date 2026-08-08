# RescueLoop v1.0.1 — External Gates

> **Date:** 2026-08-07
> **Branch:** `release/v1.0.1-operational-certification`
> **Starting SHA:** `450c50dad0a2883c6286346f48dae9e63189e8b7`
> **Auditor:** witejackel-eng

---

## Overview

Two external gates must be passed before v1.0.1 can be certified for
production release. Neither can be exercised by the agent — both require
**owner approval** and interaction with the live Whop platform.

---

## Gate A: One Real Whop Notification Delivery

### Description
Trigger a real notification through the Whop notifications API and confirm
that the notification is **accepted by the provider** (not just sent).

### Why This Gate Exists
- The Whop notifications adapter (`src/providers/whop/notifications.ts`)
  maps `success: true → accepted: true` and records `providerMessageId: null`
- The delivery state model uses `notification_accepted`, NOT `delivered`
- We must verify that a real Whop API call returns `success: true` and
  that our adapter correctly maps this to `DeliveryState.api_accepted`
- The webhook handler must then process the corresponding event (if any)

### Preparation Status

| Item | Status |
|---|---|
| Whop notifications adapter code | Complete — `src/providers/whop/notifications.ts` |
| Delivery state mapping | Verified — `api_accepted` on success, `failed` on error |
| Webhook handler | Verified — signature via SDK `webhooks.unwrap()`, idempotent via `webhookReceipt` |
| Inngest job wiring | Verified — `processWebhook` handles all billing events |
| Test coverage | Unit tests pass for adapter mapping |
| **Real Whop API call** | **NOT EXECUTED** |

### Steps for Owner

1. Navigate to a connected workspace in RescueLoop
2. Trigger a manual rescue for a real member
3. Confirm the notification appears in the Whop dashboard
4. Confirm the `DeliveryAttempt` record in RescueLoop shows `state: api_accepted`
5. If the notification fails, check `state: failed` and the error details

### Owner Approval Required
**REQUIRES OWNER APPROVAL** — This gate cannot be automated. The owner must
execute a real notification through the live Whop API and confirm delivery.

---

## Gate B: One Real $29 Checkout Completion

### Description
Complete a real Whop checkout for the Rescue tier ($29/month) and confirm
that `SubscriptionEntitlement` is populated with the correct plan tier and
active state.

### Why This Gate Exists
- Prior to v1.0.1, `SubscriptionEntitlement` was never populated — the
  billing wiring fix is the primary value of this release
- The checkout route (`src/app/api/dashboard/[companyId]/billing/checkout/route.ts`)
  creates a Whop checkout session and returns the `checkoutUrl`
- The browser redirects to Whop, the user pays, and Whop sends a
  `membership.activated` webhook
- The webhook handler calls `upsertSubscriptionEntitlementFromBilling()`,
  which populates `SubscriptionEntitlement` via idempotent upsert on `whopMembershipId`
- We must verify this entire flow end-to-end with real Whop infrastructure

### Preparation Status

| Item | Status |
|---|---|
| Checkout route | Complete — creates real Whop checkout session |
| Checkout rate limiting | Complete — `checkRateLimitOrReject(orgId, RATE_LIMITS.planMutation)` at 5 req/min |
| Checkout redirect URL | Read-only "Processing" page — does NOT grant entitlement |
| Webhook handler | Complete — `membership.activated` → `handleBillingWebhook()` → `upsertSubscriptionEntitlementFromBilling()` |
| Idempotency | Verified — `whopMembershipId` unique constraint upsert |
| Payment.failed handling | Added — was absent before v1.0.1 |
| Entitlement engine | Reads `SubscriptionEntitlement` — will return correct tier once populated |
| **Real Whop checkout** | **NOT EXECUTED** |

### Steps for Owner

1. Navigate to a connected workspace billing settings
2. Click "Upgrade" and select the Rescue plan ($29/mo)
3. Complete the Whop checkout in the browser
4. Verify the redirect lands on the "Processing" page (read-only)
5. Wait for the Whop `membership.activated` webhook to arrive
6. Confirm `SubscriptionEntitlement` row exists with:
   - `planTier: rescue`
   - `state: active`
   - `whopMembershipId` populated
   - `billingPeriodStart` and `billingPeriodEnd` populated
7. Verify the workspace now shows the Rescue tier entitlement in the UI

### Owner Approval Required
**REQUIRES OWNER APPROVAL** — This gate cannot be automated. The owner must
complete a real $29 checkout through the live Whop payment flow and confirm
entitlement population.

---

## Gate Execution Summary

| Gate | Description | Executed? | Passed? | Owner Action |
|---|---|---|---|---|
| A | Real Whop notification delivery | **NO** | **PENDING** | Must execute and confirm |
| B | Real $29 checkout → entitlement populated | **NO** | **PENDING** | Must execute and confirm |

**Neither gate has been executed.** Both require live Whop API interactions
that can only be performed by the product owner with access to the Whop
dashboard and a real payment method.

---

## Post-Gate Actions

Once both gates pass:

1. Record the gate results in this document (date, SHA, confirmation details)
2. Update `V1_0_1_OPERATIONAL_CERTIFICATION.md` to remove remaining blockers
3. Tag the release: `git tag v1.0.1 -m "RescueLoop v1.0.1 operational certification"`
4. Merge `release/v1.0.1-operational-certification` → `main`
5. Deploy to production via Vercel
