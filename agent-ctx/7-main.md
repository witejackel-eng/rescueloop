# Task 7 — PX06 Scale Certification

## Summary
Implemented PX06 Scale Certification for the RescueLoop $119 Scale tier. All files compile cleanly with TypeScript and pass ESLint.

## Files Created

### Types
- `src/lib/types/scale.ts` — Full type system: LoadProfile, ChaosScenario, MetricSet, BenchmarkResult, MultiTenantBenchmarkResult, SLOTargets, SCALE_CAPACITY_POLICY (hard cap 2,500)

### Library Modules
- `src/lib/scale/fixture-generator.ts` — Seeded PRNG, deterministic synthetic data at 250/1,000/2,500 member scales, multi-tenant fixture generation
- `src/lib/scale/benchmark-runner.ts` — Benchmark execution with SLO evaluation, chaos injection, recommendations; pre-computed demo results
- `src/lib/scale/chaos-injector.ts` — 7 chaos scenarios with metric degradation effects, toggle helpers
- `src/lib/scale/metrics-collector.ts` — Baseline metrics per load profile, multi-tenant scaling, format helpers

### UI Components
- `src/components/rescueloop/scale/scale-dashboard.tsx` — Main dashboard with capacity policy banner, controls, results, live metrics
- `src/components/rescueloop/scale/load-profile-selector.tsx` — 3-column profile selector with cap utilization bars
- `src/components/rescueloop/scale/benchmark-results.tsx` — Results tables + Recharts bar charts
- `src/components/rescueloop/scale/chaos-panel.tsx` — 7 chaos scenario toggle cards
- `src/components/rescueloop/scale/metrics-panel.tsx` — 7 metric sections with sparkline charts

### Routes
- `src/app/(dashboard)/internal/scale/page.tsx` — Scale certification page
- `src/app/api/internal/scale/route.ts` — Scale API endpoint

### Updated
- `src/app/page.tsx` — Added PX06 tab with ScalePreview, PX06 MiniStat

## Key Design Decisions
- Hard cap at 2,500 members — never raised after testing
- SLO status: green/amber/red (within_slo / marginal / slo_violation)
- Recommendations only — never change customer entitlement
- Certify correctness before speed
- Seeded PRNG for reproducible fixtures
- Pre-computed demo data with realistic metrics
