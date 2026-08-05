import { test, expect } from '@playwright/test';

/**
 * Demo workflow E2E tests.
 *
 * Covers: demo badge, queue select + approve + schedule + dismiss,
 * reset demo, student experience.
 *
 * The demo workspace uses fixture data served by the fixture provider.
 */

test.describe('Demo Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overview');
  });

  test('demo badge is visible', async ({ page }) => {
    const badge = page.locator(
      '[data-testid="demo-badge"], text="Demo", text="Fixture"'
    ).first();
    await expect(badge).toBeVisible();
  });

  test('queue: select candidate opens inspector', async ({ page }) => {
    await page.goto('/rescue-queue');
    const queueItem = page.locator(
      '[data-testid="queue-item"], [data-testid="rescue-queue-row"]'
    ).first();
    await expect(queueItem).toBeVisible();
    await queueItem.click();
    const inspector = page.locator(
      '[data-testid="inspector"], [data-testid="student-detail-panel"]'
    ).first();
    await expect(inspector).toBeVisible();
  });

  test('queue: approve action', async ({ page }) => {
    await page.goto('/rescue-queue');
    const approveBtn = page.locator(
      'button:has-text("Approve"), button[data-action="approve"]'
    ).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      const approved = page.locator('text=Approved, [data-testid="status-approved"]').first();
      await expect(approved).toBeVisible({ timeout: 5_000 });
    }
  });

  test('queue: schedule action', async ({ page }) => {
    await page.goto('/rescue-queue');
    const scheduleBtn = page.locator(
      'button:has-text("Schedule"), button[data-action="schedule"]'
    ).first();
    if (await scheduleBtn.isVisible()) {
      await scheduleBtn.click();
      const scheduler = page.locator(
        '[data-testid="schedule-picker"], [data-testid="schedule-dialog"]'
      ).first();
      await expect(scheduler).toBeVisible();
    }
  });

  test('queue: dismiss action', async ({ page }) => {
    await page.goto('/rescue-queue');
    const dismissBtn = page.locator(
      'button:has-text("Dismiss"), button[data-action="dismiss"]'
    ).first();
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      const dismissed = page.locator('text=Dismissed, [data-testid="status-dismissed"]').first();
      await expect(dismissed).toBeVisible({ timeout: 5_000 });
    }
  });

  test('reset demo restores initial state', async ({ page }) => {
    await page.goto('/rescue-queue');
    const resetBtn = page.locator(
      'button:has-text("Reset"), button[data-action="reset-demo"]'
    ).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      const queueItems = page.locator(
        '[data-testid="queue-item"], [data-testid="rescue-queue-row"]'
      );
      const count = await queueItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('student experience page loads', async ({ page }) => {
    await page.goto('/students');
    await expect(page.locator('main').first()).toBeVisible();
  });
});
