import { test, expect } from '@playwright/test';

/**
 * Connected workspace E2E tests.
 *
 * Each dashboard route asserts:
 * 1. A route-specific element is visible (heading, data-testid, or ARIA)
 * 2. The workspace shell navigation is present after hydration
 * 3. No Next.js error overlay or application error page is rendered
 *
 * This goes beyond HTTP 200 + visible <body> to verify actual application behaviour.
 */

/** Assert the workspace shell navigation is in the DOM after hydration. */
async function assertWorkspaceShell(page: import('@playwright/test').Page) {
  // The workspace shell renders both desktop and mobile nav in the DOM.
  // Desktop: <nav aria-label="Workspace navigation"> (hidden on mobile via CSS)
  // Mobile: <nav aria-label="Mobile navigation"> (hidden on desktop via CSS)
  // Both are always attached; we verify the desktop nav is attached.
  const desktopNav = page.locator('nav[aria-label="Workspace navigation"]');
  await expect(desktopNav).toBeAttached({ timeout: 15_000 });
}

/** Assert no Next.js error overlay or application error page is rendered. */
async function assertNoErrorOverlay(page: import('@playwright/test').Page) {
  // Next.js error overlay: #__next-route-announcer or nextjs-portal
  const errorOverlay = page.locator('#nextjs-portal, [data-nextjs-dialog]');
  await expect(errorOverlay).not.toBeAttached({ timeout: 1_000 });
  // Application error boundary: renders <h1> with "Application error"
  const appError = page.locator('h1:has-text("Application error")');
  await expect(appError).not.toBeVisible({ timeout: 1_000 });
}

test.describe('Connected Workspace', () => {
  test('overview: Recovery Pulse heading and period selector', async ({ page }) => {
    await page.goto('/overview');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    // Route-specific: "Recovery Pulse" heading
    const heading = page.locator('h1', { hasText: 'Recovery Pulse' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Route-specific: period selector tablist
    const periodSelector = page.locator('[role="tablist"][aria-label="Reporting period"]');
    await expect(periodSelector).toBeVisible({ timeout: 10_000 });
  });

  test('students: heading and search field', async ({ page }) => {
    await page.goto('/students');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    // Route-specific: "Students" heading
    const heading = page.locator('h1', { hasText: 'Students' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Route-specific: search input
    const searchInput = page.locator('input[aria-label="Search students"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test('campaigns: Campaign Studio heading', async ({ page }) => {
    await page.goto('/campaigns');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    // Route-specific: "Campaign Studio" heading
    const heading = page.locator('h1', { hasText: 'Campaign Studio' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('insights: Course Intelligence heading', async ({ page }) => {
    await page.goto('/insights');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    // Route-specific: "Course Intelligence" heading
    const heading = page.locator('h1', { hasText: 'Course Intelligence' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('value: Value Ledger heading', async ({ page }) => {
    await page.goto('/value');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    // Route-specific: "Value Ledger" heading
    const heading = page.locator('h1', { hasText: 'Value Ledger' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('settings: Settings heading', async ({ page }) => {
    await page.goto('/settings');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    // Route-specific: "Settings" heading
    const heading = page.locator('h1', { hasText: 'Settings' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('rescue-queue: heading and search field', async ({ page }) => {
    await page.goto('/rescue-queue');
    await assertWorkspaceShell(page);
    await assertNoErrorOverlay(page);

    // Route-specific: "Rescue Queue" heading
    const heading = page.locator('h1', { hasText: 'Rescue Queue' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Route-specific: search input
    const searchInput = page.locator('input[aria-label="Search students"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });
});
