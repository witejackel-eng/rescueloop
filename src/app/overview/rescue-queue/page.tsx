// /overview/rescue-queue — public demo of the rescue queue.
//
// Same isolation invariants as /overview: no auth, no DB, no API calls,
// no mutations. Reads from fixture providers and renders a simulated
// rescue queue experience.

import "server-only";
import {
  getMemberships,
  getCourses,
  getCourseStudents,
  getStudents,
} from "@/providers/fixtures";
import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { PublicDemoWorkspace } from "@/components/rescueloop/overview/public-demo-workspace";
import { getProducts } from "@/providers/fixtures";

export const dynamic = "force-dynamic";

export default function OverviewRescueQueuePage() {
  const memberships = getMemberships();
  const courses = getCourses();
  const products = getProducts();
  const courseStudents = getCourseStudents();
  const students = getStudents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <DemoDisclosureBanner />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          Rescue Queue · Demo
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A simulated rescue queue. Approve, schedule, or send — every action
          is local. Nothing is enqueued.
        </p>
      </div>

      <PublicDemoWorkspace
        memberships={memberships}
        courses={courses}
        products={products}
        students={students}
        courseStudents={courseStudents}
      />
    </div>
  );
}
