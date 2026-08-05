// Shared stub card for company dashboard pages that aren't fully
// database-backed yet. Renders a calm, honest placeholder that:
//   - Shows the page title + one-line description
//   - Indicates the implementation status (Coming in Phase 2 / Database-backed)
//   - Surfaces the current auth/env context as a small inline note
//
// The goal is that navigation always works — even in fixture mode or
// when auth fails — so creators can move around the shell and see what's
// planned without hitting dead ends.

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Construction, Database, ShieldAlert, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StubStatus =
  | "database" // requireCompanyAdmin succeeded — page will be DB-backed
  | "coming-soon" // not yet implemented
  | "fixture" // fixture mode — requireCompanyAdmin threw ConfigurationError
  | "auth-error"; // missing/invalid token or insufficient access

export interface CompanyStubCardProps {
  title: string;
  description: string;
  status: StubStatus;
  /** Optional note shown below the description (e.g., auth error hint). */
  statusNote?: string;
  /** Optional icon for the title row. Defaults to Construction. */
  icon?: LucideIcon;
  /** Optional children rendered below the status row. */
  children?: React.ReactNode;
}

const STATUS_META: Record<
  StubStatus,
  {
    label: string;
    Icon: LucideIcon;
    badgeClass: string;
    iconClass: string;
  }
> = {
  database: {
    label: "Database-backed",
    Icon: Database,
    badgeClass:
      "border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/40 text-[var(--recovery-green)]",
    iconClass: "text-[var(--recovery-green)]",
  },
  "coming-soon": {
    label: "Coming in Phase 2",
    Icon: Construction,
    badgeClass:
      "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]",
    iconClass: "text-[var(--ink-muted)]",
  },
  fixture: {
    label: "Fixture environment",
    Icon: FlaskConical,
    badgeClass:
      "border-[var(--warning)]/30 bg-[var(--warning-light)]/40 text-[var(--warning)]",
    iconClass: "text-[var(--warning)]",
  },
  "auth-error": {
    label: "Auth context unavailable",
    Icon: ShieldAlert,
    badgeClass:
      "border-[var(--critical)]/30 bg-[var(--critical-light)]/40 text-[var(--critical)]",
    iconClass: "text-[var(--critical)]",
  },
};

export function CompanyStubCard({
  title,
  description,
  status,
  statusNote,
  icon: TitleIcon,
  children,
}: CompanyStubCardProps) {
  const meta = STATUS_META[status];
  const StatusIcon = meta.Icon;
  const TitleIconFinal = TitleIcon ?? Construction;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="flex items-center gap-2 font-serif text-[26px] leading-tight text-[var(--ink-primary)]">
          <TitleIconFinal className="size-6 text-[var(--ink-muted)]" />
          {title}
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">{description}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn("size-4", meta.iconClass)} />
              <Badge
                variant="outline"
                className={cn("font-mono text-[11px] uppercase tracking-wide", meta.badgeClass)}
              >
                {meta.label}
              </Badge>
            </div>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              stub · rescueloop pilot
            </span>
          </div>

          {statusNote && (
            <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
              <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
                {statusNote}
              </p>
            </div>
          )}

          <div className="rounded-md border border-dashed border-[var(--hairline)] p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
              What this page will show
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              {children ?? "Detailed view in development."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
