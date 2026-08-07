# Task 3c-3d: Onboarding State Machine, Permission Diagnostics, Course Mapping, First Sync

## Status: Completed

## Files Created
- `src/lib/onboarding/onboarding-state.ts` — State machine (7 steps, transitions, serialization)
- `src/lib/onboarding/permission-diagnostics.ts` — 10 diagnostic categories, safe IDs, DB + Whop checks
- `src/lib/onboarding/sync-progress.ts` — 8 sync stages, stale detection, DB persistence
- `src/lib/onboarding/analytics.ts` — 14 allowlisted events, PII sanitization
- `src/components/rescueloop/onboarding/course-mapping-step.tsx` — Mapping UI + ZeroCourseState
- `src/components/rescueloop/onboarding/sync-step.tsx` — Sync progress UI with retry/stale/reassurance
- `src/components/rescueloop/onboarding/onboarding-wizard.tsx` — Full step wizard
- `src/app/api/onboarding/progress/route.ts` — Progress persistence API
- `src/app/api/onboarding/diagnostics/route.ts` — Diagnostics API
- `src/app/api/onboarding/sync/route.ts` — Sync trigger API

## Files Modified
- `prisma/schema.prisma` — Added OnboardingProgress model
- `src/lib/observability/posthog.ts` — Added 14 onboarding event names
- `src/app/page.tsx` — Demo onboarding wizard

## Key Decisions
- State machine is importable by both server and client (no "server-only")
- Diagnostics and sync-progress are server-only (touch DB + Whop)
- Analytics uses PostHog allowlist; forbidden metadata keys are defense-in-depth
- Zero-course state explicitly reassures "no data was changed"
- Sync stale threshold: 30 minutes
- OnboardingProgress uses upsert for leave-and-return support
