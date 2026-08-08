# Release Checklist

> Step-by-step checklist for releasing RescueLoop v1 to production.

---

## Pre-Release

### WP Ledger Truthful

- [ ] **WP00–WP09**: Every entry in `RESCUELOOP_EXECUTION_LEDGER.md` has correct status, commit SHA, files changed, and acceptance gates
- [ ] No entry claims COMPLETE without passing test evidence
- [ ] No entry has placeholder or TBD values

### Integration CI Green

- [ ] `bun run lint` — 0 errors
- [ ] `bun run typecheck` — 0 errors
- [ ] `bun vitest run` — all unit tests pass
- [ ] `bun vitest run --config vitest.integration.config.ts` — all integration tests pass
- [ ] Contract tests pass (`src/tests/contracts/`)
- [ ] E2E tests pass (requires deployed preview + PostgreSQL)
- [ ] `bun audit` — 0 critical/high direct vulnerabilities
- [ ] No `as any` in production source code

### Preview Deployment READY

- [ ] Vercel preview deployment from `integration/rescueloop-v1` is in READY state
- [ ] Preview URL loads marketing homepage
- [ ] Preview URL loads `/legal/privacy`
- [ ] No build warnings that indicate runtime issues

### Database Rehearsal Complete

- [ ] `scripts/migration-rehearsal.sh` passes against a clean test database
- [ ] `scripts/migration-rehearsal.sh` passes against a staging database (with existing data)
- [ ] No schema drift detected
- [ ] No destructive migration SQL (DROP CASCADE, TRUNCATE)

### Controlled Pilot Smoke Test

- [ ] One pilot creator can complete the onboarding flow
- [ ] Rescue queue populates with real candidates after first sync
- [ ] A draft intervention can be reviewed and approved
- [ ] The student receives the intervention message
- [ ] Student response is recorded and attributed
- [ ] Pause/resume works correctly
- [ ] Data export produces a valid JSON file
- [ ] Data deletion request enters grace period

### Owner-Approved Notification and Billing Tests

- [ ] Notification delivery test: owner confirms message received by test student
- [ ] Notification content test: owner confirms message matches approved draft (no unwanted edits)
- [ ] Billing endpoint test: owner confirms entitlement check returns correct plan status
- [ ] Billing checkout test: owner confirms upgrade flow reaches Whop checkout
- [ ] Billing enforcement test: owner confirms plan limits are enforced (not exceeded by 1)

---

## Merge

### Branch: `integration/rescueloop-v1` → `main`

- [ ] All pre-release items are checked above
- [ ] `integration/rescueloop-v1` is up to date with `main` (no merge conflicts)
- [ ] Create a PR: `integration/rescueloop-v1` → `main`
- [ ] PR title: `Release RescueLoop v1`
- [ ] PR description includes: WP summary, test counts, pilot smoke test results
- [ ] PR is reviewed and approved by at least one other person
- [ ] **Normal merge only** — no squash, no rebase, no force push
- [ ] Merge commit is created on `main`

### Prohibited merge actions

- **NEVER** `git push --force`
- **NEVER** `git merge --squash` to `main` (loses per-WP commit history)
- **NEVER** skip PR review for the release merge

---

## Post-Release

### Verify Commit

- [ ] Merge commit SHA is recorded
- [ ] `git log --oneline -1 main` shows the merge commit

### Verify Public/Auth Routes

- [ ] `/` — marketing homepage loads with hero, nav, footer
- [ ] `/legal/privacy` — privacy page loads
- [ ] `/legal/terms` — terms page loads
- [ ] `/legal/security` — security page loads
- [ ] `/legal/data-processing` — data processing page loads
- [ ] `/dashboard/[companyId]` — auth-gated dashboard redirects unauthenticated users
- [ ] `/dashboard/[companyId]/onboarding` — onboarding wizard loads for authenticated admin
- [ ] `/student-rescue` — student-facing page loads

### Verify Webhook Endpoint

- [ ] `GET /api/webhooks/whop` — health check returns 200
- [ ] `POST /api/webhooks/whop` — with valid Whop signature → processed
- [ ] `POST /api/webhooks/whop` — with invalid signature → rejected (401/403)

### Verify Billing Endpoint

- [ ] `GET /api/dashboard/[companyId]/billing` — returns current plan and usage
- [ ] `POST /api/dashboard/[companyId]/billing/checkout` — creates Whop checkout session

### One Controlled Provider Workflow

- [ ] Install → onboarding → first sync → candidate detected → message reviewed → approved → delivered → response tracked
- [ ] All steps complete without errors in Sentry
- [ ] Attribution is recorded for the intervention → response → resumed path

### Runtime Logs

- [ ] No unexpected errors in Vercel function logs (first 30 minutes)
- [ ] No unhandled promise rejections
- [ ] No database connection pool exhaustion warnings
- [ ] Webhook processing logs show successful receipts

### Sentry/PostHog Environment

- [ ] Sentry DSN is configured and receiving events (test by triggering a known non-fatal error)
- [ ] Sentry environment is set to `production` (not `development` or `preview`)
- [ ] Sentry release is set to the merge commit SHA
- [ ] PostHog is capturing allowlisted onboarding events
- [ ] PostHog is NOT capturing any event with PII in metadata (verify with PostHog dashboard)
- [ ] PostHog environment matches the deployment environment

---

## Rollback Preparation

- [ ] Previous Vercel deployment SHA is recorded
- [ ] Database backup is verified (Neon branch or pg_dump)
- [ ] `docs/implementation/ROLLBACK_PLAN.md` is reviewed and accessible
- [ ] At least one team member is available for the first 2 hours post-release

---

## Release Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Engineering lead | | | |
| Product owner | | | |
| Pilot creator (external) | | | |

Release is complete when all post-release checks pass and sign-off is recorded.
