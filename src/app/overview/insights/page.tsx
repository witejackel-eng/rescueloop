// /overview/insights — public demo of the insights/course intelligence view.
//
// Same isolation invariants as /overview: no auth, no DB, no API calls,
// no mutations. Reads from fixture providers.

import "server-only";
import { getCourses, getCourseStudents, getMemberships } from "@/providers/fixtures";
import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OverviewInsightsPage() {
  const courses = getCourses();
  const courseStudents = getCourseStudents();
  const memberships = getMemberships();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <DemoDisclosureBanner />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          Insights · Demo
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A simulated course intelligence view. Funnel data and friction
          findings are illustrative.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => {
          const enrolled = memberships.filter(
            (m) => m.productId === course.experienceId && m.status === "active",
          ).length;
          const withProgress = courseStudents.filter(
            (cs) => cs.courseId === course.id,
          ).length;
          const pct = enrolled > 0 ? Math.round((withProgress / enrolled) * 100) : 0;
          return (
            <Card key={course.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif text-base">
                  <BarChart3 className="size-4 text-[var(--ink-muted)]" />
                  {course.title ?? course.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-secondary)]">Active enrolled</span>
                  <span className="font-mono tabular-nums text-[var(--ink-primary)]">{enrolled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-secondary)]">With progress</span>
                  <span className="font-mono tabular-nums text-[var(--ink-primary)]">{withProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-secondary)]">Activation rate (demo)</span>
                  <span className="font-mono tabular-nums text-[var(--recovery-green)]">{pct}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
