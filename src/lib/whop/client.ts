// Whop API client wrapper.
// Provides typed access to the Whop API for server-side operations.
// Never imported by client components.
//
// Note: The exact Whop SDK method signatures require testing against real
// Whop credentials. The manual HMAC verification below is used by tests
// and as a fallback. The SDK methods are called with best-effort typing
// and will be refined during private-pilot integration testing.

import { createHmac, timingSafeEqual } from "crypto";

// Lazy-load the Whop SDK to avoid import errors if not configured
let whopSdk: unknown = null;

async function getWhopSdk(): Promise<unknown> {
  if (whopSdk) return whopSdk;
  const mod = await import("@whop/api");
  whopSdk = mod;
  return whopSdk;
}

/**
 * Verify a Whop user token from the request headers.
 * Returns the user ID if valid, or null if invalid.
 */
export async function verifyWhopUserToken(token: string): Promise<string | null> {
  try {
    const mod = (await getWhopSdk()) as { verifyUserToken?: (token: string) => Promise<{ userId?: string } | null> };
    if (mod.verifyUserToken) {
      const result = await mod.verifyUserToken(token);
      return result?.userId ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a Whop user has administrative access to a company.
 * Returns true if the user has access.
 */
export async function checkCompanyAdminAccess(
  _whopUserId: string,
  _companyId: string,
): Promise<boolean> {
  // TODO: Implement using Whop SDK during private-pilot integration.
  // The SDK's checkIfUserHasAccessToCompany returns { hasAccess, accessLevel }.
  // For now, return false — real auth requires Whop credentials.
  return false;
}

/**
 * Send a targeted notification to a Whop user.
 * Returns the provider message ID if accepted, or throws on failure.
 *
 * Note: API acceptance is not the same as confirmed delivery.
 * The caller must record the state as "api_accepted", not "delivered".
 */
export async function sendWhopNotification(_params: {
  whopUserId: string;
  message: string;
  actionUrl?: string;
}): Promise<{ messageId: string | null }> {
  // TODO: Implement using Whop SDK during private-pilot integration.
  // For now, return null — real delivery requires Whop credentials.
  return { messageId: null };
}

/**
 * Verify a Whop webhook signature using HMAC-SHA256.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(params: {
  payload: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = createHmac("sha256", params.secret).update(params.payload).digest("hex");
  if (expected.length !== params.signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
  } catch {
    return false;
  }
}
