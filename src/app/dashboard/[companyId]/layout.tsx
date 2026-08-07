// Canonical dashboard layout for /dashboard/[companyId]/* routes.
//
// This is the WP-03 canonical route group. The legacy /companies/[companyId]/*
// paths redirect here. This layout reuses ConnectedShell with identical
// auth/fixture/unconfigured handling as the former companies layout.
//
// FAIL-CLOSED DESIGN:
//   - getProviderMode() === "unconfigured" → 503 IntegrationNotConfiguredCard
//   - getProviderMode() === "fixture" → ConnectedShell with FIXTURE_COMPANY_ID
//   - getProviderMode() === "whop" → requireCompanyAdmin for org context
//     If auth FAILS in connected mode → render auth error card, NO children.
//     The layout NEVER renders children without verified auth.
//
// Children are only rendered after the auth guard passes. This ensures
// that no child page can expose data merely because the shell rendered.

import "server-only";
import { ConnectedShell } from "@/components/shell/connected-shell";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures";
import {
  requireCompanyAccess,
  CompanyAccessDeniedError,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { IntegrationNotConfiguredCard } from "@/components/shell/integration-not-configured-card";
import { db } from "@/lib/db";
import type {
  ConnectedEnvironment,
  InstallationState,
} from "@/components/shell/connected-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId: urlCompanyId } = await params;
  const mode = getProviderMode();

  // ─── Unconfigured → 503 state ───────────────────────────────
  if (mode === "unconfigured") {
    return <IntegrationNotConfiguredCard />;
  }

  // ─── Fixture mode → use fixture company ID, skip auth ───────
  if (mode === "fixture") {
    return (
      <ConnectedShell
        companyId={FIXTURE_COMPANY_ID}
        environment="fixture"
        installationState="active"
        lastSyncAt={null}
        isPaused={false}
      >
        {children}
        <Sonner position="bottom-right" />
      </ConnectedShell>
    );
  }

  // ─── Connected (Whop) mode → FAIL-CLOSED auth ──────────────
  // The auth guard MUST pass before we render the shell + children.
  // If auth fails, we render an error card instead of the shell.
  // This prevents children from ever rendering without verified auth.
  let organizationId: string;
  let companyName: string | undefined;
  let installationState: InstallationState = "unknown";
  let lastSyncAt: string | null = null;
  let isPaused = false;

  try {
    const ctx = await requireCompanyAccess(urlCompanyId);

    // Auth passed. We now have a verified context.
    // In connected mode, the companyId is verified by the guard.
    organizationId = ctx.organizationId;

    // Gather org context for the shell (best-effort, non-fatal)
    const [org, installation, lastWebhook] = await Promise.all([
      db.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, isPaused: true },
      }),
      db.whopInstallation.findUnique({
        where: { whopCompanyId: urlCompanyId },
        select: { status: true },
      }),
      db.webhookReceipt.findFirst({
        where: { organizationId },
        orderBy: { receivedAt: "desc" },
        select: { receivedAt: true },
      }),
    ]);

    if (org) {
      companyName = org.name;
      isPaused = org.isPaused;
    }
    installationState =
      installation?.status === "active" ? "active" : installation ? "missing" : "unknown";
    lastSyncAt = lastWebhook?.receivedAt.toISOString() ?? null;
  } catch (error) {
    // FAIL-CLOSED: Auth failed in connected mode.
    // Render the error card directly — do NOT render the shell or children.
    const rendered = renderAccessDeniedError(error, urlCompanyId, {
      adminMessage:
        "Only company admins can access this dashboard. Ask a company admin to open this page.",
    });
    if (rendered) {
      return <div className="mx-auto max-w-3xl">{rendered}</div>;
    }
    // Unexpected error — don't render anything that could leak data
    throw error;
  }

  // Auth confirmed — safe to render the shell with children
  return (
    <ConnectedShell
      companyId={urlCompanyId}
      companyName={companyName}
      environment="whop"
      installationState={installationState}
      lastSyncAt={lastSyncAt}
      isPaused={isPaused}
    >
      {children}
      <Sonner position="bottom-right" />
    </ConnectedShell>
  );
}
