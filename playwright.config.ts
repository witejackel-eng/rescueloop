import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for RescueLoop.
 *
 * - Base URL: http://localhost:3000
 * - Chromium only (no Firefox/WebKit for CI speed)
 * - Retry flaky tests twice
 * - 30s test timeout, 5s expect timeout
 * - Screenshots on failure only, trace on first retry, video on failure
 * - In CI: starts standalone server via `node .next/standalone/server.js`
 *   (next start does NOT work with output: standalone)
 */

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['list']] : 'html',
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
    command: process.env.CI
      ? 'node .next/standalone/server.js'
      : 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
    },
  },
});
