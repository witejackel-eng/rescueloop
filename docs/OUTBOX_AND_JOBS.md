# Outbox Pattern and Job Processing

## Transactional outbox

The outbox pattern ensures no job is silently lost, even if the job provider (Inngest) is unavailable.

**File:** `src/lib/outbox/outbox.ts`

### How it works

1. **Write:** When application state requires a job, the domain mutation and an `OutboxEvent` are written in the same DB transaction
2. **Commit:** The transaction commits atomically
3. **Claim:** A dispatcher claims pending events atomically using PostgreSQL `FOR UPDATE SKIP LOCKED`
4. **Dispatch:** The dispatcher sends the event to Inngest
5. **Mark:** Only an "accepted" response from Inngest transitions the event to `dispatched`

### Atomic claiming

The `claimPendingOutboxEvents()` function uses a CTE with `FOR UPDATE SKIP LOCKED`:

```sql
WITH candidates AS (
  SELECT id FROM outbox_events
  WHERE state = 'pending'
    AND ("claimedBy" IS NULL OR "leaseExpiresAt" < now)
    AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now)
  ORDER BY "createdAt" ASC
  LIMIT $limit
  FOR UPDATE SKIP LOCKED
)
UPDATE outbox_events SET "claimedBy" = $workerId, ...
FROM candidates WHERE outbox_events.id = candidates.id
RETURNING outbox_events.id
```

This ensures:
- Only one worker claims a given event
- No race conditions between concurrent dispatchers
- Leases expire after 30 seconds (configurable)

### Truthful state transitions

The outbox never marks an event `dispatched` unless Inngest explicitly accepts it:

| Inngest response | Outbox action |
|-----------------|---------------|
| `accepted` | Mark `dispatched`, store `externalEventId` |
| `unconfigured` | Keep `pending`, do NOT increment `attemptCount` endlessly |
| `failed` + retryable | Return to `pending`, set `nextAttemptAt` with backoff |
| `failed` + permanent | Move to `dead_letter` |

### Bounded retry

Backoff is capped: 1s, 2s, 4s, 8s, 16s, 32s, 60s (max). After `maxAttempts` (default: 10) retries, the event moves to dead letter.

### Dead letter queue

Permanently failed events are moved to `DeadLetterEvent` with:
- The original event type and payload
- The error message
- The attempt count at failure

Dead letters can be viewed at `/internal/dead-letters` and re-queued.

## Inngest job processing

**Files:** `src/server/jobs/client.ts`, `src/server/jobs/functions.ts`

### Client

`src/server/jobs/client.ts` provides:
- `getInngestClient()` — creates the Inngest client (lazy, only when configured)
- `isInngestReady()` — checks if `INNGEST_EVENT_KEY` is set
- `sendInngestEvent()` — dispatches an event to Inngest with graceful degradation
- `EVENTS` — event name constants

### Job functions

`src/server/jobs/functions.ts` defines durable Inngest functions:

| Function ID | Trigger | Purpose |
|------------|---------|---------|
| `process-webhook` | `whop/webhook.received` | Process a stored webhook receipt |
| `run-eligibility-scan` | `sync/eligibility.check` | Scan for eligible candidates |
| `deliver-intervention` | `intervention/deliver.requested` | Send notification via Whop |
| `process-data-export` | `data/export.requested` | Generate and store data export |
| `process-data-deletion` | `data/deletion.requested` | Execute data deletion after grace period |

Each function is:
- **Durable:** Inngest persists step state; survives restarts
- **Retryable:** Up to 5 retries with exponential backoff
- **Idempotent:** webhook receipts have unique constraints; duplicate events are skipped

### Lazy initialization

Job functions are created lazily via `getJobFunctions()` to avoid calling `getInngestClient()` at module import time, which would crash `next build` when Inngest is not configured.

### Inngest serve route

`src/app/api/inngest/route.ts`:
- Returns 503 if Inngest is not configured
- Lazily creates the serve handler on first request
- Delegates GET/POST/PUT to the Inngest handler

## Outbox tests

`src/lib/outbox/outbox.test.ts` verifies:
- Events are created and stored correctly
- Dispatch transitions are truthful (only "accepted" → "dispatched")
- Failed dispatches keep events pending
- Dead letter creation on permanent failure
- Atomic claiming with PostgreSQL SKIP LOCKED
- Backoff computation is bounded
