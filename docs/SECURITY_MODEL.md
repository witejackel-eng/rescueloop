# Security Model

## Authentication

### Company routes (Whop auth)

All routes under `/companies/[companyId]/*` use strict Whop authentication:

**File:** `src/lib/auth/whop-auth.ts`

1. `verifyUserToken()` — verifies the user's session token from the Whop SDK
2. `checkAccess()` — confirms the user has admin access to the specific company
3. The `companyId` from the URL is **never trusted alone** — it's validated against the authenticated user's accessible companies

If auth fails, the route returns 401 (no token) or 403 (no access).

### Strict company auth wrapper

**File:** `src/lib/auth/strict-company-auth.tsx`

A React Server Component wrapper that:
- Calls the Whop auth functions
- Redirects unauthenticated users to Whop login
- Returns 403 if the user lacks access to the company
- Passes the verified company context to the page component

### Internal routes (secret-based auth)

All routes under `/internal/*` and all `/api/internal/*` routes use internal authentication:

**File:** `src/lib/auth/internal-auth.ts`

- Requires a `CRON_SECRET` or `Authorization: Bearer <CRON_SECRET>` header
- Returns 401 if the secret is missing or incorrect
- Used for cron jobs, internal dashboards, and admin actions

### Internal route helpers

**File:** `src/lib/auth/internal-route-helpers.ts`

Provides `withInternalAuth()` wrapper for API routes that:
- Validates the internal secret
- Extracts the actor ID for audit logging
- Returns proper error responses for auth failures

### Student routes (token auth)

Student rescue routes at `/experiences/[experienceId]/rescue/[token]` use token-based auth:

- The token is a cryptographically random 32-byte value
- Only its SHA-256 hash is stored in the database
- Token verification: hash the provided token and compare against the stored hash
- Tokens are single-use for response submission; viewing can be repeated
- Tokens expire after a configurable TTL

**File:** `src/lib/crypto/student-access-tokens.ts`

## Tenant isolation

### Database-level isolation

Every table includes an `organizationId` column. All queries include a `where: { organizationId }` clause.

### Verified by integration tests

`src/tests/integration/tenant-isolation.test.ts` explicitly verifies:
- Org A's students are not visible to org B
- Org A's interventions are not visible to org B
- Org A's audit logs are not visible to org B
- Org A's outbox events are not visible to org B
- Cross-tenant data manipulation is prevented

### API route isolation

Company API routes:
1. Authenticate the user via Whop
2. Resolve the `companyId` to an `organizationId`
3. Scope all queries to that `organizationId`
4. Never accept `organizationId` from user input

## Rate limiting

**File:** `src/lib/rate-limit/rate-limiter.ts`

- Redis-backed sliding window algorithm
- Default: 60 requests per 60 seconds per key (IP + route)
- Applied to all API routes
- Graceful degradation: if Redis is unavailable, requests are allowed through (fail-open)
- Configurable per route

## Webhook security

**File:** `src/app/api/webhooks/whop/route.ts`

- Uses Whop's Standard Webhooks SDK (`client.webhooks.unwrap()`) for signature verification
- Returns 401 if the signature is invalid
- Returns 503 if Whop is not configured
- Stores a SHA-256 hash of the raw payload for audit
- Idempotent: duplicate events (same `whopEventId`) are silently skipped

## CSRF protection

Next.js App Router provides built-in CSRF protection:
- Server Actions verify origin headers
- API routes use `NextRequest` which includes origin validation
- POST/PUT/DELETE routes require valid content type

## Data security

### Secrets management

- Server secrets are never prefixed with `NEXT_PUBLIC_`
- `.env` files are gitignored
- `.env.example` contains only variable names, never values
- Vercel environment variables are configured per environment (Preview / Production)

### Student data

- Student free-text responses are never sent to analytics
- PostHog allowlist excludes: email, name, token, note, messageContent, payloadJson, whopUserId, ipAddress, userAgent
- Student access tokens are hashed (SHA-256) before storage

### Webhook payload retention

- Webhook payloads are stored for debugging and replay
- On organization deletion, payloads are redacted (replaced with `{}`)
- Event metadata (type, timestamp, company) is retained for audit

## Input validation

### Pilot application validation

**File:** `src/lib/validation/pilot-application.ts`

Validates: name, email, company name, course URL, member count, motivation — all required, with length limits.

### API route validation

All API routes validate:
- Required fields are present
- Field types are correct (string, number, enum)
- IDs match expected formats (UUID, Whop ID)
- Invalid requests return 400 with descriptive error messages

## Audit trail

Every mutation creates an audit log entry:

**File:** `src/lib/audit.ts`

- `organizationId` — tenant scope
- `actorId` — who made the change (user ID or "system")
- `action` — what was done (enum: approved, dismissed, scheduled, suppressed, paused, resumed, deleted, exported, overridden)
- `objectType` + `objectId` — what was affected
- `previousState` + `newState` — before/after
- `reason` — why (required for internal actions)
- `metadataJson` — additional context

Internal audit (separate table):

**File:** `src/lib/auth/internal-audit.ts`

Same structure, plus `tenantScope` for cross-tenant internal actions.
