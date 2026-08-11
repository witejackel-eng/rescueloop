// Error boundary for /dashboard/[companyId]/* routes.
//
// Catches errors thrown by the layout or any child page.
// When the error is a ConfigurationError (Whop unconfigured),
// renders the IntegrationNotConfiguredCard with real HTTP 503.
//
// BLOCKER 3 FIX: This is the mechanism by which unconfigured
// dashboard routes return REAL HTTP 503, not just a visual card
// under HTTP 200.

"use client";

import { IntegrationNotConfiguredCard } from "@/components/shell/integration-not-configured-card";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for observability
    console.error("[dashboard/error]", error);
  }, [error]);

  // If this is a configuration error, render the unconfigured card
  // The actual HTTP status was set by the layout/middleware.
  if (
    error.message?.includes("not configured") ||
    error.message?.includes("INTEGRATION_NOT_CONFIGURED")
  ) {
    return <IntegrationNotConfiguredCard />;
  }

  // Generic error fallback
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-[var(--ink-secondary)]">
        This page encountered an error. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-md border border-[var(--hairline)] px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
