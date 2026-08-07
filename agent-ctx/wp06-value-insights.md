# WP06 Value & Insights — Work Record

---
Task ID: wp06
Agent: wp06-value-insights
Date: 2026-08-07

## Summary
Implemented the complete WP06 Value & Insights feature set for RescueLoop, including attribution policy module, value ledger API, dispute API, course intelligence API, enhanced value/insights pages, and unit tests.

## Files Created
1. **src/lib/attribution/policy.ts** — Attribution Policy Module
   - `ATTRIBUTION_POLICY_VERSION` = "2026-08-01"
   - `ATTRIBUTION_WINDOW_DAYS` = 14
   - `classifyAttributionLevel()` — maps outcomes to attribution levels
   - `getAttributionLevelDefinition()` — level definitions with methodology
   - `getAttributionMethodology()` — full methodology for UI display
   - `isConfirmedAvailable()` — checks if confirmed attribution is available
   - `isMonetizable()` — checks if a level makes a monetary claim

2. **src/app/api/dashboard/[companyId]/value/route.ts** — Value Ledger API
   - GET endpoint with filtering by attributionLevel, dateRange, studentId, courseId
   - Returns ValueEvents with AttributionEvidence, intervention relations
   - Summary stats (confirmed, associated, estimated, disputed, excluded counts)
   - Attribution methodology included in response

3. **src/app/api/dashboard/[companyId]/value/[valueEventId]/dispute/route.ts** — Dispute API
   - PATCH endpoint accepting { action, reason }
   - Actions: "dispute", "exclude", "restore"
   - Audit event created for every action
   - Attribution changes are versioned

4. **src/app/api/dashboard/[companyId]/insights/route.ts** — Course Intelligence API
   - GET endpoint with courseId and date range filtering
   - Start funnel, friction map, blocker distribution
   - Time-to-first-action, return-after-support
   - Issue clusters, recommendations
   - Sample size, date range, caveats on every metric
   - Minimum-sample threshold warnings

5. **src/components/rescueloop/value/value-page-client.tsx** — Value page client
   - Fetches from Value Ledger API
   - Renders attribution waterfall, ledger table, evidence timeline, ROI panel
   - Dispute/exclude/restore actions with dialog
   - Methodology explanation panel
   - Each monetary tile states its evidence class

6. **src/components/rescueloop/insights/insights-page-client.tsx** — Insights page client
   - Fetches from Course Intelligence API
   - Course funnel, friction map, blocker explorer, recommendations
   - Sample size and date range on every chart
   - Minimum-sample threshold warnings
   - Data caveats banner

7. **src/tests/unit/attribution/attribution-policy.test.ts** — 29 unit tests
   - Payments do NOT auto-become confirmed recovery
   - Observed progress → observed (not confirmed)
   - Estimated opportunity is not recovered money
   - Attribution policy version is tracked
   - Confirmed attribution requires auditable reversal events
   - Only confirmed level is monetizable
   - Methodology key rules verified

## Files Modified
1. **prisma/schema.prisma** — Added "observed" to AttributionState enum; added excluded, disputed, disputeReason, disputedAt, excludedAt, updatedAt fields to ValueEvent model
2. **src/lib/types.ts** — Added "observed" to AttributionLevel type
3. **src/lib/format.ts** — Added "observed" entry to attributionMeta
4. **src/components/rescueloop/value/ledger-table.tsx** — Added "Observed" filter segment
5. **src/app/dashboard/[companyId]/value/page.tsx** — Wired up ValuePageClient
6. **src/app/dashboard/[companyId]/insights/page.tsx** — Wired up InsightsPageClient

## Key Design Decisions
- Attribution policy is a pure module with no DB dependency — tested in isolation
- "observed" added as a first-class attribution level for outcomes with no monetary claim
- Ordinary payments are NEVER confirmed — only auditable reversal events qualify
- Dispute/exclude/restore creates audit events and is versioned
- Recommendations are always suggestions — never autonomous course edits
- Every metric shows sample size, date range, and threshold warnings
- No sensitive student text in analytics data
- API routes use requireCompanyAdmin for auth
- Client components use proper React patterns (cancelled flag in useEffect, no setState-in-effect)

## Verification
- `bun run lint` — 0 errors (1 pre-existing warning)
- `bun run typecheck` — 0 errors
- `bun run test` — 560 tests passing (29 new attribution-policy tests)
