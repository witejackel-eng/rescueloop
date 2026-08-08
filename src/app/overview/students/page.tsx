// /overview/students — public demo of the students view.
//
// Same isolation invariants as /overview: no auth, no DB, no API calls,
// no mutations. Reads from fixture providers.

import "server-only";
import { getMemberships, getCourses, getCourseStudents } from "@/providers/fixtures";
import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OverviewStudentsPage() {
  const memberships = getMemberships();
  const courses = getCourses();
  const courseStudents = getCourseStudents();

  const activeMembers = memberships.filter((m) => m.status === "active");
  const withProgress = activeMembers.filter((m) =>
    courseStudents.some((cs) => cs.userId === m.userId),
  );
  const noProgress = activeMembers.filter(
    (m) => !courseStudents.some((cs) => cs.userId === m.userId),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <DemoDisclosureBanner />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          Students · Demo
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A simulated students directory. Data is illustrative seed — not
          customer results.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Users className="size-4 text-[var(--ink-muted)]" />
              Active members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono tabular-nums text-2xl text-[var(--ink-primary)]">
              {activeMembers.length}
            </span>
            <span className="ml-2 text-[13px] text-[var(--ink-secondary)]">
              across {courses.length} course{courses.length !== 1 ? "s" : ""}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">With progress</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono tabular-nums text-2xl text-[var(--recovery-green)]">
              {withProgress.length}
            </span>
            <span className="ml-2 text-[13px] text-[var(--ink-secondary)]">
              active &amp; learning
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">No progress</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono tabular-nums text-2xl text-[var(--ink-primary)]">
              {noProgress.length}
            </span>
            <span className="ml-2 text-[13px] text-[var(--ink-secondary)]">
              rescue candidates
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <ul className="divide-y divide-[var(--hairline)]">
          {memberships.map((m) => {
            const hasProgress = courseStudents.some((cs) => cs.userId === m.userId);
            return (
              <li key={m.id} className="flex items-center justify-between px-2 py-3 text-[13px]">
                <span className="font-medium text-[var(--ink-primary)]">
                  {m.userId}
                </span>
                <span className="text-[var(--ink-secondary)]">
                  {m.status} · {hasProgress ? "has progress" : "no progress"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
