import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for RescueLoop.
 *
 * - Base URL: http://localhost:3000
 * - Chromium only (no Firefox/WebKit for CI speed)
 * - Retry flaky tests twice
 * - 30s test timeout, 5s expect timeout
 * - Screenshots on failure only, trace on first retry, video on failure
 * - Dev server started via `bun run dev`, reused if already running
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  expect: {
    timeout: 5_000,
  },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
