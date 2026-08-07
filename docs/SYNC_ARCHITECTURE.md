# Sync Architecture

The sync engine keeps RescueLoop's PostgreSQL database in sync with Whop's API data. It is checkpointed, batched, and resumable.

## Overview

```
Whop Webhook → WebhookReceipt (DB) → Inngest Job → Sync Engine → PostgreSQL
```

1. Whop sends a webhook (e.g., `membership.activated`)
2. The webhook endpoint stores a `WebhookReceipt` and enqueues an Inngest event
3. The Inngest job function processes the receipt based on event type
4. The sync engine updates the corresponding DB records

## Checkpointed synchronization

For full syncs (not triggered by a single webhook), the sync engine uses checkpoints:

- A `SyncCheckpoint` record stores the last-synced cursor per organization per data type
- Each sync run resumes from the last checkpoint
- If interrupted, the next run picks up where it left off
- Checkpoints are stored in PostgreSQL with the organization scope

## Batched processing

The sync engine processes data in bounded batches:

- **Page size:** `RECONCILIATION_PAGE_SIZE` (default: 500 records)
- **Page limit:** configurable per sync run (default: no limit; production uses 100)
- Each batch is processed in its own DB transaction
- If a batch fails, only that batch rolls back; previous batches are preserved
- The next sync run resumes from the last successful checkpoint

## Sync engine components

**File:** `src/lib/sync/sync-engine.ts`

### Membership sync

- Fetches memberships from the Whop provider
- Normalizes membership status via `normalizeMembershipStatus()`
- Upserts `Student`, `Membership`, and `Enrollment` records
- Uses set-based queries for reconciliation (not N+1)

### Progress sync

- Fetches progress events from the Whop provider
- Records `ProgressEvent` rows with external interaction IDs for idempotency
- Progress ingestion is idempotent (unique constraint on `externalInteractionId`)

### Reconciliation

After sync, the engine runs reconciliation:

- Matches memberships to course activity
- Classifies outcomes: `matched`, `membership_without_course_activity`, `course_activity_without_membership`, `unmapped_product`, `missing_source_fields`, `stale_source_record`
- Stores `ReconciliationOutcome` rows for audit and debugging
- Creates `ReconciliationRun` records to track each run

### Membership status normalization

**File:** `src/lib/sync/normalize-membership-status.ts`

Maps Whop membership statuses to RescueLoop's `MembershipStatus` enum without using `as any` casts.

## Sync records helper

**File:** `src/lib/sync/sync-records.ts`

Provides typed helper functions for creating and updating sync-related records.

## Resilience

- **Idempotent:** webhook receipts have unique `whopEventId` constraints; duplicate events are silently skipped
- **Bounded:** queries use `take` limits; no unbounded `findMany` calls
- **Retried:** Inngest functions retry up to 5 times with exponential backoff
- **Graceful degradation:** if Whop API is unavailable, sync returns partial results + error metadata
- **Atomic:** each batch is processed in a transaction; no partial state

## Manual sync trigger

Organization admins can trigger a manual sync from `/companies/[companyId]/sync`. This creates a new sync run that processes all data types from scratch (ignoring checkpoints).

## Integration tests

`src/tests/integration/sync-resilience.test.ts` verifies:
- Sync recovers from mid-run interruptions
- Checkpoints are correctly persisted and resumed
- Bounded queries prevent unbounded memory usage
- Duplicate webhook events are handled idempotently
