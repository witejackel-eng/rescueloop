# Task 3b: WP-03 Canonical Dashboard Routes

**Date:** 2026-08-07
**Status:** Completed

## Summary
Created canonical `/dashboard/[companyId]` route group and redirected all legacy `/companies/[companyId]` paths to the new canonical routes. This implements WP-03, establishing `/dashboard/` as the permanent base for all company-scoped routes.

## Key Decisions
- ConnectedShell and ConnectedNav updated to use `/dashboard/` as the base path
- Legacy `/companies/` routes now redirect via `redirect()` from `next/navigation`
- Navigation: "Overview" → "Dashboard" (root segment), "Queue" → "rescue-queue" segment
- OnboardingJourney is a multi-step client wizard using URL search params for step state
- All dashboard routes use `resolveStrictCompanyAuth` for consistent auth enforcement

## Files Created
- `src/app/dashboard/[companyId]/layout.tsx` — Canonical layout
- `src/app/dashboard/[companyId]/page.tsx` — Dashboard overview
- `src/app/dashboard/[companyId]/onboarding/page.tsx` — Onboarding
- `src/app/dashboard/[companyId]/rescue-queue/page.tsx` — Rescue queue
- `src/app/dashboard/[companyId]/students/page.tsx` — Students
- `src/app/dashboard/[companyId]/responses/page.tsx` — Responses
- `src/app/dashboard/[companyId]/insights/page.tsx` — Insights
- `src/app/dashboard/[companyId]/value/page.tsx` — Value/ROI
- `src/app/dashboard/[companyId]/activity/page.tsx` — Activity feed
- `src/app/dashboard/[companyId]/sync/page.tsx` — Sync status
- `src/app/dashboard/[companyId]/usage/page.tsx` — Usage/plan
- `src/app/dashboard/[companyId]/settings/page.tsx` — Settings
- `src/components/rescueloop/onboarding/onboarding-journey.tsx` — Multi-step wizard

## Files Modified
- `src/components/shell/connected-nav.tsx` — Base path + active nav matching
- All 12 legacy pages under `src/app/companies/[companyId]/` → redirect pages

## Validation
- Lint: 0 new errors
- TypeScript: 0 new errors
- Dev server: Compiling cleanly
