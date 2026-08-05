# Scale Architecture

Target: **100 organisations, 250,000 members** at pilot scale.

## Database design for scale

### Tenant isolation

Every table is scoped by `organizationId`. Queries always include a `where: { organizationId }` clause. Integration tests in `src/tests/integration/tenant-isolation.test.ts` verify cross-tenant data never leaks.

### Indexes

The Prisma schema includes composite indexes on:
- `(organizationId, whopUserId)` for student lookups
- `(organizationId, state)` for intervention queue queries
- `(organizationId, createdAt)` for audit and outbox ordering
- `(whopEventId)` unique for webhook idempotency
- `(externalInteractionId)` unique for progress event idempotency
- `(idempotencyKey)` unique for outbox and eligibility dedup

### Bounded queries

All queries use `take` limits. No unbounded `findMany` calls exist in production code:
- Sync engine: `RECONCILIATION_PAGE_SIZE` (500) with configurable page limit
- Outbox: `claimPendingOutboxEvents` defaults to 50 events per claim
- API routes: internal usage route caps at 200 counters
- Eligibility scan: processes students in batches

### Set-based reconciliation

The sync engine uses set-based queries instead of N+1 patterns:
- Membership reconciliation compares DB sets against provider sets
- Reconciliation outcomes are created in bulk via `createMany`
- Student lookups use `upsert` with composite unique keys

## Connection pooling

- Neon pooled connection string (`DATABASE_URL`) for runtime queries
- Neon direct connection string (`DIRECT_URL`) for migrations
- Prisma client is a singleton (`src/lib/db.ts`) to reuse connections

## Job processing at scale

### Outbox batch processing

`processPendingOutbox()` claims a batch of events (default: 50) per invocation:
- Each event is dispatched individually with lease management
- Leases expire after 30 seconds, preventing stuck events
- Multiple workers can run concurrently (atomic claiming via SKIP LOCKED)

### Inngest concurrency

Inngest handles concurrency and retry at the platform level:
- Each function run is isolated
- Step-level persistence means no lost work on restart
- Concurrency limits can be configured per function in Inngest dashboard

## Rate limiting

**File:** `src/lib/rate-limit/rate-limiter.ts`

Redis-backed sliding window rate limiter:
- Default: 60 requests per 60 seconds per key
- Used on API routes to prevent abuse
- Graceful degradation: if Redis is unavailable, requests are allowed through

## Plan enforcement

**File:** `src/lib/usage/enforcement.ts`

Usage limits are enforced atomically:
- `SubscriptionEntitlement` records define per-org limits
- `UsageCounter` tracks current usage per metric
- `UsageReservation` provides atomic reserve-then-commit for concurrent requests
- Plan overrides are supported via `PlanOverride` records

### Plan tiers

| Tier | Max monitored members | Max courses | Max campaigns |
|------|----------------------|------------|---------------|
| rescue | 1,000 | 1 | 1 |
| pilot | 10,000 | 5 | 5 |
| growth | 250,000 | unlimited | unlimited |

## Memory and compute considerations

- Server Components by default (no client JS for static content)
- Client Components only where interactivity is required
- Framer Motion animations are restrained (180–250ms) and respect `prefers-reduced-motion`
- Charts use Recharts with lazy rendering
- Large lists use virtualized rendering where applicable

## Monitoring

- Sync execution history is queryable via `/internal/sync`
- Outbox backlog is visible in `/internal/jobs`
- Usage counters are visible in `/internal/usage`
- Dead letters are visible in `/internal/dead-letters`
- Audit trail is per-organization at `/companies/[companyId]/audit`
