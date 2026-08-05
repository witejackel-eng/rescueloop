// Provider factory — selects between Whop and fixture providers.
//
// Fixture mode is activated by a server-side environment flag:
//   RESCUELOOP_FIXTURE_MODE=true
//
// This flag MUST NOT be set in production. The factory enforces this:
// if NODE_ENV=production and RESCUELOOP_FIXTURE_MODE=true, it throws.
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

export function getProviderMode(): ProviderMode {
  // Fixture mode must never run in production
  if (process.env.NODE_ENV === "production" && process.env.RESCUELOOP_FIXTURE_MODE === "true") {
    throw new Error("RESGUELOOP_FIXTURE_MODE must not be enabled in production");
  }

  if (process.env.RESCUELOOP_FIXTURE_MODE === "true") {
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
