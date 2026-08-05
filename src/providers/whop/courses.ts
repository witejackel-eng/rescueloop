// Whop adapter for the `CoursesProvider` contract.
//
// Wraps `getWhopClient().courses.list()` and `retrieve()` so business logic
// never imports the Whop SDK directly. All Whop SDK errors are mapped to the
// typed `ProviderError` hierarchy from `@/providers/contracts/shared`.

import "server-only";

import { getWhopClient } from "@/lib/whop/client";
import {
  CoursePage,
  ExternalCourse,
  ListCoursesParams,
  ProviderNotFoundError,
} from "@/providers/contracts";
import type { Course, CourseListResponse } from "@whop/sdk/resources/courses";
import type { CursorPage } from "@whop/sdk/core/pagination";
import { APIError, NotFoundError } from "@whop/sdk";
import { assertWhopConfigured, mapWhopError } from "./errors";

/**
 * Whop implementation of the `CoursesProvider` contract.
 *
 * Whop courses belong to an experience, which belongs to a product, which
 * belongs to a company. The SDK's `courses.list({ company_id })` endpoint
 * returns course stubs without their parent experience_id, so callers that
 * need the experience mapping should filter by `experience_id` instead of
 * `company_id` (TODO: Verify against real Whop API during Phase 2 — the
 * live response may include `experience_id` even though the SDK type
 * omits it).
 */
export class WhopCoursesProvider {
  async list(params: ListCoursesParams): Promise<CoursePage> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const page = (await client.courses.list({
        company_id: params.companyId,
        after: params.cursor ?? undefined,
        first: params.pageSize ?? undefined,
      })) as CursorPage<CourseListResponse>;

      const items = (page.data ?? []).map(mapCourseListResponse);

      return {
        items,
        nextCursor: page.page_info?.end_cursor ?? null,
      };
    } catch (error) {
      throw mapWhopError(error);
    }
  }

  async retrieve(courseId: string): Promise<ExternalCourse | null> {
    try {
      assertWhopConfigured();
      const client = getWhopClient();

      const course = await client.courses.retrieve(courseId);
      return mapCourse(course);
    } catch (error) {
      if (error instanceof NotFoundError || (error instanceof APIError && error.status === 404)) {
        return null;
      }
      if (error instanceof ProviderNotFoundError) {
        return null;
      }
      throw mapWhopError(error);
    }
  }
}

// ─── Mappers ─────────────────────────────────────────────────

function mapCourseListResponse(course: CourseListResponse): ExternalCourse {
  // TODO: Verify against real Whop API during Phase 2 — the list response
  // type omits `experience_id`, but the live API may include it. We try to
  // read it via cast; otherwise fall back to an empty string so downstream
  // callers can still group by id.
  const experienceId = readExperienceId(course);

  return {
    id: course.id,
    title: course.title ?? null,
    experienceId,
    // List responses omit chapter/lesson data, so we cannot compute an
    // accurate lesson count without an additional `retrieve()` per course.
    // TODO: Verify against real Whop API during Phase 2 — populate via
    // `retrieve()` if list responses turn out to be light.
    lessonCount: 0,
    isPublished: course.visibility === "visible",
    sourceTimestamp: course.updated_at,
  };
}

function mapCourse(course: Course): ExternalCourse {
  const lessonCount = course.chapters.reduce(
    (sum, chapter) => sum + (chapter.lessons?.length ?? 0),
    0,
  );

  return {
    id: course.id,
    title: course.title ?? null,
    experienceId: readExperienceId(course),
    lessonCount,
    isPublished: course.visibility === "visible",
    sourceTimestamp: course.updated_at,
  };
}

/**
 * Try to read `experience_id` off a Whop course payload even though the
 * SDK type does not declare it. Returns an empty string when absent.
 */
function readExperienceId(course: CourseListResponse | Course): string {
  const raw = course as unknown as { experience_id?: string | null };
  return raw.experience_id ?? "";
}

/** Re-exported for the bundle index. */
export const whopCoursesProvider = new WhopCoursesProvider();
