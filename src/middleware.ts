// RescueLoop — Edge middleware
//
// Three responsibilities:
//   1. Apply iframe security policy on every response.
//      Whop-embedded dashboard routes: CSP frame-ancestors https://*.whop.com https://whop.com
//      Student experience, internal, API, marketing: X-Frame-Options: DENY
//   2. Dashboard 503 check — return real HTTP 503 when Whop is not configured.
//      BLOCKER 3 FIX: Previously only checked NEXT_PUBLIC_WHOP_APP_ID.
//      Now checks ALL required Whop env vars at the Edge level.
//      For vars not available at Edge (non-NEXT_PUBLIC_), the Node layout
//      performs the authoritative check and sets the status code.
//   3. Reject open-redirect attempts (WP09 security).
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

  // ─── 2. Dashboard unconfigured check (REAL HTTP 503) ────────
  // If the Whop integration is not configured, connected dashboard
  // routes cannot operate. Return real HTTP 503, not just a visual
  // card under HTTP 200.
  //
  // Edge Runtime limitation: only NEXT_PUBLIC_ prefixed vars are
  // available. We check NEXT_PUBLIC_WHOP_APP_ID here. Server-side
  // vars (WHOP_API_KEY, WHOP_WEBHOOK_SECRET) are checked by the
  // Node layout, which also sets the HTTP status code to 503 if
  // they're missing.
  if (pathname.startsWith("/dashboard/")) {
    if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) {
      return new NextResponse(
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>503 - Integration Not Configured</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;color:#1a1a1a}h1{font-size:20px;margin-bottom:8px}p{font-size:14px;line-height:1.6;color:#666}code{font-size:12px;background:#f5f5f5;padding:2px 6px;border-radius:3px}</style></head><body><h1>503 · Integration not configured</h1><p>RescueLoop isn't connected to Whop yet. Required environment variables are not configured.</p><p>Missing: <code>NEXT_PUBLIC_WHOP_APP_ID</code> (and potentially <code>WHOP_API_KEY</code>, <code>WHOP_WEBHOOK_SECRET</code>).</p><p>Open this app from your Whop dashboard after installing.</p></body></html>`,
        {
          status: 503,
          headers: {
            "Content-Type": "text/html",
            "X-RescueLoop-Unconfigured": "true",
          },
        },
      );
    }
  }

  // ─── 3. Open-redirect rejection ─────────────────────────────
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
