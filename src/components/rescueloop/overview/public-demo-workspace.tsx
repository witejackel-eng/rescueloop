"use client";

// PublicDemoWorkspace — interactive, fully client-side simulated
// RescueLoop workspace for the `/overview` public demo route.
//
// INVARIANTS:
//   - NO network requests. No fetch(), no API calls.
//   - All state is local React state seeded from fixture data passed
//     in as props from the server.
//   - Every "action" (approve, schedule, send) updates local state
//     and renders a "Simulated" notice. Nothing is enqueued.
//   - No use of `useEffect` to call out to APIs or websockets.
//
// This component is intentionally kept small and self-contained so
// that a Playwright test can assert that mounting it triggers zero
// requests to /api/*.

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  Send,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import type {
  ExternalMembership,
  ExternalCourse,
  ExternalProduct,
  ExternalCourseStudent,
} from "@/providers/contracts";

// Adapt the fixture Student shape — the public demo only needs a
// stable label + the related userId to cross-reference memberships.
interface DemoStudent {
  id: string;
  name: string;
  email: string;
}

interface PublicDemoWorkspaceProps {
  memberships: ExternalMembership[];
  courses: ExternalCourse[];
  products: ExternalProduct[];
  students: DemoStudent[];
  courseStudents: ExternalCourseStudent[];
}

type SimulatedAction =
  | { kind: "approved"; studentId: string; studentName: string; at: string }
  | { kind: "scheduled"; studentId: string; studentName: string; at: string }
  | { kind: "sent"; studentId: string; studentName: string; at: string };

interface Candidate {
  membershipId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  reason: string;
  lastActivityDaysAgo: number;
}

/**
 * Build the rescue queue from the fixture snapshot — same logic as
 * `/dashboard/co_fixture_cgl`'s fixture rescue queue, but inlined so
 * the public demo makes zero cross-route lookups.
 */
function buildCandidates(
  memberships: ExternalMembership[],
  students: DemoStudent[],
  courses: ExternalCourse[],
  courseStudents: ExternalCourseStudent[],
): Candidate[] {
  const candidates: Candidate[] = [];
  for (const m of memberships) {
    if (m.status !== "active") continue;
    const hasProgress = courseStudents.some((cs) => cs.userId === m.userId);
    if (hasProgress) continue;
    const student = students.find((s) => s.id === m.userId);
    if (!student) continue;
    const course = courses.find((c) => c.experienceId === m.productId) ?? courses[0];
    if (!course) continue;
    candidates.push({
      membershipId: m.id,
      studentId: student.id,
      studentName: student.name,
      courseId: course.id,
      courseTitle: course.title ?? "(untitled course)",
      reason: "Active member, no lesson progress detected.",
      lastActivityDaysAgo: 14,
    });
  }
  return candidates.slice(0, 8);
}

export function PublicDemoWorkspace({
  memberships,
  courses,
  products,
  students,
  courseStudents,
}: PublicDemoWorkspaceProps) {
  const initialCandidates = useMemo(
    () => buildCandidates(memberships, students, courses, courseStudents),
    [memberships, students, courses, courseStudents],
  );

  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [actions, setActions] = useState<SimulatedAction[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  function pushAction(action: SimulatedAction, message: string) {
    setActions((prev) => [action, ...prev].slice(0, 6));
    setNotice(message);
    // Auto-clear the notice after a few seconds.
    window.setTimeout(() => setNotice((cur) => (cur === message ? null : cur)), 3000);
  }

  function handleApprove(c: Candidate) {
    setCandidates((prev) => prev.filter((x) => x.membershipId !== c.membershipId));
    pushAction(
      {
        kind: "approved",
        studentId: c.studentId,
        studentName: c.studentName,
        at: new Date().toISOString(),
      },
      `Simulated approval for ${c.studentName}. In a connected workspace this would enqueue a notification job after a send-time safety re-check.`,
    );
  }

  function handleSchedule(c: Candidate) {
    pushAction(
      {
        kind: "scheduled",
        studentId: c.studentId,
        studentName: c.studentName,
        at: new Date().toISOString(),
      },
      `Simulated schedule for ${c.studentName}. In a connected workspace this would queue a durable Inngest job — never a fire-and-forget send.`,
    );
  }

  function handleSendNow(c: Candidate) {
    setCandidates((prev) => prev.filter((x) => x.membershipId !== c.membershipId));
    pushAction(
      {
        kind: "sent",
        studentId: c.studentId,
        studentName: c.studentName,
        at: new Date().toISOString(),
      },
      `Simulated send for ${c.studentName}. The Whop provider would record "accepted" — never "delivered" — because the Whop API does not return delivery evidence.`,
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-[var(--hairline)] pb-3">
        <CardTitle className="flex items-center justify-between font-serif text-base">
          <span className="flex items-center gap-2">
            <Megaphone className="size-4 text-[var(--recovery-green)]" />
            Rescue Queue · simulated
          </span>
          <Badge
            variant="outline"
            className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]"
          >
            {candidates.length} awaiting
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {notice && (
          <div className="border-b border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/40 px-4 py-3 text-[13px] leading-snug text-[var(--ink-secondary)]">
            <AlertTriangle className="mr-1 inline size-3.5 align-text-bottom text-[var(--recovery-green)]" />
            {notice}
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <CheckCircle2 className="size-6 text-[var(--recovery-green)]" />
            <p className="text-[14px] font-medium text-[var(--ink-primary)]">
              Queue cleared (simulated)
            </p>
            <p className="text-[12px] text-[var(--ink-muted)]">
              Reload the page to restore the demo candidate list.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {candidates.map((c) => (
              <li
                key={c.membershipId}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-[var(--ink-primary)]">
                    {c.studentName}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-secondary)]">
                    {c.courseTitle} · {c.reason}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--ink-muted)]">
                    last activity {c.lastActivityDaysAgo}d ago
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSchedule(c)}
                  >
                    <Clock className="mr-1 size-3.5" />
                    Schedule
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendNow(c)}
                  >
                    <Send className="mr-1 size-3.5" />
                    Simulate send
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApprove(c)}
                  >
                    <CheckCircle2 className="mr-1 size-3.5" />
                    Approve
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {actions.length > 0 && (
          <div className="border-t border-[var(--hairline)] bg-[var(--canvas-elevated)] px-4 py-3">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
              Recent simulated actions
            </p>
            <ul className="flex flex-col gap-1 text-[12px]">
              {actions.map((a, i) => (
                <li
                  key={`${a.kind}-${a.studentId}-${a.at}-${i}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-[var(--ink-secondary)]">
                    <span className="font-mono uppercase">{a.kind}</span>{" "}
                    · {a.studentName}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                    {new Date(a.at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-[var(--hairline)] px-4 py-3 text-[11px] leading-snug text-[var(--ink-muted)]">
          Demo snapshot · {memberships.length} memberships ·{" "}
          {courses.length} courses · {products.length} products ·{" "}
          {students.length} students. All figures illustrative.
        </div>
      </CardContent>
    </Card>
  );
}
