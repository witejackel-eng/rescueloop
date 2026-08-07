// /overview — public demo entry route.
//
// ARCHITECTURE
// ────────────
// The canonical simulated demo lives at `/dashboard/[companyId]` with the
// well-known fixture company id (`FIXTURE_COMPANY_ID = "co_fixture_cgl"`).
// In fixture mode (RESCUELOOP_FIXTURE_MODE=true, VERCEL_ENV != production)
// `requireCompanyAccess()` returns a `FixtureCompanyContext` WITHOUT calling
// Whop — no admin token required, no real customer data, no notifications,
// no billing. The dashboard renders `<FixtureDashboard>` with deterministic
// seed data and a visible "Fixture mode" banner.
//
// `/overview` itself is a stable public URL used across the marketing
// surface (header CTA, hero, final CTA, footer). It MUST NOT bypass the
// `/dashboard/[companyId]` auth guard — instead it is a server-side
// redirect to the canonical demo route. Auth on `/dashboard/[companyId]`
// is unchanged.
//
// MODE BEHAVIOUR
// ──────────────
//   fixture mode (preview / dev):  → /dashboard/co_fixture_cgl renders demo
//   connected mode (production):   → /dashboard/co_fixture_cgl fails auth
//                                    (correct fail-closed behaviour — the
//                                     demo is not a production surface)
//   unconfigured mode:             → /dashboard/co_fixture_cgl returns
//                                    NOT_CONFIGURED error card
//
// The "Explore demo" CTA on the marketing page is intended for preview /
// fixture deployments. In production, users reach the dashboard through
// Whop, not through this URL.
//
// This route does NOT:
//   - weaken authentication on /dashboard/[companyId]
//   - expose any connected customer data
//   - send notifications or create billing
//   - silently fall into connected mode
//   - render any UI of its own (pure redirect)

import { redirect } from "next/navigation";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures";

export const dynamic = "force-dynamic";

export default function OverviewRedirectPage(): never {
  redirect(`/dashboard/${encodeURIComponent(FIXTURE_COMPANY_ID)}`);
}
