# Visual Regression Ledger Item

## Status: DEFERRED (explicit ledger entry)

## Owner: WP-00 executor

## Acceptance Criteria
1. Playwright visual regression tests must be re-enabled with `toHaveScreenshot()`
2. Committed Linux baseline images must exist in `src/tests/e2e/__snapshots__/`
3. Baselines must be generated on the exact CI runner image (ubuntu-latest)
4. Visual tests must pass on CI without updating baselines (no `--update-snapshots` in CI)
5. Any intentional visual change must update baselines via a separate commit

## Rationale
Visual regression baselines are OS-specific. The CI runs on Ubuntu Linux, while
development may occur on macOS/Windows. Committing baselines generated on a
different OS causes CI failures. This ledger item tracks the debt of not having
committed Linux baselines.

## Remediation Plan
1. Generate baselines on the CI runner image using `playwright test --update-snapshots`
2. Download the updated snapshots artifact from the CI run
3. Commit the Linux baselines to the repository
4. Re-enable `toMatchSnapshot()` / `toHaveScreenshot()` assertions in E2E tests
5. Verify CI passes with the committed baselines

## Created: 2025-08-06 (WP-00 remediation commit 3)
