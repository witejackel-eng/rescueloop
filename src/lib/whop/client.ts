// Official Whop SDK server-only client.
//
// LAZY INITIALIZATION: the client is NOT constructed at module import
// time. It is constructed on first call to getWhopClient(). This allows
// the module to be imported during `next build` without requiring
// production credentials.
//
// Never imported by client components — this module touches secrets.

import "server-only";
import { Whop } from "@whop/sdk";
import { getWhopEnv, isWhopConfigured, ConfigurationError } from "@/lib/env/server";

let cachedClient: Whop | null = null;

/**
 * Get the Whop server client.
 *
 * Constructs the client on first call, then caches it for the lifetime
 * of the runtime instance. Throws a ConfigurationError if Whop
 * credentials are not configured — this error is safe to expose in
 * API responses (contains no secret names or values).
 *
 * @throws ConfigurationError if WHOP_API_KEY, WHOP_WEBHOOK_SECRET,
 *   or NEXT_PUBLIC_WHOP_APP_ID is missing or empty.
 */
export function getWhopClient(): Whop {
  if (cachedClient) return cachedClient;

  const env = getWhopEnv();

  cachedClient = new Whop({
    apiKey: env.WHOP_API_KEY,
    webhookKey: btoa(env.WHOP_WEBHOOK_SECRET),
    appID: env.NEXT_PUBLIC_WHOP_APP_ID,
  });

  return cachedClient;
}

/**
 * Check whether the Whop integration is configured.
 * Does not throw — returns true/false.
 */
export function isWhopReady(): boolean {
  return isWhopConfigured();
}

/**
 * Create a ConfigurationError for the Whop subsystem.
 * Useful for routes that need to return a 503 before calling the SDK.
 */
export function whopNotConfiguredError(): ConfigurationError {
  return new ConfigurationError("Whop");
}

// Re-export for backward compatibility with existing imports
export type { ConfigurationError } from "@/lib/env/server";
