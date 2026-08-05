import { test, expect } from '@playwright/test';

/**
 * Visual regression E2E tests.
 *
 * Screenshots at three viewport sizes (desktop 1440×1000,
 * tablet 768×1024, mobile 390×844) for key pages.
 *
 * Snapshots are stored under src/tests/e2e/__snapshots__ and
 * compared on subsequent runs. Use --update-snapshots to rebaseline.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 390,  height: 844 },
];

const PAGES = [
  { name: 'marketing-home', path: '/' },
  { name: 'private-pilot', path: '/private-pilot' },
  { name: 'legal-privacy', path: '/legal/privacy' },
  { name: 'legal-terms', path: '/legal/terms' },
];

for (const vp of VIEWPORTS) {
  test.describe(`Visual regression – ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
    });

    for (const pg of PAGES) {
      test(`${pg.name} screenshot`, async ({ page }) => {
        await page.goto(pg.path);
        // Wait for page to settle
        await page.waitForLoadState('networkidle').catch(() => {});
        await expect(page).toHaveScreenshot(`${pg.name}-${vp.name}.png`, {
          maxDiffPixelRatio: 0.02,
        });
      });
    }
  });
}
