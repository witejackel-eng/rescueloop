// Canonical dashboard layout for /dashboard/[companyId]/* routes.
//
// This is the WP-03 canonical route group. The legacy /companies/[companyId]/*
// paths redirect here. This layout reuses ConnectedShell with identical
// auth/fixture/unconfigured handling as the former companies layout.
//
// Environment handling:
//   - getProviderMode() === "unconfigured" → 503 IntegrationNotConfiguredCard
//   - getProviderMode() === "fixture" → ConnectedShell with FIXTURE_COMPANY_ID
//   - getProviderMode() === "whop" → Best-effort requireCompanyAdmin for org context

import "server-only";
import { ConnectedShell } from "@/components/shell/connected-shell";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import { ConfigurationError } from "@/lib/env/server";
import { db } from "@/lib/db";
import type {
  ConnectedEnvironment,
  InstallationState,
} from "@/components/shell/connected-nav";
import { IntegrationNotConfiguredCard } from "@/components/shell/integration-not-configured-card";

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

  // ─── Shared shell props ─────────────────────────────────────
  let shellCompanyId = urlCompanyId;
  let environment: ConnectedEnvironment =
    mode === "fixture" ? "fixture" : "whop";
  let companyName: string | undefined;
  let installationState: InstallationState = "unknown";
  let lastSyncAt: string | null = null;
  let isPaused = false;

  // ─── Fixture mode → use fixture company ID, skip auth ───────
  if (mode === "fixture") {
    shellCompanyId = FIXTURE_COMPANY_ID;
  } else {
    // ─── Whop mode → best-effort gather org context ───────────
    try {
      const ctx = await requireCompanyAdmin(urlCompanyId);
      const [org, installation, lastWebhook] = await Promise.all([
        db.organization.findUnique({
          where: { id: ctx.organizationId },
          select: { name: true, isPaused: true },
        }),
        db.whopInstallation.findUnique({
          where: { whopCompanyId: urlCompanyId },
          select: { status: true },
        }),
        db.webhookReceipt.findFirst({
          where: { organizationId: ctx.organizationId },
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
      shellCompanyId = ctx.companyId;
    } catch (error) {
      if (error instanceof ConfigurationError) {
        return <IntegrationNotConfiguredCard />;
      }
      // For all other auth errors: render the shell anyway.
      // Child pages will surface the appropriate auth card.
    }
  }

  return (
    <ConnectedShell
      companyId={shellCompanyId}
      companyName={companyName}
      environment={environment}
      installationState={installationState}
      lastSyncAt={lastSyncAt}
      isPaused={isPaused}
    >
      {children}
      <Sonner position="bottom-right" />
    </ConnectedShell>
  );
}
