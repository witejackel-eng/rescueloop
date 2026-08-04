// Shared state cards for company dashboard routes.
// Handles: auth errors, installation-required, empty, and loading states.
// All use the warm cream design system (no indigo/blue beyond the info accent).

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Plug,
  Inbox,
  Loader2,
  ShieldAlert,
} from "lucide-react";

/**
 * Auth / access error card. Renders a calm, honest message explaining why
 * the page can't be shown. Used when requireCompanyAdmin throws.
 */
export function AuthErrorCard({
  title,
  description,
  hint,
}: {
  title: string;
  description: string;
  hint?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--critical-light)]">
        <ShieldAlert className="size-6 text-[var(--critical)]" />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="font-serif text-2xl text-[var(--ink-primary)]">
          {title}
        </h2>
        <p className="max-w-sm text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          {description}
        </p>
        {hint && (
          <p className="mt-2 max-w-sm font-mono text-[12px] text-[var(--ink-muted)]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Installation-required state. Shown when a Whop admin authenticates but
 * RescueLoop has no active installation for their company.
 */
export function InstallationRequiredCard({ companyId }: { companyId: string }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--warning-light)]">
        <Plug className="size-6 text-[var(--warning)]" />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="font-serif text-2xl text-[var(--ink-primary)]">
          RescueLoop isn&rsquo;t installed for this company yet
        </h2>
        <p className="max-w-sm text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          Install the RescueLoop app on your Whop company to start detecting
          Activation Rescue opportunities.
        </p>
        <p className="mt-2 font-mono text-[12px] text-[var(--ink-muted)]">
          company_id: {companyId}
        </p>
      </div>
      <Button asChild size="lg" className="gap-2">
        <a
          href="https://whop.com/apps"
          target="_blank"
          rel="noopener noreferrer"
        >
          Install RescueLoop
        </a>
      </Button>
    </div>
  );
}

/**
 * Empty state card. Shown when a DB query returns no rows.
 */
export function EmptyStateCard({
  title,
  description,
  icon: Icon = Inbox,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  icon?: typeof Inbox;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="mx-auto max-w-lg border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--canvas-elevated)]">
          <Icon className="size-5 text-[var(--ink-muted)]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">
            {title}
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            {description}
          </p>
        </div>
        {actionHref && actionLabel && (
          <Button asChild size="sm" variant="outline" className="mt-2">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading card. Rarely shown (server components render ready), but kept
 * for Suspense fallbacks.
 */
export function LoadingCard({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[var(--ink-muted)]">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

/**
 * Inline error callout (non-fatal). Used inside pages when a secondary
 * data fetch (e.g. Whop API) fails but the page can still render.
 */
export function InlineWarningCallout({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-[var(--warning-light)] bg-[var(--warning-light)]/40 p-3">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
      <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
        {message}
      </p>
    </div>
  );
}

/**
 * Page header for company dashboard pages. Serif title + muted description.
 */
export function CompanyPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-[26px] leading-tight text-[var(--ink-primary)]">
          {title}
        </h1>
        {description && (
          <p className="text-[14px] text-[var(--ink-secondary)]">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
