import { test, expect } from '@playwright/test';

/**
 * Demo workflow E2E tests.
 *
 * In fixture mode, the dashboard renders with demo data.
 * We verify pages load by checking for the workspace shell.
 */

test.describe('Demo Workflow', () => {
  test('overview page loads', async ({ page }) => {
    await page.goto('/overview');
    const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(desktopNav.or(mobileNav)).toBeVisible({ timeout: 15_000 });
  });

  test('rescue-queue page loads', async ({ page }) => {
    await page.goto('/rescue-queue');
    const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(desktopNav.or(mobileNav)).toBeVisible({ timeout: 15_000 });
  });

  test('students page loads', async ({ page }) => {
    await page.goto('/students');
    const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(desktopNav.or(mobileNav)).toBeVisible({ timeout: 15_000 });
  });
});
