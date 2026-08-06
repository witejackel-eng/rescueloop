import { test, expect } from '@playwright/test';

/**
 * WP-01 Brand Asset Endpoint Verification.
 *
 * Confirms that every canonical brand asset returns a successful HTTP
 * response with the appropriate content type. Also verifies that the
 * root HTML document references the expected manifest, icons, Open Graph
 * image, and Twitter image in its <head> metadata.
 *
 * No pixel-diff or visual regression assertions — these are HTTP + DOM checks.
 */

/** Brand assets that must be served with correct content types. */
const BRAND_ASSETS = [
  { path: '/brand/favicon.svg', expectedType: 'image/svg+xml' },
  { path: '/brand/favicon-16.png', expectedType: 'image/png' },
  { path: '/brand/favicon-32.png', expectedType: 'image/png' },
  { path: '/brand/apple-touch-icon.png', expectedType: 'image/png' },
  { path: '/brand/icon-192.png', expectedType: 'image/png' },
  { path: '/brand/icon-512.png', expectedType: 'image/png' },
  { path: '/brand/whop-app-icon-512.png', expectedType: 'image/png' },
  { path: '/brand/og-default-1200x630.png', expectedType: 'image/png' },
  { path: '/brand/twitter-default-1200x630.png', expectedType: 'image/png' },
] as const;

const BRAND_MANIFEST = '/brand-manifest.json';

test.describe('Brand Asset Endpoints', () => {
  for (const asset of BRAND_ASSETS) {
    test(`${asset.path} → 200 with ${asset.expectedType}`, async ({ request }) => {
      const response = await request.get(asset.path);
      expect(response.status()).toBe(200);

      const contentType = response.headers()['content-type'] ?? '';
      // Content-Type may include charset or other parameters; check the base type
      const baseType = contentType.split(';')[0].trim().toLowerCase();
      expect(baseType).toBe(asset.expectedType);
    });
  }

  test(`${BRAND_MANIFEST} → 200 with application/json`, async ({ request }) => {
    const response = await request.get(BRAND_MANIFEST);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    const baseType = contentType.split(';')[0].trim().toLowerCase();
    expect(baseType).toBe('application/json');

    // Validate manifest structure
    const manifest = await response.json();
    expect(manifest.name).toBe('RescueLoop');
    expect(manifest.short_name).toBe('RescueLoop');
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });
});

test.describe('HTML Metadata References', () => {
  test('root page references manifest, icons, OG image, and Twitter image', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('domcontentloaded');

    // ─── Manifest link ────────────────────────────────────────
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached({ timeout: 15_000 });
    const manifestHref = await manifestLink.getAttribute('href');
    expect(manifestHref).toContain('brand-manifest.json');

    // ─── Favicon icons ────────────────────────────────────────
    const iconLinks = page.locator('link[rel="icon"]');
    const iconCount = await iconLinks.count();
    expect(iconCount).toBeGreaterThanOrEqual(2); // At least favicon-16 + favicon-32

    // Verify specific favicon references exist
    const allIconHrefs: string[] = [];
    for (let i = 0; i < iconCount; i++) {
      const href = await iconLinks.nth(i).getAttribute('href');
      if (href) allIconHrefs.push(href);
    }
    expect(allIconHrefs.some(h => h.includes('favicon-16.png') || h.includes('favicon.svg'))).toBe(true);
    expect(allIconHrefs.some(h => h.includes('favicon-32.png'))).toBe(true);

    // ─── Apple touch icon ─────────────────────────────────────
    const appleLink = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleLink).toBeAttached({ timeout: 15_000 });
    const appleHref = await appleLink.getAttribute('href');
    expect(appleHref).toContain('apple-touch-icon.png');

    // ─── Open Graph image ─────────────────────────────────────
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toBeAttached({ timeout: 15_000 });
    const ogContent = await ogImage.getAttribute('content');
    expect(ogContent).toContain('og-default-1200x630.png');

    // ─── Twitter image ────────────────────────────────────────
    const twitterImage = page.locator('meta[name="twitter:image"], meta[property="twitter:image"]');
    await expect(twitterImage).toBeAttached({ timeout: 15_000 });
    const twitterContent = await twitterImage.first().getAttribute('content');
    expect(twitterContent).toContain('twitter-default-1200x630.png');
  });
});
