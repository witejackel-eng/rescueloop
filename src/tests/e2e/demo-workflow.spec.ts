import { test, expect } from '@playwright/test';

/**
 * Demo workflow E2E tests.
 *
 * Covers: overview page loads, rescue-queue page loads, students page loads.
 *
 * In fixture mode, the dashboard renders with demo data.
 * We verify pages load without crashing — detailed UI interactions
 * are better tested with component-level tests or visual regression.
 */

test.describe('Demo Workflow', () => {
  test('overview page loads', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  test('rescue-queue page loads', async ({ page }) => {
    await page.goto('/rescue-queue');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  test('students page loads', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });
});
