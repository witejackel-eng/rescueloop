import { test, expect } from '@playwright/test';

/**
 * Demo workflow E2E tests.
 *
 * In fixture mode, the dashboard renders with demo data.
 * We verify pages load by checking HTTP status and visible body.
 */

test.describe('Demo Workflow', () => {
  test('overview page loads', async ({ page }) => {
    const response = await page.goto('/overview');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });

  test('rescue-queue page loads', async ({ page }) => {
    const response = await page.goto('/rescue-queue');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });

  test('students page loads', async ({ page }) => {
    const response = await page.goto('/students');
    expect(response?.status()).toBe(200);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
  });
});
