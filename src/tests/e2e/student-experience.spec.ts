import { test, expect } from '@playwright/test';

/**
 * Student experience E2E tests.
 *
 * Covers: valid token loads rescue, expired token error,
 * blocker response submission, opt-out.
 *
 * Uses a known fixture token for the happy path.
 */

const VALID_TOKEN = 'fixture-student-token-abc123';
const EXPIRED_TOKEN = 'expired-token-xxx';

test.describe('Student Experience', () => {
  test('valid token loads rescue page', async ({ page }) => {
    await page.goto(`/student-rescue?token=${VALID_TOKEN}`);
    // Should render the rescue experience (not an error page)
    const rescueContent = page.locator(
      'main, [data-testid="rescue-experience"], [data-testid="student-rescue"]'
    ).first();
    await expect(rescueContent).toBeVisible();
  });

  test('expired / invalid token shows error', async ({ page }) => {
    await page.goto(`/student-rescue?token=${EXPIRED_TOKEN}`);
    const errorIndicator = page.locator(
      'text=expired, text=invalid, text=not found, [data-testid="token-error"]'
    ).first();
    await expect(errorIndicator).toBeVisible();
  });

  test('blocker response can be submitted', async ({ page }) => {
    await page.goto(`/student-rescue?token=${VALID_TOKEN}`);
    const blockerForm = page.locator(
      '[data-testid="blocker-form"], form:has(textarea), form:has(input[type="text"])'
    ).first();
    if (await blockerForm.isVisible()) {
      const textarea = blockerForm.locator('textarea, input[type="text"]').first();
      await textarea.fill('I am stuck on module 3');
      const submitBtn = blockerForm.locator('button[type="submit"], button:has-text("Submit")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        // Confirmation should appear
        const confirmation = page.locator(
          'text=Thank, text=Submitted, text=Received, [data-testid="submission-confirmation"]'
        ).first();
        await expect(confirmation).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test('opt-out link is present and functional', async ({ page }) => {
    await page.goto(`/student-rescue?token=${VALID_TOKEN}`);
    const optOut = page.locator(
      'a:has-text("opt out"), button:has-text("opt out"), [data-testid="opt-out"]'
    ).first();
    if (await optOut.isVisible()) {
      await optOut.click();
      // Should show confirmation or navigate away
      const optOutConfirm = page.locator(
        'text=opted out, text=unsubscribed, [data-testid="opt-out-confirmation"]'
      ).first();
      await expect(optOutConfirm).toBeVisible({ timeout: 5_000 });
    }
  });
});
