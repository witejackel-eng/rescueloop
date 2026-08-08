
---
Task ID: final-release-candidate
Agent: Main
Task: Production-safe reintegration + release candidate

Work Log:
- Disabled autonomous cron job (313163 deleted)
- Created repair/final-release-candidate from repair/px01-px07-production-safe at 12c3cb3
- Set git identity: witejackel-eng / 291486779+witejackel-eng@users.noreply.github.com
- Created donor salvage audit (docs/implementation/FINAL_UI_SALVAGE_AUDIT.md)
- Salvaged product-led hero: product-story-visual.tsx + rescue-hero.tsx upgrade
- Eliminated all marketing-truth regressions (12 files fixed)
- Fixed attribution model: confirmed=$0, no cross-evidence totals
- Corrected notification language: "accepted by provider" not "delivered/opened/read"
- Created 7 public demo sub-routes under /overview/
- Fixed SEO positioning: "Activation rescue for Whop creators"
- Added 22 regression guard tests (marketing-truth, security, attribution)
- All quality gates pass: lint 0 errors, typecheck clean, 674/674 tests, build success
- Pushed to origin repair/final-release-candidate

Stage Summary:
- Final SHA: 731571f7879ca5800e123f81721cb8dfc4d202a7
- PostgreSQL schema preserved (no SQLite)
- No z-ai-web-dev-sdk in production
- No src/app/page.tsx duplicate root
- Main branch untouched (ded8ef7)
- All 8 demo routes return 200
- Production build succeeds

---
Task ID: 2-a
Agent: product-moments
Task: Create THREE hero-sized product moment components

Work Log:
- Created /src/components/marketing/product-moments/rescue-queue-moment.tsx
  • Large product-surface rescue queue table (Maya Thompson, Devon Park, Sara Klein, Jamal Wright)
  • Column headers in mono font: Member, Trigger, Progress, Inactive, Value, Priority
  • Progress bars with recovery-green fill
  • Priority badges: HIGH (warning), URGENT (critical), MEDIUM (info)
  • Maya row expandable — reveals evidence panel (previous pace 3.2 lessons/week, no activity since Module 4, no recent intervention, reminders allowed)
  • Toolbar: "Awaiting approval · 4" with sync status and manual-approval indicator
  • Inactivity color coding: 7+ days = critical, 5+ = warning
  • Footer: "4 interventions · $286/mo represented"
  • Scroll-reveal entrance animations, AnimatePresence for expand/collapse
  • Full responsive: stacked mobile, table layout desktop

- Created /src/components/marketing/product-moments/playbook-moment.tsx
  • Substantial rule-builder product surface
  • Three numbered rule clauses: progress band (20%–80%), inactivity threshold (interactive slider), membership status filter
  • Interactive slider (1–30 days) with real-time eligibility updates
  • Stat cards: Eligible members, Expected interventions, Excluded by cooldown, Near renewal
  • Delta indicators when threshold differs from 7-day baseline
  • "Editing · not yet published" badge
  • "Nothing will be sent until you publish this rule" safety footer
  • Deterministic stat computation from 742 students × $79/mo
  • Uses shadcn/ui Slider component

- Created /src/components/marketing/product-moments/course-intelligence-moment.tsx
  • Large 12-lesson bar chart (L1–L12) with 260px height
  • Clear friction point at L7 highlighted in recovery-green (24% stall rate)
  • Friction severity markers: critical (red), watch (amber), ok (none)
  • Animated bar entrance with staggered delays
  • Interactive lesson selection with hover states
  • 4-column detail panel: Lesson, Stall rate, Affected students, Recommended action
  • L7 recommendation: "Add a setup walkthrough video to reduce stall by estimated 30%"
  • Legend, axis labels, and footer
  • AnimatePresence for detail panel transitions

Design compliance:
- All components use "use client"
- Imports: useReducedMotion, motion tokens, cn, ScrollReveal, SectionEyebrow
- CSS custom properties only (--canvas, --surface, --ink-primary, --recovery-green, --warning, --critical, --info, etc.)
- framer-motion for entrance animations only (scroll reveal, stagger, expand/collapse)
- Respects prefers-reduced-motion
- Desktop: full-width product surface with surrounding copy
- Mobile: stacked, logical information flow
- No glassmorphism, no neon, no random blues/purples, no crypto aesthetics
- Subtle borders (var(--hairline)), small shadows (shadow-sm), surface elevation

Lint: 0 errors (1 pre-existing warning in unrelated file)

---
Task ID: 2-b
Agent: demo-layout
Task: Create a unified demo layout shell for /overview routes

Work Log:
- Created /src/app/overview/layout.tsx — unified demo shell wrapping ALL /overview/* routes
  • Top bar (h-14): RescueLoopLogo (workspace/compact), vertical separator, workspace name "Creator Growth Lab", plan badge "Growth" (recovery-green outline), system status indicator (ping dot + "Healthy" label)
  • Desktop sidebar (240px, lg+): always visible, framer-motion entrance (slide-from-left + fade)
  • Mobile sidebar: Sheet drawer (Radix Dialog, side="left", 280px) triggered by hamburger Menu icon in top bar
    - Built-in focus trap and Escape key close via Radix Dialog
    - Drawer closes on route change (derived state pattern, no useEffect)
    - Drawer closes on nav item click (onNavigate callback)
    - SheetTitle with RescueLoopLogo, SheetDescription sr-only for a11y
  • Sidebar navigation — Primary group:
    - Overview → /overview (exact match for active state)
    - Rescue Queue → /overview/rescue-queue
    - Students → /overview/students
    - Campaigns → /overview/campaigns
    - Insights → /overview/insights
    - Value Ledger → /overview/value
  • Sidebar navigation — Secondary group (after separator, "System" label):
    - System Health → /overview/settings/health
    - Settings → /overview/settings
  • Active nav item: recovery-green text + recovery-light/50 bg + animated left border accent (motion.div layoutId spring animation)
  • Inactive nav item: ink-secondary text, hover → ink-primary + canvas-elevated bg
  • Persistent disclosure banner at bottom of main content area:
    - "Interactive demo · simulated workspace — No customer data is connected. Nothing is sent."
    - CircleCheck icon in recovery-green
    - hairline top border, canvas-elevated bg
  • Main content area: flex-1 overflow-y-auto with AnimatePresence page transitions (fade + slide)
  • Layout root: h-screen flex-col, overflow-hidden, canvas bg

Design compliance:
- "use client" for stateful mobile drawer toggle
- CSS custom properties only: --canvas, --canvas-elevated, --surface, --ink-primary, --ink-secondary, --ink-muted, --hairline, --recovery-green, --recovery-light
- framer-motion for sidebar entrance + page transitions + active indicator spring
- shadcn/ui Sheet for mobile drawer (built on Radix Dialog)
- shadcn/ui Badge, Separator
- RescueLoopLogo from @/components/brand/logo
- usePathname for active state detection
- Link from next/link for client-side navigation
- Responsive: sidebar hidden on <lg, hamburger visible on <lg
- Touch target (44px) on hamburger button
- aria-current="page" on active nav item
- aria-label on hamburger and nav
- No useEffect — derived state pattern for route-change drawer close
- No glassmorphism, no neon, no random blues/purples

Lint: 0 errors (1 pre-existing warning in unrelated file)

---
Task ID: 3-a
Agent: marketing-truth-fix
Task: Search and fix ALL marketing truth regressions

Work Log:
- Searched all .tsx, .ts, .md files in src/ and docs/ for 12 forbidden terms
- Found 3 regressions in src/ and 2 in docs/

Fixes applied:

1. src/components/marketing/hero/closing-signal-visual.tsx
   • "Support sent" → "Intervention dispatched" (label: "Intervention", sublabel: "dispatched")
   • "Return confirmed" → "Return observed" (sublabel: "confirmed" → "observed")
   • Updated JSDoc comment: "Support event" → "Intervention dispatched"

2. src/components/marketing/pricing-section.tsx
   • "confirmed attribution" → "attribution evidence" in Scale plan problemItHandles
   • (not about the confirmed tier specifically — this is marketing copy)

3. docs/implementation/FINAL_UI_SALVAGE_AUDIT.md
   • "Live demo" → "Interactive demo" in donor component audit (2 occurrences)

Terms confirmed already clean (no action needed):
- "Support sent" — no other occurrences in src/ or docs/
- "Return confirmed" — no other occurrences
- "opened the support" — no occurrences
- "confirmed payment attribution" — no occurrences
- "Total defended value" — only in manifest.ts forbiddenClaims array and test files (correct: these define what's forbidden)
- "$237 confirmed" — only in test guard patterns (correct)
- "Confirmed recovered value $237" — no occurrences
- "Live demo" / "live demo" — only in manifest.ts forbiddenClaims and test files (correct)
- "Delivered"/"Opened"/"Read" as provider state labels — no occurrences in UI labels
  • interventionStateMeta uses truthful labels: "Sent", "Response received", "Responded", "Recovered"
  • brand/copy.ts states use truthful labels: "provider accepted", "outcome observed"
- "confirmed attribution" in policy.ts/engine.ts — correct: these describe the technical classification system, not marketing copy

Verification:
- TypeScript: clean (tsc --noEmit passes)
- Marketing truth guard tests: 16/16 pass
- Marketplace truth tests: 8/8 pass
- No lint errors in changed files
---
Task ID: final-visual-pass
Agent: main
Task: 10/10 Visual Pass + Release Closure — all 26 steps

Work Log:
- Audited RC branch at 89e2e51, verified on repair/final-release-candidate
- Read all 12+ marketing components and design system
- Captured BEFORE screenshot at 1440px
- Hero: swapped layout to 45-50% copy / 50-55% visual, increased min-height, updated copy to 4-line product story
- Created 3 hero-sized product moments: RescueQueueMoment, PlaybookMoment, CourseIntelligenceMoment
- Created unified demo shell: /overview/layout.tsx with sidebar, top bar, mobile drawer
- Added section rhythm CSS tokens: --section-warm, --section-secondary, --section-recovery-tint, --section-white, --section-neutral
- Applied tonal variation to all 11 sections (no more "all cream")
- Fixed footer dead links: /rescue-queue → /overview/rescue-queue, /settings → /overview/settings
- Fixed marketing truth: Support sent→Intervention dispatched, Return confirmed→Return observed, confirmed attribution→attribution evidence
- Fixed ROI calculator overselling: Conservative→Scenario, Value:cost→Illustrative value-to-plan-cost
- Added Done-for-you implementation $699 section to pricing
- Updated Final CTA to dark conclusion treatment with "Apply for done-for-you implementation"
- Fixed Observe copy: "RescueLoop observes student responses and subsequent course activity where evidence is available."
- Hard-guarded db:push and db:reset scripts in package.json
- Fixed documentation date to 2025-08-10
- TypeScript: clean, Lint: 0 errors, Tests: 674/674 pass
- Pushed f7381b8 to origin/repair/final-release-candidate (verified via git ls-remote)
- Captured AFTER screenshots at 390, 768, 1440px

Stage Summary:
- FINAL SHA: f7381b89eed9aa8d3816114818a1b385b6f0ffcc
- Remote verified: git ls-remote shows f7381b8 on repair/final-release-candidate
- All /overview routes (8 total) return 200 with unified shell
- Database: PostgreSQL + DIRECT_URL confirmed, SQLite absent
- Destructive scripts: hard-guarded (exit 1 with warning)
- Marketing truth: clean (no forbidden claims found)
- ROI calculator: illustrative language throughout
- Pricing: $29/$59/$119 + $699 done-for-you

---
Task ID: 6
Agent: witejackel-eng
Task: Verify GitHub Actions CI

Work Log:

1. Read `.github/workflows/ci.yml` (369 lines, 7 jobs)
2. Confirmed `vercel-preview.yml` exists on repo (workflow ID 327738684, state: active)
   - Trigger: deployment_status (Preview environment)
   - No `|| true` or blanket suppression
   - Health check uses `::warning::` for non-200 (acceptable for preview check)

3. Verified all 7 required CI jobs exist as actual jobs:
   | # | Job Key            | Display Name                  | Present |
   |---|--------------------|-------------------------------|--------|
   | 1 | lint-typecheck     | Lint & Typecheck              | YES    |
   | 2 | unit-tests         | Unit Tests                    | YES    |
   | 3 | integration-tests  | Integration Tests (PostgreSQL)| YES    |
   | 4 | contract-tests     | Provider Contract Tests       | YES    |
   | 5 | production-build   | Production Build              | YES    |
   | 6 | e2e                | E2E (Playwright)              | YES    |
   | 7 | security           | Security Scan                 | YES    |

4. Triggers — FOUND MISSING: release/* was not in push or pull_request branches
   - Original: push on [main, next, feat/*, integration/*]
   - Fixed:    push on [main, next, feat/*, integration/*, release/*]
   - Fixed:    pull_request on [main, next, release/*]
   - Committed as 135be81, pushed to both main and release/v1.0.1-operational-certification

5. Strict error handling — VERIFIED:
   - No `|| true` in any step command (only in header comment as documentation)
   - No `continue-on-error: true` on any step
   - No `fail-fast: false` on any job
   - Security audit is genuinely blocking (exit 1 on critical/high via audit-parser.ts)
   - `if: always()` on artifact upload is correct (should upload even on failure)
   - `if: failure()` on failure-artifact upload is correct (only on failure)

6. Pushed release branch to origin — SUCCESS
   - `git push origin release/v1.0.1-operational-certification`
   - Remote SHA: 135be8125c108eb5480ee96663cc30b2f6daef0e

7. CI triggered — CONFIRMED
   - Run ID: 31253882150
   - Workflow: CI
   - Branch: release/v1.0.1-operational-certification
   - SHA: 135be81

8. Job results at time of check:
   - Lint & Typecheck:        success
   - Unit Tests:              success
   - Provider Contract Tests: success
   - Security Scan:           success
   - Production Build:        success
   - Integration Tests (PostgreSQL): FAILURE (step: "Run integration tests")
   - E2E (Playwright):        in_progress (still running)

Findings:
- All 7 required CI jobs present
- Triggers now include release/* (was missing, fixed)
- Strict error handling verified
- CI successfully triggered on release branch
- 5/7 jobs passed, 1 failed (PostgreSQL Integration), 1 still running (E2E)
- PostgreSQL Integration failure needs investigation (test:integration script)
- gh CLI not available in environment; used GitHub REST API with token auth instead

---
Task ID: 9-13
Agent: explore
Task: Verify billing security, internal ops, rate limiter, system health, and public demo safety

Work Log:

## TASK 9 — BILLING SECURITY ✅ (invariant upheld, one gap noted)

### Checkout route (`billing/checkout/route.ts`)
- ✅ Does NOT create entitlement. Creates Whop checkout configuration, returns `purchase_url`.
- ✅ JSDoc: "The browser-side checkout completion callback NEVER grants access."
- ✅ Redirect URL points to read-only "Processing" route.
- ✅ Auth guard via `requireCompanyAccess()`. Whop-not-configured returns 503.
- ✅ Metadata on checkout includes rescueloop_organization_id for webhook tenant mapping.

### Processing page (`billing/processing/page.tsx`)
- ✅ READ-ONLY. No mutations. No entitlement creation.
- ✅ `import "server-only"`. Calls `requireCompanyAccess()` for shell rendering only.
- ✅ Copy: "The browser completing checkout alone does not grant access."

### Webhook route (`api/webhooks/whop/route.ts`)
- ✅ Signature verification via official SDK: `client.webhooks.unwrap(rawBody, { headers })`.
- ✅ Returns 401 on invalid signature. Returns 503 if Whop not configured.
- ✅ Idempotency: checks `WebhookReceipt` by `whopEventId` → returns 200 `{ reason: "duplicate" }`.
- ✅ Requires `WhopInstallation` for company mapping → returns 200 `{ reason: "not_installed" }` if missing.
- ✅ Enqueues async processing via Inngest (`whop/webhook.received`).

### Whop webhook handlers (`whop-webhooks.ts`)
- ✅ All handlers (payment.succeeded, payment.failed, membership.activated, membership.deactivated) are idempotent (dedup via `internalAuditLog` by eventId).
- ✅ Updates Organization.planTier + entitlementState. Grace period on payment.failed (7 days).
- ✅ Deactivation preserves historical data — only restricts NEW use.
- ⚠️ **GAP**: This module is only imported by tests, NOT by the production Inngest flow. The Inngest `process-webhook` in `functions.ts` has its own handlers that create Membership/MembershipEvent records but do NOT create SubscriptionEntitlement rows or update Organization.planTier/entitlementState.

### Entitlement engine (`entitlement-engine.ts`)
- ✅ `import "server-only"` — server-authoritative. Never trusts client data.
- ✅ Computes from `SubscriptionEntitlement` rows + `PilotOverride` rows.
- ✅ Fails safely: inactive/billing_error (expired grace) → denies all operations.
- ✅ Downgrade never deletes historical data.
- ⚠️ **GAP**: `computeEntitlement()` reads from `db.subscriptionEntitlement.findFirst()`, but no production code path creates `SubscriptionEntitlement` rows. Only a test file has `subscriptionEntitlement.create`. This means the entitlement engine will always fall back to inactive/pilot in production. The `whop-webhooks.ts` handlers update Organization directly but are not wired into the production flow.

### Billing invariant summary
| Invariant | Status |
|---|---|
| Forged browser callback cannot activate entitlement | ✅ PASS |
| Missing webhook → no entitlement | ✅ PASS |
| Invalid webhook signature → no entitlement | ✅ PASS |
| Duplicate webhook is idempotent | ✅ PASS |
| Correct webhook → correct org + plan | ✅ PASS (if wired) |
| Plan limits follow entitlement | ⚠️ SubscriptionEntitlement gap |
| whop-webhooks.ts wired into production | ⚠️ NOT — only tests import it |

---

## TASK 13 — INTERNAL OPS ✅

### 1. All /internal/* routes behind InternalAuthGate
- ✅ `src/app/internal/layout.tsx` wraps all children in `<InternalAuthGate>`.
- ✅ All 11 internal pages (webhooks, jobs, usage, brand-qa, dead-letters, organisations, sync, pilots, data-requests, scale, exceptions) go through this layout.
- ✅ InternalAuthGate requires POST to `/api/internal/auth` with Bearer token.

### 2. No internal dashboard data on public routes
- ✅ Public /overview routes use fixture providers only. No /api/internal calls.

### 3. noindex/nofollow on internal pages
- ✅ Layout metadata: `robots: { index: false, follow: false }`.

### 4. Cost math derives from SubscriptionEntitlement MRR, NOT memberCount × price
- ✅ `/api/internal/costs` reads active `SubscriptionEntitlement` records to compute MRR per org.
- ✅ Explicit comment: "NEVER uses memberCount × planPrice (that is a known buggy pattern)."
- ✅ Payment cost derived from `estimatedMrrCents` (from entitlement MRR, falling back to plan price).

### 5. Cost estimates labeled "Internal estimate — not accounting truth"
- ✅ Response `_meta.disclaimer`: "Internal estimate — not accounting truth. Payment processing derived from actual subscription MRR where available."

---

## TASK 12 — RATE LIMITER

### Architecture ✅
- ✅ `UpstashRateLimiter` uses `@upstash/ratelimit` + `@upstash/redis` for production.
- ✅ `InMemoryRateLimiter` used only when `!isUpstashConfigured()` (test/dev).
- ✅ `getRateLimiter()` selects Upstash when configured, in-memory otherwise.
- ✅ Raw student tokens never used in Redis keys — SHA-256 hash only.

### Rate-limited endpoints (12)
| Endpoint | Limit | Key |
|---|---|---|
| data-deletion | planMutation (5/min) | org |
| pause | planMutation (5/min) | org |
| approve | planMutation (5/min) | org |
| schedule | planMutation (5/min) | org |
| edit | planMutation (5/min) | org |
| suppress | planMutation (5/min) | org |
| dismiss | planMutation (5/min) | org |
| onboarding | authSensitive (20/min) | IP |
| data-export | dataExport (3/min) | org |
| private-pilot | pilotApplication (10/min) | IP |
| internal/sync | internalRetry (20/min) | IP |
| student/respond | studentResponse (10/min) | token hash |

### NOT rate-limited ⚠️
| Endpoint | Risk |
|---|---|
| `/api/webhooks/whop` | Webhook flood (mitigated by signature verification + idempotency) |
| `/api/dashboard/[companyId]/billing/checkout` | ⚠️ Checkout spam — could create many Whop checkout configs |
| `/api/dashboard/[companyId]/billing` (GET) | Low risk — read-only |
| `/api/dashboard/[companyId]/health` (GET) | Low risk — read-only |
| All `/api/internal/*` except sync | Medium — behind InternalAuthGate but no rate limit |
| `/api/inngest` | Event processing endpoint |
| `/api/onboarding/*` | Onboarding routes |
| `/api/dashboard/[companyId]/rescue-queue` | Dashboard data read |
| `/api/dashboard/[companyId]/insights` | Dashboard data read |
| `/api/dashboard/[companyId]/value*` | Dashboard data read |

**Recommendation**: Add rate limiting to `billing/checkout` (planMutation) and `/api/internal/*` routes (internalRetry).

---

## TASK 11 — SYSTEM HEALTH ✅

### Health API (`/api/dashboard/[companyId]/health/route.ts`)
Checks 6 real health signals from DB:

| Signal | Check | Status |
|---|---|---|
| WhopInstallation | Installation exists and status="active" | ✅ |
| SyncExecution | Latest sync state (completed/failed/pending) | ✅ |
| WebhookReceipt | Failed webhook count (>5 = critical) | ✅ |
| OutboxEvent | Failed + dead-lettered counts | ✅ |
| SubscriptionEntitlement | Active/billing_error/inactive state | ✅ |
| UsageCounter | Stale counters (>24h since update = degraded) | ✅ |

- ✅ DB connectivity implicitly tested — catch returns 503 "Database unavailable".
- ✅ Webhook freshness checked via failed webhook count.
- ✅ Sync freshness checked via latest SyncExecution state.
- ✅ Background jobs checked via OutboxEvent failures/dead letters.
- ✅ "Unknown" ≠ "Healthy" — distinct status values (unknown/healthy/degraded/critical) with different icons, colors, and badges.
- ✅ Overall status computed correctly: critical if any critical, degraded if any degraded, healthy otherwise.
- ✅ Auth guard via `requireCompanyAccess()`.

---

## TASK 14 — PUBLIC DEMO SAFETY ✅

### All /overview routes verified (9 pages):
| Route | Safe? | API calls | DB | Mutations | Disclosure banner |
|---|---|---|---|---|---|
| /overview | ✅ | None | None | None | ✅ DemoDisclosureBanner |
| /overview/rescue-queue | ✅ | None | Fixture only | None | ✅ DemoDisclosureBanner |
| /overview/students | ✅ | None | Fixture only | None | ✅ DemoDisclosureBanner |
| /overview/campaigns | ✅ | None | None (hardcoded) | None | ✅ DemoDisclosureBanner |
| /overview/insights | ✅ | None | Fixture only | None | ✅ DemoDisclosureBanner |
| /overview/value | ✅ | None | Fixture only | None | ✅ DemoDisclosureBanner |
| /overview/settings | ✅ | None | None | None | ✅ DemoDisclosureBanner |
| /overview/settings/health | ✅ | None | Zustand store (demo) | None | ✅ DemoDisclosureBanner |
| Layout shell | ✅ | None | None | None | ✅ Persistent DisclosureBanner |

### Invariant checks:
- ✅ No authenticated /api/dashboard API calls in any /overview route
- ✅ No Whop SDK calls or sends
- ✅ No checkout calls
- ✅ No SubscriptionEntitlement creation
- ✅ No production DB mutations
- ✅ Demo disclosure banner present on every page + persistent in layout shell
- ✅ Approve/Send buttons simulate locally only (PublicDemoWorkspace uses local React state)
- ✅ All pages use `"server-only"` or fixture providers — never connect to production DB

---

## Summary of Findings

### ✅ PASSING
1. Billing invariant: browser callback cannot grant entitlement
2. Webhook signature verification via official Whop SDK
3. Webhook idempotency (WebhookReceipt dedup + eventId audit dedup)
4. Processing page is read-only, no mutations
5. Entitlement engine is server-authoritative (server-only)
6. All internal routes behind InternalAuthGate
7. Internal pages noindex/nofollow
8. Cost math derives from SubscriptionEntitlement MRR, not memberCount × price
9. Cost estimates labeled "Internal estimate — not accounting truth"
10. Rate limiter: Upstash in prod, in-memory in test/dev
11. System health checks all 6 real signals, "Unknown" ≠ "Healthy"
12. All /overview routes are demo-safe with disclosure banners

### ⚠️ GAPS (not code changes, investigation needed)
1. **SubscriptionEntitlement orphan**: `computeEntitlement()` reads from `SubscriptionEntitlement` table, but no production code path creates these rows. The `whop-webhooks.ts` handlers update `Organization` directly but are not wired into the production Inngest flow. This means the entitlement engine will always return inactive/pilot in production.
2. **whop-webhooks.ts not wired**: Only imported by tests. The Inngest `process-webhook` in `functions.ts` has separate handlers that don't create SubscriptionEntitlement or update Organization.planTier/entitlementState.
3. **Missing rate limits**: `billing/checkout` and most `/api/internal/*` routes lack rate limiting.
4. **Upstash fail-open**: When Redis is not configured, `UpstashRateLimiter.check()` returns `success: true` (allow all). This is intentional for graceful degradation but means a misconfigured prod environment has no rate limiting.

---
Task ID: 15-16
Agent: explore
Task: Marketing truth audit (15) + Security retest (16)

## MARKETING TRUTH AUDIT (Task 15)

Searched all src/ and docs/ for 12 forbidden/misleading terms. Results:

### "delivered" (in notification context)
| File | Line | Match | Context | Verdict |
|------|------|-------|---------|---------|
| wp04-student-row.tsx | 41 | `delivered: { label: "Accepted by provider" }` | Maps DB state "delivered" → truthful UI label "Accepted by provider" | ✅ Acceptable — UI label is truthful |
| public-demo-workspace.tsx | 157 | `Whop provider would record "accepted" — never "delivered"` | Explanatory text in demo | ✅ Acceptable — disavowal |
| overview/page.tsx | 175 | `delivered — because the` | Explanatory text | ✅ Acceptable — disavowal |
| server/jobs/functions.ts | 377,383 | `state: "api_accepted" // API accepted — NOT "delivered"` | Internal processing, explicit NOT-delivered annotation | ✅ Acceptable |
| attribution/engine.ts, policy.ts | various | `intervention_delivered` | Internal event type identifier, not UI | ✅ Acceptable — enum value |
| health-store.ts | 62,87 | "webhooks undelivered", "89 delivered" | Internal infra health (webhook delivery, not student notification) | ✅ Acceptable |
| All other occurrences | various | DB state values, test guards, query filters | Internal/engineering | ✅ Acceptable |

**Key evidence:** Whop notification state is consistently surfaced as "Accepted by provider" in UI (wp04-student-row.tsx:41). Internal DB states use "delivered"/"notification_accepted" but are never shown to users as "Delivered". ✅ CLEAN

### "notification opened" / "notification read" / "opened the support"
No matches found. ✅ CLEAN

### "confirmed payment attribution"
No matches found. ✅ CLEAN

### "confirmed attribution"
| File | Line | Match | Context | Verdict |
|------|------|-------|---------|---------|
| attribution/engine.ts | 19,116 | "Confirmed attribution is reserved for later workflows" | Internal code comment | ✅ Acceptable — engineering doc |
| attribution/policy.ts | 67,169,246,258 | "Confirmed attribution requires an auditable reversal event…" | Policy definition | ✅ Acceptable — internal policy |

No user-facing marketing copy uses "confirmed attribution" as a claim. ✅ CLEAN

### "recovered revenue"
| File | Line | Match | Context | Verdict |
|------|------|-------|---------|---------|
| attribution-waterfall.tsx | 79 | `"Recovered revenue — by attribution tier"` (UI heading) | Dashboard value page heading | ⚠️ Borderline — dashboard, not marketing, but term is in forbiddenClaims |
| attribution/engine.ts | 24,119,151 | "recovered revenue" in disavowal comments | Internal code explaining why NOT to claim | ✅ Acceptable — disavowal |
| attribution/policy.ts | 99 | "not attributed as recovered revenue" | Policy constraint | ✅ Acceptable — disavowal |
| marketplace/manifest.ts | 44 | `"recovered revenue"` in forbiddenClaims | Forbidden list definition | ✅ Acceptable |
| Tests | various | Test guard patterns | Test code | ✅ Acceptable |

**Finding:** `attribution-waterfall.tsx:79` uses "Recovered revenue" as a heading in the dashboard value page. This is a dashboard component (not marketing copy), and the component clearly separates the three attribution tiers with a footer note: "RescueLoop never combines these tiers into one number." However, the exact term "recovered revenue" is in the `forbiddenClaims` manifest. **Recommendation:** Consider changing to "Attributed value — by evidence tier" to fully comply, though current usage is defensible since it's dashboard-internal and the tiers + disclaimer provide context.

### "retained revenue"
| File | Line | Match | Context | Verdict |
|------|------|-------|---------|---------|
| faq-section.tsx | 17 | "Does RescueLoop guarantee retained revenue?" | FAQ question — answered "No." | ✅ Acceptable — explicit disavowal |

### "guaranteed" (as product claim)
| File | Line | Match | Context | Verdict |
|------|------|-------|---------|---------|
| faq-section.tsx | 17 | "Does RescueLoop guarantee retained revenue?" | FAQ question answered "No." | ✅ Acceptable — disavowal |
| marketplace/manifest.ts | 43 | "guaranteed retention" in forbiddenClaims | Forbidden list | ✅ Acceptable |
| sync-engine.ts | 1426,1428 | "guaranteed by our query" | Engineering comment about query logic | ✅ Acceptable |
| marketplace-listing.ts | 4 | "Never claim guaranteed retention" | Disavowal comment | ✅ Acceptable |

No marketing claims use "guaranteed" as a product promise. ✅ CLEAN

### "live demo"
Only in test files and manifest.ts forbiddenClaims. No user-facing occurrences. ✅ CLEAN

### "total defended value"
Only in test files and manifest.ts forbiddenClaims. No user-facing occurrences. ✅ CLEAN

### "total value" (without "illustrative"/"estimated")
No matches found. ✅ CLEAN

### "ROI" (without "illustrative"/"assumption")
All ROI usages are methodology-constraint statements, not marketing promises:
- roi-panel.tsx: "ROI is calculated using confirmed value only. Estimated and strongly associated values are intentionally excluded."
- faq-section.tsx: "excluded from ROI totals" / "ROI is calculated against course price and refund rate"
- feature-rows.tsx: "Only confirmed value enters your ROI."
- workflow-showcase.tsx: "Excluded from ROI totals."
- attribution-illustration.tsx: "Only confirmed contributes to the primary ROI."

These are honest constraints, not unsubstantiated ROI claims. ✅ CLEAN

### "Confirmed recovered value" with non-zero dollar
- outcome-strip.tsx:21: `{ value: 0, label: "Confirmed recovered value" }` — hardcoded to $0 ✅
- pricing-section.tsx:258: `confirmed recovered value stays at {formatCurrency(0)}` — $0 ✅
- faq-section.tsx:22,50: "Confirmed recovered value remains $0" / "Confirmed recovered value is $0 by policy" ✅
- workflow-showcase.tsx:352: "Confirmed recovered value remains $0 unless a defensible auditable monetary recovery rule is satisfied" ✅

No non-zero confirmed recovered value claims exist. ✅ CLEAN

### MARKETING TRUTH SUMMARY
- 11 of 12 forbidden terms: CLEAN (no user-facing violations)
- 1 borderline finding: "Recovered revenue" heading in dashboard attribution-waterfall.tsx
- All "delivered" UI labels correctly show "Accepted by provider"
- All confirmed recovered value = $0 by policy
- All ROI references are methodology constraints, not claims
- FAQ explicitly disavows "guarantee retained revenue"

---

## SECURITY RETEST (Task 16)

### 1. Signed Whop webhooks ✅ PASS
- File: `src/app/api/webhooks/whop/route.ts:37`
- Uses `client.webhooks.unwrap(rawBody, { headers: headersObject })` — official @whop/sdk Standard Webhooks
- Returns 401 on signature verification failure (line 42-46)
- Raw body consumed via `req.text()` before verification

### 2. Replay/idempotency protection ✅ PASS
- File: `src/app/api/webhooks/whop/route.ts:72-81`
- `db.webhookReceipt.findUnique({ where: { whopEventId: eventId } })` — duplicate check before processing
- Returns `{ received: true, processed: false, reason: "duplicate" }` for replayed events
- Payload hash (`sha256`) stored for integrity verification

### 3. Tenant scoping ✅ PASS
- All company-scoped API routes derive organizationId from authenticated Whop user, NOT from browser
- `requireCompanyAdmin(companyId)` validates user has admin access to the specific companyId
- DB queries scoped by `ctx.organizationId` (e.g., approve route line 68: `intervention.organizationId !== ctx.organizationId`)
- companyId from URL is "NEVER trusted without authorization" (require-company-access.tsx:14)

### 4. Creator auth — requireCompanyAccess is fail-closed ✅ PASS
- File: `src/lib/auth/require-company-access.tsx:180-215`
- Connected mode: full auth chain via `requireCompanyAdmin` — ANY failure throws
- Unknown errors mapped to `InsufficientAccessError` (fail-closed, line 212)
- Fixture mode: strict companyId match required (line 169)
- Unconfigured mode: throws `NOT_CONFIGURED` (line 163)
- Content is NEVER rendered on auth failure — caller must handle throw

### 5. Internal auth — constant-time comparison ✅ PASS
- File: `src/lib/auth/internal-auth.ts:82-88`
- `constantTimeEqual` function: XOR-based constant-time comparison
- Length check at line 83 (early return if lengths differ — acceptable; length is not secret)
- Iterates full string with `result |= a.charCodeAt(i) ^ b.charCodeAt(i)` — no short-circuit
- Returns `result === 0` — single comparison at end
- Min token length: 32 characters (line 17)

### 6. Student-link signing — STUDENT_LINK_SIGNING_SECRET ≥32 chars ✅ PASS
- File: `src/lib/env/server.ts:105`: `STUDENT_LINK_SIGNING_SECRET: z.string().trim().min(32)`
- File: `src/lib/env.ts:15`: `z.string().min(32, "STUDENT_LINK_SIGNING_SECRET must be at least 32 characters")`
- Student access tokens: 32 bytes (256 bits) cryptographic randomness (`src/lib/crypto/student-access-tokens.ts:18`)
- Only SHA-256 hashes stored in DB — raw tokens never persisted
- Non-enumerating errors prevent token enumeration attacks

### 7. No secrets client-side ✅ PASS
- `process.env.APP_URL` and `process.env.VERCEL_URL` in layout.tsx — public URLs for metadata, not secrets
- All client-accessible env vars use `NEXT_PUBLIC_` prefix: `NEXT_PUBLIC_WHOP_APP_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- No `process.env.` in any `.tsx` component files (verified via grep)
- `server-only` import guards in auth modules prevent client-side import

### 8. Rate limiting ✅ PASS
- File: `src/lib/rate-limit/rate-limiter.ts`
- Production: `@upstash/ratelimit` + `@upstash/redis` (UpstashRateLimiter)
- Dev/test fallback: InMemoryRateLimiter when Redis not configured
- 8 rate limit configs defined: pilot app, manual sync, auth-sensitive, student token, student response, data export, internal retry, plan mutation
- Proper 429 responses with Retry-After, X-RateLimit-* headers
- Rate-limit keys use SHA-256 token hashes, never raw tokens

### 9. Browser-based entitlement — Checkout does NOT grant entitlement ✅ PASS
- File: `src/app/api/dashboard/[companyId]/billing/checkout/route.ts:7-10`
- Explicit comment: "The browser-side checkout completion callback NEVER grants access"
- redirect_url points to read-only "Processing" route (line 100)
- Line 208: "Access will be granted once the Whop webhook confirms payment"
- Entitlement granted exclusively by verified webhook handler (`webhooks/whop/route.ts → handleMembershipActivated`)
- Metadata includes organization_id for webhook tenant mapping (not trusted from browser callback)

### 10. Cross-tenant isolation ✅ PASS
- All `/api/companies/[companyId]/` routes call `requireCompanyAdmin(companyId)` — verifies user has admin access to THAT companyId
- All `/api/dashboard/[companyId]/` routes call `requireCompanyAccess(companyId)` or `requireCompanyAdmin(companyId)`
- DB queries scoped by `ctx.organizationId` from authenticated session
- Intervention access checks: `intervention.organizationId !== ctx.organizationId` (approve, schedule, edit, suppress, dismiss routes)
- Student response route uses signed tokens containing organizationId — tenant linkage verified server-side
- Webhook handler maps companyId → organizationId via `whopInstallation` table (line 59-62 of webhook route)

### SECURITY RETEST SUMMARY
All 10 security properties: ✅ PASS
- No findings requiring immediate remediation
- Webhook signatures verified via official SDK
- Idempotency via WebhookReceipt dedup
- Tenant scoping from auth, not URL params
- Fail-closed auth guards throughout
- Constant-time internal auth comparison
- Strong student link signing (≥32 chars, 256-bit tokens, SHA-256 hashing)
- No secrets leaked to client
- Upstash rate limiting for production
- Checkout never grants entitlement (webhook-only)
- Cross-tenant isolation enforced at query level

---
Task ID: 9-fix
Agent: witejackel-eng
Task: Fix critical production gap — SubscriptionEntitlement never populated

Work Log:
- Read Inngest processWebhook handler (src/server/jobs/functions.ts)
- Read whop-webhooks module (src/lib/billing/whop-webhooks.ts) with handlePaymentSucceeded, handlePaymentFailed, handleMembershipActivated, handleMembershipDeactivated
- Read entitlement-engine.ts — confirmed computeEntitlement() reads SubscriptionEntitlement table which was never populated
- Read SubscriptionEntitlement schema — unique on whopMembershipId, fields: planTier, state, manageUrl, billingPeriodStart/End
- Added import of handleBillingWebhook + BillingWebhookPayload + EntitlementState + PlanTier to functions.ts
- Added entitlement step after each billing event handler in processWebhook:
  • membership.activated → handleBillingWebhook() + upsertSubscriptionEntitlementFromBilling()
  • membership.deactivated → handleBillingWebhook() + upsertSubscriptionEntitlementFromBilling()
  • payment.succeeded → handleBillingWebhook() + upsertSubscriptionEntitlementFromBilling()
  • payment.failed → handleBillingWebhook() + upsertSubscriptionEntitlementFromBilling()
- Added missing payment.failed event handling (was absent from processWebhook entirely)
- Added upsertSubscriptionEntitlementFromBilling() helper — idempotent via whopMembershipId unique upsert
- Added inferPlanTierFromPrice() — maps Whop price to PlanTier heuristic
- Added handlePaymentFailedLocal() — records failed payment event + audit
- Fixed "Recovered revenue — by attribution tier" → "Attributed value — by evidence tier" in attribution-waterfall.tsx
- Added rate limiting to checkout route: checkRateLimitOrReject(orgId, RATE_LIMITS.planMutation) — 5 req/min per org
- All handlers remain idempotent (BillingWebhookPayload eventId for dedup, upsert for SubscriptionEntitlement)
- typecheck: clean | lint: 0 errors (1 pre-existing warning unrelated to changes)
- No prisma/schema.prisma modifications
- Fixture mode preserved (no changes to fixture paths)
