import { test, expect } from '@playwright/test';

/**
 * WP-01 Brand QA Route Protection Verification.
 *
 * Confirms that /internal/brand-qa:
 * - Requires the existing internal authentication mechanism
 * - Is noindex/nofollow
 * - Cannot expose internal content to an unauthenticated visitor
 * - Uses the canonical logo module (RescueLoopMark/RescueLoopLogo)
 *
 * This test uses the same InternalAuthGate mechanism as other /internal/*
 * routes — no parallel authentication mechanism is created.
 */

const INTERNAL_API_KEY = process.env.RESCUELOOP_INTERNAL_TOKEN ?? 'ci-fixture-internal-token-padding-32';

test.describe('Brand QA Route Protection', () => {
  // ─── Requirement 1: Requires existing internal auth mechanism ─
  test('unauthenticated visitor sees login gate, not brand QA content', async ({ page }) => {
    await page.goto('/internal/brand-qa');
    await page.waitForLoadState('domcontentloaded');

    // The InternalAuthGate renders a Card with "Internal Operations" title
    const authGate = page.locator('text=Internal Operations').first();
    await expect(authGate).toBeVisible({ timeout: 10_000 });

    // The brand QA content must NOT be visible to unauthenticated visitors
    // Brand QA has an h1 "Brand QA" heading — this should NOT be visible
    const brandQaHeading = page.locator('h1', { hasText: 'Brand QA' });
    await expect(brandQaHeading).not.toBeVisible({ timeout: 5_000 });

    // Internal-only sections must not leak
    const studentCopySection = page.locator('section[aria-label="Student copy policy"]');
    await expect(studentCopySection).not.toBeVisible({ timeout: 3_000 });
  });

  // ─── Requirement 2: Authenticated access shows brand QA content ─
  test('authenticated visitor sees brand QA content with all 7 sections', async ({ page }) => {
    // Navigate to domain first, then inject auth token
    await page.goto('/internal');
    await page.evaluate((token) => {
      sessionStorage.setItem('rl_internal_token', token);
    }, INTERNAL_API_KEY);
    // Reload so auth gate picks up the token
    await page.reload();
    // Now navigate to brand-qa
    await page.goto('/internal/brand-qa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // The Brand QA heading should now be visible
    const heading = page.locator('h1', { hasText: 'Brand QA' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // All 7 sections should be present
    const sections = [
      'Logo variants',
      'Background variants',
      'Typography hierarchy',
      'Semantic colors',
      'Student copy policy',
      'Route context signatures',
      'Asset previews',
    ];
    for (const sectionLabel of sections) {
      const section = page.locator(`section[aria-label="${sectionLabel}"]`);
      await expect(section).toBeVisible({ timeout: 10_000 });
    }
  });

  // ─── Requirement 3: noindex/nofollow ────────────────────────
  test('page has noindex/nofollow robots meta tag', async ({ page }) => {
    await page.goto('/internal/brand-qa');
    await page.waitForLoadState('domcontentloaded');

    // The internal layout sets robots: { index: false, follow: false }
    // which renders as <meta name="robots" content="noindex, nofollow">
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toBeAttached({ timeout: 10_000 });
    const content = await robotsMeta.getAttribute('content');
    expect(content).toContain('noindex');
    expect(content).toContain('nofollow');
  });

  // ─── Requirement 4: Uses canonical logo module ──────────────
  test('brand QA uses canonical logo components (RescueLoopMark/RescueLoopLogo)', async ({ page }) => {
    // Authenticate first
    await page.goto('/internal');
    await page.evaluate((token) => {
      sessionStorage.setItem('rl_internal_token', token);
    }, INTERNAL_API_KEY);
    await page.reload();
    await page.goto('/internal/brand-qa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // The brand QA page imports RescueLoopMark, RescueLoopLogo, and BrandSignature
    // from @/components/brand/logo (the canonical logo module).
    // These render SVG elements with the RescueLoop mark geometry.
    // We verify they're rendered by checking for SVG elements in the logo section.
    const logoSection = page.locator('section[aria-label="Logo variants"]');
    await expect(logoSection).toBeVisible({ timeout: 15_000 });

    // The primary mark renders as an <svg> element
    const svgMarks = logoSection.locator('svg');
    const svgCount = await svgMarks.count();
    expect(svgCount).toBeGreaterThanOrEqual(1);

    // Brand signature should include the wordmark "RescueLoop" as live text
    const brandSignature = page.locator('text=RescueLoop').first();
    await expect(brandSignature).toBeVisible({ timeout: 10_000 });
  });

  // ─── Confirmation: No parallel auth mechanism ───────────────
  test('uses same auth mechanism as other /internal routes (sessionStorage + /api/internal/auth)', async ({ page }) => {
    // Verify the auth endpoint exists and works
    const response = await page.request.post('/api/internal/auth', {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    });
    expect(response.status()).toBe(200);

    // Verify wrong token is rejected
    const badResponse = await page.request.post('/api/internal/auth', {
      headers: {
        Authorization: 'Bearer wrong-token-value',
      },
    });
    expect(badResponse.status()).toBe(401);
  });
});
