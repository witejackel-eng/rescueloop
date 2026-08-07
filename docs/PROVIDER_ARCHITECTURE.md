# Provider Architecture

RescueLoop uses a **provider pattern** to decouple the UI from data sources. Two implementations exist: fixture (demo) and Whop (production).

## Provider contracts

All providers implement interfaces defined in `src/providers/contracts/`:

| Contract | File | Purpose |
|----------|------|---------|
| `IdentityProvider` | `identity-provider.ts` | Fetch company/org identity |
| `ProductsProvider` | `products-provider.ts` | List Whop products |
| `CoursesProvider` | `courses-provider.ts` | List courses and lesson counts |
| `MembershipsProvider` | `memberships-provider.ts` | List memberships with status, renewal dates |
| `ProgressProvider` | `progress-provider.ts` | Fetch student progress and lesson completion |
| `NotificationsProvider` | `notifications-provider.ts` | Send notifications to students |

Shared types and utilities live in `src/providers/contracts/shared.ts`.

## Fixture provider

**Location:** `src/providers/fixtures/`

Serves deterministic demo data for the `(dashboard)` route group. No backend, no API keys, no network calls required.

- Data is coherent: one company, one product, one course, 12 named students
- All figures are consistent across pages
- Sync status reports "Demo sync"
- Recovered value is labeled "Illustrative" rather than "Confirmed"
- Demo surfaces are marked "Interactive demo · simulated workspace"

Files:
- `fixtures-data.ts` — the canonical dataset
- `identity.ts`, `products.ts`, `courses.ts`, `memberships.ts`, `progress.ts`, `notifications.ts` — individual provider implementations
- `index.ts` — barrel export

## Whop provider

**Location:** `src/providers/whop/`

Wraps the `@whop/sdk` for the `companies/[companyId]` routes. Requires real Whop credentials (`WHOP_API_KEY`, `NEXT_PUBLIC_WHOP_APP_ID`).

- Calls `getWhopClient()` which initializes the SDK with the API key
- Degrades gracefully: if credentials are missing or the API is unreachable, returns empty results + `whopUnavailable: true`
- All calls go through the official SDK (no raw fetch)

Files:
- `identity.ts`, `products.ts`, `courses.ts`, `memberships.ts`, `progress.ts`, `notifications.ts` — Whop SDK wrappers
- `errors.ts` — typed Whop error classification
- `index.ts` — barrel export

## Provider resolution

The top-level `src/providers/index.ts` exports a `getProviders()` function that returns the appropriate provider set based on context:

- **Demo context** (no companyId) → fixture providers
- **Connected context** (companyId present) → Whop providers

## Contract tests

`src/tests/contracts/provider-contracts.test.ts` runs the same contract suite against both implementations. This ensures the Whop provider returns data shaped identically to the fixture provider, so UI code works with either.

## Error handling in Whop provider

When Whop API calls fail:
1. The error is classified (`errors.ts`) into: `auth_error`, `rate_limited`, `not_found`, `server_error`, `network_error`, `unknown`
2. Rate-limited and server errors are retryable
3. Auth and not-found errors are not retryable
4. The provider returns an empty result + error metadata so the UI can show appropriate states

## Notifications provider specifics

The Whop `NotificationsProvider` calls `whop.notifications.create()` with:
- The experience ID (from the onboarding mapping)
- The student's Whop user ID
- A rescue link containing the signed student access token
- A notification message from the campaign template

If the Whop API returns `api_accepted`, the intervention state is set to `notification_accepted` (NOT `delivered` — delivery confirmation requires a separate webhook from Whop).
