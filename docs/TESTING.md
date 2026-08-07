# Testing

RescueLoop uses four layers of testing: unit, integration, contract, and E2E.

## Unit tests (Vitest)

**Config:** `vitest.config.ts`

### What is tested

| Module | File | What it verifies |
|--------|------|-----------------|
| Sync engine | `src/lib/sync/sync-engine.test.ts` | Checkpointed sync, batched processing, status normalization, bounded queries |
| Outbox | `src/lib/outbox/outbox.test.ts` | Event creation, truthful dispatch, dead-letter flow, atomic claiming, backoff |
| Attribution engine | `src/lib/attribution/engine.test.ts` | Three-tier classification, time windows, unattributed handling |
| Student access tokens | `src/lib/crypto/student-access-tokens.test.ts` | Token creation, verification, hash-only storage |
| Deployment safety | `src/lib/deployment-safety.test.ts` | No placeholder credentials, no unsafe fallbacks |
| Usage enforcement | `src/lib/usage/enforcement.test.ts` | Plan limits, atomic reservations, overrides |

### Running

```bash
bun run test
```

## Integration tests (Vitest + PostgreSQL)

**Config:** `vitest.integration.config.ts`
**Setup:** `src/tests/integration/setup.ts`

These tests run against a real PostgreSQL database. They verify database-level invariants that cannot be tested with mocks.

### What is tested

| Spec | File | What it verifies |
|------|------|-----------------|
| Tenant isolation | `tenant-isolation.test.ts` | Cross-tenant data never leaks; org A cannot see org B's data |
| Outbox integrity | `outbox-integrity.test.ts` | Atomic claiming, concurrent dispatch, dead-letter correctness |
| Concurrency | `concurrency.test.ts` | Parallel usage reservations don't exceed limits |
| Sync resilience | `sync-resilience.test.ts` | Mid-run interruption recovery, checkpoint persistence, bounded queries |
| Data lifecycle | `data-lifecycle.test.ts` | Export completeness, deletion, grace period, post-deletion verification |

### Running

```bash
# Requires DATABASE_URL pointing to a test database
bun run test:integration
```

## Contract tests

**File:** `src/tests/contracts/provider-contracts.test.ts`
**Mocked Whop:** `src/tests/contracts/mocked-whop-providers.ts`

Contract tests verify that both the fixture provider and the Whop provider return data conforming to the same shape.

### What is verified

- Each provider method returns the expected type
- Required fields are always present
- Optional fields are correctly typed
- Error cases return the expected structure

### Running

```bash
bun run test
```

## E2E tests (Playwright)

**Config:** `playwright.config.ts`

### What is tested

| Spec | File | What it verifies |
|------|------|-----------------|
| Marketing page | `e2e/marketing.spec.ts` | Landing page loads, hero animates, sections render, CTAs work |
| Private pilot | `e2e/private-pilot.spec.ts` | Application form submits, validation works |
| Connected workspace | `e2e/connected-workspace.spec.ts` | Company routes load, queue renders, student search works |
| Demo workflow | `e2e/demo-workflow.spec.ts` | Demo routes render, mock data is consistent |
| Student experience | `e2e/student-experience.spec.ts` | Student rescue screen, blocker selection, response submission |
| Internal ops | `e2e/internal-ops.spec.ts` | Internal workspace loads, pilot review works |
| Visual regression | `e2e/visual-regression.spec.ts` | Screenshot comparison for key pages |

### Running

```bash
bun run test:e2e
```

## Visual regression

The visual regression spec captures screenshots of key pages and compares them against baselines. If a screenshot differs beyond the threshold, the test fails.

Baselines are stored in `src/tests/e2e/` (Playwright default). Update baselines with:

```bash
bunx playwright test --update-snapshots
```

## CI integration

The CI pipeline runs:
1. ESLint (`bun run lint`)
2. TypeScript type-check (`bun run build` — catches type errors)
3. Unit tests (`bun run test`)
4. Integration tests (with PostgreSQL service container — on CI only)
5. Playwright E2E tests (on CI only, with Vercel preview URL)

## Test data

- **Unit tests:** Use Vitest mocks for database and external APIs
- **Integration tests:** Create and clean up test data in a real PostgreSQL database
- **E2E tests:** Use the fixture provider (demo data) or the connected workspace (real database)
- **Contract tests:** Use mocked Whop SDK responses
