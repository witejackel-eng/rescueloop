// /overview — public, production-safe interactive demo.
//
// ARCHITECTURE
// ────────────
// This route is a PUBLIC, ISOLATED demo surface. It does NOT redirect
// to `/dashboard/[companyId]` and does NOT call `requireCompanyAccess()`.
// It renders a representative RescueLoop workspace using the existing
// fixture provider bundle (`src/providers/fixtures`) and a small set
// of read-only demo components.
//
// INVARIANTS
// ──────────
//   1. No authentication required — works in Preview AND Production.
//   2. No `DATABASE_URL` access — fixture data is in-memory only.
//   3. No Whop API calls — fixture providers do not invoke the SDK.
//   4. No mutations — every "action" is simulated locally. Approving
//      a candidate updates local React state and renders a
//      "Simulated approval" notice. Nothing is enqueued.
//   5. No billing — the demo shows illustrative plan UX only.
//   6. No real notifications — the fixture notifications provider
//      only logs to the server console and never sends.
//   7. `RESCUELOOP_FIXTURE_MODE` is NOT required. The public demo
//      reads fixture data directly. Fixture mode remains a
//      development/test toggle for `/dashboard/co_fixture_cgl`.
//
// CONNECTED MODE (UNCHANGED)
// ──────────────────────────
//   `/dashboard/[companyId]` continues to call `requireCompanyAccess()`
//   and fails closed in production without a valid Whop user token.
//
// A Playwright E2E test (`src/tests/e2e/public-demo.spec.ts`) asserts
// that loading `/overview` does NOT trigger any request to
// `/api/dashboard/*`, `/api/webhooks/*`, `/api/onboarding/*`, or
// `/api/internal/*`.

import "server-only";
import Link from "next/link";
import {
  getMemberships,
  getCourses,
  getProducts,
  getCourseStudents,
  getStudents,
} from "@/providers/fixtures";
import { PublicDemoWorkspace } from "@/components/rescueloop/overview/public-demo-workspace";
import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ListChecks,
  Users,
  Activity,
  Gauge,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function OverviewDemoPage() {
  // Read-only fixture snapshot. This is the SAME deterministic seed data
  // used by `/dashboard/co_fixture_cgl` in fixture mode, but here it is
  // rendered through a separate, public, no-auth surface.
  const memberships = getMemberships();
  const courses = getCourses();
  const products = getProducts();
  const courseStudents = getCourseStudents();
  const students = getStudents();

  const activeNoProgress = memberships.filter(
    (m) => m.status === "active" && !courseStudents.some((cs) => cs.userId === m.userId),
  ).length;
  const totalActive = memberships.filter((m) => m.status === "active").length;
  const totalTrialing = memberships.filter((m) => m.status === "trialing").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      {/* ─── Primary disclosure ──────────────────────────────── */}
      <DemoDisclosureBanner />

      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          Recovery Pulse
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A read-only walkthrough of the RescueLoop creator workspace.
          Numbers are illustrative seed data — not customer results.
        </p>
      </div>

      {/* ─── Quick-nav cards (read-only) ─────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DemoNavCard
          icon={ListChecks}
          label="Rescue Queue"
          value={activeNoProgress}
          valueLabel="candidates"
          accent="green"
        />
        <DemoNavCard
          icon={Users}
          label="Students"
          value={memberships.length}
          valueLabel="total"
          accent="muted"
        />
        <DemoNavCard
          icon={Activity}
          label="Courses"
          value={courses.length}
          valueLabel="mapped"
          accent="muted"
        />
        <DemoNavCard
          icon={Gauge}
          label="Plan"
          value="Pilot"
          valueLabel="(demo)"
          accent="muted"
        />
      </div>

      {/* ─── Interactive simulated workspace ─────────────────── */}
      <PublicDemoWorkspace
        memberships={memberships}
        courses={courses}
        products={products}
        students={students}
        courseStudents={courseStudents}
      />

      {/* ─── Side cards: membership summary + safety ─────────── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">
              Membership summary (illustrative)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[var(--ink-secondary)]">Active</span>
              <span className="font-mono tabular-nums text-[var(--ink-primary)]">
                {totalActive}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-secondary)]">Trialing</span>
              <span className="font-mono tabular-nums text-[var(--ink-primary)]">
                {totalTrialing}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-secondary)]">Products mapped</span>
              <span className="font-mono tabular-nums text-[var(--ink-primary)]">
                {products.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <ShieldCheck className="size-4 text-[var(--recovery-green)]" />
              Safety in real RescueLoop
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            In a connected workspace, every intervention routes through
            your approval queue. Notifications are submitted to Whop only
            after a send-time safety re-check. The Whop provider records
            <span className="font-mono"> accepted</span> — never
            <span className="font-mono"> delivered</span> — because the
            Whop API does not return delivery evidence.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">
              Ready for the real thing?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            <p>
              Install RescueLoop from the Whop App Store to connect your
              own courses, run real rescue campaigns, and see your own
              value ledger.
            </p>
            <Link
              href="/private-pilot"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--recovery-green)] hover:underline"
            >
              Apply for the private pilot <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Demo nav card ─────────────────────────────────────────────

function DemoNavCard({
  icon: Icon,
  label,
  value,
  valueLabel,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  valueLabel: string;
  accent: "green" | "muted";
}) {
  const iconColor = accent === "green" ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Icon className={`size-5 shrink-0 ${iconColor}`} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-[var(--ink-secondary)]">{label}</span>
          <span className="font-mono tabular-nums text-[18px] text-[var(--ink-primary)]">
            {value}
          </span>
          <span className="text-[11px] text-[var(--ink-muted)]">{valueLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
