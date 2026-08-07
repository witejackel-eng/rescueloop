# Task 11 — Authenticated API Routes & Page Routes for PX01-PX07

## Agent: main
## Status: COMPLETED

## Summary

Created 8 properly-authenticated route files for the RescueLoop repo, covering PX02 (System Health), PX04 (Diagnostics), PX05 (Cost Guardrails), PX06 (Scale Certification), PX07 (Growth Instrumentation), and PX03 (Exception Operations). Every route uses the correct auth pattern — no unauthenticated routes exist.

## Files Created

### Company-scoped (requireCompanyAccess):

1. **`src/app/api/dashboard/[companyId]/health/route.ts`** — GET
   - Auth: `requireCompanyAccess(params.companyId)`
   - Queries 6 real DB sources: WhopInstallation, SyncExecution, WebhookReceipt, OutboxEvent, SubscriptionEntitlement, UsageCounter
   - Returns `CompanyHealthResponse` with `HealthSignal[]` and overall status
   - Each signal has status (healthy/degraded/critical/unknown) with real thresholds
   - No fixtures, no cached data — computed on each request

2. **`src/app/api/dashboard/[companyId]/diagnostics/route.ts`** — GET
   - Auth: `requireCompanyAccess(params.companyId)`
   - Returns full diagnostic info: org, installation, sync, billing, usage, webhook health, outbox health
   - ALL secrets redacted via `redactObject()` with 13 secret patterns + URL credential stripping + long base64 detection
   - Never exposes cost/margin data (creator-facing)

3. **`src/app/dashboard/[companyId]/settings/health/page.tsx`** — System Health page
   - Auth: `requireCompanyAccess()` at top with `renderAccessDeniedError()`
   - Server component that renders page shell + `HealthSignalsClient`
   - Dynamic = "force-dynamic"

4. **`src/app/dashboard/[companyId]/settings/health/health-client.tsx`** — Client component
   - Fetches from `/api/dashboard/${companyId}/health`
   - Renders overall status banner + individual signal cards with status icons (CheckCircle2/AlertTriangle/XCircle/HelpCircle)
   - Loading skeletons, error handling, metadata display

5. **`src/app/dashboard/[companyId]/help/diagnostics/page.tsx`** — Diagnostics page
   - Auth: `requireCompanyAccess()` at top with `renderAccessDeniedError()`
   - Server component that renders page shell + `DiagnosticsClient`
   - Dynamic = "force-dynamic"

6. **`src/app/dashboard/[companyId]/help/diagnostics/diagnostics-client.tsx`** — Client component
   - Fetches from `/api/dashboard/${companyId}/diagnostics`
   - Renders 7 section cards: Organization, Installation, Sync, Billing, Usage, Webhooks, Outbox
   - JSON export button with sanitized download
   - Health badges for status indicators

### Internal-facing (withInternalAuth):

7. **`src/app/api/internal/costs/route.ts`** — GET
   - Auth: `withInternalAuth()`
   - Reads real UsageCounter data for all active organizations
   - Applies v3 rate card (Rescue $29, Growth $59, Scale $119) with per-tenant cost breakdown
   - Returns cost estimates with infra, payment, support costs and margin
   - Includes `_meta.disclaimer: "internal planning — not accounting truth"`

8. **`src/app/api/internal/exceptions/route.ts`** — GET
   - Auth: `withInternalAuth()`
   - Reads from DeadLetterEvent, OutboxEvent(failed), WebhookReceipt(failed), SyncExecution(failed)
   - Returns: summary (4 category counts + affected tenants), per-tenant breakdown, 20 most recent signals
   - Uses `groupBy` for efficient aggregation

9. **`src/app/api/internal/growth/route.ts`** — GET
   - Auth: `withInternalAuth()`
   - Derives 13-step activation funnel from real DB aggregates
   - Privacy-safe: no PII, no student messages, no tokens/secrets
   - Returns funnel, overview (completion/approval rates), channel breakdown by plan tier
   - POST intentionally not supported

10. **`src/app/api/internal/scale/route.ts`** — GET + POST
    - Auth: `withInternalAuth()`
    - GET: Returns capacity metrics (2,500 hard cap), per-tenant scale breakdown, health indicators, SLO status
    - POST: Triggers benchmark run with audit log (`recordInternalAudit`), requires reason
    - Never changes customer entitlement or raises plan limits

## Auth Patterns Verified

| Route | Auth Method | Scoped To |
|-------|-------------|-----------|
| `/api/dashboard/[companyId]/health` | `requireCompanyAccess(companyId)` | Company |
| `/api/dashboard/[companyId]/diagnostics` | `requireCompanyAccess(companyId)` | Company |
| `/dashboard/[companyId]/settings/health` | `requireCompanyAccess(companyId)` | Company |
| `/dashboard/[companyId]/help/diagnostics` | `requireCompanyAccess(companyId)` | Company |
| `/api/internal/costs` | `withInternalAuth()` | Internal |
| `/api/internal/exceptions` | `withInternalAuth()` | Internal |
| `/api/internal/growth` | `withInternalAuth()` | Internal |
| `/api/internal/scale` | `withInternalAuth()` | Internal |

## Rejected Routes (NOT created)

- `/api/health` — unscoped, unsafe
- `/api/diagnostics` — unscoped, unsafe
- `/api/operations` — tracked via SyncExecution
- `/api/operations/[id]` — tracked via SyncExecution

## Type Check

- `npx tsc --noEmit` passes with 0 errors
