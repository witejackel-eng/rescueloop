// Whop adapter for the `ProgressProvider` contract.
//
// Wraps:
//   - `getWhopClient().courseLessonInteractions.list()`
//   - `getWhopClient().courseStudents.list()`
//
// so business logic never imports the Whop SDK directly.

import "server-only";

import { getWhopClient } from "@/lib/whop/client";
import {
  CourseStudentPage,
  ExternalCourseLessonInteraction,
  ExternalCourseStudent,
  ListCourseStudentsParams,
  ListProgressParams,
  ProgressPage,
} from "@/providers/contracts";
import type { CourseLessonInteractionListItem } from "@whop/sdk/resources/shared";
import type { CourseStudentListResponse } from "@whop/sdk/resources/course-students";
import type { CursorPage } from "@whop/sdk/core/pagination";
import { assertWhopConfigured, mapWhopError } from "./errors";

/**
 * Whop implementation of the `ProgressProvider` contract.
 *
 * The Whop SDK's `courseLessonInteractions.list({ course_id })` returns
 * `CourseLessonInteractionListItem`, whose type does NOT include the
 * parent `course` object (only the full `CourseLessonInteraction` returned
 * by `retrieve()` does). We carry the input `courseId` through to the
 * mapped records to keep the contract field populated.
 *
 * TODO: Verify against real Whop API during Phase 2 — the live list
 * response may include `course.id`; if so, prefer it over the input.
 */
export class WhopProgressProvider {
  async listLessonInteractions(
    params: ListProgressParams,
  ): Promise<ProgressPage> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const page = (await client.courseLessonInteractions.list({
        course_id: params.courseId,
        after: params.cursor ?? undefined,
        first: params.pageSize ?? undefined,
      })) as CursorPage<CourseLessonInteractionListItem>;

      const items = (page.data ?? []).map((item) =>
        mapLessonInteraction(item, params.courseId),
      );

      return {
        items,
        nextCursor: page.page_info?.end_cursor ?? null,
      };
    } catch (error) {
      throw mapWhopError(error);
    }
  }

  async listCourseStudents(
    params: ListCourseStudentsParams,
  ): Promise<CourseStudentPage> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const page = (await client.courseStudents.list({
        course_id: params.courseId,
        after: params.cursor ?? undefined,
        first: params.pageSize ?? undefined,
      })) as CursorPage<CourseStudentListResponse>;

      const nowIso = new Date().toISOString();
      const items = (page.data ?? []).map((student) =>
        mapCourseStudent(student, params.courseId, nowIso),
      );

      return {
        items,
        nextCursor: page.page_info?.end_cursor ?? null,
      };
    } catch (error) {
      throw mapWhopError(error);
    }
  }
}

// ─── Mappers ─────────────────────────────────────────────────

function mapLessonInteraction(
  item: CourseLessonInteractionListItem,
  fallbackCourseId: string,
): ExternalCourseLessonInteraction {
  // Try to read `course.id` off the live payload; fall back to the input.
  // TODO: Verify against real Whop API during Phase 2.
  const courseFromPayload = (
    item as unknown as { course?: { id?: string } | null }
  ).course;
  const courseId = courseFromPayload?.id ?? fallbackCourseId;

  return {
    id: item.id,
    userId: item.user?.id ?? "",
    courseId,
    lessonId: item.lesson?.id ?? "",
    lessonTitle: item.lesson?.title ?? null,
    completed: item.completed,
    createdAt: item.created_at,
    // The list-item type has no `updated_at`, so `sourceTimestamp` falls
    // back to `created_at`.
    sourceTimestamp: item.created_at,
  };
}

function mapCourseStudent(
  student: CourseStudentListResponse,
  courseId: string,
  nowIso: string,
): ExternalCourseStudent {
  return {
    userId: student.user?.id ?? "",
    courseId,
    completionRate: student.completion_rate,
    completedLessons: student.completed_lessons_count,
    totalLessons: student.total_lessons_count,
    firstInteractionAt: unixToIso(student.first_interaction_at),
    lastInteractionAt: unixToIso(student.last_interaction_at),
    // `CourseStudentListResponse` has no `updated_at` field.
    // TODO: Verify against real Whop API during Phase 2.
    sourceTimestamp: nowIso,
  };
}

/**
 * Convert a Whop Unix-timestamp string (seconds since epoch) to an ISO 8601
 * string. Returns `null` if the input is missing or unparseable.
 */
function unixToIso(unixSeconds: string | null | undefined): string | null {
  if (!unixSeconds) return null;
  const seconds = Number(unixSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

/** Re-exported for the bundle index. */
export const whopProgressProvider = new WhopProgressProvider();
