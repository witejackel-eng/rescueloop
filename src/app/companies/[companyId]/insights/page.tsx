// /companies/[companyId]/insights
//
// Database-backed insights page. Course funnel, lesson-friction map,
// blocker distribution, sample size, course-average comparison,
// recommendation workflow states, evidence timestamps, data-quality warnings.
// Does NOT fabricate statistical certainty from small samples.

import "server-only";
import { redirect } from "next/navigation";
import { getProviderMode } from "@/providers";
import {
  FIXTURE_COMPANY_ID,
  getCourses,
  getCourseStudents,
  getLessonInteractions,
  getMemberships,
} from "@/providers/fixtures";
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
  BarChart3,
  FlaskConical,
  AlertTriangle,
  GraduationCap,
  TrendingDown,
  Users,
  BarChart2,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
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
    return <FixtureInsights />;
  }

  // ─── Whop mode ───────────────────────────────────────────────
  const [
    courses,
    courseStates,
    studentsCount,
    interventionsByState,
    blockerCounts,
  ] = await Promise.all([
    db.course.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        lessonCount: true,
        _count: { select: { studentStates: true, progressEvents: true } },
      },
    }),
    db.studentCourseState.findMany({
      where: { organizationId },
      select: {
        courseId: true,
        progressPercent: true,
        lessonsCompleted: true,
        totalLessons: true,
        lastActivityAt: true,
      },
    }),
    db.student.count({ where: { organizationId } }),
    db.intervention.groupBy({
      by: ["state"],
      where: { organizationId },
      _count: true,
    }),
    db.blockerResponse.groupBy({
      by: ["blocker"],
      where: { organizationId },
      _count: true,
    }),
  ]);

  // Lesson friction: count how many students stalled at each lesson
  const lessonFrictionMap: Record<string, Record<number, number>> = {};
  for (const course of courses) {
    const states = courseStates.filter((s) => s.courseId === course.id);
    const friction: Record<number, number> = {};
    for (const s of states) {
      if (s.lessonsCompleted > 0 && s.progressPercent < 100) {
        friction[s.lessonsCompleted] = (friction[s.lessonsCompleted] ?? 0) + 1;
      }
    }
    lessonFrictionMap[course.id] = friction;
  }

  // Compute course funnels
  const courseFunnels = courses.map((course) => {
    const states = courseStates.filter((s) => s.courseId === course.id);
    const started = states.length;
    const completed = states.filter((s) => s.progressPercent === 100).length;
    const stalled = states.filter(
      (s) => s.progressPercent > 0 && s.progressPercent < 100 && s.lastActivityAt,
    ).length;
    const noProgress = states.filter((s) => s.lessonsCompleted === 0).length;
    const avgProgress =
      started > 0
        ? Math.round(states.reduce((sum, s) => sum + s.progressPercent, 0) / started)
        : 0;

    return {
      courseId: course.id,
      courseName: course.name,
      lessonCount: course.lessonCount,
      started,
      completed,
      stalled,
      noProgress,
      avgProgress,
      sampleSize: started,
    };
  });

  // Cross-course average for comparison
  const globalAvgProgress =
    courseStates.length > 0
      ? Math.round(
          courseStates.reduce((sum, s) => sum + s.progressPercent, 0) /
            courseStates.length,
        )
      : 0;

  const totalInterventions = interventionsByState.reduce(
    (sum, r) => sum + r._count,
    0,
  );
  const sampleIsSmall = studentsCount < 30;

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Insights"
        description="Friction findings, course funnels, and recommended next actions."
      >
        <Badge variant="outline" className="font-mono text-[11px]">
          {courses.length} course{courses.length !== 1 ? "s" : ""}
        </Badge>
      </CompanyPageHeader>

      {/* Small sample / data-quality warning */}
      {sampleIsSmall && (
        <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
          <AlertTriangle className="size-4 shrink-0 text-[var(--warning)]" />
          <p className="text-[13px] text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink-primary)]">Small sample size.</span>{" "}
            With {studentsCount} student{studentsCount !== 1 ? "s" : ""}, statistical conclusions
            are unreliable. Trends shown are observational only.
          </p>
        </div>
      )}

      {/* Course funnels */}
      <div className="grid gap-4 lg:grid-cols-2">
        {courseFunnels.map((funnel) => (
          <Card key={funnel.courseId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <GraduationCap className="size-4 text-[var(--ink-muted)]" />
                {funnel.courseName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Enrolled" value={funnel.started} />
                <MiniStat label="Avg progress" value={`${funnel.avgProgress}%`} />
                <MiniStat label="Completed" value={funnel.completed} />
                <MiniStat label="Stalled" value={funnel.stalled} />
              </div>

              {/* Progress distribution bar */}
              {funnel.started > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                    Progress distribution
                  </p>
                  <div className="flex h-3 overflow-hidden rounded-full">
                    <div
                      className="bg-[var(--recovery-green)]"
                      style={{ width: `${(funnel.completed / funnel.started) * 100}%` }}
                    />
                    <div
                      className="bg-[var(--warning)]"
                      style={{ width: `${(funnel.stalled / funnel.started) * 100}%` }}
                    />
                    <div
                      className="bg-[var(--ink-muted)]/20"
                      style={{ width: `${(funnel.noProgress / funnel.started) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-[10px] text-[var(--ink-muted)]">
                    <span className="flex items-center gap-1">
                      <span className="inline-block size-2 rounded-full bg-[var(--recovery-green)]" />
                      completed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block size-2 rounded-full bg-[var(--warning)]" />
                      stalled
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block size-2 rounded-full bg-[var(--ink-muted)]/20" />
                      no progress
                    </span>
                  </div>
                </div>
              )}

              {/* Course-average comparison */}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[var(--ink-muted)]">vs. avg:</span>
                <span
                  className={`font-mono tabular-nums ${
                    funnel.avgProgress > globalAvgProgress
                      ? "text-[var(--recovery-green)]"
                      : funnel.avgProgress < globalAvgProgress
                        ? "text-[var(--warning)]"
                        : "text-[var(--ink-secondary)]"
                  }`}
                >
                  {funnel.avgProgress > globalAvgProgress
                    ? `+${funnel.avgProgress - globalAvgProgress}%`
                    : funnel.avgProgress < globalAvgProgress
                      ? `-${globalAvgProgress - funnel.avgProgress}%`
                      : "same"}
                </span>
              </div>

              {/* Lesson friction for this course */}
              {Object.keys(lessonFrictionMap[funnel.courseId] ?? {}).length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                    Lesson friction (students stalled at lesson)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(lessonFrictionMap[funnel.courseId] ?? {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([lesson, count]) => (
                        <span
                          key={lesson}
                          className="flex items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          <TrendingDown className="size-2.5 text-[var(--warning)]" />
                          L{lesson}
                          <span className="tabular-nums text-[var(--ink-primary)]">
                            {count}
                          </span>
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                sample: {funnel.sampleSize} &middot; {funnel.lessonCount} lessons
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {courseFunnels.length === 0 && (
        <EmptyStateCard
          title="No course data yet"
          description="Insights will appear as students interact with your courses."
          icon={BarChart3}
        />
      )}

      {/* Intervention workflow states */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <BarChart2 className="size-4 text-[var(--ink-muted)]" />
              Intervention workflow states
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalInterventions === 0 ? (
              <p className="text-[13px] text-[var(--ink-muted)]">
                No interventions recorded yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {interventionsByState.map((r) => (
                  <div key={r.state} className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px] uppercase">
                      {r.state.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-mono tabular-nums text-[14px] text-[var(--ink-primary)]">
                      {r._count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blocker distribution */}
      {blockerCounts.length > 0 && (
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <MapPin className="size-4 text-[var(--ink-muted)]" />
                Blocker distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {blockerCounts.map((r) => (
                  <div key={r.blocker} className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px] uppercase">
                      {r.blocker.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-mono tabular-nums text-[14px] text-[var(--ink-primary)]">
                      {r._count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Fixture insights ────────────────────────────────────────

function FixtureInsights() {
  const courses = getCourses();
  const courseStudents = getCourseStudents();
  const interactions = getLessonInteractions();
  const memberships = getMemberships();

  const courseFunnels = courses.map((course) => {
    const enrolled = courseStudents.filter((cs) => cs.courseId === course.id);
    const completed = enrolled.filter((cs) => cs.completionRate === 100).length;
    const inProgress = enrolled.filter(
      (cs) => cs.completionRate > 0 && cs.completionRate < 100,
    ).length;
    const noProgress = enrolled.filter((cs) => cs.completionRate === 0).length;
    const avgProgress =
      enrolled.length > 0
        ? Math.round(
            enrolled.reduce((sum, cs) => sum + cs.completionRate, 0) / enrolled.length,
          )
        : 0;

    return {
      courseId: course.id,
      courseName: course.title,
      lessonCount: course.lessonCount,
      enrolled: enrolled.length,
      completed,
      inProgress,
      noProgress,
      avgProgress,
    };
  });

  // Lesson friction from fixture interactions
  const fixtureFriction: Record<string, Record<number, number>> = {};
  for (const course of courses) {
    const courseInteractions = interactions.filter(
      (i) => i.courseId === course.id,
    );
    const lessonCounts: Record<number, number> = {};
    for (const int of courseInteractions) {
      const match = int.lessonId.match(/_l(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        lessonCounts[idx] = (lessonCounts[idx] ?? 0) + 1;
      }
    }
    fixtureFriction[course.id] = lessonCounts;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Insights"
        description="Friction findings, course funnels, and recommended next actions."
      >
        <Badge
          variant="outline"
          className="border-[var(--warning)]/30 bg-[var(--warning-light)]/40 font-mono text-[11px] uppercase tracking-wide text-[var(--warning)]"
        >
          <FlaskConical className="mr-1 size-3" />
          fixture
        </Badge>
      </CompanyPageHeader>

      <div className="mb-5 flex items-center gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
        <FlaskConical className="size-4 shrink-0 text-[var(--warning)]" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">
            Illustrative fixture outcome
          </span>{" "}
          &mdash; all data is from deterministic local seeds. Trends are observational only.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {courseFunnels.map((funnel) => (
          <Card key={funnel.courseId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <GraduationCap className="size-4 text-[var(--ink-muted)]" />
                {funnel.courseName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Enrolled" value={funnel.enrolled} />
                <MiniStat label="Avg progress" value={`${funnel.avgProgress}%`} />
                <MiniStat label="Completed" value={funnel.completed} />
                <MiniStat label="In progress" value={funnel.inProgress} />
              </div>
              {funnel.enrolled > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                    Progress distribution
                  </p>
                  <div className="flex h-3 overflow-hidden rounded-full">
                    <div
                      className="bg-[var(--recovery-green)]"
                      style={{ width: `${(funnel.completed / funnel.enrolled) * 100}%` }}
                    />
                    <div
                      className="bg-[var(--warning)]"
                      style={{ width: `${(funnel.inProgress / funnel.enrolled) * 100}%` }}
                    />
                    <div
                      className="bg-[var(--ink-muted)]/20"
                      style={{ width: `${(funnel.noProgress / funnel.enrolled) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Fixture lesson interactions */}
              {Object.keys(fixtureFriction[funnel.courseId] ?? {}).length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                    Lesson interactions (fixture)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(fixtureFriction[funnel.courseId] ?? {})
                      .slice(0, 6)
                      .map(([lesson, count]) => (
                        <span
                          key={lesson}
                          className="flex items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          L{lesson}
                          <span className="tabular-nums text-[var(--ink-primary)]">
                            {count}
                          </span>
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                sample: {funnel.enrolled} &middot; {funnel.lessonCount} lessons
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fixture intervention states */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <BarChart2 className="size-4 text-[var(--ink-muted)]" />
              Intervention workflow states
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] text-[var(--ink-muted)]">
              No interventions in fixture mode &mdash; workflow states are populated by
              real Whop webhook processing and admin actions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
        description="Only company admins can view insights."
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

// ─── Shared ──────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] text-[var(--ink-muted)]">{label}</p>
      <p className="font-mono tabular-nums text-[16px] text-[var(--ink-primary)]">{value}</p>
    </div>
  );
}
