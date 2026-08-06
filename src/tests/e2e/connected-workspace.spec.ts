import { test, expect } from '@playwright/test';

/**
 * Connected workspace E2E tests.
 *
 * These routes are under (dashboard) which uses WorkspaceShell.
 * We verify pages load by checking for visible body content
 * and that the URL is correct (no redirect to error page).
 */

test.describe('Connected Workspace', () => {
  test('company overview loads', async ({ page }) => {
    const response = await page.goto('/overview');
    expect(response?.status()).toBe(200);
    // Check that the page rendered content (not a blank/error page)
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
    // Check that the page has some text content (the overview page has "Recovery Pulse")
    const content = page.locator('text=Recovery Pulse').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });

  test('students page loads', async ({ page }) => {
    const response = await page.goto('/students');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });

  test('campaigns page loads', async ({ page }) => {
    const response = await page.goto('/campaigns');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });

  test('insights page loads', async ({ page }) => {
    const response = await page.goto('/insights');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });

  test('value / ROI page loads', async ({ page }) => {
    const response = await page.goto('/value');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });

  test('settings page loads', async ({ page }) => {
    const response = await page.goto('/settings');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });
});
