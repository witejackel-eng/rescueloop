import "server-only";

// ─────────────────────────────────────────────────────────────
// FixtureProgressProvider — returns deterministic lesson
// interactions and course-student summaries from the local
// fixture store. Implements `ProgressProvider`.
// ─────────────────────────────────────────────────────────────

import type {
  CourseStudentPage,
  ListCourseStudentsParams,
  ListProgressParams,
  ProgressPage,
  ProgressProvider,
} from "@/providers/contracts";
import {
  decodeCursor,
  encodeCursor,
  getCourseStudents,
  getLessonInteractions,
  makeFixtureRateLimit,
} from "./fixtures-data";

const DEFAULT_PAGE_SIZE = 50;

export class FixtureProgressProvider implements ProgressProvider {
  async listLessonInteractions(params: ListProgressParams): Promise<ProgressPage> {
    // Fixture store is single-tenant; companyId is accepted but ignored.
    void params.companyId;

    const all = getLessonInteractions();
    const filtered = all.filter((i) => i.courseId === params.courseId);

    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);

    const items = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    const nextCursor = nextOffset < filtered.length ? encodeCursor(nextOffset) : null;

    return {
      items,
      nextCursor,
      rateLimit: makeFixtureRateLimit(),
    };
  }

  async listCourseStudents(params: ListCourseStudentsParams): Promise<CourseStudentPage> {
    void params.companyId;

    const all = getCourseStudents();
    const filtered = all.filter((s) => s.courseId === params.courseId);

    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);

    const items = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    const nextCursor = nextOffset < filtered.length ? encodeCursor(nextOffset) : null;

    return {
      items,
      nextCursor,
      rateLimit: makeFixtureRateLimit(),
    };
  }
}
