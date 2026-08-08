import "server-only";
// Iframe security policy — WP08 / WP09
//
// Encodes the rule: Whop-embedded routes are framed by *.whop.com only.
// Student experience routes (opaque token links) must NEVER be framed.
//
// The runtime enforcement is in `src/middleware.ts`.

import { IFRAME_POLICY } from "./manifest";

/** Match a request pathname against a route pattern with dynamic segments. */
function matchesRoute(pathname: string, pattern: string): boolean {
  // Convert "/dashboard/[companyId]" → /^\/dashboard\/[^/]+/
  const re = new RegExp(
    "^" +
      pattern
        .replace(/\//g, "\\/")
        .replace(/\[([^\]]+)\]/g, "[^/]+") +
      "(\\/.*)?$",
  );
  return re.test(pathname);
}

export interface IframeDecision {
  /** Whether the response may be embedded in a Whop iframe. */
  allowEmbed: boolean;
  /** Whether to set X-Frame-Options: DENY. */
  denyFrame: boolean;
  /** CSP frame-ancestors value to set, or null to omit. */
  frameAncestors: string | null;
  /** Reason for the decision (auditable). */
  reason: string;
}

/**
 * Decide iframe policy for a request pathname.
 *
 * Rules:
 *   1. If pathname matches a denyIframeRoutes pattern → DENY.
 *   2. If pathname matches an embeddedRoutes pattern → allow with frame-ancestors.
 *   3. Otherwise (API routes, marketing) → DENY by default to be safe.
 */
export function decideIframePolicy(pathname: string): IframeDecision {
  // Rule 1 — explicit deny
  for (const pattern of IFRAME_POLICY.denyIframeRoutes) {
    if (matchesRoute(pathname, pattern)) {
      return {
        allowEmbed: false,
        denyFrame: true,
        frameAncestors: null,
        reason: `Route ${pathname} is on the deny-iframe list (pattern: ${pattern})`,
      };
    }
  }

  // Rule 2 — explicit allow with frame-ancestors
  for (const pattern of IFRAME_POLICY.embeddedRoutes) {
    if (matchesRoute(pathname, pattern)) {
      return {
        allowEmbed: true,
        denyFrame: false,
        frameAncestors: IFRAME_POLICY.allowedFrameAncestors.join(" "),
        reason: `Route ${pathname} is on the embedded-allow list (pattern: ${pattern})`,
      };
    }
  }

  // Rule 3 — default deny
  return {
    allowEmbed: false,
    denyFrame: true,
    frameAncestors: null,
    reason: `Route ${pathname} not on embedded-allow list — default deny`,
  };
}
