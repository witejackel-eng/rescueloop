// Shared helper for company stub pages.
//
// Each stub page calls requireCompanyAdmin(companyId) to verify auth.
// This helper centralises the try/catch + status resolution so the stub
// pages themselves stay tiny.
//
// The stub pages are designed to be LENIENT — they render their stub
// content even when auth fails. This keeps navigation working in
// fixture mode and lets creators preview the shell without blocking on
// auth. (The fully-built pages — queue, settings, responses, onboarding
// — surface auth errors as AuthErrorCards. Stubs don't, because they
// have no real data to protect.)

import "server-only";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import { ConfigurationError } from "@/lib/env/server";
import { getProviderMode } from "@/providers";
import type { StubStatus } from "@/components/shell/company-stub-card";

export interface StubAuthResult {
  status: StubStatus;
  statusNote?: string;
  organizationId?: string;
}

export async function resolveStubAuth(
  companyId: string,
): Promise<StubAuthResult> {
  const mode = getProviderMode();

  if (mode === "fixture") {
    return {
      status: "fixture",
      statusNote:
        "Fixture environment is active — Whop auth is bypassed. This stub renders with deterministic local data when the full page lands in Phase 2.",
    };
  }

  try {
    const ctx = await requireCompanyAdmin(companyId);
    return {
      status: "database",
      organizationId: ctx.organizationId,
      statusNote:
        "Whop admin verified. This page is a stub — the database-backed view lands in Phase 2.",
    };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return {
        status: "fixture",
        statusNote:
          "Whop integration is not configured. Set the required environment variables (or enable fixture mode) to see live data.",
      };
    }
    return {
      status: "auth-error",
      statusNote:
        "Open this page from your Whop dashboard to verify admin access. The stub renders anyway so you can see what's planned.",
    };
  }
}
