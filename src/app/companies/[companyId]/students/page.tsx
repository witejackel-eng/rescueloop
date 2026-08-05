// /companies/[companyId]/students
//
// Database-backed student directory. Search + cursor pagination + filters
// (membership status, course, progress, intervention state). Shows student
// rows with membership history, course progress, interventions, responses.
// Does NOT load all students in one query — uses cursor pagination.

import "server-only";
import { redirect } from "next/navigation";
import { getProviderMode } from "@/providers";
import { FIXTURE_COMPANY_ID } from "@/providers/fixtures/fixtures-data";
import {
  getStudents as getFixtureStudents,
  getMemberships as getFixtureMemberships,
  getCourseStudents as getFixtureCourseStudents,
  getCourses as getFixtureCourses,
} from "@/providers/fixtures";
import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import {
  CompanyPageHeader,
  EmptyStateCard,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FlaskConical,
  Search,
  GraduationCap,
  Mail,
  Megaphone,
} from "lucide-react";
import type { MembershipStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ q?: string; status?: string; progress?: string; cursor?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const mode = getProviderMode();

  let organizationId: string;

  if (mode === "fixture") {
    organizationId = FIXTURE_COMPANY_ID;
  } else if (mode === "whop") {
    const auth = await requireCompanyAdmin(companyId);
    organizationId = auth.organizationId;
  } else {
    redirect("/onboarding");
  }

  if (mode === "fixture") {
    return <FixtureStudents search={sp.q} statusFilter={sp.status} progressFilter={sp.progress} />;
  }

  // ─── Whop mode: database query with cursor pagination ────────
  const orgId = organizationId;
  const PAGE_SIZE = 25;

  // Build where clause from filters
  const statusFilter = sp.status && sp.status !== "all" ? (sp.status as MembershipStatus) : undefined;
  const searchQuery = sp.q?.trim() || undefined;

  const whereClause: any = { organizationId: orgId };
  if (searchQuery) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
    ];
  }
  if (statusFilter) {
    whereClause.memberships = { some: { status: statusFilter } };
  }
  if (sp.progress === "none") {
    whereClause.studentStates = { every: { lessonsCompleted: 0 } };
  } else if (sp.progress === "in_progress") {
    whereClause.studentStates = { some: { lessonsCompleted: { gt: 0 }, progressPercent: { lt: 100 } } };
  } else if (sp.progress === "completed") {
    whereClause.studentStates = { some: { progressPercent: 100 } };
  }

  const cursor = sp.cursor ? { id: sp.cursor } : undefined;

  const [students, totalCount] = await Promise.all([
    db.student.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      skip: cursor ? 1 : 0,
      cursor,
      include: {
        memberships: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { product: { select: { name: true } } },
        },
        studentStates: {
          take: 3,
          orderBy: { lastActivityAt: "desc" },
          include: { course: { select: { name: true } } },
        },
        _count: {
          select: { interventions: true },
        },
      },
    }),
    db.student.count({ where: whereClause }),
  ]);

  const hasNextPage = students.length > PAGE_SIZE;
  const pageStudents = hasNextPage ? students.slice(0, PAGE_SIZE) : students;
  const nextCursor = hasNextPage ? pageStudents[pageStudents.length - 1]?.id : null;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Students"
        description="Member directory with course progress, membership status, and rescue history."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {totalCount} total
        </Badge>
      </CompanyPageHeader>

      <StudentFilters />

      {pageStudents.length === 0 ? (
        <EmptyStateCard
          title="No students found"
          description={
            searchQuery || statusFilter
              ? "No students match the current filters. Try adjusting your search or filters."
              : "Students will appear here as memberships are synced from Whop."
          }
          icon={Users}
        />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {pageStudents.map((student) => (
            <StudentRow
              key={student.id}
              studentId={student.id}
              name={student.name ?? student.email ?? `user_${student.whopUserId.slice(-6)}`}
              email={student.email}
              membership={student.memberships[0]}
              courseStates={student.studentStates}
              interventionCount={student._count.interventions}
            />
          ))}
        </div>
      )}

      {/* Cursor pagination */}
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <a
            href={`?cursor=${nextCursor}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.status ? `&status=${sp.status}` : ""}${sp.progress ? `&progress=${sp.progress}` : ""}`}
            className="text-[13px] text-[var(--recovery-green)] hover:underline"
          >
            Load more students →
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Student row (Whop) ──────────────────────────────────────

function StudentRow({
  studentId,
  name,
  email,
  membership,
  courseStates,
  interventionCount,
}: {
  studentId: string;
  name: string;
  email: string | null;
  membership: any;
  courseStates: any[];
  interventionCount: number;
}) {
  const statusColor =
    membership?.status === "active"
      ? "text-[var(--recovery-green)]"
      : membership?.status === "trialing"
        ? "text-[var(--warning)]"
        : membership?.status === "cancelled" || membership?.status === "cancelling"
          ? "text-[var(--critical)]"
          : "text-[var(--ink-muted)]";

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[var(--ink-muted)]" />
            <span className="font-serif text-[16px] text-[var(--ink-primary)]">{name}</span>
            {email && (
              <span className="flex items-center gap-1 font-mono text-[12px] text-[var(--ink-muted)]">
                <Mail className="size-3" />
                {email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {membership && (
              <Badge variant="outline" className={`font-mono text-[11px] uppercase ${statusColor}`}>
                {membership.status}
              </Badge>
            )}
            {interventionCount > 0 && (
              <Badge variant="outline" className="font-mono text-[11px]">
                <Megaphone className="mr-1 size-3" />
                {interventionCount} intervention{interventionCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {membership && (
          <div className="flex items-center gap-3 text-[12px] text-[var(--ink-secondary)]">
            <span>{membership.product?.name}</span>
            {membership.joinedAt && (
              <span className="font-mono text-[var(--ink-muted)]">
                joined {fmtRelative(membership.joinedAt)}
              </span>
            )}
          </div>
        )}

        {courseStates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {courseStates.map((cs: any) => (
              <div
                key={cs.courseId}
                className="flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-1"
              >
                <GraduationCap className="size-3 text-[var(--ink-muted)]" />
                <span className="text-[11px] text-[var(--ink-secondary)]">{cs.course?.name}</span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
                  {cs.progressPercent}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Search/filter controls (server-rendered form) ───────────

function StudentFilters() {
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-[var(--ink-muted)]" />
        <input
          type="text"
          name="q"
          placeholder="Search by name or email…"
          className="h-9 w-full rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] pl-8 pr-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
        />
      </div>
      <div className="flex gap-2">
        <select
          name="status"
          className="h-9 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 text-[13px] text-[var(--ink-primary)]"
          defaultValue="all"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="cancelling">Cancelling</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          name="progress"
          className="h-9 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 text-[13px] text-[var(--ink-primary)]"
          defaultValue="all"
        >
          <option value="all">All progress</option>
          <option value="none">No progress</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </form>
  );
}

// ─── Fixture students ────────────────────────────────────────

function FixtureStudents({
  search,
  statusFilter,
  progressFilter,
}: {
  search?: string;
  statusFilter?: string;
  progressFilter?: string;
}) {
  const fixtureStudents = getFixtureStudents();
  const fixtureMemberships = getFixtureMemberships();
  const fixtureCourseStudents = getFixtureCourseStudents();
  const fixtureCourses = getFixtureCourses();

  // Join fixture data
  const rows = fixtureStudents.map((s) => {
    const memberships = fixtureMemberships.filter((m) => m.userId === s.id);
    const courseProgress = fixtureCourseStudents.filter((cs) => cs.userId === s.id);
    return { ...s, memberships, courseProgress };
  });

  // Apply filters
  let filtered = rows;
  if (search?.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }
  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter((r) =>
      r.memberships.some((m) => m.status === statusFilter),
    );
  }
  if (progressFilter === "none") {
    filtered = filtered.filter((r) => r.courseProgress.length === 0 || r.courseProgress.every((cs) => cs.completionRate === 0));
  } else if (progressFilter === "in_progress") {
    filtered = filtered.filter((r) =>
      r.courseProgress.some((cs) => cs.completionRate > 0 && cs.completionRate < 100),
    );
  } else if (progressFilter === "completed") {
    filtered = filtered.filter((r) => r.courseProgress.some((cs) => cs.completionRate === 100));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Students"
        description="Member directory with course progress, membership status, and rescue history."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture · {filtered.length} shown
        </Badge>
      </CompanyPageHeader>

      <div className="mb-4 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">Fixture mode.</span>{" "}
          Illustrative fixture outcome — data is from deterministic local seeds.
        </p>
      </div>

      <StudentFilters />

      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((student) => {
          const primaryMembership = student.memberships[0];
          const statusColor =
            primaryMembership?.status === "active"
              ? "text-[var(--recovery-green)]"
              : primaryMembership?.status === "trialing"
                ? "text-[var(--warning)]"
                : "text-[var(--critical)]";

          return (
            <Card key={student.id}>
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-[var(--ink-muted)]" />
                    <span className="font-serif text-[16px] text-[var(--ink-primary)]">{student.name}</span>
                    <span className="flex items-center gap-1 font-mono text-[12px] text-[var(--ink-muted)]">
                      <Mail className="size-3" />
                      {student.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {primaryMembership && (
                      <Badge variant="outline" className={`font-mono text-[11px] uppercase ${statusColor}`}>
                        {primaryMembership.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {primaryMembership && (
                  <div className="flex items-center gap-3 text-[12px] text-[var(--ink-secondary)]">
                    <span>
                      {fixtureCourses.find((c) => c.id === student.courseProgress[0]?.courseId)?.title ?? "—"}
                    </span>
                  </div>
                )}

                {student.courseProgress.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {student.courseProgress.map((cs) => {
                      const course = fixtureCourses.find((c) => c.id === cs.courseId);
                      return (
                        <div
                          key={cs.courseId}
                          className="flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-1"
                        >
                          <GraduationCap className="size-3 text-[var(--ink-muted)]" />
                          <span className="text-[11px] text-[var(--ink-secondary)]">{course?.title ?? cs.courseId}</span>
                          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-primary)]">
                            {cs.completionRate}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function fmtRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
