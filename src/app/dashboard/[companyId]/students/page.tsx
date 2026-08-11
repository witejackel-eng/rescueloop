// /dashboard/[companyId]/students
//
// Real student directory. Shows member identity, membership status,
// course enrollments, last activity, and rescue history — all from
// tenant-scoped DB records.
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import Link from "next/link";
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
import { Users, Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
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

  // ─── Fetch students with memberships, enrollments, latest intervention ───
  let students;
  let studentCount = 0;
  try {
    studentCount = await db.student.count({
      where: { organizationId },
    });

    students = await db.student.findMany({
      where: { organizationId },
      select: {
        id: true,
        whopUserId: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            status: true,
            joinedAt: true,
            renewalDate: true,
            product: { select: { name: true } },
          },
          orderBy: { joinedAt: "desc" },
          take: 3,
        },
        enrollments: {
          select: {
            course: { select: { name: true } },
            status: true,
          },
          take: 5,
        },
        interventions: {
          select: { id: true, state: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { interventions: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    return (
      <div className="mx-auto max-w-5xl">
        <CompanyPageHeader title="Students" description="Member directory with course progress, membership status, and rescue history." />
        <Card className="border-[var(--critical)]/30">
          <CardContent className="py-8 text-center text-[13px] text-[var(--ink-secondary)]">
            Unable to load student data. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  const basePath = `/dashboard/${encodeURIComponent(companyId)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Students"
        description="Member directory with course progress, membership status, and rescue history."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {studentCount} total
        </Badge>
      </CompanyPageHeader>

      {studentCount === 0 ? (
        <EmptyStateCard
          title="No students yet"
          description="Students will appear here as memberships are synced from Whop."
          icon={Users}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {students.map((s) => {
            const displayName = s.name ?? s.whopUserId;
            const latestMembership = s.memberships[0];
            const latestIntervention = s.interventions[0];
            const lastActivityDate = latestIntervention?.createdAt ?? latestMembership?.joinedAt;

            return (
              <Card key={s.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Identity */}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Link
                        href={`${basePath}/students/${s.id}`}
                        className="font-medium text-[15px] text-[var(--ink-primary)] hover:underline truncate"
                      >
                        {displayName}
                      </Link>
                      {s.email && (
                        <span className="font-mono text-[12px] text-[var(--ink-muted)] truncate">
                          {s.email}
                        </span>
                      )}
                      {/* Membership status */}
                      {latestMembership && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`font-mono text-[11px] ${membershipColor(latestMembership.status)}`}
                          >
                            {latestMembership.status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[12px] text-[var(--ink-muted)]">
                            {latestMembership.product.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right column: enrollments, rescue, activity */}
                    <div className="flex flex-col gap-1.5 sm:items-end shrink-0">
                      {/* Course enrollments */}
                      {s.enrollments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {s.enrollments.map((e, i) => (
                            <Badge key={i} variant="outline" className="font-mono text-[10px]">
                              {e.course.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Rescue history */}
                      {s._count.interventions > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Megaphone className="size-3 text-[var(--ink-muted)]" />
                          <span className="font-mono text-[11px] text-[var(--ink-secondary)]">
                            {s._count.interventions} intervention{s._count.interventions !== 1 ? "s" : ""}
                          </span>
                          {latestIntervention && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {truthfulInterventionState(latestIntervention.state)}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Last activity */}
                      {lastActivityDate && (
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          {fmtRelative(lastActivityDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function membershipColor(status: string): string {
  switch (status) {
    case "active": return "text-[#27966A] border-[#C7E6D5]";
    case "trialing": return "text-[#4C7ECF] border-[#C9DCF5]";
    case "past_due": return "text-[#D89222] border-[#F5E0C2]";
    case "cancelling":
    case "cancelled": return "text-[#C64D45] border-[#E8C9C5]";
    default: return "";
  }
}

/** Use truthful vocabulary for intervention states. */
function truthfulInterventionState(state: string): string {
  switch (state) {
    case "delivered": return "Accepted by Whop";
    case "notification_accepted": return "Student response received";
    case "delivery_attempted": return "Send attempted";
    case "awaiting_approval": return "Awaiting approval";
    default: return state.replace(/_/g, " ");
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
