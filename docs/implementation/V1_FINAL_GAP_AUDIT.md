# V1 Final Gap Audit

> Created: 2026-08-07
> Branch: `integration/rescueloop-v1`
> Audited HEAD: `bd54dc2b330b7c14f7c03c7191da799663ca2eb8`
> Auditor: agent (witejackel-eng author identity, no force-push, no secret exposure)

This document records every launch-blocking gap discovered during the final
v1 completion pass, the classification of each, and the resolution applied
(or the owner action still required). It is the authoritative pre-flight
record referenced by `RELEASE_CHECKLIST.md`.

---

## 0. Preflight verification (already-clean items)

| Check                                            | State                                                   |
| ------------------------------------------------ | ------------------------------------------------------- |
| `git fetch origin`                               | OK — `origin/integration/rescueloop-v1` matches local  |
| Branch                                           | `integration/rescueloop-v1` ✓                           |
| Remote HEAD                                      | `bd54dc2` ✓                                             |
| Working tree                                     | clean ✓                                                 |
| Vercel Preview deployment `dpl_FzH5B2khNGsDo781Q35DtfBYdV4w` | READY (per owner — agent has no Vercel project access) |
| `docs/operations/VERCEL_PREVIEW_TOOLBAR.md`      | exists; documents `VERCEL_PREVIEW_FEEDBACK_ENABLED=0` as owner action only |
| Whop notifications adapter (`src/providers/whop/notifications.ts`) | Correctly maps `success:true → accepted:true`; records `providerMessageId: null` |
| Whop webhook handler (`src/app/api/webhooks/whop/route.ts`) | Signature verified via SDK `webhooks.unwrap()`, idempotent via `webhookReceipt`, enqueues durable Inngest job |
| Intervention delivery state                      | Uses `notification_accepted`, NOT `delivered`           |
| `requireCompanyAccess()` connected-mode fail-closed | Verified — never falls through to fixture data       |
| Student token signing secret                     | Required in `.env.example` (min 32 chars)               |

---

## 1. Launch-blocking gaps (must fix before GATE C)

### GAP-1 — Public demo redirects to auth-gated dashboard (CRITICAL)

**Location:** `src/app/overview/page.tsx`

**Symptom:**
```
/overview  →  redirect(/dashboard/co_fixture_cgl)
```
In production (no `RESCUELOOP_FIXTURE_MODE`), `/dashboard/co_fixture_cgl`
fails connected authentication. The "Explore demo" CTA on the marketing
header, hero, final CTA, and footer therefore breaks for every public
visitor.

**Spec violation:** Section 2 of the v1 final completion brief: *"That is
NOT acceptable for final RescueLoop v1 because the public marketing site
contains 'Explore demo' and customers must be able to explore a safe
simulated product without Whop admin access."*

**Resolution applied in this commit:**
- Replace the `/overview` redirect with a self-contained public demo
  page that renders fixture data directly through the existing fixture
  provider bundle.
- The page does NOT call `requireCompanyAccess()`, does NOT touch
  `/dashboard/*`, does NOT call any `/api/dashboard/*` endpoint, and
  does NOT depend on `RESCUELOOP_FIXTURE_MODE`.
- A visible "Interactive demo · simulated workspace" disclosure and a
  secondary "No customer data is connected. Nothing is sent." disclosure
  are rendered.
- `/dashboard/co_fixture_cgl` remains auth-gated and fails closed in
  production. `RESCUELOOP_FIXTURE_MODE` remains a development/test
  toggle only.
- E2E test added asserting `/overview` loads without auth and that no
  request to `/api/dashboard/*` or `/api/webhooks/*` fires during the
  page load.

### GAP-2 — Billing checkout returns `checkoutUrl: null` (CRITICAL)

**Location:** `src/app/api/dashboard/[companyId]/billing/checkout/route.ts`

**Symptom:**
```ts
// In production, this would call the Whop checkout API to create a checkout session.
// ...
checkoutUrl: null,
```
The placeholder returns no real Whop checkout URL. The client cannot
open a real Whop-hosted payment flow.

**Spec violation:** Section 7: *"This is a launch blocker. Replace the
placeholder with the real current official Whop checkout flow."*

**Resolution applied in this commit:**
- Implement real Whop checkout using the official
  `client.checkoutConfigurations.create()` Stable API.
- Server resolves the requested `planTier` to a server-side plan config
  mapping (`src/lib/billing/plans.ts`) which carries the env-driven
  Whop plan ID (`WHOP_RESCUE_PLAN_ID`, `WHOP_GROWTH_PLAN_ID`,
  `WHOP_SCALE_PLAN_ID`).
- `metadata` on the checkout configuration includes
  `{ organizationId, companyId, planTier }` so the webhook handler can
  map the resulting membership/payment event back to the right tenant.
- `redirect_url` points to a public "Processing" route
  (`/dashboard/[companyId]/billing/processing`) that explicitly does
  NOT grant entitlement — it only renders a "Processing" UI and polls
  the read-only entitlement endpoint.
- The webhook (already in place) is the authoritative grant path: it
  verifies the Standard Webhooks signature, dedupes by event id, and
  updates `SubscriptionEntitlement` via `handleMembershipActivated()`.
- Added automated test asserting that hitting the client callback
  route alone leaves entitlement `inactive`.

**Owner action still required:** Configure
`WHOP_RESCUE_PLAN_ID`, `WHOP_GROWTH_PLAN_ID`, `WHOP_SCALE_PLAN_ID` in
Vercel project env (Preview + Production). These are plan IDs (`plan_*`),
not secrets, but are environment-specific.

### GAP-3 — Marketing copy contains prohibited attribution claims (CRITICAL)

**Locations:**
- `src/components/marketing/outcome-strip.tsx` — `"Confirmed recovered value"` $237
- `src/components/marketing/workflow-showcase.tsx` — `"Total defended value"` sum (combines confirmed + associated + estimated)
- `src/components/marketing/workflow-showcase.tsx` — `"Confirmed"` $237 evidence: `"Payment received after a documented intervention sequence."`
- `src/components/marketing/pricing-section.tsx` — `"In the live demo workspace, $237 confirmed and $711 estimated value were recovered…"` — uses "live demo" and combined value
- `src/components/marketing/faq-section.tsx` — `"How is recovered revenue attributed?"`

**Spec violation:** Section 5: *"REMOVE or rewrite any public copy that:
adds confirmed + strongly associated + estimated into one total; calls
estimated opportunity recovered money; calls a normal payment after
intervention 'confirmed recovery'; … says 'live demo' for simulated
content."*

**Resolution applied in this commit:**
- `outcome-strip.tsx`: cell 4 changed from `"$237 Confirmed recovered value"` to a labelled estimated opportunity cell with explicit "(illustrative)" qualifier.
- `workflow-showcase.tsx`: confirmed tier set to `$0` with truthful evidence ("Confirmed recovered value remains $0 unless an auditable monetary recovery rule is satisfied."). "Total defended value" sum row removed and replaced with a "Shown separately — never summed" footer note.
- `pricing-section.tsx`: "live demo" → "interactive demo"; combined `$237 + $711` value claim removed and replaced with separate-evidence-class language.
- `faq-section.tsx`: "recovered revenue" question reworded to "How is observed value attributed?" Answer rewritten to match the canonical evidence-class language.
- Extended `MARKETPLACE_LISTING.forbiddenClaims` with the additional
  phrases: `"Total defended value"`, `"Confirmed recovered value"`,
  `"live demo"`, `"Payment received after"` (as a confirmed-recovery
  claim). Static manifest test extended to assert marketing source
  files contain none of the forbidden phrases.

### GAP-4 — Vercel Preview Toolbar (PLATFORM — owner action only)

**Status:** Already documented in `docs/operations/VERCEL_PREVIEW_TOOLBAR.md`.
Agent has NOT modified application CSS/JS to hide the toolbar. Owner
must set `VERCEL_PREVIEW_FEEDBACK_ENABLED=0` in the Vercel project
(Preview environment only) and redeploy.

---

## 2. Pre-gate items (must execute before GATE A)

### PRE-GATE-A.1 — Local acceptance gates

Run locally and capture exact counts:
- `bun run lint` — 0 errors
- `bun run typecheck` — 0 errors
- `bun run test` — all unit tests pass
- `bun run build` — production build succeeds
- `bun run test:contracts` — provider contract tests pass
- `bun run test:e2e` — Playwright suite passes (requires `bun run start`)

If any layer fails, fix forward; do NOT skip with `|| true`.

### PRE-GATE-A.2 — Vercel Preview redeploy

After this commit is pushed, the Vercel Preview deployment will
auto-deploy from `integration/rescueloop-v1`. Owner (or agent with
Vercel project access) must verify the new deployment is READY and
that `/overview` loads without auth on the Preview URL.

### PRE-GATE-A.3 — Whop app verification

Owner must verify in the Whop dashboard:
- App ID matches `NEXT_PUBLIC_WHOP_APP_ID`
- Webhook endpoint points to `https://<production-domain>/api/webhooks/whop`
- Required scopes are still granted (no scope creep)
- iframe experience URL is correct

Agent cannot perform this — no Whop dashboard access.

---

## 3. Gated items (require owner confirmation)

### GATE A — Controlled real Whop notification

Stop and return `GATE A READY — CONTROLLED WHOP NOTIFICATION` with the
required payload, then wait for owner confirmation before firing a real
notification through the full candidate → intervention → approval →
safety-recheck → outbox → WhopNotificationsProvider → Whop API chain.

### GATE B — Controlled $29 Whop checkout

Stop and return `GATE B READY — CONTROLLED $29 RESCUE CHECKOUT` after
the real Whop checkout integration is in place and unit-tested. Owner
must perform the actual $29 checkout using a real card on a controlled
test Whop company.

### GATE C — Production promotion

Stop and return `GATE C READY — RESCUELOOP V1 PRODUCTION RELEASE` with
the full source/CI/DB/Whop/Vercel/media/open-blockers dossier. Owner
must explicitly confirm before the squash-merge to `main`.

---

## 4. Non-launch-blocking debt (recorded, not fixed in this pass)

| Item | File | Notes |
| --- | --- | --- |
| `client.plans.list({ product_id })` not used to hydrate pricing on `WhopProductsProvider` | `src/providers/whop/products.ts` | Whop's `Product` type doesn't carry pricing; pricing lives on `Plan`. Currently returns `priceCents: 0` placeholder. Not user-visible (pricing is hardcoded in `PLANS` config). |
| "In production, this would enqueue the sync job via Inngest" comment in onboarding sync route | `src/app/api/onboarding/sync/route.ts:74` | The route DOES enqueue via `sendInngestEvent`; the comment is stale. Comment-only cleanup. |
| "In production, this would call posthog.capture()" comment | `src/lib/observability/posthog.ts:88` | PostHog client is lazy-initialised; the comment is stale. Comment-only cleanup. |
| Onboarding wizard "In production, this would…" comments | `src/components/rescueloop/onboarding/*.tsx` | Comments only; the wizard does fetch from API and does trigger the sync engine. Comment-only cleanup. |
| Marketplace screenshots and 30-60s demo video | `docs/releases/` | Section 16 deliverable — to be produced from the public demo after this commit lands. Not launch-blocking for code, but blocking for Marketplace submission. |
| Neon migration rehearsal report | `docs/operations/reports/V1_MIGRATION_REHEARSAL.md` | Section 10 deliverable — requires a Neon branch; owner must provision. |
| GitHub Actions 7/7 green run | `.github/workflows/*` | Section 12 — must be verified on the post-push SHA. Agent will trigger CI by pushing; owner observes the run. |
| `brand-qa-protection.spec.ts` "uses same auth mechanism" test fails with 503 in dev sandbox | `src/tests/e2e/brand-qa-protection.spec.ts:111` | Pre-existing on parent commit `bd54dc2` (verified by `git stash` + rerun). The `/api/internal/auth` route returns 503 when an env var is missing in the local dev sandbox — does NOT reproduce in CI / Vercel Preview where env is fully configured. Not a regression introduced by this commit. |
| Tailwind v4 `compact` breakpoint was silently no-op until this commit | `src/app/globals.css` + `src/components/marketing/floating-nav.tsx` | Root cause of the previously-failing 5 desktop header tests: `tailwind.config.ts` `screens.compact = '960px'` is ignored by Tailwind v4 unless re-registered via `@theme { --breakpoint-compact: 960px }` in CSS. Fixed in this commit by adding the `@theme` block. All 42 header-responsive tests now pass at all 8 viewports (390/768/900/1024/1280/1366/1440/1920). |

---

## 5. Summary

- Launch-blocking code gaps found and fixed in this commit: **GAP-1, GAP-2, GAP-3**.
- Platform-only action documented: **GAP-4** (Vercel Toolbar).
- Owner-action items (no code): configure Whop plan IDs in Vercel env; set `VERCEL_PREVIEW_FEEDBACK_ENABLED=0`; verify Whop app; provision Neon branch.
- Gated items awaiting owner confirmation: **GATE A**, **GATE B**, **GATE C**.

After this commit is pushed and the local acceptance gates pass, the
agent will stop at **GATE A** and return the required readiness
payload.
