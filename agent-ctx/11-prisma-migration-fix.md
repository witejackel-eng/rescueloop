# Task 11: Fix Prisma Migration Drift

## Agent: prisma-migration-fix

## Summary
Fixed the Prisma migration drift caused by the schema being set to `sqlite` while the migrations and production target use PostgreSQL.

## Changes Made

### 1. Schema Provider → PostgreSQL
- `prisma/schema.prisma`: Changed `provider = "sqlite"` to `provider = "postgresql"`
- Added `directUrl = env("DIRECT_URL")` for Neon direct connections

### 2. @db.Timestamptz() Annotations
- Added `@db.Timestamptz()` to all 134 DateTime fields in the schema
- This matches the `TIMESTAMP WITH TIME ZONE` column type used in the initial migration SQL

### 3. New Migration: 20260807000000_add_onboarding_progress
- Adds the `onboarding_progress` table (only model missing from initial migration)
- Purely additive — no modifications to existing tables
- PostgreSQL syntax with proper TIMESTAMP WITH TIME ZONE and foreign key

### 4. .env Updated
- DATABASE_URL and DIRECT_URL set to PostgreSQL connection strings
- `prisma generate` verified working

## Verification
- `prisma generate` succeeded (Prisma Client v6.19.3)
- All 134 DateTime fields have @db.Timestamptz()
- migration_lock.toml already correctly declares provider = "postgresql"
- Only 1 model (OnboardingProgress) was missing from the initial migration
