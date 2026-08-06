import { test, expect } from '@playwright/test';

/**
 * Connected workspace E2E tests.
 *
 * Covers: fixture company overview, students, campaigns, insights,
 * value, audit, usage, settings.
 *
 * These routes are under (dashboard) which uses WorkspaceShell.
 * In fixture mode, the dashboard renders with demo data.
 */

test.describe('Connected Workspace', () => {
  test('company overview loads', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForLoadState('domcontentloaded');
    // The dashboard layout renders a main element
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  test('students page loads', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  test('campaigns page loads', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  test('insights page loads', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  test('value / ROI page loads', async ({ page }) => {
    await page.goto('/value');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 15_000 });
  });
});
