import { test, expect } from '@playwright/test';

/**
 * WP-01 Brand Evidence Suite.
 *
 * Captures screenshots of key RescueLoop surfaces at specified viewports
 * WITHOUT performing brittle pixel-diff assertions. These screenshots
 * serve as human-reviewable brand evidence, not automated regression gates.
 *
 * Screenshots are saved to test-results/brand-evidence/ and uploaded
 * as a GitHub Actions artifact named "rescueloop-wp01-brand-evidence".
 *
 * Viewports:
 * - Mobile: 390x844 (iPhone 14 Pro)
 * - Desktop: 1440x900
 */

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

const INTERNAL_API_KEY = process.env.RESCUELOOP_INTERNAL_TOKEN ?? 'ci-fixture-internal-token-padding-32';

const EVIDENCE_DIR = 'brand-evidence';

test.describe('Brand Evidence — WP-01', () => {
  // ─── Marketing Homepage ─────────────────────────────────────
  test('marketing homepage — mobile 390x844', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for client-side hydration
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/marketing-mobile-390x844.png`,
      fullPage: true,
    });
  });

  test('marketing homepage — desktop 1440x900', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/marketing-desktop-1440x900.png`,
      fullPage: true,
    });
  });

  // ─── Demo Workspace ─────────────────────────────────────────
  test('demo workspace — mobile 390x844', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/workspace-mobile-390x844.png`,
      fullPage: true,
    });
  });

  test('demo workspace — desktop 1440x900', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/workspace-desktop-1440x900.png`,
      fullPage: true,
    });
  });

  // ─── Student Rescue Experience ──────────────────────────────
  test('student rescue experience — mobile 390x844', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/student-rescue?token=fixture-student-token-abc123');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/student-rescue-mobile-390x844.png`,
      fullPage: true,
    });
  });

  // ─── Internal Brand QA Route ────────────────────────────────
  test('internal brand-qa — desktop 1440x900 (authenticated)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    // Navigate first to set domain, then inject auth token
    await page.goto('/internal');
    await page.evaluate((token) => {
      sessionStorage.setItem('rl_internal_token', token);
    }, INTERNAL_API_KEY);
    await page.goto('/internal/brand-qa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/internal-brand-qa-desktop-1440x900.png`,
      fullPage: true,
    });
  });

  // ─── Legal Page ─────────────────────────────────────────────
  test('legal page — mobile 390x844', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/legal/privacy');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/legal-mobile-390x844.png`,
      fullPage: true,
    });
  });

  // ─── Private-Pilot Page ─────────────────────────────────────
  test('private-pilot page — desktop 1440x900', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/private-pilot');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${EVIDENCE_DIR}/private-pilot-desktop-1440x900.png`,
      fullPage: true,
    });
  });
});
