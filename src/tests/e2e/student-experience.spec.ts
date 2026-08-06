import { test, expect } from '@playwright/test';

/**
 * Student experience E2E tests.
 *
 * The student-rescue page requires a valid token in the URL.
 * Without a real backend, we verify the page loads without crashing.
 */

const VALID_TOKEN = 'fixture-student-token-abc123';
const EXPIRED_TOKEN = 'expired-token-xxx';

test.describe('Student Experience', () => {
  test('student-rescue page loads with token', async ({ page }) => {
    await page.goto(`/student-rescue?token=${VALID_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    // The page should render (either the rescue experience or an error state)
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });
  });

  test('student-rescue page loads with expired token', async ({ page }) => {
    await page.goto(`/student-rescue?token=${EXPIRED_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    // The page should render (either the rescue experience or an error state)
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });
  });
});
