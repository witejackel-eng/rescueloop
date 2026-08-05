import { test, expect } from '@playwright/test';

/**
 * Private-pilot E2E tests.
 *
 * Covers: form renders, validation, submission.
 */

test.describe('Private Pilot Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/private-pilot');
  });

  test('form renders with required fields', async ({ page }) => {
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    // Should have at least a name/email field
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailField).toBeVisible();
  });

  test('validation: empty submission shows errors', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Apply"), button:has-text("Submit")').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    // Validation error should appear
    const error = page.locator(
      '[data-testid="field-error"], text=required, text=invalid, .text-destructive'
    ).first();
    await expect(error).toBeVisible({ timeout: 5_000 });
  });

  test('submission: valid form submits successfully', async ({ page }) => {
    // Fill required fields
    const nameField = page.locator('input[name="name"], input[placeholder*="name"]').first();
    if (await nameField.isVisible()) {
      await nameField.fill('Test Pilot');
    }
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill('test@example.com');
    }
    const companyField = page.locator('input[name="company"], input[placeholder*="company"]').first();
    if (await companyField.isVisible()) {
      await companyField.fill('Test Company');
    }

    const submitBtn = page.locator('button[type="submit"], button:has-text("Apply"), button:has-text("Submit")').first();
    await submitBtn.click();

    // Should show success or navigate away
    const success = page.locator(
      'text=Thank, text=Application submitted, text=received, [data-testid="submission-success"]'
    ).first();
    await expect(success).toBeVisible({ timeout: 10_000 });
  });
});
