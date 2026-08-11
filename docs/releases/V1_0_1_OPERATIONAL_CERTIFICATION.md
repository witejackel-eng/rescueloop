# RescueLoop v1.0.1 — Operational Certification

> **Date:** 2026-08-07
> **Branch:** `release/v1.0.1-operational-certification`
> **Starting SHA:** `450c50dad0a2883c6286346f48dae9e63189e8b7`
> **Auditor:** witejackel-eng

---

## 1. Release Identity

| Field | Value |
|---|---|
| Version | v1.0.1 |
| Branch | `release/v1.0.1-operational-certification` |
| Base SHA | `450c50dad0a2883c6286346f48dae9e63189e8b7` |
| Type | Logic-only (no schema changes) |

---

## 2. Changes Made

### PX01 — Operation Progress UI Adapters
- **Scope:** Read-model adapters over existing production state
- **No new DB models.** PX01 renders progress from `SyncExecution`, `SyncStage`,
  `SyncCheckpoint`, `OnboardingProgress`, `DataExportRequest`, `DataDeletionRequest`
- **Architecture:** Each operation type has a UI adapter that reads its persisted
  multi-stage state and renders progress indicators, stage breakdowns, and
  retry/resume affordances. No state is managed in React — all truth is in the DB.
- **PX01 principle:** "Every operation that matters to the user has a persisted
  execution record with stages, and the UI is a thin read-model over that record."

### HTTP 503 — Whop API Resilient Error Handling
- **Scope:** Whop provider layer (`src/providers/whop/`)
- Handles Whop API returning HTTP 503 (Service Unavailable) gracefully
- Transient failures are retried via Inngest with exponential backoff
- Non-retriable errors fail closed — never silently drop data

### Billing Wiring — SubscriptionEntitlement Population
- **Scope:** `src/server/jobs/functions.ts` (Inngest `processWebhook`)
- Prior to this fix, `SubscriptionEntitlement` table was never populated —
  `computeEntitlement()` always returned the free tier
- Now: every billing webhook event (membership.activated, membership.deactivated,
  payment.succeeded, payment.failed) calls `upsertSubscriptionEntitlementFromBilling()`
- Idempotent via `whopMembershipId` unique constraint upsert
- `payment.failed` event handling added (was entirely absent)
- Rate limiting added to checkout route: `checkRateLimitOrReject(orgId, RATE_LIMITS.planMutation)`

### CI Fixes
- Added billing plan ID env vars (`WHOP_RESCUE_PLAN_ID`, `WHOP_GROWTH_PLAN_ID`, `WHOP_SCALE_PLAN_ID`)
  to all CI job configurations
- Added `release/*` to CI trigger branches for operational certification workflow
- All CI jobs now pass with complete env var set

---

## 3. PX01 Architecture Description

PX01 is the **production integration** philosophy that drove this release:

1. **No new models.** Every PX feature is a read model, UI adapter, or
   internal tooling over existing production state.

2. **Operation progress is persisted.** Every long-running operation
   (sync, onboarding, data export, data deletion) has a DB record with
   stages. The UI reads this record — it does not manage state in React.

3. **Health is derived.** System health is a read model computed from
   `WhopInstallation`, `SyncExecution`, `WebhookReceipt`, `OutboxEvent`,
   `JobExecution`, and `SubscriptionEntitlement`. No separate health table.

4. **Exceptions are existing failures.** Exception operations derive from
   `DeadLetterEvent`, failed `OutboxEvent`, failed `WebhookReceipt`, and
   failed `SyncExecution`. No new exception model.

5. **Billing truth is webhook-only.** Entitlement is granted exclusively
   by the verified Whop webhook handler. The browser checkout callback
   NEVER grants access. This is enforced at the code level with explicit
   comments and a read-only redirect URL.

6. **Cost is a read model.** Cost estimation reads from `UsageCounter`,
   `UsageEvent`, `Plan`, and `SubscriptionEntitlement` with a configurable
   rate card. MRR is now derived from actual `SubscriptionEntitlement`
   records (not `memberCount × price`).

---

## 4. Environment Variables (Names Only)

| Variable Name | Status | Notes |
|---|---|---|
| `DATABASE_URL` | PRESENT | Pooled connection (PgBouncer) |
| `DIRECT_URL` | PRESENT | Direct connection for migrations |
| `WHOP_API_KEY` | PRESENT | Server-side Whop API key |
| `WHOP_WEBHOOK_SECRET` | PRESENT | Whop webhook signature verification |
| `NEXT_PUBLIC_WHOP_APP_ID` | PRESENT | Browser-safe Whop app ID |
| `WHOP_COMPANY_ID` | PRESENT | Default company for API calls |
| `APP_URL` | PRESENT | Canonical app URL |
| `CRON_SECRET` | PRESENT | Cron job authentication |
| `INNGEST_EVENT_KEY` | PRESENT | Inngest event signing |
| `JOB_PROVIDER_SECRET` | PRESENT | Inngest job provider secret |
| `STUDENT_LINK_SIGNING_SECRET` | PRESENT | HMAC for student links (≥32 chars) |
| `RESCUELOOP_INTERNAL_TOKEN` | PRESENT | Internal ops auth (≥32 chars) |
| `SENTRY_DSN` | PRESENT | Error tracking |
| `NEXT_PUBLIC_POSTHOG_KEY` | PRESENT | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | PRESENT | Analytics host |
| `WHOP_RESCUE_PLAN_ID` | PRESENT | Rescue tier plan ID |
| `WHOP_GROWTH_PLAN_ID` | PRESENT | Growth tier plan ID |
| `WHOP_SCALE_PLAN_ID` | PRESENT | Scale tier plan ID |
| `WHOP_CHECKOUT_RETURN_URL` | NOT REQUIRED | Defaults to `${APP_URL}/dashboard/[companyId]/billing/processing` |
| `UPSTASH_REDIS_REST_URL` | PRESENT | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | PRESENT | Rate limiting |
| `RESCUELOOP_FIXTURE_MODE` | NOT REQUIRED | Dev/test toggle only. Must NOT be set in production. |

> **IMPORTANT:** No secret values are included in this document.
> All variables are referenced by name only.

---

## 5. Remaining Blockers

| Blocker | Status | Owner Action Required |
|---|---|---|
| Gate A: One real Whop notification delivery | **NOT EXECUTED** | REQUIRES OWNER APPROVAL — must trigger a real Whop notification and confirm receipt |
| Gate B: One real $29 checkout completion | **NOT EXECUTED** | REQUIRES OWNER APPROVAL — must complete a real Whop checkout and confirm entitlement populated |
| Neon preview deployment verification | **NOT EXECUTED** | Owner must confirm Vercel preview deploys successfully with live DB |

These are **external gates** that cannot be exercised by the agent. See
`V1_0_1_EXTERNAL_GATES.md` for detailed preparation status.

---

## 6. Quality Gates Passed

| Gate | Result |
|---|---|
| `prisma validate` | PASS |
| TypeScript (`tsc --noEmit`) | PASS — clean |
| ESLint | PASS — 0 errors |
| Unit tests | PASS |
| Build (`next build`) | PASS |
| No schema changes | PASS |
| No destructive SQL | PASS |
| No secrets in code | PASS |

---

## 7. Certification

This document certifies that all **automatable** quality gates for v1.0.1
have passed. The remaining blockers are external gates requiring real
Whop API interactions that must be executed by the product owner.
