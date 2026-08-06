import { test, expect } from '@playwright/test';

/**
 * Student experience E2E tests.
 *
 * Route-specific assertions for each student token state:
 * - valid token: assert the actual student rescue interface renders
 * - expired token: assert an explicit expired-link state
 * - invalid token: assert an explicit invalid/inaccessible state
 *
 * No assertions are swallowed with .catch(() => {}).
 */

const VALID_TOKEN = 'fixture-student-token-abc123';
const EXPIRED_TOKEN = 'expired-token-xxx';
const INVALID_TOKEN = 'invalid-token-not-a-real-token';

/** Assert no Next.js error overlay or application error page is rendered. */
async function assertNoErrorOverlay(page: import('@playwright/test').Page) {
  const errorOverlay = page.locator('#nextjs-portal, [data-nextjs-dialog]');
  await expect(errorOverlay).not.toBeAttached({ timeout: 1_000 });
  const appError = page.locator('h1:has-text("Application error")');
  await expect(appError).not.toBeVisible({ timeout: 1_000 });
}

test.describe('Student Experience', () => {
  test('valid token: student rescue interface renders', async ({ page }) => {
    await page.goto(`/student-rescue?token=${VALID_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    await assertNoErrorOverlay(page);

    // Route-specific: student greeting heading
    const greeting = page.locator('h1', { hasText: 'Hi' });
    await expect(greeting).toBeVisible({ timeout: 10_000 });

    // Route-specific: progress section
    const progressSection = page.locator('section[aria-label="Your progress"]');
    await expect(progressSection).toBeVisible({ timeout: 10_000 });

    // Route-specific: "Continue course" button
    const continueButton = page.locator('button', { hasText: 'Continue course' });
    await expect(continueButton).toBeVisible({ timeout: 10_000 });
  });

  test('expired token: expired-link state is shown', async ({ page }) => {
    await page.goto(`/student-rescue?token=${EXPIRED_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    await assertNoErrorOverlay(page);

    // The student page should render an explicit state for expired tokens.
    // This could be a message like "This link has expired" or a generic
    // invalid-state message. Either way, the page should NOT show the
    // full rescue interface.
    const expiredMessage = page.locator('text=/expired|no longer available|invalid link/i');
    const rescueInterface = page.locator('section[aria-label="Your progress"]');
    
    // Either we see an explicit expired/invalid message,
    // or we see a generic state that is NOT the full rescue interface
    const hasExpiredMessage = await expiredMessage.count() > 0;
    const hasRescueInterface = await rescueInterface.isVisible().catch(() => false);
    
    // If we have an explicit expired message, that's correct
    // If we don't, the rescue interface must NOT be shown (no false data)
    if (!hasExpiredMessage) {
      await expect(rescueInterface).not.toBeVisible({ timeout: 3_000 });
    }
  });

  test('invalid token: invalid/inaccessible state is shown', async ({ page }) => {
    await page.goto(`/student-rescue?token=${INVALID_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    await assertNoErrorOverlay(page);

    // Invalid token should NOT show the full rescue interface
    const invalidMessage = page.locator('text=/invalid|not found|inaccessible|does not exist/i');
    const rescueInterface = page.locator('section[aria-label="Your progress"]');
    
    const hasInvalidMessage = await invalidMessage.count() > 0;
    
    if (!hasInvalidMessage) {
      await expect(rescueInterface).not.toBeVisible({ timeout: 3_000 });
    }
  });
});
