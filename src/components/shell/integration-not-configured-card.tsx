// 503 "Integration not configured" state for the company layout.
//
// Shown when getProviderMode() === "unconfigured" — Whop env vars are
// missing AND fixture mode is off. Mirrors the calm, honest tone of the
// other state cards (AuthErrorCard, InstallationRequiredCard) so the
// visual language stays consistent.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function IntegrationNotConfiguredCard() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--canvas)] px-4 py-12">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--critical-light)]">
        <ShieldAlert className="size-6 text-[var(--critical)]" />
      </div>
      <div className="flex max-w-lg flex-col items-center gap-2 text-center">
        <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
          HTTP 503 · Integration not configured
        </p>
        <h1 className="font-serif text-[28px] leading-tight text-[var(--ink-primary)]">
          RescueLoop isn&rsquo;t connected yet
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          The Whop integration isn&rsquo;t configured for this environment.
          Company routes require a live Whop connection (or fixture mode for
          local development). Please contact your RescueLoop administrator.
        </p>
        <div className="mt-3 w-full rounded-md border border-[var(--hairline)] bg-[var(--surface)] p-3 text-left">
          <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
            Required environment
          </p>
          <ul className="mt-1.5 flex flex-col gap-1 font-mono text-[12px] text-[var(--ink-secondary)]">
            <li>
              <span className="text-[var(--ink-muted)]">{"•"}</span>{" "}
              WHOP_API_KEY
            </li>
            <li>
              <span className="text-[var(--ink-muted)]">{"•"}</span>{" "}
              WHOP_WEBHOOK_SECRET
            </li>
            <li>
              <span className="text-[var(--ink-muted)]">{"•"}</span>{" "}
              NEXT_PUBLIC_WHOP_APP_ID
            </li>
            <li className="mt-1 text-[var(--ink-muted)]">
              or RESCUELOOP_FIXTURE_MODE=true (development only)
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/" aria-label="Return to marketing site">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
