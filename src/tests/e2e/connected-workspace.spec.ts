import { test, expect } from '@playwright/test';

/**
 * Connected workspace E2E tests.
 *
 * These routes are under (dashboard) which uses WorkspaceShell.
 * WorkspaceShell renders content inside a div, not a <main> element.
 * We verify pages load by checking for the workspace shell's
 * desktop sidebar nav or mobile bottom tab bar.
 */

test.describe('Connected Workspace', () => {
  test('company overview loads', async ({ page }) => {
    await page.goto('/overview');
    // WorkspaceShell renders nav[aria-label="Workspace navigation"] on desktop
    // and nav[aria-label="Mobile navigation"] on mobile
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

  test('campaigns page loads', async ({ page }) => {
    await page.goto('/campaigns');
    const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(desktopNav.or(mobileNav)).toBeVisible({ timeout: 15_000 });
  });

  test('insights page loads', async ({ page }) => {
    await page.goto('/insights');
    const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(desktopNav.or(mobileNav)).toBeVisible({ timeout: 15_000 });
  });

  test('value / ROI page loads', async ({ page }) => {
    await page.goto('/value');
    const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(desktopNav.or(mobileNav)).toBeVisible({ timeout: 15_000 });
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(desktopNav.or(mobileNav)).toBeVisible({ timeout: 15_000 });
  });
});
