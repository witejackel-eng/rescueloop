# Incident Response

What to do when things break.

## Severity levels

| Level | Definition | Example |
|-------|-----------|---------|
| P1 | Data loss or security breach | Student data exposed cross-tenant |
| P2 | Core workflow blocked | Interventions not dispatching, sync completely down |
| P3 | Degraded functionality | Slow sync, partial delivery failures |
| P4 | Cosmetic or minor | UI rendering issue, non-critical metric delay |

## P1: Data breach or data loss

1. **Immediately** pause the affected organization(s) via `/companies/[id]/settings`
2. Check the audit trail: `/companies/[id]/audit`
3. Check tenant isolation: run `bun run test:integration` (tenant-isolation spec)
4. If cross-tenant data was exposed: notify the affected organizations
5. Document the incident with timestamps, affected orgs, and root cause
6. Deploy fix and verify with integration tests before unpausing

## P2: Interventions not dispatching

### Symptoms
- Outbox backlog growing on `/internal/jobs`
- Interventions stuck in `approved` state

### Diagnosis
1. Check `/internal/jobs` — are events pending or dispatching?
2. Check `/internal/dead-letters` — are events permanently failing?
3. Check Inngest dashboard — is the app receiving events?
4. Check Vercel logs — are API routes returning 503?

### Resolution
- **Inngest not configured:** Check `INNGEST_EVENT_KEY` env var in Vercel
- **Inngest down:** Events stay pending; they'll dispatch when Inngest recovers
- **Permanent failures:** Fix the root cause, then re-queue dead letters from `/internal/dead-letters`
- **Rate limited by Inngest:** Reduce dispatch batch size in `processPendingOutbox()`

## P2: Sync completely down

### Symptoms
- `/internal/sync` shows no recent runs for active orgs
- Student/membership data is stale

### Diagnosis
1. Check Inngest dashboard — is the `process-webhook` function running?
2. Check `/internal/webhooks` — are webhooks being received?
3. Check Whop developer dashboard — is the webhook endpoint healthy?

### Resolution
- **Webhooks not arriving:** Check Whop webhook configuration, verify the endpoint URL
- **Inngest not processing:** Check Inngest app status and event key
- **Database connection issues:** Check Neon dashboard for connection limits
- After fix: trigger manual sync for each affected org from `/companies/[id]/sync`

## P3: Slow sync or partial failures

### Symptoms
- Sync runs taking > 10 minutes
- Some students not appearing after sync

### Diagnosis
1. Check sync execution history on `/internal/sync`
2. Look for `pagesProcessed` count — is it hitting the page limit?
3. Check for `staleSourceRecord` reconciliation outcomes

### Resolution
- Increase page limit for large orgs
- Trigger additional sync runs to process remaining pages
- Check Whop API rate limits in the developer dashboard

## P3: Delivery failures (some interventions not sent)

### Symptoms
- Interventions in `approved` but not `notification_accepted`
- Dead letters with `api-rejected` errors

### Diagnosis
1. Check dead letters for the specific error
2. Check if the org's Whop experience is configured (required for notification delivery)
3. Check if student access tokens are being created

### Resolution
- **Missing experience:** Complete onboarding mapping at `/companies/[id]/onboarding`
- **Auth errors:** Check Whop API key and app permissions
- **Student not found:** The student may have cancelled; sync should handle this

## P4: Stale data in demo views

Demo views (`/overview`, `/rescue-queue`, etc.) use fixture data. They do not refresh from the database. This is by design — real data is in the connected workspace (`/companies/[id]/*`).

If someone reports stale data, confirm they're looking at the correct route.

## Post-incident checklist

- [ ] Root cause documented
- [ ] Fix deployed and verified
- [ ] Integration tests added or updated for the failure mode
- [ ] Affected organizations notified (if P1/P2)
- [ ] Monitoring/alerting updated if the failure was not caught
- [ ] Incident report filed with timeline
