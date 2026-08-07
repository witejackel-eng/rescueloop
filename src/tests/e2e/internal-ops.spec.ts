import { test, expect } from '@playwright/test';

/**
 * Internal ops E2E tests.
 *
 * The /internal/* routes use a client-side InternalAuthGate that:
 * - Renders a login form (Card with "Internal Operations" title) when unauthenticated
 * - The page returns HTTP 200 (Next.js renders the client component)
 * - Auth is handled client-side via sessionStorage + fetch to /api/internal/auth
 *
 * The correct E2E assertion is: unauthenticated → login form visible (200).
 * Authenticated → dashboard content visible, workspace shell present.
 */

const INTERNAL_API_KEY = process.env.RESCUELOOP_INTERNAL_TOKEN ?? 'ci-fixture-internal-token-padding-32';

test.describe('Internal Ops', () => {
  test('unauthenticated request to /internal shows login gate', async ({ page }) => {
    const response = await page.goto('/internal');
    // Next.js returns 200; the client-side auth gate shows the login form
    expect(response?.status()).toBe(200);
    // The auth gate renders a Card with "Internal Operations" title
    const authGate = page.locator('text=Internal Operations').first();
    await expect(authGate).toBeVisible({ timeout: 10_000 });
  });

  test('authenticated request loads internal dashboard', async ({ page }) => {
    // Pre-set the sessionStorage token so the auth gate lets us through
    await page.goto('/internal');
    await page.evaluate((token) => {
      sessionStorage.setItem('rl_internal_token', token);
    }, INTERNAL_API_KEY);
    // Reload so the auth gate reads the token
    await page.reload();
    // The internal dashboard should be visible (main content area)
    const dashboard = page.locator('main').first();
    await expect(dashboard).toBeVisible({ timeout: 15_000 });
  });

  test('pilot review page loads', async ({ page }) => {
    await page.goto('/internal');
    await page.evaluate((token) => {
      sessionStorage.setItem('rl_internal_token', token);
    }, INTERNAL_API_KEY);
    await page.goto('/internal/pilots');
    const content = page.locator('main').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });

  test('job retry page loads', async ({ page }) => {
    await page.goto('/internal');
    await page.evaluate((token) => {
      sessionStorage.setItem('rl_internal_token', token);
    }, INTERNAL_API_KEY);
    await page.goto('/internal/jobs');
    const content = page.locator('main').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});
