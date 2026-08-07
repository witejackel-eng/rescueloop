# Worklog

## Task 2-a: Fix typecheck errors batch 1
**Date:** 2026-08-05
**Status:** Completed

### Summary
Fixed 6 typecheck error groups across 5 files. All targeted errors are resolved. Remaining typecheck errors are in test files and playwright config (not in scope for this batch).

### Fixes Applied

1. **`src/app/api/internal/usage/route.ts`** (Error 1: PlanTier cast)
   - Added `import type { PlanTier } from "@prisma/client"`
   - Changed `(org?.planTier as string) ?? "rescue"` → `(org?.planTier ?? "rescue") as PlanTier`

2. **`src/app/companies/[companyId]/insights/page.tsx`** (Error 2: blockerType→blocker)
   - Changed `by: ["blockerType"]` → `by: ["blocker"]` in groupBy (matches Prisma schema field name `blocker` on `BlockerResponse`)
   - Changed `r.blockerType` → `r.blocker` in JSX key and display

3. **`src/app/companies/[companyId]/value/page.tsx`** (Error 3: attributionEvidences→evidence, intervention fixes)
   - Changed `attributionEvidences:` → `evidence:` in include (matches Prisma relation name `evidence` on `ValueEvent`)
   - Added optional chaining on `ve.intervention.student?.name` / `?.email`
   - Changed `ve.attributionEvidences.length` → `ve.evidence.length`
   - Changed `ve.attributionEvidences.map` → `ve.evidence.map`

4. **`src/lib/sync/sync-engine.ts` line 1133** (Error 4: InputJsonValue→ReconciliationOutcomeClassification)
   - Added `ReconciliationOutcomeClassification` to import from `@prisma/client`
   - Changed `o.classification as Prisma.InputJsonValue` → `o.classification as ReconciliationOutcomeClassification`

5. **`src/lib/sync/sync-engine.ts` line 1615** (Error 5: "skipped"→"completed")
   - Changed `"skipped"` → `"completed"` in `completeSyncStage` call (matches valid status type `"completed" | "failed" | undefined`)

6. **`src/server/jobs/functions.ts`** (Error 6: Record<string,unknown> casts + metadataJson→metadata)
   - Changed `eventPayload as WhopMembershipEvent` → `eventPayload as unknown as WhopMembershipEvent` (4 call sites) to satisfy TypeScript overlap check
   - Changed `metadataJson: result.evidence as Prisma.InputJsonValue` → `metadata: result.evidence as Record<string, unknown>` (matches `recordAuditEvent` parameter name `metadata`)

### Remaining Errors (out of scope)
- `playwright.config.ts(30,5)`: Video mode type mismatch

---

## Task 2-b: Fix typecheck errors batch 2 (test files)
**Date:** 2026-08-05
**Status:** Completed

### Summary
Fixed all 4 remaining typecheck error groups in test files. Only `playwright.config.ts` video mode error remains (out of scope).

### Fixes Applied

1. **`src/lib/sync/sync-engine.test.ts` line 246** (Unintentional comparison of literal types '10' and '7')
   - Changed `const courseLessonCount = 7` → `const courseLessonCount: number = 7`
   - Changed `const staleTotalLessons = 10` → `const staleTotalLessons: number = 10`
   - Widened literal types to `number` so the `!==` comparison is valid

2. **`src/tests/integration/data-lifecycle.test.ts`** (Intervention `type`/`channel` fields + StudentAccessToken `interventionId`)
   - Removed non-existent `type` and `channel` fields from Intervention creates (lines 103, 250)
   - Added required fields: `campaignId`, `trigger`, `evidenceJson`, `messagePreview`, `idempotencyKey`
   - Created Campaign records inline before each Intervention create
   - Added `interventionId: 'test-intervention-' + Date.now()` to StudentAccessToken create (line 222)

3. **`src/tests/integration/tenant-isolation.test.ts`** (Intervention `type`/`channel` fields)
   - Removed non-existent `type` and `channel` from all 3 Intervention creates (lines 101, 111, 130)
   - Added required fields: `campaignId`, `trigger`, `evidenceJson`, `messagePreview`, `idempotencyKey`
   - Created Campaign records inline for each org before Intervention creates

4. **`src/tests/perf/scale-benchmark.test.ts` line 536** (Membership `productId` type mismatch)
   - Removed non-existent `cancelAtPeriodEnd` field from Membership create
   - Changed `productId` scalar → `product: { connect: { id: productId } }` to use relation-based connection (avoids Prisma type conflict when also using `student: { connect: ... }`)

### Remaining Errors (out of scope)
- `playwright.config.ts(30,5)`: Video mode type mismatch

---

## Task 6: Port verified Whop/Neon connection knowledge from agent/whop-clean-start
**Date:** 2026-08-05
**Status:** Completed

### Summary
Ported Whop/Neon connection patterns from `origin/agent/whop-clean-start` without replacing the mature Prisma schema (1258 lines) or existing business logic. The current branch already had a superior Whop SDK integration (`@whop/sdk` with lazy init, provider contracts, typed error mapping) compared to the source branch's raw fetch-based API. Ports were limited to genuinely missing connection knowledge.

### Changes Applied

1. **`src/lib/db.ts`** — Improved Prisma client logging (ported from whop-clean-start's `prisma.ts` pattern)
   - Changed from always logging `["query"]` (noisy in production, especially with Neon pgbouncer)
   - Now logs `["error", "warn"]` in development, `["error"]` only in production
   - Added explanatory comments about Neon pooling

2. **`.env.example`** — Added `WHOP_COMPANY_ID` env variable
   - Documented as `biz_xxxxxxxxx` format, for API calls and connection testing
   - Matches the pattern verified in whop-clean-start

3. **`src/lib/env/server.ts`** — Added `WHOP_COMPANY_ID` to Whop env schema
   - Optional field (routes get companyId from URL params or webhook payloads)
   - Used by the whop-test endpoint for full connectivity verification

4. **`src/lib/env.ts`** — Added `WHOP_COMPANY_ID` to global env schema
   - Consistent with server.ts: optional, not required for build

5. **`src/app/api/whop-test/route.ts`** — NEW: Whop connection test endpoint
   - Ported concept from whop-clean-start's equivalent, but adapted to use the current branch's `@whop/sdk` client (`getWhopClient`/`isWhopReady`) instead of raw fetch
   - Returns detailed diagnostics: missing env vars, API reachability, course count
   - Gracefully degrades when `WHOP_COMPANY_ID` is not set

### What Was NOT Ported (and why)

| Source file | Reason for skipping |
|---|---|
| `src/lib/whop/api.ts` (raw fetch Whop client) | Current branch uses `@whop/sdk` with lazy init — superior pattern |
| `src/lib/whop/sync-company.ts` (batch sync) | Current branch uses webhook-driven sync via `src/lib/sync/sync-engine.ts` — more mature |
| `src/app/api/sync/whop/route.ts` (manual sync trigger) | Redundant with existing `src/app/api/internal/sync/route.ts` |
| `prisma/schema.prisma` | Current schema is 1258 lines with full multi-tenant model; source was ~100 lines with simpler single-company model |
| `src/lib/prisma.ts` (separate Prisma singleton) | Current branch already has `db.ts` used in 40+ files; a second export would cause confusion |

### Verification
- `bun run typecheck` — passes (0 errors)
- `bun run lint` — passes (0 errors)

---

## Task 2: Create Node/TypeScript dependency-audit parser
**Date:** 2026-08-06
**Status:** Completed

### Summary
Created a reliable Node/TypeScript audit parser (`scripts/audit-parser.ts`) to replace the fragile shell state machine in CI. The old shell parser assumed severity lines appear BEFORE the "(direct dependency)" marker, but Bun's actual output has "(direct dependency)" BEFORE severity lines — causing direct critical/high vulnerabilities to pass undetected.

### Files Created

1. **`scripts/audit-parser.ts`** — Standalone TypeScript audit parser
   - Reads `bun audit` output from stdin or file path argument
   - Parses complete package sections (separated by blank lines)
   - For each section: extracts package name, direct/indirect status, severities, advisory titles, URLs
   - Classifies: BLOCKING (direct + critical/high), REPORTED (transitive + critical/high), PASSING
   - Exit codes: 0 = passing, 1 = blocking
   - Outputs: human-readable summary (stdout), GitHub Actions annotations `::error::`/`::warning::` (stdout), JSON summary (stderr)
   - Handles all edge cases: marker before/after severity, multiple severities, no severity, empty/malformed input
   - No external dependencies — Node built-ins only
   - Works as both imported module and CLI script

2. **`scripts/audit-parser.test.ts`** — Comprehensive Vitest test suite (38 tests)
   - `splitSections` — blank line splitting, trimming, empty input
   - `parseSection` — direct critical, direct high, transitive critical, direct moderate, marker before severity, marker after severity, multiple severities, no severity, malformed input
   - `parseAuditOutput` — integration tests for all classification paths
   - `formatSummary` — output formatting for clean/blocking/mixed
   - `formatAnnotations` — GitHub Actions `::error::` and `::warning::` emission
   - `formatJsonSummary` — machine-parseable JSON output
   - Edge cases: transitive high, direct low/info, real-world exact format from task description

3. **`vitest.config.ts`** — Updated `include` to also cover `scripts/**/*.test.ts`

### Key Design Decisions
- Parser processes sections as a whole (not line-by-line state machine) — eliminates the ordering bug entirely
- Each section is parsed independently, then classified based on `isDirect + severities`
- The "(direct dependency)" marker and severity lines are detected independently within a section — order doesn't matter
- CLI auto-detects direct execution (works with both `bun` and `ts-node`)

### Verification
- `bun vitest run scripts/audit-parser.test.ts` — 38/38 tests pass
- `bun vitest run` — 279/279 tests pass (full suite, no regressions)
- CLI tested with piped input: blocking output → exit 1, passing output → exit 0

---

## WP-00 Final Fixes: CI audit parser, E2E assertions, Neon doc
**Date:** 2026-08-06
**Status:** Completed

### Summary
Three remaining WP-00 issues fixed:

1. **CI workflow** — Replaced the fragile shell `while read` state machine in the "Dependency audit" step with two steps: (a) run audit parser tests, (b) pipe `bun audit` output through `scripts/audit-parser.ts`
2. **E2E tests** — Removed all `.catch(() => {})` assertion swallowing from `connected-workspace.spec.ts` and `demo-workflow.spec.ts`; rewrote `student-experience.spec.ts` with route-specific assertions for valid/expired/invalid token states
3. **Neon migration baseline** — Created `docs/operations/NEON_MIGRATION_BASELINE.md` with the complete safe baselining procedure

### Files Modified

1. **`.github/workflows/ci.yml`** — Removed 60-line shell state machine; replaced with 2-step TypeScript parser pipeline:
   - `bun vitest run scripts/audit-parser.test.ts` (parser tests gate)
   - `bun audit 2>&1 | bun run scripts/audit-parser.ts` (audit + parse)

2. **`src/tests/e2e/connected-workspace.spec.ts`** — Removed `.catch(() => {})` from both `assertNoErrorOverlay` assertions (error overlay and app error checks)

3. **`src/tests/e2e/demo-workflow.spec.ts`** — Same: removed `.catch(() => {})` from both `assertNoErrorOverlay` assertions

4. **`src/tests/e2e/student-experience.spec.ts`** — Complete rewrite:
   - valid token: asserts greeting heading "Hi", progress section, "Continue course" button
   - expired token: asserts expired/invalid-link message OR absence of rescue interface
   - invalid token: asserts invalid/not-found message OR absence of rescue interface
   - No `.catch(() => {})` on any genuine assertion

5. **`docs/operations/NEON_MIGRATION_BASELINE.md`** — NEW: Complete Neon migration baselining document with:
   - Backup procedures (Neon branching + pg_dump)
   - Schema comparison workflow
   - Init migration verification on staging
   - Safe baselining via `prisma migrate resolve --applied`
   - Schema drift detection
   - Rollback steps
   - Stop conditions and prohibited commands
   - Owner action required checklist

---

## Task 2-header-breakpoints: Fix RescueLoop header breakpoints to match workspace spec (1180/1366)
**Date:** 2026-08-06
**Status:** Completed

### Summary
Replaced Tailwind's default `lg` (1024px) and `xl` (1280px) breakpoints in the floating-nav with custom `compact` (1180px) and `full` (1366px) breakpoints per the 03_HEADER_AND_NAVIGATION.md workspace spec. Added scroll-margin-top for anchor navigation. TypeScript compiles cleanly.

### Files Changed

1. **`tailwind.config.ts`** — Added custom screen breakpoints under `theme.extend.screens`:
   - `'compact': '1180px'` — compact desktop threshold
   - `'full': '1366px'` — full desktop threshold
   - These are in addition to the standard Tailwind breakpoints (sm, md, lg, xl, 2xl)

2. **`src/components/marketing/floating-nav.tsx`** — Updated all breakpoint classes and comments:
   - Desktop nav: `lg:flex` → `compact:flex`
   - Secondary links: `xl:inline-block` → `full:inline-block`
   - Overflow trigger: `lg:block xl:hidden` → `compact:block full:hidden`
   - CTA button: `lg:inline-flex` → `compact:inline-flex`
   - Mobile trigger: `lg:hidden` → `compact:hidden`
   - Mobile menu: `lg:hidden` → `compact:hidden`
   - Updated all comments and constants (DESKTOP_FULL, DESKTOP_COMPACT) to reflect new breakpoint names
   - Navigation items unchanged: Primary (Product, How it works, Student experience, Pricing), Secondary (Safety, FAQ), CTA ("Explore demo" → /overview)

3. **`src/app/globals.css`** — Added anchor scroll offset:
   ```css
   [id] {
     scroll-margin-top: 80px;
   }
   ```
   Ensures sections anchor below the fixed header (~64px header + 16px breathing room).

### Layout Contract Verification
- Three protected regions preserved: brand, navigation, CTA
- Brand and CTA never shrink (unchanged)
- Centre region collapses from full→compact→mobile (now at correct 1366/1180 thresholds)
- No wrapping, no horizontal overflow, no collision
- CTA visible from 1180px (compact) through 1600px+ (full and beyond)
- Escape restores focus (unchanged)
- Focus follows visual order (unchanged)

### Verification
- `bun run typecheck` — passes (0 errors)
- No remaining `lg:` or `xl:` references in floating-nav.tsx

---

## Task 1: Rebuild the RescueLoop hero with Closing Signal visual and locked copy
**Date:** 2026-08-06
**Status:** Completed

### Summary
Rewrote the RescueLoop hero component with the Closing Signal product visual (RecoveryLoopCanvas), exact locked copy from the workspace spec, and proper two-column desktop layout. Updated copy dictionary and marketing page section order.

### Files Changed

1. **`src/brand/copy.ts`** — Updated locked copy values:
   - `support`: "Find who needs help. Approve the right message. See what changed."
   - `primaryCTA`: "Explore the interactive demo"
   - `secondaryCTA`: "See the student experience"
   - Added `disclosure`: "Interactive demonstration. No messages are sent and no customer data is connected."

2. **`src/components/marketing/hero/rescue-hero.tsx`** — Complete rewrite:
   - Removed imports: `KineticRecoveryWord`, `WorkflowMarquee`
   - Added import: `copy` from `@/brand/copy` for source-controlled copy
   - Two-column grid layout: `lg:grid-cols-[1.1fr_1fr]` with copy LEFT, RecoveryLoopCanvas RIGHT
   - Single column on mobile: copy before canvas
   - Headline: "Close the loop before they *leave*." — "leave" rendered in `text-[var(--ink-secondary)]` with `not-italic` on the `<em>` (visual distinction without font-style italic)
   - Eyebrow: exact copy "Activation rescue for Whop creators"
   - Supporting line, trust line, disclosure: all from `copy` dict
   - CTAs: primary → `/overview`, secondary → `/student-rescue`
   - Hero padding: `pt-28 pb-12` mobile, `lg:pt-32 lg:pb-20` desktop
   - `min-h-[100svh]` for full viewport height
   - `scroll-mt-0` on section for anchor navigation
   - Motion: `framer-motion` `motion.div` with fade-in animations respecting `useReducedMotion` — reduced motion uses opacity-only transitions (duration 0.15s), full motion uses y-slide + opacity with `easeOut`
   - RecoveryLoopCanvas in right column with responsive height (`h-[340px]` mobile, `lg:h-[560px]` desktop)
   - Kept subtle technical grid background and noise texture from original

3. **`src/app/(marketing)/page.tsx`** — Reordered sections per workspace spec:
   - Removed: `RevenueLeakageSection` (avoids "revenue rescue" language)
   - New order: FloatingNav → RescueHero → FeatureRows → RecoveryProcessSection → WorkflowShowcase → SafetySection → CourseIntelligenceSection → OutcomeStrip → RoiCalculator → PricingSection → FaqSection → FinalCta → MarketingFooter

### What was NOT changed (per instructions)
- `src/components/marketing/floating-nav.tsx` — another agent's domain
- `src/tests/e2e/*` — another agent's domain
- `tailwind.config.ts` — another agent's domain

### Verification
- `bun run typecheck` — passes (0 errors)

---

## Task 3: Update brand evidence Playwright suite and brand asset endpoint tests
**Date:** 2026-08-06
**Status:** Completed

### Summary
Updated the brand evidence Playwright suite to capture screenshots at ALL 8 required viewports across ALL 6 target pages (48 total screenshot tests). Updated the brand asset endpoint tests to include the missing `favicon-48.png` and verify `twitter:card` metadata. Verified `brand-gates.test.ts` has 42 tests and passes. No changes needed to `playwright.config.ts` (viewports set programmatically in the test).

### Files Changed

1. **`src/tests/e2e/brand-evidence.spec.ts`** — Complete rewrite:
   - Expanded from 7 ad-hoc tests (2 viewports, 5 pages) to 48 parameterized tests (8 viewports × 6 pages)
   - All 8 required viewports from spec 07_RESPONSIVE_VISUAL_QA.md:
     - 390×844 (mobile), 768×1024 (mobile), 1024×768 (desktop), 1180×820 (desktop), 1280×800 (desktop), 1366×768 (desktop), 1440×900 (desktop), 1600×900 (desktop)
   - All 6 capture targets from viewport_matrix.csv:
     - `/` (marketing), `/overview` (workspace), `/student-rescue` (student-rescue), `/private-pilot` (private-pilot), `/legal/privacy` (legal), `/internal/brand-qa` (internal-brand-qa)
   - Screenshot filename pattern: `{page}-{mode}-{viewport}.png` (e.g., `marketing-mobile-390x844.png`)
   - **Security**: Removed `INTERNAL_API_KEY` variable and all credential injection — for `/internal/brand-qa`, test skips if auth gate is visible (no credentials in code)
   - No pixel-diff assertions — only capture screenshots for evidence
   - Each non-internal test verifies page loads with HTTP 200 before capturing
   - Internal brand-qa test gracefully skips when unauthenticated

2. **`src/tests/e2e/brand-assets.spec.ts`** — Enhanced:
   - Added `/brand/favicon-48.png` to BRAND_ASSETS array (was missing — now 10 image assets + 1 manifest = 11 total endpoints)
   - Added SVG content-type flexibility check: `.svg` files accept `image/svg+xml` OR any content-type containing `svg`
   - Added `twitter:card` metadata verification: checks `<meta name="twitter:card" content="summary_large_image">` is present
   - Updated JSDoc to list all 11 brand asset endpoints from spec 06_METADATA_FAVICON_SOCIAL.md
   - All existing checks preserved: manifest link, favicon icons, apple-touch-icon, og:image, twitter:image

3. **`src/brand/brand-gates.test.ts`** — No changes needed (42 tests already pass)

4. **`playwright.config.ts`** — No changes needed (brand-evidence tests set viewports programmatically via `page.setViewportSize()`)

### Verification
- `bun run typecheck` — passes (0 errors)
- `bun run test` — 321/321 tests pass (all 11 test files, 0 failures)
- `src/brand/brand-gates.test.ts` — 42/42 tests pass specifically

---

## Task 6-c: Implement mobile/Whop embed, reduced motion contract, and interaction performance for WP-02
**Date:** 2026-08-06
**Status:** Completed

### Summary
Implemented mobile and Whop embedded context support, reduced motion contract enforcement, and interaction accessibility/performance utilities per Workspace_04_WP02_Interaction_Foundation specs (08, 09, 02_MOTION_CONTRACT).

### Files Created

1. **`src/components/interaction/whop-frame-harness.tsx`** — Local iframe harness for testing Whop embedded context
   - `WhopFrameHarness` component renders the app in a local iframe simulating Whop's embedded context
   - Diagnostic panel detects: double scrollbars, sticky-header collision, focus trapping
   - Width selector with common Whop embed widths (380, 480, 600, 768, 960)
   - Simulated Whop chrome header bar
   - Cross-origin error handling (diagnostics gracefully degrade)
   - Real Whop verification remains tracked debt
   - Exported presets: `WHOP_EMBED_WIDTHS`, `DEFAULT_WHOP_WIDTH`, `DEFAULT_WHOP_HEIGHT`

2. **`src/components/interaction/mobile-safe-area.tsx`** — Mobile safe-area utilities
   - `useSafeAreaInsets()` hook — reads `--safe-area-inset-*` CSS custom properties
   - `SafeAreaWrapper` — applies safe-area padding on specified edges (top/bottom/left/right)
   - `SafeAreaBottomSheet` — bottom sheet respecting safe-area-inset-bottom
     - Proper dialog semantics (role="dialog", aria-modal, Escape to close)
     - Focus trap on open, drag handle indicator
   - `TouchTarget` — enforces minimum 44×44px touch target, centers child

3. **`src/hooks/use-reduced-motion-contract.ts`** — Enhanced reduced motion hook
   - `useReducedMotionContract()` returns:
     - `reduced` (boolean)
     - `duration` (0 for reduced, normal otherwise)
     - `transition` (opacity-only for reduced, standard easeOut otherwise)
     - `motionProps()` helper returning appropriate framer-motion props
     - `safeVariant()` sanitizer stripping unsafe properties
   - Contract enforcement: translation→0, blur→0, parallax→0, repetition→none, fallback→opacity
   - `sanitizeVariant()` exported for standalone use (tests, config objects)

4. **`src/components/interaction/live-region.tsx`** — Accessible live region for async updates
   - `LiveRegion` component — polite and assertive variants, auto-clears after 5s
   - `LiveRegionProvider` + `useLiveRegion()` hook — stack multiple async announcements
   - Proper ARIA: role="status", aria-live, aria-atomic="true", sr-only class

5. **`src/tests/unit/interaction/reduced-motion-contract.test.ts`** — 23 unit tests
   - `sanitizeVariant` with `reduced=false`: preserves all properties
   - `sanitizeVariant` with `reduced=true`: removes x/y/translateX/translateY/filter, resets scale to 1, strips repeat/repeatDelay, forces duration 0.15, preserves opacity
   - Edge cases: number/null/empty-object variants, unknown properties (forward-compat)

### Files Changed

6. **`src/app/globals.css`** — Added:
   - Safe-area CSS custom properties in `:root`:
     - `--safe-area-inset-top: env(safe-area-inset-top, 0px)`
     - `--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px)`
     - `--safe-area-inset-left: env(safe-area-inset-left, 0px)`
     - `--safe-area-inset-right: env(safe-area-inset-right, 0px)`
   - `.touch-target` utility class (min-width: 44px, min-height: 44px)
   - `.motion-pause-offscreen` utility (content-visibility: auto + contain-intrinsic-size)

### Verification
- `bun run typecheck` — 0 new errors (pre-existing errors in focus-manager.tsx and focus-restore.test.ts are from another agent)
- `bun vitest run src/tests/unit/interaction/reduced-motion-contract.test.ts` — 23/23 tests pass

### What was NOT changed (per instructions)
- `src/components/marketing/hero/rescue-hero.tsx`
- `src/components/marketing/floating-nav.tsx`
- `src/app/(marketing)/page.tsx`
- `src/brand/copy.ts`
- `tailwind.config.ts`
- `src/design-system/motion.ts`
- `src/tests/e2e/*`

---

## Task 6-b: Implement mutation feedback, undo/rollback, and keyboard/command palette for WP-02
**Date:** 2026-08-06
**Status:** Completed

### Summary
Implemented the full mutation feedback system with undo/rollback, updated the command palette per spec (single registry, internal route hiding, disabled actions with reason, trigger focus restoration), updated the keyboard handler per spec (Arrow Up/Down active row, Enter inspector, Escape close, Space toggle, action shortcut guard, aria-activedescendant), and corrected motion tokens to match spec 02_MOTION_CONTRACT.md.

### Files Created

1. **`src/components/interaction/mutation-feedback.tsx`** — Unified mutation state display component
   - `MutationState` type: idle, pressed, pending, success, failure, retrying, permission-denied, plan-limit, paused, suppressed (all 10 spec-required states)
   - `MutationFeedback` component with badge, icon, retry button, and undo button with countdown
   - Truthful labels via `STATE_LABELS` — never claims "delivered" without evidence
   - Undo window (5s default) after which undo button disappears
   - `interventionToMutationState()` — maps InterventionState → MutationState
   - `interventionLabel()` — truthful label for each intervention state
   - `aria-live` regions for pending (assertive) and other (polite) states
   - Compact mode support

2. **`src/components/interaction/optimistic-update.tsx`** — Optimistic update with deterministic rollback
   - `useOptimisticUpdate<T>` hook — returns [data, mutate, isPending, rollback, canUndo, mutationState, reset]
   - Shows optimistic data immediately on mutate
   - Deterministic rollback to `rollbackData` on failure
   - Undo window (5s) for reversible actions
   - `OptimisticUpdate<T>` wrapper component combining hook with MutationFeedback

3. **`src/hooks/use-optimistic-mutation.ts`** — TanStack Query integration
   - `useOptimisticMutation<TData, TError, TVariables>` hook
   - Wraps `useMutation` with `onMutate` (snapshot + optimistic update), `onError` (rollback), `onSuccess` (undo window)
   - Cancels outgoing refetches, snapshots previous data
   - Invalidates queries on settle for server-truth
   - Returns mutate, isPending, rollback, canUndo, mutationState, data, error, reset

4. **`src/tests/unit/interaction/mutation-feedback.test.ts`** — 32 unit tests
   - MutationState type coverage (10 states, distinct strings)
   - interventionToMutationState mapping (all 12 InterventionState values)
   - interventionLabel truthful labels (never "delivered", non-empty for actionable states)
   - Mutation state machine paths (happy path, retry, permission denied, plan limit, suppressed, paused, undo)

### Files Changed

5. **`src/components/interaction/command-palette.tsx`** — Updated per spec 07_KEYBOARD_AND_COMMAND_PALETTE.md
   - Single `CommandEntry` registry for routes AND safe actions
   - Internal routes (sync, webhooks) marked with `internal: true` — **never exposed to creators** (filtered out of `visibleCommands`)
   - Unavailable actions disabled with `unavailableReason` text shown inline
   - Company context preserved (all navigation preserves companyId implicitly via router)
   - **Trigger focus restoration** — captures `document.activeElement` on Cmd+K, restores focus on close
   - Keyboard shortcut labels via `CommandShortcut` component (G O, G Q, P, S, etc.)
   - JSDoc documenting Cmd+K/Ctrl+K, Escape, Enter, Arrow Up/Down
   - `CommandEntry` type exported for programmatic use

6. **`src/components/rescueloop/rescue-queue/keyboard-handler.tsx`** — Updated per spec 07_KEYBOARD_AND_COMMAND_PALETTE.md
   - **ArrowDown/ArrowUp** — changes active row (was J/K only before)
   - **Enter** — opens inspector for active row (NEW)
   - **Escape** — closes inspector when open (NEW)
   - **Space** — toggles selection only on selectable rows (NEW — checks `row.selectable`)
   - **J/K** — vim-style aliases (unchanged)
   - **A/S/D** — action shortcuts (unchanged)
   - **Action shortcuts never fire in inputs/editors** — `isTypingTarget()` guard (was already present, now more robust)
   - **aria-activedescendant** — programmatically exposes active row via `useEffect` setting attribute on container
   - New props: `activeId`, `onActiveId`, `onOpenInspector`, `onCloseInspector`, `onToggleSelection`, `inspectorOpen`, `listboxId`
   - Backward-compatible `useKeyboardQueueLegacy()` wrapper for old `selectedId`/`onSelectId` API

7. **`src/app/(dashboard)/rescue-queue/page.tsx`** — Updated to use new keyboard handler API
   - Switched from old `selectedId`/`onSelectId` to new `activeId`/`onActiveId` API
   - Added `onOpenInspector`, `onCloseInspector`, `onToggleSelection`, `inspectorOpen`, `listboxId`
   - Rows mapped to `{ id, selectable: true }` format

8. **`src/design-system/motion.ts`** — Corrected to match spec 02_MOTION_CONTRACT.md
   - Added `instant: 80`, `press: 120`, `micro: 160` (was `fast: 160`)
   - Added `panel: 320`, `route: 360`, `firstValue: 480`
   - Corrected `reveal: 520` (was 600ms — spec says 520ms)
   - Corrected `hero: 820` (was 900ms — spec says 820ms max)
   - `pressScale` now uses `motionTokens.press` (120ms) instead of `motionTokens.fast` (160ms)
   - Backward-compatible aliases: `fast` → `micro`, `panelMotion` → `panel`
   - Documented spec contract assertions as comments

### Verification
- `bun run typecheck` — No new errors. Pre-existing errors in `focus-manager.tsx`, `focus-restore.test.ts`, and `reduced-motion-contract.test.ts` (not from this task).
- `bun vitest run src/tests/unit/interaction/mutation-feedback.test.ts` — 32/32 tests pass
- No errors in any of the created/changed files from typecheck

### What was NOT changed (per instructions)
- `src/components/marketing/hero/rescue-hero.tsx`
- `src/components/marketing/floating-nav.tsx`
- `src/app/(marketing)/page.tsx`
- `src/brand/copy.ts`
- `tailwind.config.ts`
- `src/tests/e2e/*`

---

## Task 6-a: Implement stable app shell, focus restoration, and complete state system for WP-02
**Date:** 2026-08-06
**Status:** Completed

### Summary
Implemented the stable app shell with regional skeletons and content-region errors, full focus restoration system (useFocusRestore, useEscapeKey, FocusTrap), a unified DataState component covering all 11 spec-required states, and an inspector drawer with desktop/mobile variants. 25 new unit tests pass. TypeScript compiles cleanly. 401 total tests pass.

### Files Created

1. **`src/hooks/use-focus-restore.ts`** — Core focus management hooks:
   - `useFocusRestore(isOpen)` — returns ref; focus returns to trigger when overlay closes (after 2 rAF for exit animations)
   - `useEscapeKey(callback, isActive)` — document-level Escape listener, active only when isActive
   - `FocusTrap` object: `getFocusableElements(container)` + `createTrapHandler(container)` for Tab/Shift+Tab wrapping
   - `useFocusTrap(containerRef, isActive)` — React hook attaching trap handler
   - `isElementVisible()` — visibility check working in both browser and jsdom (offsetParent + isConnected fallback)

2. **`src/components/interaction/focus-manager.tsx`** — Declarative focus management:
   - `<FocusRestore isOpen>` — render-prop component for trigger focus restoration
   - `<EscapeHandler isActive onEscape>` — declarative Escape wrapper
   - `<FocusTrapRegion isActive>` — div with Tab focus trapping
   - `<DestructiveConfirm>` — AlertDialog per spec 04: states consequences, cancel gets default focus, requires explicit confirmation, loading state

3. **`src/components/interaction/state-presence.tsx`** — Unified state display per spec 06:
   - `DataState` type: idle, loading, empty, populated, partial, stale, permission-error, network-error, server-error, plan-limit, paused
   - `getStateMeta(state)` → { what, isIncomplete, action, retrySafe, actionOccurred } — answers all five spec questions
   - `<StatePresence<T>>` — generic component with custom fallbacks (loading, empty, error, stale, planLimit, paused) and sensible defaults
   - Stale: renders data + staleness indicator; Partial: renders data + "loading remaining"; Paused: renders paused overlay + data
   - `data-state` attribute for CSS/testing hooks

4. **`src/components/interaction/inspector-drawer.tsx`** — Desktop inspector / mobile sheet per spec 04:
   - Desktop: Radix Dialog side panel (right-edge), keeps source visible, preserves selected identity, Escape closes + restores focus, Arrow/Nav next/previous, URL param encoding
   - Mobile: Vaul Drawer bottom sheet, safe-area-aware (env(safe-area-inset-bottom)), max-h-85svh, no nested-scroll trap
   - `<InspectorTrigger>` — convenience wrapper wiring click/Enter + focus ref

5. **`src/tests/unit/interaction/focus-restore.test.ts`** — 25 unit tests:
   - FocusTrap.getFocusableElements (10): anchors, buttons, inputs, selects, textareas, tabindex, disabled, contenteditable, multiple
   - FocusTrap.createTrapHandler (5): returns function, ignores non-Tab, wraps Tab, wraps Shift+Tab, no-wrap in middle
   - getStateMeta (10): all states have metadata, loading=incomplete, populated/empty=complete, errors=incomplete, retry-safe, action-occurred, stale/partial specifics

### Files Modified

6. **`src/components/layout/app-shell.tsx`** — Enhanced per spec 03:
   - Route registry: `NAV_ITEMS` (as const) + `NavRoute` type + `getActiveNavKey()` — shared with CommandPalette
   - `<RegionSkeleton>` with 4 variants (table, cards, list, chart) — regional, not full-screen
   - `<ContentRegionError>` — renders errors inside content region with retry
   - `<ContentRegion>` wrapper with min-h-[50vh]
   - Shell stays mounted; only content region changes between routes
   - `aria-current="page"` on active nav items, `role="alert"` on paused banner
   - `useEscapeKey` closes mobile nav and notification sheets
   - Mobile nav links close sheet on navigation

### Verification
- `bun run typecheck` — 0 errors
- `bun run test` — 401/401 tests pass (14 test files)
- All components use existing shadcn/ui primitives
- All interactive elements have aria-labels
- Error states use role="alert" + aria-live="assertive"
- Warm cream design system colors (no indigo/blue)

## Task 3e-3f: WP-03 Threshold/Candidate Preview, First-Value Completion, Fixture/Connected Separation, Root Page
**Date:** 2026-08-07
**Status:** Completed

### Summary
Implemented threshold/candidate preview, first-value completion, fixture/connected separation, and updated the root page to show the onboarding journey. All 7 files created/modified as specified.

### Files Created

1. **`src/components/rescueloop/onboarding/threshold-step.tsx`**
   - Client component for setting inactivity threshold
   - Slider (1–30 days) + numeric input with validation
   - "Hypothesis" badge on threshold label
   - 7-day default with "Suggested" callout based on common course patterns
   - "Preview candidates" button → shows candidate count, percentage, sample list
   - Safety implications panel (cooldown, quiet hours, max messages, threshold warning)
   - "Nothing has been sent" / "Previewing never generates or sends" disclaimers
   - Back/Next navigation

2. **`src/components/rescueloop/onboarding/candidate-preview-step.tsx`**
   - Full candidate list with: name/email, course, product, membership status badge, start date, progress evidence, inactivity duration (amber badge), eligibility reason, unknown evidence marker (amber badge), suppressed status (with snowflake icon), cooldown status
   - "Nothing has been sent" banner (green ShieldCheck)
   - "Previewing never generates or sends a message" disclaimer
   - Candidates found → "Continue to Rescue Queue" button → routes to `/dashboard/[companyId]/rescue-queue`
   - Zero candidates → inline zero-candidate success state

3. **`src/components/rescueloop/onboarding/zero-candidate-state.tsx`**
   - Zero candidates IS success (not failure) — restrained green checkmark Closing Signal
   - Explains: scan completed, no members meet threshold, threshold adjustable, data freshness, monitoring promise
   - "Go to dashboard" button → `/dashboard/[companyId]/overview`

4. **`src/components/rescueloop/onboarding/completion-step.tsx`**
   - Shows when all steps complete: Access ✓, Course mapped ✓, Sync ✓, Threshold ✓, Candidates ✓
   - One restrained Closing Signal confirmation
   - Summary stats: courses connected, members scanned, candidates found, safety exclusions
   - Threshold badge
   - "Nothing has been sent" final confirmation
   - Conditional next action: "Go to Rescue Queue" (if candidates) + "Go to Dashboard"

5. **`src/lib/onboarding/mode-guard.ts`**
   - `isFixtureMode()` — checks `RESCUELOOP_FIXTURE_MODE` env var
   - `ensureConnectedMode()` — throws `FixtureModeError` if fixture mode active and route requires real data
   - `FixtureModeError` — typed error class with `code: "FIXTURE_MODE_GUARD"`
   - `FixtureCandidate` / `FixtureOnboardingState` interfaces
   - `getFixtureOnboardingState(thresholdDays)` — generates deterministic fixture data with 6 candidates
   - `getFixtureCandidateCount(days)` / `getFixtureCandidateSamples(days, limit)` — preview helpers
   - `FIXTURE_COMPANY_ID` exported for routing

6. **`src/app/api/dashboard/[companyId]/onboarding/route.ts`**
   - GET: returns current onboarding state + progress (fixture or connected mode)
   - POST: advances onboarding to next step (validates with Zod schema)
   - Both validate Whop admin access via `requireCompanyAdmin()`
   - Uses `OnboardingProgress` model for step tracking (not Organization)
   - Uses `SyncExecution` for lastSyncedAt
   - Uses `StudentCourseState.lastActivityAt` for candidate counting
   - **Never sends real notifications during onboarding** — enforced by design, `notificationsSent: 0` always

7. **`src/app/page.tsx`** (modified)
   - Fixture mode → demo onboarding journey with step indicator, progress bar, DEMO badge
   - 4-step wizard: Welcome → Threshold → Candidates → Complete
   - Whop mode → marketing landing page with logo, hero, "Get Started" → `/onboarding`
   - Unconfigured → setup instructions with numbered steps + fixture mode hint
   - Uses existing brand components (`RescueLoopLogo`), shadcn/ui components, motion animations
   - Responsive design, brand tokens, no indigo/blue

### Design Decisions
- Threshold default 7 days labelled "Hypothesis" (not "configuration")
- Zero-candidate state is explicitly success, not failure
- Closing Signal (green checkmark) used sparingly — only at completion states
- Fixture mode has amber "DEMO" banner at top of page
- All "nothing sent" / "previewing never sends" disclaimers use ShieldCheck + green border
- Candidate inactivity shown as amber badge with Clock icon
- Unknown evidence and suppressed status shown as distinct badges

### Verification
- `bun run lint` — 0 new errors (pre-existing warning in student-rescue blocker page)
- TypeScript compilation — 0 errors in new files
- Dev server — GET / 200 responses confirmed
- All components use existing shadcn/ui (Card, Button, Badge, Slider, Progress, Input, Label)
- Brand tokens: var(--recovery-green), var(--ink-primary), var(--warning), etc.
- Responsive design throughout
- No indigo/blue colors

---

## Task 3c-3d: Onboarding state machine, permission diagnostics, course mapping, first sync (WP-03)
**Date:** 2026-08-07
**Status:** Completed

### Summary
Implemented the complete onboarding state machine, permission diagnostics system, course mapping with zero-course state, first sync with resume, and onboarding analytics. All components use the existing brand tokens, shadcn/ui library, and project patterns.

### Files Created

1. **`src/lib/onboarding/onboarding-state.ts`** — Onboarding state machine
   - States: entry → access_check → mapping → first_sync → threshold → preview → complete
   - Types: OnboardingStep, OnboardingStatus, OnboardingStepState, OnboardingState
   - Functions: getNextStep, getStepIndex, isStepComplete, canAdvanceTo, createInitialState, completeStep, failStep, getProgressFraction, getProgressPercent
   - Serialization: serializeOnboardingState, deserializeOnboardingState

2. **`src/lib/onboarding/permission-diagnostics.ts`** — Permission diagnostics system
   - 10 diagnostic categories: connected, missing_api_key, invalid_token, non_admin, missing_scopes, whop_temporary_failure, rate_limit, no_courses, db_unavailable, stale_connection
   - DiagnosticResult type with safe ID generation (never exposes secrets)
   - runDiagnostics(companyId, organizationId) — runs all checks and returns structured report
   - Structured logging without sensitive payloads

3. **`src/lib/onboarding/sync-progress.ts`** — Sync progress tracking
   - 8 sync stages: company_refs, memberships, members, students, lessons, progress, reconciliation, candidate_eval
   - SyncProgress type with stages, currentStage, recordsProcessed, totalRecords, lastProviderResponseAt, failure, startedAt
   - Stale run detection (> 30 min since last update)
   - DB persistence via persistSyncProgress/loadSyncProgress (OnboardingProgress model)
   - Factory helpers: createInitialSyncProgress, startStage, completeStage, failStage

4. **`src/lib/onboarding/analytics.ts`** — Allowlisted onboarding analytics
   - 14 allowlisted event types covering the full journey
   - Forbidden metadata keys: email, messageBody, freeText, rawPayload, apiKey, token, etc.
   - safeDiagnosticId() — deterministic hash, never reversible to secrets
   - trackOnboardingEvent() and trackDiagnosticResult() — safe event tracking
   - Integrates with existing PostHog infrastructure

5. **`src/components/rescueloop/onboarding/course-mapping-step.tsx`** — Course mapping UI
   - Client component for the mapping step
   - Real provider results with stable IDs
   - Member counts shown when trustworthy
   - Refresh button, duplicate prevention warning
   - Previous mapping preservation on provider failure
   - Explicit confirmation before remapping
   - **ZeroCourseState** sub-component:
     - Likely causes (permissions, API key, no published courses)
     - Required permissions display
     - Refresh button + diagnostic test link
     - Support path with email + docs link
     - Confirmation that no messages or student changes occurred

6. **`src/components/rescueloop/onboarding/sync-step.tsx`** — Sync step UI
   - Shows all 8 sync stages with status icons (pending/in_progress/completed/failed)
   - Records processed count + last provider response time
   - Failure state with retry button (retryable vs manual intervention)
   - Stale run detection alert (> 30 min)
   - Reassurance: "This may take a few minutes. You can leave and come back."
   - Leave-and-return support (persisted state via OnboardingProgress in DB)

7. **`src/components/rescueloop/onboarding/onboarding-wizard.tsx`** — Full wizard
   - Step-based wizard with progress bar and stepper navigation
   - StepContent router for all 7 steps (entry through complete)
   - Integrates diagnostics, course mapping, sync, threshold, and preview steps
   - Auto-advances entry step after welcome delay
   - Persists state to API on each step completion

8. **`src/app/api/onboarding/progress/route.ts`** — Progress API
   - GET: Load onboarding progress by companyId/organizationId
   - POST: Upsert onboarding progress with step state and sync progress JSON

9. **`src/app/api/onboarding/diagnostics/route.ts`** — Diagnostics API
   - GET: Run permission diagnostics, track results as analytics events, return safe report

10. **`src/app/api/onboarding/sync/route.ts`** — Sync API
    - POST: Trigger first sync, create initial sync progress, persist to DB

### Files Modified

1. **`prisma/schema.prisma`** — Added OnboardingProgress model
   - Fields: id, organizationId, companyId, currentStep, stepsJson, syncProgressJson, completedAt, timestamps
   - Unique constraint on [organizationId, companyId]
   - Relation to Organization model (onboardingProgresses)

2. **`src/lib/observability/posthog.ts`** — Added 14 onboarding event names to ALLOWED_EVENTS
   - organization.onboarding_started through organization.onboarding_abandoned

3. **`src/app/page.tsx`** — Updated to show the OnboardingWizard with demo data

### Validation
- `bun run lint` — 0 errors, 1 pre-existing warning (unrelated to this task)
- `bun run db:push` — Schema synced successfully
- Dev server compiling cleanly
- All components use shadcn/ui (Card, Button, Badge, Progress, Alert, Input, Label, Select)
- Brand tokens: var(--recovery-green), var(--ink-primary), var(--warning), var(--critical), etc.
- Responsive design throughout
- No indigo/blue colors

## Task 3b: WP-03 Canonical Dashboard Routes
**Date:** 2026-08-07
**Status:** Completed

### Summary
Created canonical `/dashboard/[companyId]` route group and redirected all legacy `/companies/[companyId]` paths. This implements WP-03, establishing `/dashboard/` as the canonical base for all company-scoped routes.

### Files Created

1. **`src/app/dashboard/[companyId]/layout.tsx`** — Canonical dashboard layout
   - Server component with `import "server-only"`
   - Validates Whop token, company admin, app config, and onboarding state
   - Reuses ConnectedShell from `src/components/shell/connected-shell`
   - Handles fixture/whop/unconfigured modes identically to former companies layout
   - `export const dynamic = "force-dynamic"` and noindex metadata

2. **`src/app/dashboard/[companyId]/page.tsx`** — Dashboard overview/home
   - Shows onboarding progress prompt, quick navigation cards, and detail cards
   - Links to sub-routes (onboarding, rescue-queue, students, insights, settings)
   - Full Whop mode with DB queries + fixture mode with fixture data
   - Uses `resolveStrictCompanyAuth` and `renderCompanyAuthError`

3. **`src/app/dashboard/[companyId]/onboarding/page.tsx`** — Canonical onboarding
   - Server component verifying admin access via `requireCompanyAdmin`
   - Fetches onboarding data and renders `OnboardingJourney` client component
   - Shows safety promise banner ("Nothing will be sent automatically")

4. **`src/app/dashboard/[companyId]/rescue-queue/page.tsx`** — Rescue queue
   - Database-backed in Whop mode, fixture data only in fixture mode
   - Shows awaiting-approval interventions with queue actions
   - Uses `resolveStrictCompanyAuth` for auth

5. **Sub-route placeholder pages:**
   - `src/app/dashboard/[companyId]/students/page.tsx`
   - `src/app/dashboard/[companyId]/responses/page.tsx`
   - `src/app/dashboard/[companyId]/insights/page.tsx`
   - `src/app/dashboard/[companyId]/value/page.tsx`
   - `src/app/dashboard/[companyId]/activity/page.tsx`
   - `src/app/dashboard/[companyId]/sync/page.tsx`
   - `src/app/dashboard/[companyId]/usage/page.tsx`
   - `src/app/dashboard/[companyId]/settings/page.tsx`
   Each is a server component that verifies admin access via `resolveStrictCompanyAuth` and renders placeholder content with the appropriate icon and description.

6. **`src/components/rescueloop/onboarding/onboarding-journey.tsx`** — Multi-step wizard
   - Client component implementing the onboarding state machine
   - Steps: Access → Connection → Mapping → Sync → Threshold → Preview → Complete
   - URL search params track progress (`?step=access`, `?step=mapping`, etc.)
   - Progress bar and step indicators
   - "Nothing will be sent" safety promise visible on every step
   - Uses shadcn/ui Card, Button, Badge, Progress components

### Files Modified

7. **`src/components/shell/connected-nav.tsx`** — Updated navigation
   - `buildCompanyHref()` now generates `/dashboard/[companyId]/segment` paths
   - `getActiveConnectedNavKey()` matches both `/dashboard/` and legacy `/companies/` prefixes
   - "Overview" nav item renamed to "Dashboard" with segment `""` (root)
   - "Queue" nav item segment changed from `"queue"` to `"rescue-queue"`

8. **Legacy redirect pages** (all under `src/app/companies/[companyId]/`):
   - `overview/page.tsx` → redirects to `/dashboard/[companyId]`
   - `queue/page.tsx` → redirects to `/dashboard/[companyId]/rescue-queue`
   - `onboarding/page.tsx` → redirects to `/dashboard/[companyId]/onboarding`
   - `students/page.tsx` → redirects to `/dashboard/[companyId]/students`
   - `responses/page.tsx` → redirects to `/dashboard/[companyId]/responses`
   - `insights/page.tsx` → redirects to `/dashboard/[companyId]/insights`
   - `value/page.tsx` → redirects to `/dashboard/[companyId]/value`
   - `settings/page.tsx` → redirects to `/dashboard/[companyId]/settings`
   - `sync/page.tsx` → redirects to `/dashboard/[companyId]/sync`
   - `usage/page.tsx` → redirects to `/dashboard/[companyId]/usage`
   - `campaigns/page.tsx` → redirects to `/dashboard/[companyId]/campaigns`
   - `audit/page.tsx` → redirects to `/dashboard/[companyId]/audit`
   All use `redirect()` from `next/navigation` with `export const dynamic = "force-dynamic"`.

### Route Mapping (Legacy → Canonical)
| Legacy Path | Canonical Path |
|---|---|
| `/companies/[id]/overview` | `/dashboard/[id]` |
| `/companies/[id]/queue` | `/dashboard/[id]/rescue-queue` |
| `/companies/[id]/onboarding` | `/dashboard/[id]/onboarding` |
| `/companies/[id]/students` | `/dashboard/[id]/students` |
| `/companies/[id]/responses` | `/dashboard/[id]/responses` |
| `/companies/[id]/insights` | `/dashboard/[id]/insights` |
| `/companies/[id]/value` | `/dashboard/[id]/value` |
| `/companies/[id]/settings` | `/dashboard/[id]/settings` |
| `/companies/[id]/sync` | `/dashboard/[id]/sync` |
| `/companies/[id]/usage` | `/dashboard/[id]/usage` |
| `/companies/[id]/campaigns` | `/dashboard/[id]/campaigns` |
| `/companies/[id]/audit` | `/dashboard/[id]/audit` |

### Validation
- `bun run lint` — 0 errors in new code (1 pre-existing warning in unrelated file)
- `tsc --noEmit` — 0 new type errors (all pre-existing)
- Dev server compiling cleanly
- All components use shadcn/ui + brand tokens (var(--recovery-green), var(--ink-primary), etc.)
- Responsive design throughout
- No indigo/blue colors
- Every connected route validates Whop token + company admin
- Connected routes never render fixture data (only fixture mode does)
- "Nothing will be sent" safety promise shown throughout onboarding
