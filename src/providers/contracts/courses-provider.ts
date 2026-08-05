// Provider contract: Course data source.
// All business logic depends on this interface, not on the Whop SDK directly.
// This enables fixture-mode testing and future provider swaps.

// A course from an external platform (Whop).
export interface ExternalCourse {
  id: string; // Stable external ID (Whop course ID)
  title: string | null;
  experienceId: string; // The experience this course belongs to
  lessonCount: number;
  isPublished: boolean;
  sourceTimestamp: string; // ISO 8601 — when the source last updated this record
}

// Paginated response with cursor for continuation.
export interface CoursePage {
  items: ExternalCourse[];
  nextCursor: string | null;
  rateLimit?: RateLimitMetadata;
}

export interface ListCoursesParams {
  companyId: string;
  cursor?: string | null;
  pageSize?: number;
}

export interface CoursesProvider {
  list(params: ListCoursesParams): Promise<CoursePage>;
  retrieve(courseId: string): Promise<ExternalCourse | null>;
}

import type { RateLimitMetadata } from "./shared";
