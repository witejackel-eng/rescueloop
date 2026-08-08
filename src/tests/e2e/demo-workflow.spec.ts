import { test, expect } from '@playwright/test';

/**
 * Demo workflow E2E tests.
 *
 * In fixture mode, the dashboard renders with demo data.
 * Each test asserts route-specific elements and workspace shell —
 * not merely HTTP 200 + visible body.
 */

/** Assert the workspace shell navigation is in the DOM after hydration. */
async function assertWorkspaceShell(page: import('@playwright/test').Page) {
  const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
  await expect(desktopNav).toBeAttached({ timeout: 15_000 });
}

/** Assert no Next.js error overlay or application error page is rendered. */
async function assertNoErrorOverlay(page: import('@playwright/test').Page) {
  const errorOverlay = page.locator('#nextjs-portal, [data-nextjs-dialog]');
  await expect(errorOverlay).not.toBeAttached({ timeout: 1_000 });
  const appError = page.locator('h1:has-text("Application error")');
  await expect(appError).not.toBeVisible({ timeout: 1_000 });
}

test.describe('Demo Workflow', () => {
  test('overview page: Recovery Pulse heading', async ({ page }) => {
    await page.goto('/overview');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    const heading = page.locator('h1', { hasText: 'Recovery Pulse' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('rescue-queue page: Rescue Queue heading', async ({ page }) => {
    await page.goto('/rescue-queue');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    const heading = page.locator('h1', { hasText: 'Rescue Queue' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('students page: Students heading', async ({ page }) => {
    await page.goto('/students');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    const heading = page.locator('h1', { hasText: 'Students' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });
});
