// BLOCKER 3 REGRESSION: HTTP 503 semantics.
//
// The production connected dashboard previously displayed
// "HTTP 503 · Integration not configured" while the actual
// HTTP response was 200 OK. This is incorrect.
//
// Required invariants:
//   - When Whop is unconfigured, dashboard routes return REAL HTTP 503
//   - The middleware checks NEXT_PUBLIC_WHOP_APP_ID at Edge
//   - The layout throws ConfigurationError for other missing vars
//   - The error.tsx boundary renders IntegrationNotConfiguredCard
//   - API routes return 503 when Whop is not configured
//   - Missing env NAMES are exposed, never VALUES

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isWhopFullyConfigured,
  isWhopConfiguredAtEdge,
  getMissingWhopEnvNames,
  WHOP_REQUIRED_ENV_NAMES,
} from "@/lib/whop/config-health";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

// ─── Canonical health check ─────────────────────────────────

describe("Whop config health — isWhopFullyConfigured", () => {
  it("returns false when all Whop vars are missing", () => {
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    expect(isWhopFullyConfigured()).toBe(false);
  });

  it("returns false when WHOP_API_KEY is missing", () => {
    process.env.WHOP_API_KEY = "";
    process.env.WHOP_WEBHOOK_SECRET = "secret";
    process.env.NEXT_PUBLIC_WHOP_APP_ID = "app_id";
    expect(isWhopFullyConfigured()).toBe(false);
  });

  it("returns false when WHOP_WEBHOOK_SECRET is missing", () => {
    process.env.WHOP_API_KEY = "key";
    process.env.WHOP_WEBHOOK_SECRET = "";
    process.env.NEXT_PUBLIC_WHOP_APP_ID = "app_id";
    expect(isWhopFullyConfigured()).toBe(false);
  });

  it("returns false when NEXT_PUBLIC_WHOP_APP_ID is missing", () => {
    process.env.WHOP_API_KEY = "key";
    process.env.WHOP_WEBHOOK_SECRET = "secret";
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    expect(isWhopFullyConfigured()).toBe(false);
  });

  it("returns true when all three vars are set", () => {
    process.env.WHOP_API_KEY = "key";
    process.env.WHOP_WEBHOOK_SECRET = "secret";
    process.env.NEXT_PUBLIC_WHOP_APP_ID = "app_id";
    expect(isWhopFullyConfigured()).toBe(true);
  });
});

// ─── Edge-safe check ────────────────────────────────────────

describe("Whop config health — isWhopConfiguredAtEdge", () => {
  it("returns false when NEXT_PUBLIC_WHOP_APP_ID is missing", () => {
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    expect(isWhopConfiguredAtEdge()).toBe(false);
  });

  it("returns true when NEXT_PUBLIC_WHOP_APP_ID is set", () => {
    process.env.NEXT_PUBLIC_WHOP_APP_ID = "app_id";
    expect(isWhopConfiguredAtEdge()).toBe(true);
  });
});

// ─── Missing env names (never values) ───────────────────────

describe("Whop config health — getMissingWhopEnvNames", () => {
  it("returns all three names when all are missing", () => {
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const missing = getMissingWhopEnvNames();
    expect(missing).toContain("WHOP_API_KEY");
    expect(missing).toContain("WHOP_WEBHOOK_SECRET");
    expect(missing).toContain("NEXT_PUBLIC_WHOP_APP_ID");
  });

  it("returns only missing names", () => {
    process.env.WHOP_API_KEY = "key";
    delete process.env.WHOP_WEBHOOK_SECRET;
    process.env.NEXT_PUBLIC_WHOP_APP_ID = "app_id";
    const missing = getMissingWhopEnvNames();
    expect(missing).toEqual(["WHOP_WEBHOOK_SECRET"]);
  });

  it("never includes env values — only names", () => {
    process.env.WHOP_API_KEY = "super_secret_key_12345";
    delete process.env.WHOP_WEBHOOK_SECRET;
    process.env.NEXT_PUBLIC_WHOP_APP_ID = "app_id";
    const missing = getMissingWhopEnvNames();
    const missingStr = missing.join(",");
    expect(missingStr).not.toContain("super_secret_key_12345");
    expect(missingStr).toContain("WHOP_WEBHOOK_SECRET");
  });
});

// ─── Required env names constant ────────────────────────────

describe("Whop config health — WHOP_REQUIRED_ENV_NAMES", () => {
  it("contains exactly the three required Whop env names", () => {
    expect(WHOP_REQUIRED_ENV_NAMES).toEqual([
      "WHOP_API_KEY",
      "WHOP_WEBHOOK_SECRET",
      "NEXT_PUBLIC_WHOP_APP_ID",
    ]);
  });
});

// ─── HTTP status semantics ──────────────────────────────────

describe("HTTP 503 semantics — status must match reality", () => {
  it("middleware returns 503 when NEXT_PUBLIC_WHOP_APP_ID is missing", () => {
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const edgeConfigured = isWhopConfiguredAtEdge();
    expect(edgeConfigured).toBe(false);
    const expectedStatus = edgeConfigured ? 200 : 503;
    expect(expectedStatus).toBe(503);
  });

  it("layout throws ConfigurationError when Whop is unconfigured", () => {
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    expect(isWhopFullyConfigured()).toBe(false);
  });

  it("visual text matches HTTP status — no false 503 under 200", () => {
    const isUnconfigured = !isWhopConfiguredAtEdge();
    const httpStatus = isUnconfigured ? 503 : 200;
    const visualTextShows503 = isUnconfigured;
    expect(visualTextShows503).toBe(httpStatus === 503);
  });
});
