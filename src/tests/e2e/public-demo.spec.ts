import { test, expect } from "@playwright/test";

/**
 * Public demo production-safety tests.
 *
 * These tests verify that the `/overview` public demo route is
 * genuinely isolated from the connected RescueLoop backend:
 *
 *   - Loads without authentication (no Whop token, no SSO).
 *   - Does NOT issue any request to /api/dashboard/*, /api/webhooks/*,
 *     /api/onboarding/*, /api/internal/*, or /api/private-pilot/*.
 *   - Renders the required "Interactive demo · simulated workspace"
 *     primary disclosure and the "No customer data is connected.
 *     Nothing is sent." secondary disclosure.
 *   - Interactive actions (Approve, Schedule, Simulate send) update
 *     local UI state and do NOT trigger network requests.
 *
 * Spec reference: docs/implementation/V1_FINAL_GAP_AUDIT.md → GAP-1.
 */

const FORBIDDEN_API_PREFIXES = [
  "/api/dashboard/",
  "/api/webhooks/",
  "/api/onboarding/",
  "/api/internal/",
  "/api/private-pilot/",
  "/api/companies/",
  "/api/experiences/",
];

test.describe("Public demo — production safety", () => {
  test("/overview loads without auth and renders the demo disclosure", async ({
    page,
  }) => {
    const forbiddenRequests: string[] = [];

    const listener = (request: import("@playwright/test").Request) => {
      const url = request.url();
      for (const prefix of FORBIDDEN_API_PREFIXES) {
        if (url.includes(prefix)) {
          forbiddenRequests.push(url);
          break;
        }
      }
    };
    page.on("request", listener);

    await page.goto("/overview");

    // Primary disclosure
    await expect(
      page.getByText("Interactive demo · simulated workspace"),
    ).toBeVisible({ timeout: 10_000 });

    // Secondary disclosure
    await expect(
      page.getByText("No customer data is connected. Nothing is sent."),
    ).toBeVisible();

    // The page must render the Recovery Pulse heading — proves the
    // demo workspace actually mounted, not just the disclosure banner.
    await expect(
      page.getByRole("heading", { name: "Recovery Pulse" }),
    ).toBeVisible();

    // Give the page a moment for any lazy fetches to fire.
    await page.waitForTimeout(500);

    // Hard assertion: no forbidden API request fired during the load.
    expect(
      forbiddenRequests,
      `Forbidden API requests fired during /overview load: ${forbiddenRequests.join(", ")}`,
    ).toEqual([]);

    page.off("request", listener);
  });

  test("interactive actions stay local — no API calls fire on Approve", async ({
    page,
  }) => {
    const forbiddenRequests: string[] = [];

    const listener = (request: import("@playwright/test").Request) => {
      const url = request.url();
      for (const prefix of FORBIDDEN_API_PREFIXES) {
        if (url.includes(prefix)) {
          forbiddenRequests.push(url);
          break;
        }
      }
    };
    page.on("request", listener);

    await page.goto("/overview");

    // Wait for the rescue queue to render.
    const rescueQueueHeading = page.getByText("Rescue Queue · simulated");
    await expect(rescueQueueHeading).toBeVisible({ timeout: 10_000 });

    // Click the first "Approve" button. This should update local UI
    // state and NOT fire any network request.
    const approveButton = page.getByRole("button", { name: /Approve/ }).first();
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // The "Simulated approval" notice should appear.
    await expect(page.getByText(/Simulated approval/)).toBeVisible({
      timeout: 5_000,
    });

    // Wait briefly to capture any trailing request.
    await page.waitForTimeout(500);

    expect(
      forbiddenRequests,
      `Forbidden API requests fired during demo interaction: ${forbiddenRequests.join(", ")}`,
    ).toEqual([]);

    page.off("request", listener);
  });

  test("Simulate send button records a simulated action — no API call", async ({
    page,
  }) => {
    const forbiddenRequests: string[] = [];

    const listener = (request: import("@playwright/test").Request) => {
      const url = request.url();
      for (const prefix of FORBIDDEN_API_PREFIXES) {
        if (url.includes(prefix)) {
          forbiddenRequests.push(url);
          break;
        }
      }
    };
    page.on("request", listener);

    await page.goto("/overview");

    const sendButton = page
      .getByRole("button", { name: /Simulate send/ })
      .first();
    await expect(sendButton).toBeVisible({ timeout: 10_000 });
    await sendButton.click();

    await expect(page.getByText(/Simulated send/)).toBeVisible({
      timeout: 5_000,
    });

    await page.waitForTimeout(500);

    expect(
      forbiddenRequests,
      `Forbidden API requests fired during simulate-send: ${forbiddenRequests.join(", ")}`,
    ).toEqual([]);

    page.off("request", listener);
  });
});
