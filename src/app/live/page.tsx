import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { whopConfig } from "@/lib/whop/api";
import { ManualSyncButton } from "@/components/live/manual-sync-button";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null): string {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function displayMember(member: { name: string | null; username: string | null; email: string | null }) {
  return member.name ?? member.username ?? member.email ?? "Unknown member";
}

export default async function LiveWorkspacePage() {
  const installation = await prisma.companyInstallation.findUnique({
    where: { whopCompanyId: whopConfig.defaultCompanyId },
    include: {
      _count: {
        select: {
          courses: true,
          members: true,
          memberships: true,
          enrollments: true,
          riskDetections: true,
        },
      },
      courses: {
        where: { isArchived: false },
        orderBy: { updatedAt: "desc" },
        take: 6,
      },
      members: {
        orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
        take: 8,
      },
      riskDetections: {
        where: { state: "OPEN" },
        orderBy: [{ score: "desc" }, { detectedAt: "desc" }],
        take: 8,
        include: {
          member: true,
          course: true,
        },
      },
      syncRuns: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  const counts = installation?._count ?? {
    courses: 0,
    members: 0,
    memberships: 0,
    enrollments: 0,
    riskDetections: 0,
  };

  const metrics = [
    { label: "Courses", value: counts.courses },
    { label: "Members", value: counts.members },
    { label: "Memberships", value: counts.memberships },
    { label: "Enrollments", value: counts.enrollments },
    { label: "Risk signals", value: counts.riskDetections },
  ];

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-8 text-[var(--ink-primary)] lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1280px]">
        <header className="flex flex-col gap-6 border-b border-[var(--hairline)] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              RescueLoop
            </Link>
            <h1 className="mt-3 font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.95]">
              Live Whop workspace
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--ink-secondary)]">
              This page reads RescueLoop&apos;s synchronized PostgreSQL records—not the demonstration dataset.
            </p>
          </div>
          <ManualSyncButton />
        </header>

        <section className="grid border-b border-l border-[var(--hairline)] sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <article key={metric.label} className="border-r border-t border-[var(--hairline)] bg-[var(--surface)] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">{metric.label}</p>
              <p className="mt-5 font-serif text-4xl">{metric.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="border border-[var(--hairline)] bg-[var(--surface)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Connection health</p>
                <h2 className="mt-2 font-serif text-3xl">{installation ? "Database synchronized" : "Awaiting first sync"}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${installation?.lastSyncError ? "bg-[var(--critical-light)] text-[var(--critical)]" : "bg-[var(--recovery-light)] text-[var(--recovery-green)]"}`}>
                {installation?.lastSyncError ? "Needs attention" : "Operational"}
              </span>
            </div>

            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[12px] text-[var(--ink-muted)]">Whop company</dt>
                <dd className="mt-1 font-mono text-[12px]">{whopConfig.defaultCompanyId}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[var(--ink-muted)]">Last successful sync</dt>
                <dd className="mt-1 text-[13px]">{formatDate(installation?.lastSyncedAt ?? null)}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[var(--ink-muted)]">Latest run status</dt>
                <dd className="mt-1 text-[13px]">{installation?.syncRuns[0]?.status ?? "No run yet"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[var(--ink-muted)]">Last error</dt>
                <dd className="mt-1 text-[13px] text-[var(--critical)]">{installation?.lastSyncError ?? "None"}</dd>
              </div>
            </dl>
          </article>

          <article className="border border-[var(--hairline)] bg-[var(--dark-section)] p-6 text-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--dark-secondary)]">Next product milestone</p>
            <h2 className="mt-3 font-serif text-3xl">Turn risk signals into a real queue.</h2>
            <p className="mt-4 text-[14px] leading-6 text-[var(--dark-secondary)]">
              Once real members appear here, the next layer is creator review, intervention drafting, approval, delivery and outcome tracking.
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="border border-[var(--hairline)] bg-[var(--surface)]">
            <div className="border-b border-[var(--hairline)] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Synced courses</p>
              <h2 className="mt-2 font-serif text-2xl">Course inventory</h2>
            </div>
            <div className="divide-y divide-[var(--hairline)]">
              {installation?.courses.length ? installation.courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-[14px] font-medium">{course.title}</p>
                    <p className="mt-1 text-[12px] text-[var(--ink-muted)]">{course.lessonCount} lessons · {course.studentCount} students</p>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--ink-muted)]">{course.whopCourseId}</span>
                </div>
              )) : (
                <p className="p-5 text-[13px] leading-6 text-[var(--ink-secondary)]">No courses have been returned by Whop yet. Create a course in the connected company or approve the course analytics permissions, then run sync again.</p>
              )}
            </div>
          </article>

          <article className="border border-[var(--hairline)] bg-[var(--surface)]">
            <div className="border-b border-[var(--hairline)] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Open detections</p>
              <h2 className="mt-2 font-serif text-2xl">Risk queue preview</h2>
            </div>
            <div className="divide-y divide-[var(--hairline)]">
              {installation?.riskDetections.length ? installation.riskDetections.map((risk) => (
                <div key={risk.id} className="grid grid-cols-[1fr_auto] gap-4 p-5">
                  <div>
                    <p className="text-[14px] font-medium">{displayMember(risk.member)}</p>
                    <p className="mt-1 text-[12px] text-[var(--ink-muted)]">{risk.type.replaceAll("_", " ")} · {risk.course?.title ?? "Membership-level signal"}</p>
                    <p className="mt-3 text-[13px] leading-5 text-[var(--ink-secondary)]">{risk.reason}</p>
                  </div>
                  <span className="font-mono text-xl text-[var(--warning)]">{risk.score}</span>
                </div>
              )) : (
                <p className="p-5 text-[13px] leading-6 text-[var(--ink-secondary)]">No risk detections exist yet. They will appear automatically when synced students have never started, are inactive for seven days, or have a pending cancellation.</p>
              )}
            </div>
          </article>
        </section>

        <section className="mt-6 border border-[var(--hairline)] bg-[var(--surface)]">
          <div className="border-b border-[var(--hairline)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Member records</p>
            <h2 className="mt-2 font-serif text-2xl">Recently active members</h2>
          </div>
          <div className="grid divide-y divide-[var(--hairline)] md:grid-cols-2 md:divide-x md:divide-y-0">
            {installation?.members.length ? installation.members.map((member) => (
              <div key={member.id} className="p-5">
                <p className="text-[14px] font-medium">{displayMember(member)}</p>
                <p className="mt-1 text-[12px] text-[var(--ink-muted)]">{member.email ?? member.whopUserId}</p>
                <p className="mt-3 font-mono text-[10px] text-[var(--ink-muted)]">Last activity: {formatDate(member.lastActivityAt)}</p>
              </div>
            )) : (
              <p className="p-5 text-[13px] leading-6 text-[var(--ink-secondary)]">No Whop member records are stored yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
