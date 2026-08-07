// RescueLoop — Edge middleware
//
// Two responsibilities:
//   1. Apply iframe security policy on every response.
//      Whop-embedded dashboard routes: CSP frame-ancestors https://*.whop.com https://whop.com
//      Student experience, internal, API, marketing: X-Frame-Options: DENY
//   2. Reject open-redirect attempts (WP09 security).
//
// This middleware runs on every request. Keep it allocation-light.

import { NextResponse, type NextRequest } from "next/server";
import { decideIframePolicy } from "@/lib/marketplace/iframe-policy";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const response = NextResponse.next();

  // ─── 1. Iframe policy ────────────────────────────────────────
  const decision = decideIframePolicy(pathname);

  if (decision.denyFrame) {
    response.headers.set("X-Frame-Options", "DENY");
    // Also set CSP frame-ancestors 'none' for defence in depth
    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  } else if (decision.frameAncestors) {
    response.headers.set("Content-Security-Policy", `frame-ancestors ${decision.frameAncestors}`);
  }

  // ─── 2. Open-redirect rejection ─────────────────────────────
  // Any `?next=` / `?redirect=` param must be a same-origin relative path.
  const nextParam = searchParams.get("next") ?? searchParams.get("redirect");
  if (nextParam) {
    if (!isSafeRelativeRedirect(nextParam)) {
      // Strip the dangerous param and continue with a 400.
      const url = request.nextUrl.clone();
      url.searchParams.delete("next");
      url.searchParams.delete("redirect");
      const deny = NextResponse.redirect(url, 400);
      deny.headers.set("X-RescueLoop-Redirect-Rejected", "open-redirect-blocked");
      return deny;
    }
  }

  return response;
}

/** A safe redirect target is a same-origin relative path. */
function isSafeRelativeRedirect(target: string): boolean {
  if (!target.startsWith("/")) return false;
  if (target.startsWith("//")) return false; // protocol-relative
  // Disallow backslash-based protocol evasion
  if (target.startsWith("/\\")) return false;
  // Disallow control chars
  if (/[\r\n\t]/.test(target)) return false;
  return true;
}

export const config = {
  // Run on every path except static asset files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|marketplace/|robots.txt|brand-manifest.json).*)"],
};
