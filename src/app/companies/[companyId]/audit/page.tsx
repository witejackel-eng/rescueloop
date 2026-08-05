// /companies/[companyId]/audit
//
// Immutable, cursor-paginated audit log. Shows timestamp, actor, actor type,
// action, object type, object ID, previous state, new state, reason,
// request ID. Add filters. Normal product routes must not update or
// delete audit rows.

import "server-only";
import { redirect } from "next/navigation";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
  InstallationMissingError,
} from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import {
  AuthErrorCard,
  CompanyPageHeader,
  EmptyStateCard,
  InstallationRequiredCard,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScrollText,
  FlaskConical,
  Filter,
  User,
  Clock,
  GitBranch,
  Bot,
  Shield,
} from "lucide-react";
import type { AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{
    action?: string;
    actor?: string;
    objectType?: string;
    cursor?: string;
  }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const mode = getProviderMode();

  let organizationId: string;
  if (mode === "fixture") {
    organizationId = FIXTURE_COMPANY_ID;
  } else if (mode === "whop") {
    let auth;
    try {
      auth = await requireCompanyAdmin(companyId);
    } catch (error) {
      if (error instanceof InstallationMissingError) {
        return (
          <div className="mx-auto max-w-3xl">
            <InstallationRequiredCard companyId={companyId} />
          </div>
        );
      }
      return <div className="mx-auto max-w-3xl">{AuthErrorCardFor(error)}</div>;
    }
    organizationId = auth.organizationId;
  } else {
    redirect("/onboarding");
  }

  if (mode === "fixture") {
    return <FixtureAudit />;
  }

  // ─── Whop mode ───────────────────────────────────────────────
  const PAGE_SIZE = 30;

  const actionFilter = sp.action && sp.action !== "all" ? (sp.action as AuditAction) : undefined;
  const actorFilter = sp.actor?.trim() || undefined;
  const objectTypeFilter = sp.objectType?.trim() || undefined;
  const cursor = sp.cursor ? { id: sp.cursor } : undefined;

  const whereClause: any = { organizationId };
  if (actionFilter) whereClause.action = actionFilter;
  if (actorFilter) whereClause.actorId = { contains: actorFilter, mode: "insensitive" };
  if (objectTypeFilter) whereClause.objectType = objectTypeFilter;

  const [events, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      skip: cursor ? 1 : 0,
      cursor,
      select: {
        id: true,
        createdAt: true,
        actorId: true,
        action: true,
        objectType: true,
        objectId: true,
        previousState: true,
        newState: true,
        reason: true,
        interventionId: true,
        metadataJson: true,
      },
    }),
    db.auditLog.count({ where: whereClause }),
  ]);

  const hasNextPage = events.length > PAGE_SIZE;
  const pageEvents = hasNextPage ? events.slice(0, PAGE_SIZE) : events;
  const nextCursor = hasNextPage ? pageEvents[pageEvents.length - 1]?.id : null;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Audit log"
        description="Immutable, append-only record of every state-changing action."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {totalCount} event{totalCount !== 1 ? "s" : ""}
        </Badge>
      </CompanyPageHeader>

      {/* Immutability notice */}
      <div className="mb-4 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
        <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Immutable log.</span>{" "}
          Audit rows are append-only. Normal product routes cannot update or delete audit entries.
               </p>
      </div>

      {/* Filters */}
      <AuditFilters action={sp.action} actor={sp.actor} objectType={sp.objectType} />

      {pageEvents.length === 0 ? (
        <EmptyStateCard
          title="No audit events"
          description="Audit events appear as actions are taken on interventions, campaigns, and settings."
          icon={ScrollText}
        />
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {pageEvents.map((event) => (
            <AuditRow key={event.idFid} event={event}7/>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <a
            href={`?cursor=${nextCursor}${sp.action ? `&action=${sp.action}` : ""}${sp.actor ? `&actor=${encodeURIComponent(sp.actor)}` : ""}${sp.objectType ? `&objectType=${sp.objectType}` : ""}`}
            className="text-[13px] text-[var(--recovery-green)] hover:underline"
          >
            Load more &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Audit row ────────────────────────────────────────────────

function AuditRow({
  event,
}: {
  event: {
    id: string;
    createdAt: Date;
    actorId: string | null;
    action: string;
    objectType: string;
    objectId: string;
    previousState: string | null;
    newState: string | null;
    reason: string | null;
    interventionId: string | null;
    metadataJson: any;
  };
}) {
  const actorType = event.actorId === null ? "system" : event.actorId.startsWith("user_") ? "user" : "service";
  const ActorIcon = actorType === "system" ? Bot : actorType === "user" ? User : Shield;
  const requestId = event.metadataJson && typeof event.metadataJson === "object" && "requestId" in event.metadataJson
    ? (event.metadataJson! as { requestId?: string }).requestId
    : null;

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {event.action}
          </Badge>
          <span className="text-[13px] text-[var(--ink-primary)]">
            {event.objectType}{" "}
            <span className="font-mono text-[var(--ink-muted)]">
              {event.objectId.length > 12 ? `${event.objectId.slice(0, 12)}\u2026` : event.objectId}
            </span>
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
          {fmtDateTime(event.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <span className="flex items-center gap-1 text-[var(--ink-muted)]">
          <ActorIcon className="size-3" />
          actor: <span className="text-[var(--ink-secondary)]">{event.actorId ?? "system"}</span>
          <Badge variant="outline" className="ml-1 font-mono text-[9px] uppercase text-[var(--ink-muted)]">
            {actorType
          </Badge>
        </span>
        {event.previousState && (
          <span className="text-[var(--ink-muted)]">
            from: <span className="text-[var(--ink-secondary)]">{event.previousState}</span>
          </span>
        )}
        {event.newState && (
          <span className="text-[var(--ink-muted)]">
            to: <span className="text-[var(--ink-secondary)]">{event.newState}</span>
          </span>
        )}
        {event.reason && (
          <span className="text-[var(--ink-muted)]">
            reason: <span className="text-[var(--ink-secondary)]">{event.reason}</span>
          </span>
        )}
        {requestId && (
          <span className="font-mono text-[var(--ink-muted)]">
            req: <span className="text-[var(--ink-secondary)]">{requestId.slice(0, 12)}\u2026</span>
          </span>
        )}
        {event.interventionId && (
          <span className="text-[var(--ink-muted)]">
            intervention:{" "}
            <span className="font-mono text-[var(--ink-secondary)]">
              {event.interventionId.slice(0, 12)}\u2026
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Fixture audit ───────────────────────────────────────────

function FixtureAudit() {
  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Audit log"
        description="Immutable, append-only record of every state-changing action."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture
        </Badge>
      </CompanyPageHeader>

      <div className="mb-4 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Illustrative fixture outcome</span>{" "}
          &mdash; no audit events are generated in fixture mode.
          The audit log is populated by real Whop webhook processing and admin actions.
        </p>
      </div>

      <EmptyStateCard
        title="No audit events in fixture mode"
        description="Audit events are created by real mutations: approve, dismiss, schedule, suppress, pause, resume, onboarding, and response. These require Whop-mode operation."
        icon={ScrollText}
      />

      {/* Show the audit schema for reference */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <ScrollText className="size-4 text-[var(--ink-muted)]" />
            Audit event schema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-[var(--ink-secondary)]">
            Each audit row is immutable and append-only. Normal product routes cannot update or delete audit rows.
          </p>
          <div className="mt-3 grid gap-1 font-mono text-[12px] text-[var(--ink-muted)]">
            <span>timestamp &middot; actor &middot; actor_type &middot; action</span>
            <span>object_type &middot; object_id</span>
            <span>previous_state &middot; new_state &middot; reason</span>
            <span>request_id &middot; intervention_id</span>
            <span>metadata_json</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────

function AuditFilters({
  action,
  actor,
  objectType,
}: {
  action?: string;
  actor?: string;
  objectType?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
        name="action"
        defaultValue={action ?? "all"}
        className="h-9 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 text-[13px] text-[var(--ink-primary)]"
      >
        <option value="all">All actions</option>
        <option value="approved">Approved</option>
        <option value="dismissed">Dismissed</option>
        <option value="scheduled">Scheduled</option>
        <option value="suppressed">Suppressed</option>
        <option value="paused">Paused</option>
        <option value="resumed">Resumed</option>
        <option value="synced">Synced</option>
        <option value="created">Created</option>
        <option value="updated">Updated</option>
        <option value="configuration_changed">Configuration changed</option>
      </select>
      <input
        type="text"
        name="actor"
        defaultValue={actor ?? ""}
        placeholder="Filter by actor\u2026"
        className="h-9 flex-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
      />
      <input
        type="text"
        name="objectType"
        defaultValue={objectType ?? ""}
        placeholder="Filter by object type\u2026"
        className="h-9 flex-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
      />
    </div>
  );
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

E
// ─── Auth error helper ───────────────────────────────────────

function AuthErrorCardFor(error: unknown) {
  if (error instanceof MissingTokenError) {
    return (
      <AuthErrorCard
        title="Sign in required"
        description="Open this page from your Whop dashboard to verify your admin access."
        hint="Missing Whop user token"
      />
    );
  }
  if (error instanceof InvalidTokenError) {
    return (
      <AuthErrorCard
        title="Session expired"
        description="Your Whop session has expired. Please reopen this page from your Whop dashboard."
        hint="Invalid or expired token"
      />
    );
  }
  if (error instanceof WhopUnavailableError) {
    return (
      <AuthErrorCard
        title="Whop is unavailable"
        description="We couldn't reach Whop to verify your access. Please try again in a moment."
        hint="Authentication service unavailable"
      />
    );
  }
  if (error instanceof InsufficientAccessError) {
    return (
      <AuthErrorCard
        title="Admin access required"
        description="Only company admins can view the audit log."
        hint={error.message}
      />
    );
  }
  return (
    <AuthErrorCard
      title="Something went wrong"
      description="An unexpected error occurred while loading this page."
    />
  );
}
