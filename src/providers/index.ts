// Provider factory — selects between Whop and fixture providers.
//
// Fixture mode is activated by a server-side environment flag:
//   RESCUELOOP_FIXTURE_MODE=true
//
// Deployment-environment gating uses VERCEL_ENV (not NODE_ENV):
//   – No VERCEL_ENV        → local development  (fixture allowed)
//   – VERCEL_ENV=preview   → Vercel Preview     (fixture allowed)
//   – VERCEL_ENV=production → Vercel Production  (fixture ALWAYS blocked)
//
// This flag MUST NOT be set in production. The factory enforces this:
// if VERCEL_ENV=production and RESCUELOOP_FIXTURE_MODE=true, it throws.
//
// If Whop is configured and fixture mode is off → Whop providers.
// If fixture mode is on → Fixture providers.
// If neither → returns null (caller should return 503).

import "server-only";
import type { ProviderBundle } from "./contracts";
import { fixtureProviders } from "./fixtures";
import { getWhopProviders } from "./whop";
import { isWhopReady } from "@/lib/whop/client";

export type ProviderMode = "fixture" | "whop" | "unconfigured";

/**
 * Determine whether fixture mode is permitted in the current deployment.
 *
 * Rules:
 *   – VERCEL_ENV=production  → always false (blocked)
 *   – No VERCEL_ENV (local)   → allowed when RESCUELOOP_FIXTURE_MODE=true
 *   – VERCEL_ENV=preview      → allowed when RESCUELOOP_FIXTURE_MODE=true
 *
 * This function is server-only. The env var is never exposed to the client,
 * cannot be activated via URL query, cookies, or any browser-controlled input.
 */
export function canUseFixtureMode(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  const fixtureFlag = process.env.RESCUELOOP_FIXTURE_MODE === "true";

  // Production deployment: fixture mode is always blocked
  if (vercelEnv === "production") {
    if (fixtureFlag) {
      throw new Error(
        "RESCUELOOP_FIXTURE_MODE must not be enabled in production"
      );
    }
    return false;
  }

  // Local dev (no VERCEL_ENV) or Vercel Preview: fixture allowed when flag is set
  return fixtureFlag;
}

export function getProviderMode(): ProviderMode {
  if (canUseFixtureMode()) {
    return "fixture";
  }

  if (isWhopReady()) {
    return "whop";
  }

  return "unconfigured";
}

export function getProviders(): ProviderBundle | null {
  const mode = getProviderMode();

  switch (mode) {
    case "fixture":
      return fixtureProviders;
    case "whop":
      return getWhopProviders();
    case "unconfigured":
      return null;
  }
}

export function isFixtureMode(): boolean {
  return getProviderMode() === "fixture";
}
