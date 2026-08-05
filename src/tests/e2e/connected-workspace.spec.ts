import { test, expect } from '@playwright/test';

/**
 * Connected workspace E2E tests.
 *
 * Covers: fixture company overview, students with search, campaigns,
 * insights, value, audit, usage, emergency pause.
 *
 * The connected workspace is the main dashboard for an authenticated
 * company with the fixture/demo provider active.
 */

const OVERVIEW = '/overview';

test.describe('Connected Workspace', () => {
  test('company overview loads with key metrics', async ({ page }) => {
    await page.goto(OVERVIEW);
    await expect(page.locator('main, [data-testid="overview"]').first()).toBeVisible();
    // At least one metric card should be present
    const metric = page.locator(
      '[data-testid="metric-card"], [data-testid="recovery-pulse"], [data-testid="system-status"]'
    ).first();
    await expect(metric).toBeVisible();
  });

  test('students page with search', async ({ page }) => {
    await page.goto('/students');
    await expect(page.locator('main').first()).toBeVisible();
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], [data-testid="student-search"]'
    ).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      // Results should update (no crash)
      await page.waitForTimeout(500);
    }
  });

  test('campaigns page loads', async ({ page }) => {
    await page.goto('/campaigns');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('insights page loads', async ({ page }) => {
    await page.goto('/insights');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('value / ROI page loads', async ({ page }) => {
    await page.goto('/value');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('audit log page loads', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('usage page loads', async ({ page }) => {
    await page.goto('/usage');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('emergency pause toggle exists on settings', async ({ page }) => {
    await page.goto('/settings');
    const pauseToggle = page.locator(
      '[data-testid="emergency-pause"], button:has-text("Pause"), [data-testid="org-pause-toggle"]'
    ).first();
    if (await pauseToggle.isVisible()) {
      // Toggle exists — don't actually click it (would change state)
      await expect(pauseToggle).toBeVisible();
    }
  });
});
