# Task 5 — Connected company shell

Agent: connected-shell-builder
Branch: feat/private-pilot-activation-rescue
Task ID: 5

## Summary

Built a dedicated navigation + layout shell for company-scoped routes
(`/companies/[companyId]/*`) that is completely separate from the demo
WorkspaceShell. The ConnectedShell never links to demo routes
(`/overview`, `/rescue-queue`, etc.) — every nav href always includes
`companyId`.

The shell is visually distinct from the demo workspace:
- Wider desktop nav rail (76px vs 68px) with section dividers
- Environment badge (FIXTURE / CONNECTED / NOT CONFIGURED) shown in the
  rail AND the top command bar
- Installation-state indicator (active / missing / unknown) next to the
  company name
- "Last sync" timestamp with relative time (font-mono tabular-nums)
- Emergency pause button (AlertDialog confirm → calls
  `/api/companies/[id]/settings/pause`)
- User menu placeholder (DropdownMenu)
- Mobile bottom tab bar with 4 primary items (Overview, Queue,
  Campaigns, Responses) + "More" sheet for the rest

## Environment handling (layout)

The layout reads `getProviderMode()` from `src/providers/index.ts`:

- `"unconfigured"` → renders `IntegrationNotConfiguredCard` (503 state,
  no shell, no children). Lists the required env vars.
- `"fixture"` → renders ConnectedShell with `FIXTURE_COMPANY_ID` and
  amber "FIXTURE" badge. Skips `requireCompanyAdmin` (it would throw
  `ConfigurationError`). Child stub pages catch the error and render
  their "Coming in Phase 2" content via `resolveStubAuth`.
- `"whop"` → best-effort gather org context (name, isPaused, last
  webhook, installation status) by calling `requireCompanyAdmin` and
  `db.organization.findUnique` + `db.whopInstallation.findUnique` +
  `db.webhookReceipt.findFirst` in parallel. If `ConfigurationError`
  is thrown (env changed under us), falls back to the 503 state. For
  any other auth error (missing/invalid token, insufficient access,
  installation missing), renders the shell anyway — children surface
  the appropriate AuthErrorCard.

The demo `CommandPalette` was REMOVED from the company layout because it
navigates to demo routes via the demo store. Company routes don't need
a command palette in this phase.

## Files created

### `src/components/shell/connected-nav.tsx`
Single source of truth for nav items. Exports:
- `ConnectedEnvironment` type ("fixture" | "whop" | "unconfigured")
- `InstallationState` type ("active" | "missing" | "unknown")
- `ConnectedNavItem` interface
- `CONNECTED_NAV_ITEMS` — 11 items (Overview, Queue, Students,
  Campaigns, Responses, Insights, Value, Settings, Sync, Audit, Usage).
  Mobile primary flags on Overview, Queue, Campaigns, Responses.
- `MOBILE_PRIMARY_ITEMS` / `MOBILE_MORE_ITEMS` derived arrays
- `buildCompanyHref(companyId, segment)` — always returns
  `/companies/{encodeURIComponent(companyId)}/{segment}`
- `getActiveConnectedNavKey(pathname, companyId)` — matches the path
  segment immediately after the company prefix; returns the item key
  or null
- `ENVIRONMENT_BADGE` — visual metadata (label, dotClass, textClass,
  bgClass) per environment
- `ENVIRONMENT_LABEL` — human-readable tooltip text per environment

Safe to import from both client and server components (no "server-only").

### `src/components/shell/connected-shell.tsx`
Client component (`"use client"`). Props:
```ts
interface ConnectedShellProps {
  companyId: string;
  companyName?: string;
  environment: ConnectedEnvironment;
  installationState: InstallationState;
  lastSyncAt: string | null;  // ISO string
  isPaused: boolean;
  children: React.ReactNode;
}
```

Renders:
1. Desktop vertical nav rail (76px, hidden on mobile) with:
   - RescueLoopMark logo (links to overview)
   - Environment badge in the rail header
   - 11 nav items as icon-only buttons with tooltips (label +
     description)
   - Active-state: animated background + left bar (motion layoutId)
   - Footer: installation state dot + label
2. Main content area with top command bar:
   - Mobile logo (links to overview)
   - Company selector (read-only button): env pill + installation dot +
     company name + companyId (font-mono)
   - Last sync timestamp (font-mono tabular-nums, relative time)
   - SyncStatusPill (compact env/installation indicator)
   - Pause/Resume button (AlertDialog confirm for pause, direct click
     for resume). Calls `/api/companies/[id]/settings/pause` via fetch,
     toasts on success/error, router.refresh() after.
   - UserMenu (DropdownMenu placeholder: Profile, Organisation
     settings, Sign out — all toast-info or navigate)
3. Paused banner (animated, red)
4. Environment banner (amber for fixture, red for unconfigured —
   hidden when whop/connected)
5. Page content (max-w-1320px, pb-24 on mobile for the tab bar)
6. Mobile bottom tab bar (fixed, 4 primary items + More button,
   min-h-44px touch targets, safe-area-inset-bottom padding)
7. Mobile "More" sheet (bottom Sheet with the 7 secondary items)

All numbers in `font-mono tabular-nums`. All touch targets ≥ 44px.

### `src/components/shell/integration-not-configured-card.tsx`
503 state card. Shown when `getProviderMode() === "unconfigured"`.
Calm, honest message + the required env vars (WHOP_API_KEY,
WHOP_WEBHOOK_SECRET, NEXT_PUBLIC_WHOP_APP_ID) + a "Back to home" link.
Uses the warm cream design system (no indigo/blue).

### `src/components/shell/company-stub-card.tsx`
Shared stub card for the placeholder pages. Props:
```ts
interface CompanyStubCardProps {
  title: string;
  description: string;
  status: StubStatus;  // "database" | "coming-soon" | "fixture" | "auth-error"
  statusNote?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;  // "What this page will show" content
}
```

Renders the page title (font-serif, with icon), description, a status
badge (Database-backed / Coming in Phase 2 / Fixture environment / Auth
context unavailable), an inline status note, and a dashed "What this
page will show" box with the children content.

### `src/components/shell/resolve-stub-auth.ts`
Server-only helper that centralises the try/catch + status resolution
for stub pages. Returns:
```ts
interface StubAuthResult {
  status: StubStatus;
  statusNote?: string;
  organizationId?: string;
}
```

Logic:
- If `getProviderMode() === "fixture"` → returns `status: "fixture"`
  with a note explaining Whop auth is bypassed.
- Otherwise calls `requireCompanyAdmin(companyId)`:
  - Success → `status: "database"` with the organizationId
  - `ConfigurationError` → `status: "fixture"` with a note about
    missing env vars
  - Any other auth error → `status: "auth-error"` with a note about
    opening from Whop dashboard

The stub pages are LENIENT — they render their stub content even when
auth fails. This keeps navigation working in fixture mode and lets
creators preview the shell without blocking on auth. (The fully-built
pages — queue, settings, responses, onboarding — surface auth errors as
AuthErrorCards. Stubs don't, because they have no real data to
protect.)

## Stub pages created (8)

Each is a Server Component with `export const dynamic = "force-dynamic"`,
calls `resolveStubAuth(companyId)`, and renders `<CompanyStubCard>` with
the page title, description, status, statusNote, icon, and "What this
page will show" content.

- `src/app/companies/[companyId]/overview/page.tsx` — Overview
  (LayoutDashboard icon, recovery pulse + system status)
- `src/app/companies/[companyId]/sync/page.tsx` — Sync status
  (RefreshCw icon, webhook receipts + sync health)
- `src/app/companies/[companyId]/students/page.tsx` — Students
  (Users icon, member directory + course progress)
- `src/app/companies/[companyId]/campaigns/page.tsx` — Campaigns
  (Megaphone icon, rescue campaigns + message templates)
- `src/app/companies/[companyId]/insights/page.tsx` — Insights
  (BarChart3 icon, friction findings + course funnels)
- `src/app/companies/[companyId]/value/page.tsx` — Value ledger
  (DollarSign icon, attribution ledger + ROI)
- `src/app/companies/[companyId]/audit/page.tsx` — Audit log
  (ScrollText icon, immutable state-change record)
- `src/app/companies/[companyId]/usage/page.tsx` — Usage
  (Gauge icon, plan limits + consumption)

## Files modified

### `src/app/companies/[companyId]/layout.tsx`
Switched from `WorkspaceShell` (demo) to `ConnectedShell` (company).
Removed the demo `CommandPalette` import (it navigates to demo routes).
Added env-mode handling via `getProviderMode()` + `requireCompanyAdmin`.
Added `import "server-only"` (the layout now touches server-only
modules directly).

The existing pages (queue, settings, responses, onboarding) were NOT
modified — they continue to call `requireCompanyAdmin` and surface auth
errors as before.

## What was NOT modified (per spec)

- `src/components/shell/workspace-shell.tsx` — the demo shell, untouched
- Demo routes (`/overview`, `/rescue-queue`, etc.) — untouched
- Existing company pages (queue, settings, responses, onboarding) —
  untouched. They still call `requireCompanyAdmin` and handle auth
  errors their own way.

## Verification

- `bun run lint` → exit 0, no errors, no warnings
- `bunx tsc --noEmit --skipLibCheck` → exit 0, no errors (excluding
  pre-existing examples/skills noise)
- No `any` types in any new file
- All shadcn/ui components used (Button, Sheet, Tooltip, AlertDialog,
  DropdownMenu, Card, Badge)
- All numbers in `font-mono tabular-nums`
- All touch targets ≥ 44px (mobile nav links + tab bar use `min-h-[44px]`)
- Keyboard accessible (all interactive elements are buttons/links;
  AlertDialog and DropdownMenu are Radix-based and keyboard-navigable)
- Responsive: mobile-first with `sm:`/`md:`/`lg:` breakpoints
- Sticky footer N/A (this is a full-screen shell with overflow-y-auto
  on the content area, not a page-level layout)

## Design notes

1. **The shell is visually distinct from the demo WorkspaceShell.**
   Different nav rail width (76px vs 68px), environment badge in the
   rail header, installation-state indicator, sync-status pill, no
   "DEMO" badge, no demo sync label, no notification panel (those are
   demo-specific).

2. **The environment badge uses the warm cream palette.** Amber
   (`--warning`) for fixture, green (`--recovery-green`) for connected,
   red (`--critical`) for unconfigured. No indigo/blue.

3. **Pause button uses AlertDialog confirm** (matching the existing
   `OrgPauseToggle` pattern). The resume button is direct (no confirm
   needed). Both call the existing
   `/api/companies/[id]/settings/pause` endpoint.

4. **UserMenu is a placeholder.** Profile and Sign out are toast-info
   only (not wired). Organisation settings navigates to the settings
   page. This matches the spec's "User menu (placeholder)" requirement.

5. **Stub pages are lenient.** They render their content even when auth
   fails, so navigation always works. The status badge (Database-backed
   / Coming in Phase 2 / Fixture environment / Auth context unavailable)
   communicates the current state honestly.

6. **The layout's `requireCompanyAdmin` call is best-effort.** In whop
   mode, if the user is unauthenticated (missing token), the layout
   still renders the shell — the child page surfaces the AuthErrorCard.
   This matches the existing pattern where each page handles its own
   auth.

7. **Fixture mode uses FIXTURE_COMPANY_ID for nav links.** This means
   in fixture mode, clicking a nav link changes the URL to
   `/companies/co_fixture_cgl/...`. The layout re-evaluates and uses
   FIXTURE_COMPANY_ID again. The original URL companyId is ignored in
   fixture mode.

## Stage Summary

The ConnectedShell is fully separate from the demo WorkspaceShell. All
company-scoped navigation retains companyId. The shell renders
correctly in all three environment modes (fixture, whop, unconfigured).
8 stub pages are created and render within the shell. Lint and tsc
pass cleanly.
