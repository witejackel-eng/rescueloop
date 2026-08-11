// Canonical Whop configuration health check.
//
// A single source of truth for whether the Whop integration is
// sufficiently configured to serve connected customer routes.
//
// This module is used by:
//   - middleware.ts (Edge Runtime) — to return real HTTP 503 before rendering
//   - dashboard layout (Node Runtime) — to set real HTTP 503 status
//   - API routes — to return 503 when Whop is required but not configured
//
// IMPORTANT: This module NEVER exposes secret values.
// It only checks for the PRESENCE of required configuration.

import { isWhopConfigured } from "@/lib/env/server";

/** Required Whop environment variable NAMES (never values) */
export const WHOP_REQUIRED_ENV_NAMES = [
  "WHOP_API_KEY",
  "WHOP_WEBHOOK_SECRET",
  "NEXT_PUBLIC_WHOP_APP_ID",
] as const;

/**
 * Check whether all required Whop configuration is present.
 * Returns true only if every required variable is set and non-empty.
 *
 * This is the canonical health check used by middleware, layouts,
 * and API routes to decide whether to serve connected routes or
 * return 503.
 */
export function isWhopFullyConfigured(): boolean {
  return isWhopConfigured();
}

/**
 * Edge-safe Whop configuration check.
 * In Edge Runtime, we can only check NEXT_PUBLIC_ prefixed vars.
 * For full checks, the Node runtime layout must be used.
 *
 * Returns true if at least NEXT_PUBLIC_WHOP_APP_ID is set.
 * A more thorough check happens in the Node layout.
 */
export function isWhopConfiguredAtEdge(): boolean {
  return !!process.env.NEXT_PUBLIC_WHOP_APP_ID;
}

/**
 * Build a list of missing Whop env NAMES (not values).
 * Safe to expose in error responses and client-facing pages.
 */
export function getMissingWhopEnvNames(): string[] {
  const missing: string[] = [];
  if (!process.env.WHOP_API_KEY) missing.push("WHOP_API_KEY");
  if (!process.env.WHOP_WEBHOOK_SECRET) missing.push("WHOP_WEBHOOK_SECRET");
  if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) missing.push("NEXT_PUBLIC_WHOP_APP_ID");
  return missing;
}
