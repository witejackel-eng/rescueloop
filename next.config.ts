import type { NextConfig } from "next";

// ─── Security Headers ─────────────────────────────────────────────
//
// Applied to every response. These headers protect against common
// web vulnerabilities while allowing RescueLoop to function inside
// a Whop iframe embed.
//
// CSP notes:
//   - frame-ancestors allows whop.com and app.whop.com for iframe embed
//   - script-src 'self' is restrictive but functional for Next.js
//   - style-src allows 'unsafe-inline' (required by Next.js/Tailwind CSS)
//   - connect-src allows self + whop.com API + PostHog + Sentry
//   - img-src allows self + data: (for inline images) + brand assets
//
// These headers supplement (not replace) application-level security:
//   - Auth guards in server components
//   - Webhook signature verification
//   - Tenant-scoped queries
//   - Rate limiting

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self'",
      // Next.js/Tailwind requires inline styles; nonce-based is preferred but
      // not yet configured. 'unsafe-inline' for styles is lower risk than for scripts.
      "style-src 'self' 'unsafe-inline'",
      // Allow connections to self, Whop API, PostHog, and Sentry
      "connect-src 'self' https://api.whop.com https://us.i.posthog.com https://us.posthog.com https://o*.ingest.sentry.io",
      // Images from self, data URIs, and brand/og assets
      "img-src 'self' data: blob: https://whop.com https://cdn.whop.com",
      // Fonts from self (Next.js font optimization serves locally)
      "font-src 'self'",
      // Allow framing only from Whop (iframe embed context)
      "frame-ancestors https://whop.com https://app.whop.com https://*.whop.com",
      // No framing FROM this app into other origins
      "frame-src 'none'",
      // No plugins
      "object-src 'none'",
      // Base URI restricted to self
      "base-uri 'self'",
      // Form submissions only to self
      "form-action 'self'",
    ].join("; "),
  },
  {
    // X-Frame-Options is superseded by CSP frame-ancestors but included
    // for legacy browser support. ALLOW-FROM is not widely supported;
    // we rely on CSP frame-ancestors as the primary control and set
    // X-Frame-Options to SAMEORIGIN as a fallback (which still blocks
    // most non-Whop embeds). Whop iframe embedding works via CSP.
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      // RescueLoop never needs these browser APIs
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  },
  {
    // HSTS — enforce HTTPS for 1 year with subdomains
    // Only effective once the site is served over HTTPS
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Cache control for API routes — no caching of dynamic data
    // Static assets use Next.js's built-in caching
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
