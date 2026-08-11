// /dashboard/[companyId]/activity
//
// Real recent tenant activity from AuditLog. Shows sync operations,
// rescue candidate changes, approvals, intervention dispatches,
// Whop acceptance events, and administrative actions.
//
// Uses truthful vocabulary: "Accepted by Whop" not "Delivered",
// "Student response received" not "Read".
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import { db } from "@/lib/db";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import {
  CompanyPageHeader,
  EmptyStateCard,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  Megaphone,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  let ctx;
  try {
    ctx = await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  const organizationId = ctx.organizationId;

  // ─── Fetch audit log (last 50 events) ────────────────────────
  let events;
  try {
    events = await db.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        actorId: true,
        action: true,
        objectType: true,
        objectId: true,
        previousState: true,
        newState: true,
        reason: true,
        createdAt: true,
      },
    });
  } catch {
    return (
      <div className="mx-auto max-w-5xl">
        <CompanyPageHeader title="Activity" description="Recent events, interventions, and sync activity." />
        <Card className="border-[var(--critical)]/30">
          <CardContent className="py-8 text-center text-[13px] text-[var(--ink-secondary)]">
            Unable to load activity log. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Activity"
        description="Recent events, interventions, and sync activity."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </Badge>
      </CompanyPageHeader>

      {events.length === 0 ? (
        <EmptyStateCard
          title="No activity recorded"
          description="Audit events will appear here as rescue operations, syncs, and admin actions occur."
          icon={Activity}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((e) => (
            <Card key={e.id}>
              <CardContent className="py-3">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: icon + description */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {actionIcon(e.action)}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-[13px] text-[var(--ink-primary)]">
                        <span className="font-medium">{truthfulAction(e.action)}</span>
                        {" "}
                        <span className="text-[var(--ink-secondary)]">
                          {e.objectType}
                        </span>
                      </p>
                      {/* State transition if available */}
                      {e.previousState && e.newState && (
                        <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                          {truthfulState(e.previousState)} → {truthfulState(e.newState)}
                        </p>
                      )}
                      {/* Reason if available */}
                      {e.reason && (
                        <p className="text-[11px] text-[var(--ink-muted)] truncate">
                          {e.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: actor + timestamp */}
                  <div className="flex items-center gap-3 shrink-0 sm:flex-col sm:items-end sm:gap-0.5">
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                      {e.actorId ?? "system"}
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)]">
                      {fmtRelative(e.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

/** Truthful action labels. */
function truthfulAction(action: string): string {
  switch (action) {
    case "delivered": return "Accepted by Whop";
    case "sent": return "Intervention dispatched";
    case "synced": return "Sync completed";
    case "approved": return "Approved";
    case "dismissed": return "Dismissed";
    case "responded": return "Student response received";
    case "opted_out": return "Student opted out";
    case "paused": return "Paused";
    case "resumed": return "Resumed";
    case "suppressed": return "Suppressed";
    case "unsuppressed": return "Unsuppressed";
    case "scheduled": return "Scheduled";
    case "created": return "Created";
    case "updated": return "Updated";
    case "deleted": return "Deleted";
    case "configuration_changed": return "Configuration changed";
    default: return action.replace(/_/g, " ");
  }
}

/** Truthful state labels for intervention state transitions. */
function truthfulState(state: string): string {
  switch (state) {
    case "delivered": return "Accepted by Whop";
    case "notification_accepted": return "Student response received";
    case "delivery_attempted": return "Send attempted";
    default: return state.replace(/_/g, " ");
  }
}

function actionIcon(action: string): React.ReactNode {
  const cls = "size-4";
  switch (action) {
    case "synced":
      return <RefreshCw className={`${cls} text-[var(--recovery-green)]`} />;
    case "approved":
      return <CheckCircle2 className={`${cls} text-[var(--recovery-green)]`} />;
    case "delivered":
      return <Megaphone className={`${cls} text-[var(--recovery-green)]`} />;
    case "sent":
      return <Megaphone className={`${cls} text-[#4C7ECF]`} />;
    case "responded":
      return <UserCheck className={`${cls} text-[var(--recovery-green)]`} />;
    case "paused":
    case "suppressed":
      return <ShieldAlert className={`${cls} text-[#D89222]`} />;
    default:
      return <Activity className={`${cls} text-[var(--ink-muted)]`} />;
  }
}

function fmtRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
