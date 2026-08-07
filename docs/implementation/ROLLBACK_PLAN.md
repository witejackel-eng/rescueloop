# Rollback Plan

> How to roll back RescueLoop if a deployment introduces a critical issue.

---

## Principles

1. **Rollback is always possible.** Every deployment preserves the previous state.
2. **Rollback is not instant.** Database migrations may need reversal steps.
3. **Rollback is a coordinated action.** Code, database, and infrastructure must be in sync.
4. **Never blind-reverse a migration.** Data changes may have occurred between deploy and rollback.

---

## 1. Code Rollback

### Method: Revert to previous commit SHA

```bash
# 1. Identify the commit that was working
git log --oneline -10

# 2. Create a rollback branch (never force-push to main)
git checkout -b rollback/YYYY-MM-DD-short-description main
git revert <problem-commit-sha>

# 3. Push the rollback branch
git push origin rollback/YYYY-MM-DD-short-description

# 4. Merge via PR (normal merge, no force push)
#    This creates a revert commit on main.
```

### Alternative: Cherry-pick specific fixes

If the problem is isolated to specific files:

```bash
git checkout -b hotfix/YYYY-MM-DD-description main
git cherry-pick <fix-commit-sha>
git push origin hotfix/YYYY-MM-DD-description
```

### Prohibited actions

- **NEVER** `git push --force` to `main` or `integration/rescueloop-v1`
- **NEVER** `git reset --hard` on shared branches
- Always use merge commits for rollbacks (preserves history)

---

## 2. Database Rollback

### Method: Follow migration recovery plan

Database rollback is the most delicate part. Migrations are forward-only by design.

### Step 1: Assess the migration

```bash
# Check migration status on the production database
DATABASE_URL="<production_url>" npx prisma migrate status
```

### Step 2: Determine the rollback strategy

| Scenario | Strategy |
|----------|----------|
| Migration added new tables/columns only | Safe to mark as rolled back; data in new columns is lost but no existing data is affected |
| Migration added constraints/indexes | May need to drop constraints first, then mark migration as rolled back |
| Migration altered column types | **High risk.** Requires a compensating migration. Do NOT blindly reverse. |
| Migration dropped data | **Data loss already occurred.** Restore from backup (Neon branching or pg_dump). |

### Step 3: Create a compensating migration (if needed)

```bash
# Generate a new migration that reverses the problematic change
# This is an ADDITIVE migration — it adds back what was removed
npx prisma migrate dev --name rollback_YYYYMMDD_description
```

### Step 4: Deploy the compensating migration

```bash
DATABASE_URL="<production_url>" npx prisma migrate deploy
```

### Prohibited actions

- **NEVER** `prisma migrate reset` — this drops all data
- **NEVER** `prisma db push --accept-data-loss` — this can silently destroy data
- **NEVER** manually edit `_prisma_migrations` table without a documented reason
- **NEVER** reverse a migration SQL file — always create a NEW forward migration

### Backup recovery (last resort)

If data was lost and no compensating migration can restore it:

1. Identify the Neon branch or pg_dump backup from before the migration
2. Create a new Neon branch from the backup point
3. Verify data integrity on the branch
4. Coordinate with the team: switching the production database to the branch requires Vercel env var update

---

## 3. Vercel Rollback

### Method: Promote previous deployment

Vercel preserves every deployment. The previous READY deployment can be promoted to production.

### Step 1: Identify the previous READY deployment

```bash
# Using Vercel CLI
npx vercel ls --prod

# Or via Vercel dashboard:
# Project → Deployments → filter by "Production" → find previous READY
```

### Step 2: Promote the previous deployment

```bash
# Via Vercel CLI
npx vercel --prod --yes <previous-deployment-url>

# Or via Vercel dashboard:
# Deployments → click the previous READY deployment → "..." → "Promote to Production"
```

### Step 3: Verify routes after promotion

Check these routes immediately after rollback:

| Route | Expected behavior |
|-------|-------------------|
| `/` (marketing) | Loads with hero, nav, CTA |
| `/dashboard/[companyId]` | Auth-gated dashboard loads |
| `/dashboard/[companyId]/rescue-queue` | Queue loads with students |
| `/api/webhooks/whop` | Returns 200 (health check) |
| `/legal/privacy` | Privacy page loads |
| `/api/dashboard/[companyId]/billing` | Billing endpoint responds |

### Step 4: Verify webhooks

After rollback, webhook delivery from Whop continues automatically. Verify:

1. Whop webhook URL still points to the correct endpoint
2. Recent webhook deliveries succeeded (check Whop dashboard → Webhooks)
3. No webhook receipts are stuck in `pending` state in the database

---

## 4. Rollback Decision Matrix

| Issue severity | Rollback scope | Time window | Approval |
|----------------|---------------|-------------|----------|
| Data loss or corruption | Full (code + DB + Vercel) | < 15 min | Any team member |
| Broken auth or security | Full (code + Vercel) | < 15 min | Any team member |
| Broken core feature (queue, interventions) | Code + Vercel | < 30 min | Any team member |
| Broken non-core feature (analytics, insights) | Code + Vercel | < 1 hour | Lead approval |
| Performance degradation | Code + Vercel | < 2 hours | Lead approval |
| Visual/CSS regression | Code only | < 4 hours | Next deploy cycle |
| Minor bug with workaround | Next deploy cycle | — | PR review |

---

## 5. Post-Rollback Checklist

- [ ] Previous deployment is promoted and serving traffic
- [ ] All critical routes return expected responses
- [ ] Webhook endpoint is receiving and processing events
- [ ] No new errors in Sentry above baseline
- [ ] Database migration status is consistent
- [ ] Incident is documented in `docs/INCIDENT_RESPONSE.md`
- [ ] Root cause analysis is scheduled
- [ ] Fix is developed on a branch (not directly on main)
