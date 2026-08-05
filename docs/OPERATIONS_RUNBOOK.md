# Operations Runbook

Internal procedures for operating RescueLoop in production.

## Deployment

### Vercel deployment flow

1. Push to `main` → Vercel auto-deploys to production
2. PR creates a preview deployment automatically
3. CI runs lint, type-check, and build verification in parallel jobs

### Database migrations

```bash
# After schema changes, create a migration
bunx prisma migrate dev --name <description>

# Deploy migrations to production
bunx prisma migrate deploy
```

Always review the generated SQL before deploying. Breaking changes (column drops, type changes) require a multi-step migration.

### Plan seeding

After a fresh database or schema change affecting plans:
```bash
bun run src/lib/usage/seed-plans.ts
```

## Monitoring

### Internal dashboard

Access `/internal` (requires `CRON_SECRET` auth). Key views:

| View | What to check |
|------|---------------|
| `/internal/sync` | Stale syncs (last run > 1 hour ago for active orgs) |
| `/internal/jobs` | Outbox backlog depth, failed events |
| `/internal/webhooks` | Recent webhook receipts, any `failed` status |
| `/internal/dead-letters` | Permanently failed events needing attention |
| `/internal/usage` | Orgs approaching or exceeding plan limits |
| `/internal/pilots` | Pending pilot applications |

### Alerting thresholds

- Outbox backlog > 100 pending events → investigate dispatch failures
- Dead letters appearing → check Inngest connectivity
- Webhook failures > 10 in 1 hour → check Whop API status
- Sync not run in > 2 hours for active org → check cron/Inngest

## Common procedures

### Re-queue a dead letter event

1. Go to `/internal/dead-letters`
2. Find the event, click "Re-queue"
3. This creates a new pending outbox event with a fresh idempotency key
4. The dispatcher will pick it up on the next cycle

### Force a manual sync for an organization

1. Go to `/companies/[companyId]/sync`
2. Click "Trigger sync"
3. This creates a sync run that processes all data types from scratch

### Pause an organization

1. Go to `/companies/[companyId]/settings`
2. Toggle "Organization paused"
3. Paused orgs: sync stops, eligibility scanning stops, pending interventions are NOT cancelled
4. Resume by toggling back

### Override a plan limit

1. Go to `/internal/usage`
2. Find the org, click "Override"
3. Enter the new limit and a reason (reason is audit-logged)
4. The override takes effect immediately

### Review a pilot application

1. Go to `/internal/pilots`
2. Find the pending application
3. Click "Approve" or "Reject" with a reason
4. Approved: the org is created with the `pilot` plan tier
5. Rejected: the applicant receives no notification (manual follow-up)

### Approve an intervention

1. Go to `/companies/[companyId]/queue`
2. Find the intervention in "Awaiting approval"
3. Click "Approve" — this dispatches the notification via Whop
4. The intervention state transitions: `awaiting_approval` → `approved` → `notification_accepted`

### Handle a data deletion request

1. Go to `/internal/data-requests`
2. Find the request
3. The system enforces a 24-hour grace period before deletion
4. During grace period, deletion can be cancelled
5. After grace period, all org data is deleted and the org is suspended

## Backup and recovery

- Neon provides automatic point-in-time recovery (PITR) for 7 days on free tier
- For manual backup: `pg_dump` the Neon database
- Webhook receipts are retained for audit (not deleted on org deletion — they're redacted)

## Rate limit management

Rate limits are enforced via Redis sliding windows:
- Default: 60 req/min per IP per route
- If Redis is unavailable, rate limiting degrades open (allows all requests)
- To adjust limits: modify the `rate-limiter.ts` configuration
