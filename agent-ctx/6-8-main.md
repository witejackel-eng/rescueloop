# Task 6-8 — PX05 Cost Guardrails + PX07 Growth Instrumentation

## Agent: main

## Summary
Implemented PX05 (Cost Guardrails) and PX07 (Growth Instrumentation) for RescueLoop.

## PX05 — Cost Guardrails

### Files Created:
- `src/lib/types/cost.ts` — Type definitions: TenantUsage, TenantCostEstimate, RateCardRates, RateCardVersion, CostSummary, CostAlert, CostPlan, PLAN_PRICING
- `src/lib/cost/rate-card.ts` — Versioned rate card with 3 versions (v1 Jul 2024, v2 Oct 2024, v3 Jan 2025). Rates decrease over time reflecting infrastructure optimization and negotiated payment rates.
- `src/lib/cost/cost-calculator.ts` — Core estimation logic: calculateTenantCost(), buildCostSummary(), plus 8 demo tenants across all 3 plans (Rescue/Growth/Scale)
- `src/components/rescueloop/cost/margin-indicator.tsx` — Color-coded margin badge: green (>60%), amber (30-60%), red (<30%)
- `src/components/rescueloop/cost/cost-breakdown.tsx` — Expandable cost line items per tenant
- `src/components/rescueloop/cost/tenant-cost-row.tsx` — Table row with expandable breakdown
- `src/components/rescueloop/cost/rate-card-viewer.tsx` — Versioned rate card viewer with tab navigation
- `src/components/rescueloop/cost/cost-dashboard.tsx` — Main dashboard: summary metrics, by-plan breakdown, tenant table, high-cost alerts
- `src/app/(dashboard)/internal/costs/page.tsx` — Cost route page
- `src/app/api/internal/costs/route.ts` — Cost API endpoint

### Demo Data:
- 8 tenants: 2 Rescue, 3 Growth, 3 Scale plans
- MRR ranges from $29 to $1,428
- Blended margin ~91% (high, as expected for early SaaS)
- All plans show healthy margins with current rate card

### Key Design Decisions:
- Margin indicator uses 3 color bands (green/amber/red) with CSS variables
- Cost estimates are clearly labeled "internal planning — not accounting truth"
- Rate card versioning preserved for audit/re-calculation
- isHighCost flag triggers at <20% margin but does NOT change entitlement
- Data-dense table layout for internal planning use

## PX07 — Growth Instrumentation

### Files Created:
- `src/lib/types/growth.ts` — FunnelStep (13 steps), FunnelEvent, FunnelStepAggregate, FunnelAnalysis, ReferralChannel, ReferralEntry, ReferralAggregate, CaseStudyConsent, GrowthOverview
- `src/lib/growth/funnel-tracker.ts` — trackFunnelStep(), buildFunnelAnalysis(), demo data: 20 installs → 2 subscriptions (10% overall conversion)
- `src/lib/growth/referral.ts` — aggregateReferrals(), 15 demo referral entries across 6 channels, 4 case-study consent entries
- `src/components/rescueloop/growth/funnel-visualization.tsx` — Recharts horizontal bar chart with step-by-step drop-off table
- `src/components/rescueloop/growth/referral-panel.tsx` — Channel breakdown with progress bars + case-study consent list
- `src/components/rescueloop/growth/growth-dashboard.tsx` — Combined dashboard with privacy notice
- `src/app/(dashboard)/internal/growth/page.tsx` — Growth route page
- `src/app/api/internal/growth/route.ts` — Growth API endpoint

### Demo Funnel Data (realistic drop-off):
- Install: 20 → Permissions: 17 (15% drop) → Sync: 14 (12.5% drop) → First Candidate: 11 → First Review: 9 → First Approval: 7 → Notification: 6 → Student Response: 5 → Return: 3 → Subscription: 2

### Key Design Decisions:
- Privacy-safe events only (no raw student messages, no blocker text, no tokens)
- Funnel uses horizontal bar chart (Recharts) for readability
- Referral tracking is minimal (not a full affiliate platform)
- Case-study consent requires explicit opt-in
- Privacy shield notice prominently displayed

## Root Page
- `src/app/page.tsx` — Tabbed interface switching between Cost Guardrails and Growth Instrumentation

## Verification:
- ESLint: clean (0 errors, 0 warnings)
- Dev server: running, all routes return 200
- API endpoints verified: /api/internal/costs and /api/internal/growth both return valid JSON
