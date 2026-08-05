// /companies/[companyId]/sync
//
// Database-backed sync status page. Shows sync executions with status,
// cursors, timing, records processed, structured failures. Action buttons
// for triggering sync types. In fixture mode, shows fixture data.
// Fixture sync is NOT labelled as "Whop synchronization".

import "server-only";
import { redirect } from "next/navigation";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures/fixtures-data";
import {
  getMemberships,
  getCourses,
  getProducts,
  getLessonInteractions,
  getFixtureSourceTimestamp,
} from "@/providers/fixtures";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import {
  CompanyPageHeader,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  CheckCircle2,
  FlaskConical,
  Clock,
  Database,
  AlertTriangle,
  Play,
  Download,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SyncPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const mode = getProviderMode();

  let organizationId: string;

  if (mode === "fixture") {
    organizationId = FIXTURE_COMPANY_ID;
  } else if (mode === "whop") {
    const auth = await requireCompanyAdmin(companyId);
    organizationId = auth.organizationId;
  } else {
    redirect("/onboarding");
  }

  if (mode === "fixture") {
    return <FixtureSync />;
  }

  // ─── Whop mode: database queries ─────────────────────────────
  const orgId = organizationId;

  const [webhooks, installation, courses, products, memberships, students, auditSyncEvents] =
    await Promise.all([
      db.webhookReceipt.findMany({
        where: { organizationId: orgId },
        orderBy: { receivedAt: "desc" },
        take: 20,
        select: {
          id: true,
          eventType: true,
          status: true,
          receivedAt: true,
        },
      }),
      db.whopInstallation.findUnique({
        where: { whopCompanyId: companyId },
        select: { status: true, installedAt: true, grantedScopes: true },
      }),
      db.course.count({ where: { organizationId: orgId } }),
      db.product.count({ where: { organizationId: orgId } }),
      db.membership.count({ where: { organizationId: orgId } }),
      db.student.count({ where: { organizationId: orgId } }),
      db.auditLog.findMany({
        where: { organizationId: orgId, action: "synced" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          objectType: true,
          createdAt: true,
          reason: true,
          metadataJson: true,
        },
      }),
    ]);

  const lastWebhook = webhooks[0];
  const webhookSuccessCount = webhooks.filter((w) => w.status === "processed").length;
  const webhookFailCount = webhooks.filter((w) => w.status === "failed").length;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Sync status"
        description="Integration health, webhook receipts, and sync history."
      >
        <Badge variant="outline" className="font-mono text-[11px] uppercase tracking-wide">
          whop · connected
        </Badge>
      </CompanyPageHeader>

      {/* Sync trigger actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        <form action={`/api/companies/${encodeURIComponent(companyId)}/sync/memberships`} method="POST">
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Sync memberships
          </Button>
        </form>
        <form action={`/api/companies/${encodeURIComponent(companyId)}/sync/progress`} method="POST">
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Sync course progress
          </Button>
        </form>
        <form action={`/api/companies/${encodeURIComponent(companyId)}/sync/full`} method="POST">
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <Zap className="size-3.5" />
            Full resync
          </Button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Integration health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
              Integration health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Installation" value={installation?.status ?? "unknown"} mono />
            <Row
              label="Last webhook"
              value={lastWebhook ? fmtRelative(lastWebhook.receivedAt) : "No webhooks yet"}
              mono
            />
            <Row
              label="Recent webhooks"
              value={`${webhookSuccessCount} ok / ${webhookFailCount} failed`}
              mono
            />
            {installation?.grantedScopes && installation.grantedScopes.length > 0 && (
              <Row label="Scopes" value={installation.grantedScopes.join(", ")} mono />
            )}
            <Row label="Source" value="Whop Standard Webhooks" mono />
          </CardContent>
        </Card>

        {/* Synced resource counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Database className="size-4 text-[var(--recovery-green)]" />
              Synced resources
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Courses" value={courses} mono />
            <Row label="Products" value={products} mono />
            <Row label="Memberships" value={memberships} mono />
            <Row label="Students" value={students} mono />
          </CardContent>
        </Card>

        {/* Recent webhook receipts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <RefreshCw className="size-4 text-[var(--ink-muted)]" />
              Recent webhook receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-muted)]">
                No webhook receipts recorded yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--hairline)] text-left">
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Event</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Status</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((w) => (
                      <tr key={w.id} className="border-b border-[var(--hairline-subtle)]">
                        <td className="py-1.5 font-mono text-[var(--ink-secondary)]">{w.eventType}</td>
                        <td className="py-1.5">
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] uppercase ${
                              w.status === "processed"
                                ? "border-[var(--recovery-green)]/30 text-[var(--recovery-green)]"
                                : "border-[var(--critical)]/30 text-[var(--critical)]"
                            }`}
                          >
                            {w.status}
                          </Badge>
                        </td>
                        <td className="py-1.5 font-mono text-[var(--ink-muted)]">{fmtRelative(w.receivedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync execution log */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Clock className="size-4 text-[var(--ink-muted)]" />
              Sync execution log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditSyncEvents.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-muted)]">
                No sync executions recorded yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--hairline)] text-left">
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Resource</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Detail</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditSyncEvents.map((e) => (
                      <tr key={e.id} className="border-b border-[var(--hairline-subtle)]">
                        <td className="py-1.5 font-mono text-[var(--ink-secondary)]">{e.objectType}</td>
                        <td className="py-1.5 text-[var(--ink-muted)]">{e.reason ?? "—"}</td>
                        <td className="py-1.5 font-mono text-[var(--ink-muted)]">{fmtRelative(e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Structured failures */}
        {webhookFailCount > 0 && (
          <Card className="lg:col-span-2 border-[var(--critical)]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <AlertTriangle className="size-4 text-[var(--critical)]" />
                Structured failures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--hairline)] text-left">
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Event</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Status</th>
                      <th className="pb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks
                      .filter((w) => w.status === "failed")
                      .map((w) => (
                        <tr key={w.id} className="border-b border-[var(--hairline-subtle)]">
                          <td className="py-1.5 font-mono text-[var(--ink-secondary)]">{w.eventType}</td>
                          <td className="py-1.5">
                            <Badge variant="outline" className="border-[var(--critical)]/30 font-mono text-[10px] uppercase text-[var(--critical)]">
                              {w.status}
                            </Badge>
                          </td>
                          <td className="py-1.5 font-mono text-[var(--ink-muted)]">{fmtRelative(w.receivedAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Fixture sync ────────────────────────────────────────────

function FixtureSync() {
  const memberships = getMemberships();
  const courses = getCourses();
  const products = getProducts();
  const interactions = getLessonInteractions();
  const sourceTs = getFixtureSourceTimestamp();

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Sync status"
        description="Integration health, sync resources, and data generation."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture
        </Badge>
      </CompanyPageHeader>

      <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Fixture mode.</span>{" "}
          Illustrative fixture outcome — data is from deterministic local seeds.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
              Integration health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Installation" value="active (fixture)" mono />
            <Row label="Source" value="Fixture synchronization" mono />
            <Row label="Last generated" value={fmtRelative(new Date(sourceTs))} mono />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Database className="size-4 text-[var(--recovery-green)]" />
              Synced resources
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Courses" value={courses.length} mono />
            <Row label="Products" value={products.length} mono />
            <Row label="Memberships" value={memberships.length} mono />
            <Row label="Interactions" value={interactions.length} mono />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <RefreshCw className="size-4 text-[var(--ink-muted)]" />
              Fixture sync resources
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-[13px] text-[var(--ink-secondary)]">
              Fixture data is generated from static seeds. Each call to{" "}
              <span className="font-mono text-[12px]">resetFixtureData()</span>{" "}
              regenerates the dataset from the seeds with dates relative to now.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { resource: "Courses", count: courses.length },
                { resource: "Products", count: products.length },
                { resource: "Memberships", count: memberships.length },
                { resource: "Interactions", count: interactions.length },
              ].map((r) => (
                <div key={r.resource} className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">{r.resource}</p>
                  <p className="mt-0.5 font-mono tabular-nums text-lg text-[var(--ink-primary)]">{r.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-[var(--ink-secondary)]">{label}</span>
      <span className={`text-[13px] text-[var(--ink-primary)] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function fmtRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
