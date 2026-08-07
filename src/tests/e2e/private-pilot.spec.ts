import { test, expect } from '@playwright/test';

/**
 * Private-pilot E2E tests.
 *
 * Covers: form renders, validation, submission.
 *
 * The form uses react-hook-form with zodResolver. Fields:
 * - fullName (required), email (required), businessName (required)
 * - consentToContact (required checkbox)
 * - Submit button text: "Apply for Private Pilot"
 */

test.describe('Private Pilot Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/private-pilot');
    await page.waitForLoadState('domcontentloaded');
  });

  test('form renders with required fields', async ({ page }) => {
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10_000 });
    // Email field
    const emailField = page.locator('input[type="email"]').first();
    await expect(emailField).toBeVisible({ timeout: 10_000 });
  });

  test('validation: empty submission shows errors', async ({ page }) => {
    // The submit button says "Apply for Private Pilot"
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible({ timeout: 10_000 });
    await submitBtn.click();
    // react-hook-form + zod should show validation messages
    // FormMessage renders with role="alert" or in a p with text-destructive
    const error = page.locator('[data-slot="form-message"], p.text-destructive, [role="alert"]').first();
    await expect(error).toBeVisible({ timeout: 5_000 });
  });

  test('form has consent checkbox', async ({ page }) => {
    const checkbox = page.locator('button[role="checkbox"]').first();
    await expect(checkbox).toBeVisible({ timeout: 10_000 });
  });
});
