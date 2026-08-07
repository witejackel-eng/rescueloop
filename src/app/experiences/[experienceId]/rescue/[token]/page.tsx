// /experiences/[experienceId]/rescue/[token]
//
// Server component wrapper. Verifies the opaque student access token, loads
// the intervention + course + campaign context, then renders the interactive
// client experience.
//
// The token is the only source of truth — the experienceId in the URL is
// accepted but never trusted for authorization.
//
// WP05 enhancements:
// - Checks for already-responded state and shows confirmation
// - Passes the creator's edited message (if any) for display
// - Uses enhanced non-enumerating token validation
// - Never exposes churn/revenue/candidate ranking language

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireStudentInterventionAccess } from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import {
  RescueExperience,
  StudentLinkError,
  AlreadyRespondedView,
} from "@/components/rescueloop/student/rescue-experience";

export const dynamic = "force-dynamic";

// Student-facing metadata — calm, no commercial language.
export const metadata: Metadata = {
  title: "Continue your course — RescueLoop",
  description: "Pick up where you left off. We're here to help.",
  robots: { index: false, follow: false },
};

export default async function StudentRescuePage({
  params,
}: {
  params: Promise<{ experienceId: string; token: string }>;
}) {
  const { token, experienceId } = await params;

  // Verify the opaque token (throws a Response on failure)
  let access;
  try {
    access = await requireStudentInterventionAccess(token);
  } catch (error) {
    if (error instanceof Response) {
      const status = error.status;
      let body: { error?: string } = {};
      try {
        body = await error.json();
      } catch {
        // ignore — use the status alone
      }
      const message = body.error ?? "Invalid or expired link";
      return (
        <StudentLinkError
          title={
            message === "Reminders stopped"
              ? "Reminders stopped"
              : status === 404
                ? "This link is no longer available"
                : "This link has expired"
          }
          description={
            message === "Reminders stopped"
              ? "You've already asked us to stop reminders for this course. If that was a mistake, contact the course creator."
              : status === 404
                ? "The support message you're looking for is no longer active. If you need help, reach out to the course creator."
                : "For your security, these links expire after a set time. Please use the most recent message from your course."
          }
        />
      );
    }
    throw error;
  }

  // Token is valid — load the full context
  const intervention = await db.intervention.findUnique({
    where: { id: access.interventionId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          memberships: {
            include: {
              product: { select: { name: true } },
            },
          },
          studentStates: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  lessonCount: true,
                  externalExperienceId: true,
                },
              },
            },
          },
        },
      },
      campaign: {
        select: {
          name: true,
          messageTemplate: true,
          quietHoursStart: true,
          quietHoursEnd: true,
        },
      },
      organization: {
        select: { name: true, timezone: true },
      },
      responses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          responseType: true,
          blockerType: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!intervention) {
    notFound();
  }

  const courseState = intervention.student.studentStates[0];
  const course = courseState?.course;
  const membership = intervention.student.memberships[0];

  // Check if the student has already responded
  const existingResponse = intervention.responses[0];

  // Derive the "next lesson" info from the course state
  const lessonsCompleted = courseState?.lessonsCompleted ?? 0;
  const totalLessons = course?.lessonCount ?? courseState?.totalLessons ?? 0;
  const nextLessonIndex = lessonsCompleted + 1;

  // Estimated lesson duration (calm, honest phrasing — never a hard claim)
  const lessonDuration = "~10–15 minutes";

  // The creator's message to the student — prefer the edited version if available
  const creatorMessage = intervention.messageEdited ?? intervention.messagePreview;

  // If the student has already responded, show the already-responded view
  if (existingResponse) {
    return (
      <AlreadyRespondedView
        responseType={existingResponse.responseType}
        blockerType={existingResponse.blockerType}
        studentName={intervention.student.name ?? "there"}
        courseName={course?.name ?? "your course"}
        creatorName={intervention.organization.name}
        respondedAt={existingResponse.createdAt}
      />
    );
  }

  return (
    <RescueExperience
      token={token}
      experienceId={experienceId}
      studentName={intervention.student.name ?? "there"}
      courseName={course?.name ?? "your course"}
      creatorName={intervention.organization.name}
      productName={membership?.product.name ?? null}
      lessonsCompleted={lessonsCompleted}
      totalLessons={totalLessons}
      progressPercent={courseState?.progressPercent ?? 0}
      nextLessonIndex={nextLessonIndex}
      whySupport={intervention.trigger}
      messagePreview={creatorMessage}
      lessonDuration={lessonDuration}
      quietHours={[intervention.campaign.quietHoursStart, intervention.campaign.quietHoursEnd]}
    />
  );
}
