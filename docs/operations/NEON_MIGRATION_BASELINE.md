# Neon Database Migration Baseline

## Overview

The RescueLoop production Neon database was originally created with `prisma db push`,
which applies schema changes without recording them in the `_prisma_migrations` table.
The init migration (`20260806000000_init`) was verified only against an **empty** PostgreSQL database.

**Do NOT run `prisma migrate deploy` blindly against the existing Neon database.**

This document describes the safe procedure for baselining the existing database.

---

## 1. Back Up the Existing Database

Before any migration work:

1. **Neon branching**: Create a branch of the production database:
   ```bash
   # Using the Neon CLI
   neon branches create --project-id <project-id> --name pre-migration-baseline
   ```
   This creates an instant, copy-on-write branch with zero data duplication.

2. **Verify the branch**: Confirm the branch is accessible and contains the expected data:
   ```bash
   psql <branch-connection-string> -c "SELECT count(*) FROM _prisma_migrations;"
   # Expected: 0 rows (because db push doesn't record migrations)
   ```

3. **Export a logical backup** (belt-and-suspenders):
   ```bash
   pg_dump <connection-string> > pre_migration_baseline_$(date +%Y%m%d).sql
   ```

---

## 2. Compare Live Schema to prisma/schema.prisma

Run a non-destructive comparison:

```bash
# Introspect the live database schema
bunx prisma db pull --print > /tmp/live-schema.prisma

# Diff against the canonical schema
diff prisma/schema.prisma /tmp/live-schema.prisma
```

**If there is any difference**: STOP. The init migration does not represent the live database.
Document the differences and create a corrective migration before proceeding.

**If they match**: The init migration should be safe to baseline.

---

## 3. Verify the Init Migration Represents the Existing Schema

On a **cloned/staging Neon branch** (never production directly):

1. Create an empty database on the branch:
   ```bash
   neon databases create --branch pre-migration-baseline --name migration_test
   ```

2. Run `prisma migrate deploy` against the empty test database:
   ```bash
   DATABASE_URL=<test-db-url> bunx prisma migrate deploy
   ```

3. Introspect the result and compare to the production schema:
   ```bash
   DATABASE_URL=<test-db-url> bunx prisma db pull --print > /tmp/migration-result.prisma
   diff /tmp/live-schema.prisma /tmp/migration-result.prisma
   ```

4. If identical: the init migration correctly represents the existing schema.

---

## 4. Safe Prisma Baselining Procedure

Once verified on the staging branch:

1. **Mark the migration as already applied** without running DDL:
   ```bash
   # Insert the migration record into _prisma_migrations
   # Prisma provides a baselining approach:
   DATABASE_URL=<production-url> bunx prisma migrate resolve --applied 20260806000000_init
   ```
   This tells Prisma "this migration has already been applied" without executing the SQL.

2. **Verify**:
   ```bash
   DATABASE_URL=<production-url> bunx prisma migrate status
   # Should show: "Database schema is up to date!"
   ```

3. **Future migrations**: All subsequent schema changes must use `prisma migrate dev` to create migration files, and `prisma migrate deploy` to apply them in production.

---

## 5. Schema Drift Detection

### Non-destructive drift check (run in CI or on schedule)

```bash
# 1. Introspect live schema
bunx prisma db pull --print > /tmp/live-schema.prisma

# 2. Diff against canonical
if ! diff -q prisma/schema.prisma /tmp/live-schema.prisma > /dev/null 2>&1; then
  echo "::error::Schema drift detected! Live database schema does not match prisma/schema.prisma"
  exit 1
fi

echo "No schema drift detected."
```

### CI migration-drift gate

Already implemented in the CI workflow: `prisma migrate deploy` runs against a fresh empty PostgreSQL database. If migrations fail to apply cleanly, the CI job fails.

---

## 6. Rollback Steps

If the baselining causes problems:

1. **Revert to the pre-migration branch**:
   ```bash
   neon branches promote --project-id <project-id> pre-migration-baseline
   ```

2. **Or restore from logical backup**:
   ```bash
   psql <connection-string> < pre_migration_baseline_YYYYMMDD.sql
   ```

3. **Remove the _prisma_migrations record** (if partially applied):
   ```sql
   DELETE FROM _prisma_migrations WHERE migration_name = '20260806000000_init';
   ```

---

## 7. Stop Conditions

**STOP and do not proceed if:**

- The live schema and `schema.prisma` differ in any way
- `prisma migrate deploy` fails on the empty test database
- The introspected migration result doesn't match the live schema
- There are pending data migrations that aren't covered by the init migration
- The Neon branch backup fails or is inaccessible
- Any `prisma migrate reset` or `--accept-data-loss` flag appears in any command

---

## 8. Prohibited Commands

The following commands must NEVER be run against the production Neon database:

| Command | Reason |
|---------|--------|
| `prisma migrate reset` | Drops all data and recreates from scratch |
| `prisma db push --accept-data-loss` | Applies schema without migration records; may drop columns/tables |
| `prisma migrate dev` | Interactive; creates AND applies migrations; not for production |

Only these commands are safe for production:

| Command | Purpose |
|---------|---------|
| `prisma migrate deploy` | Apply pending migrations (non-destructive, no interactive prompts) |
| `prisma migrate resolve --applied` | Mark a migration as already applied (baselining) |
| `prisma migrate status` | Check migration state |

---

## 9. Validation on Staging Before Production

Before touching the production database:

1. Perform ALL steps above on a **cloned Neon branch** first
2. Run the full test suite against the branched database
3. Have at least one other team member review the migration plan
4. Confirm the rollback procedure works on the branch
5. Document the exact timestamp and person responsible for the production change

---

## Owner Action Required

**Before touching the existing Neon production database**, the owner must:

1. Create a Neon branch backup of the production database
2. Run the schema comparison procedure (Section 2)
3. Verify the init migration on a staging branch (Section 3)
4. Confirm the baselining procedure with a team member
5. Execute the baselining during a low-traffic window
6. Verify `prisma migrate status` shows "up to date" after baselining
