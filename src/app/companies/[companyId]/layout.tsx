// Shared layout for Whop company dashboard routes.
//
// /companies/[companyId]/... is database-backed (real Whop auth + Prisma).
// This layout renders ConnectedShell — a separate shell from the demo
// WorkspaceShell — so a creator inside the company scope is never sent
// to demo routes (/overview, /rescue-queue, etc.).
//
// Environment handling:
//   - getProviderMode() === "unconfigured"
//       → Whop env vars are missing AND fixture mode is off.
//       → Render a 503 "Integration not configured" state. No shell, no children.
//   - getProviderMode() === "fixture"
//       → RESCUELOOP_FIXTURE_MODE=true.
//       → Render ConnectedShell with the FIXTURE company ID and amber badge.
//         child pages handle their own auth via resolveStrictCompanyAuth,
//         which verifies the fixture company ID in fixture mode.
//   - getProviderMode() === "whop"
//       → Try requireCompanyAdmin to gather optional org context (name,
//         pause state, last sync). If it throws ConfigurationError (env
//         changed under us), render the 503 state. For any other auth
//         error (missing token, invalid token, insufficient access),
//         render the shell anyway — children will surface the auth card.

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

export default async function CompanyLayout({
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
    // Child pages call resolveStrictCompanyAuth themselves; in fixture mode
    // they verify the companyId matches FIXTURE_COMPANY_ID. The shell still renders.
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
        // Env changed under us between getProviderMode() and requireCompanyAdmin().
        return <IntegrationNotConfiguredCard />;
      }
      // For all other auth errors (MissingTokenError, InvalidTokenError,
      // WhopUnavailableError, InsufficientAccessError, InstallationMissingError):
      // render the shell anyway. Child pages will surface the appropriate
      // auth card. The shell's env badge stays "CONNECTED" because Whop
      // IS configured — the user just needs to authenticate.
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
