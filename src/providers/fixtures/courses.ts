import "server-only";

// ─────────────────────────────────────────────────────────────
// FixtureCoursesProvider — returns deterministic course data
// from the local fixture store. Implements `CoursesProvider`.
// ─────────────────────────────────────────────────────────────

import type {
  CoursePage,
  CoursesProvider,
  ExternalCourse,
  ListCoursesParams,
} from "@/providers/contracts";
import {
  decodeCursor,
  encodeCursor,
  getCourses,
  makeFixtureRateLimit,
} from "./fixtures-data";

const DEFAULT_PAGE_SIZE = 25;

export class FixtureCoursesProvider implements CoursesProvider {
  async list(params: ListCoursesParams): Promise<CoursePage> {
    // The fixture store is a single-tenant dataset for one company.
    // We accept any companyId but always return the same dataset so
    // tests can use a stable company ID.
    void params.companyId;

    const all = getCourses();
    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);

    const items = all.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    const nextCursor = nextOffset < all.length ? encodeCursor(nextOffset) : null;

    return {
      items,
      nextCursor,
      rateLimit: makeFixtureRateLimit(),
    };
  }

  async retrieve(courseId: string): Promise<ExternalCourse | null> {
    const all = getCourses();
    return all.find((c) => c.id === courseId) ?? null;
  }
}
