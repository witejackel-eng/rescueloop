import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * WP-01 Brand Evidence Suite.
 *
 * Captures screenshots of key RescueLoop surfaces at ALL 8 required
 * viewports WITHOUT performing brittle pixel-diff assertions. These
 * screenshots serve as human-reviewable brand evidence, not automated
 * regression gates.
 *
 * Viewports (from workspace spec 07_RESPONSIVE_VISUAL_QA.md):
 *   390×844   — mobile (iPhone 14 Pro)
 *   768×1024  — tablet portrait (iPad Mini)
 *   1024×768  — tablet landscape
 *   1180×820  — small desktop
 *   1280×800  — standard desktop
 *   1366×768  — common laptop
 *   1440×900  — large desktop
 *   1600×900  — wide desktop
 *
 * Capture targets (from viewport_matrix.csv):
 *   /              → marketing (homepage)
 *   /overview      → workspace (demo workspace)
 *   /student-rescue→ student-rescue (student demo)
 *   /private-pilot → private-pilot (pilot page)
 *   /legal/privacy → legal (legal page)
 *   /internal/brand-qa → internal-brand-qa (QA page, skip if unauthenticated)
 *
 * Screenshots saved to test-results/brand-evidence/ with pattern:
 *   {page}-{mode}-{viewport}.png
 *
 * Security: No internal auth credentials are exposed in screenshots or logs.
 * The /internal/brand-qa page is skipped if unauthenticated — no credentials
 * are included in test code.
 */

// ─── All 8 required viewports ───────────────────────────────────
const VIEWPORTS = [
  { width: 390, height: 844, mode: 'mobile' },
  { width: 768, height: 1024, mode: 'mobile' },
  { width: 1024, height: 768, mode: 'desktop' },
  { width: 1180, height: 820, mode: 'desktop' },
  { width: 1280, height: 800, mode: 'desktop' },
  { width: 1366, height: 768, mode: 'desktop' },
  { width: 1440, height: 900, mode: 'desktop' },
  { width: 1600, height: 900, mode: 'desktop' },
] as const;

// ─── 6 capture targets ──────────────────────────────────────────
const PAGES = [
  { path: '/', name: 'marketing' },
  { path: '/overview', name: 'workspace' },
  { path: '/student-rescue', name: 'student-rescue' },
  { path: '/private-pilot', name: 'private-pilot' },
  { path: '/legal/privacy', name: 'legal' },
  { path: '/internal/brand-qa', name: 'internal-brand-qa' },
] as const;

// Screenshots go to test-results/brand-evidence/
const EVIDENCE_DIR = path.join('test-results', 'brand-evidence');

/**
 * Build screenshot filename: {page}-{mode}-{viewport}.png
 * e.g. marketing-mobile-390x844.png
 */
function screenshotFilename(pageName: string, mode: string, vp: { width: number; height: number }): string {
  return `${pageName}-${mode}-${vp.width}x${vp.height}.png`;
}

test.describe('Brand Evidence — WP-01', () => {
  // ─── Generate tests for all 6 pages × all 8 viewports ────────
  for (const pageTarget of PAGES) {
    for (const viewport of VIEWPORTS) {
      const filename = screenshotFilename(pageTarget.name, viewport.mode, viewport);

      test(`${pageTarget.name} — ${viewport.mode} ${viewport.width}×${viewport.height}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // For /internal/brand-qa, skip if unauthenticated (no credentials in code)
        if (pageTarget.path === '/internal/brand-qa') {
          await page.goto(pageTarget.path);
          await page.waitForLoadState('domcontentloaded');

          // Check if we hit the auth gate — if so, skip screenshot
          const authGateVisible = await page.locator('text=Internal Operations').isVisible().catch(() => false);
          if (authGateVisible) {
            test.skip(true, 'Internal brand-qa requires authentication — skipping to avoid exposing credentials');
            return;
          }

          // If page loaded without auth gate, capture screenshot
          await page.waitForTimeout(2000);
          await page.screenshot({
            path: path.join(EVIDENCE_DIR, filename),
            fullPage: true,
          });
          return;
        }

        // For all other pages: verify load without errors, then capture
        const response = await page.goto(pageTarget.path);
        expect(response?.status()).toBe(200);
        await page.waitForLoadState('domcontentloaded');

        // Wait for client-side hydration
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: path.join(EVIDENCE_DIR, filename),
          fullPage: true,
        });
      });
    }
  }
});
