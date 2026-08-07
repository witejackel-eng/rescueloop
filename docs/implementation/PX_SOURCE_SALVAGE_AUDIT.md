# PX Source Salvage Audit

Classification of every file changed in df3fc87.

| # | File | Classification | Reason |
|---|---|---|---|
| 1 | `prisma/schema.prisma` | **REJECT** | Replaced PostgreSQL with SQLite, deleted 35 production models, removed DIRECT_URL, removed all enums/relations/indexes. Production-destructive. |
| 2 | `src/app/page.tsx` | **REJECT** | Conflicts with canonical `src/app/(marketing)/page.tsx`. Creates duplicate root route. Developer showcase is not the commercial homepage. |
| 3 | `src/app/(dashboard)/settings/health/page.tsx` | **ADAPT** | Move to `/dashboard/[companyId]/settings/health/page.tsx` — must be company-scoped with `requireCompanyAccess`. |
| 4 | `src/app/(dashboard)/help/diagnostics/page.tsx` | **ADAPT** | Move to `/dashboard/[companyId]/help/diagnostics/page.tsx` — company-scoped, secrets redacted. |
| 5 | `src/app/(dashboard)/internal/page.tsx` | **ADAPT** | Must use existing `InternalAuthGate` and `/internal/` route architecture (already exists at safe base). |
| 6 | `src/app/(dashboard)/internal/costs/page.tsx` | **ADAPT** | Must use `InternalAuthGate`. |
| 7 | `src/app/(dashboard)/internal/growth/page.tsx` | **ADAPT** | Must use `InternalAuthGate`. |
| 8 | `src/app/(dashboard)/internal/scale/page.tsx` | **ADAPT** | Must use `InternalAuthGate`. |
| 9 | `src/app/(dashboard)/internal/orgs/[orgId]/page.tsx` | **ADAPT** | Must use `InternalAuthGate`. Existing `/internal/organisations/` already exists. |
| 10 | `src/app/api/diagnostics/route.ts` | **ADAPT** | Must be company-scoped: `/api/dashboard/[companyId]/diagnostics/`. Add `requireCompanyAccess`. |
| 11 | `src/app/api/health/route.ts` | **ADAPT** | Must be company-scoped: `/api/dashboard/[companyId]/health/`. Add `requireCompanyAccess`. Derive from real DB state, not fixtures. |
| 12 | `src/app/api/internal/costs/route.ts` | **ADAPT** | Must use `withInternalAuth`. Derive from real `UsageCounter` data. |
| 13 | `src/app/api/internal/exceptions/route.ts` | **ADAPT** | Must use `withInternalAuth`. Derive from real `DeadLetterEvent`/`OutboxEvent` failures. |
| 14 | `src/app/api/internal/growth/route.ts` | **ADAPT** | Must use `withInternalAuth`. Privacy-safe only. |
| 15 | `src/app/api/internal/orgs/route.ts` | **ADAPT** | Must use `withInternalAuth`. Existing `/api/internal/organisations/` already exists — extend it. |
| 16 | `src/app/api/internal/scale/route.ts` | **ADAPT** | Must use `withInternalAuth`. Scale tools are internal-only. |
| 17 | `src/app/api/operations/route.ts` | **ADAPT** | Must be company-scoped: `/api/dashboard/[companyId]/operations/`. Add `requireCompanyAccess`. |
| 18 | `src/app/api/operations/[id]/route.ts` | **ADAPT** | Must be company-scoped. Add `requireCompanyAccess`. |
| 19 | `src/components/rescueloop/operations/*` (6 files) | **KEEP** | Pure UI components. No auth/DB coupling. Safe to reuse as-is. |
| 20 | `src/components/rescueloop/health/*` (4 files) | **KEEP** | Pure UI components. Presentation layer only. |
| 21 | `src/components/rescueloop/internal/*` (5 files) | **KEEP** | Pure UI components. Auth handled at route level. |
| 22 | `src/components/rescueloop/diagnostics/*` (4 files) | **KEEP** | Pure UI components. Must verify secret redaction in export. |
| 23 | `src/components/rescueloop/cost/*` (5 files) | **KEEP** | Pure UI components. Internal-only presentation. |
| 24 | `src/components/rescueloop/scale/*` (5 files) | **KEEP** | Pure UI components. Internal/test only. |
| 25 | `src/components/rescueloop/growth/*` (3 files) | **KEEP** | Pure UI components. Privacy-safe. |
| 26 | `src/features/health-engine/health-store.ts` | **ADAPT** | Replace fixture data with real DB-derived health signals. Zustand store for client cache is acceptable. |
| 27 | `src/features/operation-engine/operation-store.ts` | **ADAPT** | Must read from real `SyncExecution`/`OnboardingProgress` in connected mode. Demo store for fixture mode only. |
| 28 | `src/features/operation-engine/demo-simulation.ts` | **ADAPT** | Keep as demo/fixture ONLY. Must be impossible to use in connected production mode. Gate behind `RESCUELOOP_FIXTURE_MODE`. |
| 29 | `src/lib/cost/cost-calculator.ts` | **ADAPT** | Replace mock data with real `UsageCounter` queries. Keep estimation logic. |
| 30 | `src/lib/cost/rate-card.ts` | **KEEP** | Versioned rate card configuration. No DB coupling. |
| 31 | `src/lib/growth/funnel-tracker.ts` | **ADAPT** | Route through existing `trackEvent()` (PostHog) with its allowlist + PII sanitization. Do not create parallel analytics. |
| 32 | `src/lib/growth/referral.ts` | **ADAPT** | Use PostHog for referral attribution. No new DB model this round. |
| 33 | `src/lib/recovery/rate-limiter.ts` | **REJECT** | Existing `src/lib/rate-limit/rate-limiter.ts` is the canonical production Upstash implementation. Do not duplicate. |
| 34 | `src/lib/recovery/recovery-matrix.ts` | **ADAPT** | Document existing retry behavior. Must align with actual Inngest/outbox retry config. |
| 35 | `src/lib/recovery/retry-strategies.ts` | **ADAPT** | Useful as documentation/reference. Actual retry is handled by Inngest + outbox system. |
| 36 | `src/lib/scale/benchmark-runner.ts` | **ADAPT** | Must run against PostgreSQL, not SQLite. Use Neon connection. |
| 37 | `src/lib/scale/fixture-generator.ts` | **KEEP** | Deterministic fixture generation. No DB coupling. |
| 38 | `src/lib/scale/chaos-injector.ts` | **KEEP** | Chaos simulation logic. Test/tool only. |
| 39 | `src/lib/scale/metrics-collector.ts` | **KEEP** | Metrics collection/formatting. No DB coupling. |

## Summary

| Classification | Count |
|---|---|
| KEEP | 18 |
| ADAPT | 19 |
| REJECT | 2 |
| DELETE | 0 (rejected files are simply not brought over) |
