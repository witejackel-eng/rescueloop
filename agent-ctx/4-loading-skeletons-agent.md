# Task 4: Route-level loading.tsx skeletons for all dashboard routes

## Task
Add `loading.tsx` files for all 11 company-scoped dashboard routes to provide route-level suspense boundaries and improve perceived performance. Create a shared `DashboardLoading` component, enhance the existing skeleton toolkit with `TableSkeleton` / `ChartSkeleton`, and add a subtle gradient shimmer animation to `globals.css`.

## Context Read
- Read `/home/z/my-project/worklog.md` — confirmed 13 dashboard pages all wired to live API, lint clean, all routes 200 OK.
- Read `/home/z/my-project/src/components/shared/card-skeleton.tsx` — existing `CardSkeleton` (card with header + N body rows) and `MetricSkeleton` (icon+label / big number / sub label). Both `"use client"`, both use `--hairline` background + `animate-pulse`, project aesthetic = square-ish corners (`rounded-[8px]`), hairline borders, `--surface` background.
- Read `/home/z/my-project/src/app/globals.css` — confirmed CSS variable palette (`--canvas-elevated`, `--surface-hover`, `--hairline`, `--hairline-subtle`, etc.) and that a global `prefers-reduced-motion` block already exists at the bottom.
- Read `/home/z/my-project/src/app/(dashboard)/dashboard/[companyId]/layout.tsx` — confirmed page shell: sidebar + header + `<div className="mx-auto w-full max-w-[1200px] px-4 py-6 …">{children}<DashboardFooter /></div>`. Loading.tsx content renders inside this container, so skeletons should use `space-y-8` + responsive grids matching real pages.
- Read `/home/z/my-project/src/app/(dashboard)/dashboard/[companyId]/page.tsx` (Overview) — confirmed header pattern: `<div className="dot-grid space-y-8">` wrapper, `flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between` header with title on left + action buttons on right, then `grid grid-cols-2 … sm:grid-cols-3 lg:grid-cols-5` metric grid.
- Read prior agent records in `/agent-ctx/` (9-a dashboard polish) — noted canonical patterns: `divide-y divide-[var(--hairline)]` + `py-2.5` for rows, `--info` is the project's allowed "blue" (CSS var, not Tailwind blue).

## Approach
1. Enhanced `card-skeleton.tsx` in place — added `TableSkeleton` and `ChartSkeleton` exports without touching existing `CardSkeleton` / `MetricSkeleton` (they're imported by live pages).
2. Created `dashboard-loading.tsx` as a server component (no `"use client"`). Renders header skeleton + 4 metric skeletons + 2 content cards + 1 wide card. Uses `.skeleton-shimmer` on the title bar for premium feel, `animate-pulse` everywhere else.
3. Created 11 `loading.tsx` files, each a 5-line server component that defers to `<DashboardLoading title="…" />`.
4. Added `@keyframes shimmer` + `.skeleton-shimmer` + explicit reduced-motion guard to `globals.css`.
5. Ran `bun run lint` (0 errors) and curled every route (all 200 OK).

## Files Changed
- `src/components/shared/card-skeleton.tsx` (modified — added 2 exports)
- `src/components/shared/dashboard-loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/rescue-queue/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/students/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/insights/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/outcomes/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/activity/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/responses/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/playbooks/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/analytics/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/usage/loading.tsx` (new)
- `src/app/(dashboard)/dashboard/[companyId]/settings/loading.tsx` (new)
- `src/app/globals.css` (modified — added shimmer keyframes + class + reduced-motion guard)

## Key Design Decisions
- **Visible title = shimmer bar, not real text.** The `title` prop drives only ARIA + sr-only text. Prevents a flash of the wrong heading size when the real page heading (serif `Dashboard` vs sans `Rescue Queue` etc.) hydrates.
- **`.skeleton-shimmer` on the hero title only; `animate-pulse` everywhere else.** Premium feel without overwhelming the page; pulse matches existing `CardSkeleton`/`MetricSkeleton` aesthetic so the whole frame reads as one cohesive system.
- **`dot-grid` background on loading wrapper** to match the Overview page's background pattern — skeleton feels like the real page, not a foreign shell.
- **`TableSkeleton` and `ChartSkeleton` added but intentionally NOT wired into `DashboardLoading`.** Shared component uses generic `CardSkeleton`/`MetricSkeleton` so one component serves all 11 routes. New variants exist for future per-route customization (e.g. `AnalyticsLoading` with `ChartSkeleton`, `RescueQueueLoading` with `TableSkeleton`) without changing the shared component.
- **No new npm dependencies.** Pure Tailwind + CSS variables + existing `cn` util.
- **Server components throughout.** `loading.tsx` files + `DashboardLoading` have no `"use client"`. The imported `CardSkeleton`/`MetricSkeleton` are already `"use client"` and become client boundaries automatically.

## Verification
- `bun run lint` → 0 errors, 0 warnings.
- All 11 dashboard routes return 200 OK via curl:
  - `/dashboard/co_cgl` → 200 (overview)
  - `/dashboard/co_cgl/rescue-queue` → 200
  - `/dashboard/co_cgl/students` → 200
  - `/dashboard/co_cgl/insights` → 200
  - `/dashboard/co_cgl/outcomes` → 200
  - `/dashboard/co_cgl/activity` → 200
  - `/dashboard/co_cgl/responses` → 200
  - `/dashboard/co_cgl/playbooks` → 200
  - `/dashboard/co_cgl/analytics` → 200
  - `/dashboard/co_cgl/usage` → 200
  - `/dashboard/co_cgl/settings` → 200
- Dev server log: clean compile, no warnings or errors after adding loading boundaries.
- `prefers-reduced-motion`: shimmer collapses to flat `--hairline`; existing global block already neutralizes `animate-pulse`.

## Notes for Future Agents
- The new `TableSkeleton` and `ChartSkeleton` are unused by `DashboardLoading` right now — they exist so future per-route loading variants can be dropped in without touching the shared component.
- If you build a per-route loading variant, follow the same server-component + `aria-busy` + `role="status"` + `sr-only` notice pattern as `DashboardLoading`.
- The `.skeleton-shimmer` class replaces the element background — don't combine with `bg-[var(--hairline)]`.
- Because the dashboard pages are `"use client"` and fetch via hooks, the `loading.tsx` shows during the brief server-render suspense window on route navigation. This is the intended App Router pattern for perceived performance — it does not replace the in-page `loading` state of the data hooks.
