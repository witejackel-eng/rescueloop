import { test, expect } from '@playwright/test';

/**
 * Marketing page E2E tests.
 *
 * The marketing page uses a FloatingNav (client component) with:
 * - Desktop nav at lg+ (1024px+) with aria-label="Marketing navigation"
 * - Mobile menu trigger below lg with aria-label="Open menu"
 * - Hero CTA links to /overview
 * - Pricing section has id="pricing"
 * - FAQ section has id="faq"
 * - Footer has links to /legal/privacy and /legal/terms
 */

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 800 },
  { name: '768',  width: 768,  height: 1024 },
  { name: '390',  width: 390,  height: 844 },
];

test.describe('Marketing Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  for (const vp of VIEWPORTS) {
    test(`header renders at ${vp.name}px width`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      // Wait for client-side hydration
      await page.waitForTimeout(500);
      // At lg+ (1024px+): desktop nav visible. Below: mobile menu button visible.
      if (vp.width >= 1024) {
        const desktopNav = page.locator('nav[aria-label="Marketing navigation"]');
        await expect(desktopNav).toBeVisible({ timeout: 10_000 });
      } else {
        const mobileToggle = page.locator('button[aria-label="Open menu"]');
        await expect(mobileToggle).toBeVisible({ timeout: 10_000 });
      }
    });
  }

  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const menuToggle = page.locator('button[aria-label="Open menu"]');
    await expect(menuToggle).toBeVisible({ timeout: 10_000 });
    await menuToggle.click();
    const mobileNav = page.locator('#mobile-menu');
    await expect(mobileNav).toBeVisible({ timeout: 5_000 });
    const closeBtn = page.locator('button[aria-label="Close menu"]');
    await closeBtn.click();
    await expect(mobileNav).not.toBeVisible({ timeout: 5_000 });
  });

  test('hero CTA navigates to /overview', async ({ page }) => {
    const heroCta = page.locator('a[href="/overview"]').first();
    await expect(heroCta).toBeVisible({ timeout: 10_000 });
    await heroCta.click();
    await page.waitForURL(/\/overview/, { timeout: 15_000 });
    expect(page.url()).toContain('/overview');
  });

  test('pricing section is visible', async ({ page }) => {
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible({ timeout: 10_000 });
  });

  test('FAQ section is visible', async ({ page }) => {
    const faq = page.locator('#faq');
    await expect(faq).toBeVisible({ timeout: 10_000 });
  });

  test('legal links are present in the footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 10_000 });
    await expect(footer.locator('a[href="/legal/privacy"]')).toBeAttached({ timeout: 10_000 });
    await expect(footer.locator('a[href="/legal/terms"]')).toBeAttached({ timeout: 10_000 });
  });

  test('private-pilot form exists at /private-pilot', async ({ page }) => {
    await page.goto('/private-pilot');
    await page.waitForLoadState('domcontentloaded');
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 10_000 });
  });
});
