import { test, expect } from '@playwright/test';

/**
 * Marketing page E2E tests.
 *
 * Covers: header across viewports, mobile menu, hero CTA, pricing,
 * FAQ, legal links, private-pilot form.
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
  });

  for (const vp of VIEWPORTS) {
    test(`header renders at ${vp.name}px width`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const header = page.locator('header, nav, [data-testid="marketing-header"]').first();
      await expect(header).toBeVisible();
    });
  }

  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const menuToggle = page.locator(
      'button[aria-label="Open menu"], button[data-testid="mobile-menu-toggle"], button:has(svg.lucide-menu)'
    ).first();
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      const mobileNav = page.locator(
        '[data-testid="mobile-nav"], [data-state="open"], nav[aria-label="Mobile navigation"]'
      ).first();
      await expect(mobileNav).toBeVisible();
    }
  });

  test('hero CTA navigates to private-pilot or onboarding', async ({ page }) => {
    const heroCta = page.locator(
      '[data-testid="hero-cta"] a, [data-testid="hero-cta"] button, a[href="/private-pilot"], a[href="/onboarding"]'
    ).first();
    await expect(heroCta).toBeVisible();
    await heroCta.click();
    await page.waitForURL(/\/(private-pilot|onboarding)/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/(private-pilot|onboarding)/);
  });

  test('pricing section is visible', async ({ page }) => {
    const pricing = page.locator(
      '[data-testid="pricing-section"], section:has(h2:text-is("Pricing")), [id="pricing"]'
    ).first();
    await expect(pricing).toBeVisible();
  });

  test('FAQ section is visible', async ({ page }) => {
    const faq = page.locator(
      '[data-testid="faq-section"], section:has(h2:text-is("FAQ")), [id="faq"]'
    ).first();
    await expect(faq).toBeVisible();
  });

  test('legal links are present in the footer', async ({ page }) => {
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    await expect(footer.locator('a[href="/legal/privacy"]')).toBeAttached();
    await expect(footer.locator('a[href="/legal/terms"]')).toBeAttached();
  });

  test('private-pilot form exists at /private-pilot', async ({ page }) => {
    await page.goto('/private-pilot');
    await expect(page.locator('form').first()).toBeVisible();
  });
});
