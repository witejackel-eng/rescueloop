# Task 8 - Route Consolidation Agent Work

## Summary
Created canonical `/dashboard/[companyId]` route family, converted all legacy `/companies/[companyId]` routes to server redirects, updated navigation to use canonical paths, and deleted obsolete `(dashboard)` group routes.

## Work Done

### 1. Created missing canonical routes
- **`/dashboard/[companyId]/playbooks/page.tsx`** - New route based on existing campaigns implementation. Full DB-backed page with fixture support. Uses `/dashboard/` links instead of `/companies/`.
- **`/dashboard/[companyId]/responses/page.tsx`** - Already existed (confirmed).

### 2. Converted all legacy `/companies/[companyId]` routes to server redirects
Each legacy `page.tsx` replaced with a minimal server component that calls `redirect()`:

| Legacy Route | Canonical Redirect |
|---|---|
| `/companies/[companyId]/overview` | `/dashboard/[companyId]` |
| `/companies/[companyId]/queue` | `/dashboard/[companyId]/rescue-queue` |
| `/companies/[companyId]/students` | `/dashboard/[companyId]/students` |
| `/companies/[companyId]/responses` | `/dashboard/[companyId]/responses` |
| `/companies/[companyId]/campaigns` | `/dashboard/[companyId]/playbooks` |
| `/companies/[companyId]/insights` | `/dashboard/[companyId]/insights` |
| `/companies/[companyId]/value` | `/dashboard/[companyId]/value` |
| `/companies/[companyId]/sync` | `/dashboard/[companyId]/sync` |
| `/companies/[companyId]/usage` | `/dashboard/[companyId]/usage` |
| `/companies/[companyId]/settings` | `/dashboard/[companyId]/settings` |
| `/companies/[companyId]/audit` | `/dashboard/[companyId]/activity` |
| `/companies/[companyId]/onboarding` | `/dashboard/[companyId]/onboarding` |

### 3. Updated navigation (`connected-nav.tsx`)
- Changed all nav item segments from legacy names to canonical names:
  - `overview` → `""` (root dashboard)
  - `queue` → `rescue-queue`
  - `campaigns` → `playbooks`
  - `audit` → `activity`
- Added `buildDashboardHref()` function (canonical path builder using `/dashboard/`)
- Kept `buildCompanyHref()` as deprecated wrapper for backward compat
- Updated `getActiveConnectedNavKey()` to match `/dashboard/` paths
- Updated Lucide icon import: `ScrollText` → `Activity` for activity nav item

### 4. Updated ConnectedShell (`connected-shell.tsx`)
- Replaced all `buildCompanyHref()` calls with `buildDashboardHref()`
- Changed logo links from `buildCompanyHref(companyId, "overview")` to `buildDashboardHref(companyId, "")` (root dashboard)
- Updated comment docs to reference `/dashboard/` routes

### 5. Deleted obsolete `(dashboard)` group routes
Removed entire `src/app/(dashboard)/` directory:
- `layout.tsx` (WorkspaceShell wrapper)
- `overview/page.tsx` (client-side mock data)
- `campaigns/page.tsx` (mock data campaigns)
- `campaigns/[campaignId]/page.tsx` (mock campaign editor)
- `insights/page.tsx` (mock insights)
- `value/page.tsx` (mock value)
- `students/page.tsx` (mock students)
- `rescue-queue/page.tsx` (mock queue)
- `settings/page.tsx` (mock settings)

## Canonical Route Family (12 routes)
1. `/dashboard/[companyId]` - Main dashboard overview
2. `/dashboard/[companyId]/onboarding` - Setup wizard
3. `/dashboard/[companyId]/rescue-queue` - Intervention review queue
4. `/dashboard/[companyId]/students` - Student directory
5. `/dashboard/[companyId]/responses` - Response centre
6. `/dashboard/[companyId]/playbooks` - Campaign management
7. `/dashboard/[companyId]/insights` - Course funnels & friction
8. `/dashboard/[companyId]/value` - Attribution ledger
9. `/dashboard/[companyId]/activity` - Activity/audit log
10. `/dashboard/[companyId]/sync` - Sync status
11. `/dashboard/[companyId]/usage` - Plan limits
12. `/dashboard/[companyId]/settings` - Org settings
