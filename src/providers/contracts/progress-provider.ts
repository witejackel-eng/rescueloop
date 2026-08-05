// Provider contract: Course progress data source.

export interface ExternalCourseLessonInteraction {
  id: string; // Whop interaction ID (unique per student+lesson)
  userId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string | null;
  completed: boolean;
  createdAt: string; // ISO 8601
  sourceTimestamp: string;
}

export interface ExternalCourseStudent {
  userId: string;
  courseId: string;
  completionRate: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  firstInteractionAt: string | null;
  lastInteractionAt: string | null;
  sourceTimestamp: string;
}

export interface ProgressPage {
  items: ExternalCourseLessonInteraction[];
  nextCursor: string | null;
  rateLimit?: RateLimitMetadata;
}

export interface CourseStudentPage {
  items: ExternalCourseStudent[];
  nextCursor: string | null;
  rateLimit?: RateLimitMetadata;
}

export interface ListProgressParams {
  companyId: string;
  courseId: string;
  cursor?: string | null;
  pageSize?: number;
}

export interface ListCourseStudentsParams {
  companyId: string;
  courseId: string;
  cursor?: string | null;
  pageSize?: number;
}

export interface ProgressProvider {
  listLessonInteractions(params: ListProgressParams): Promise<ProgressPage>;
  listCourseStudents(params: ListCourseStudentsParams): Promise<CourseStudentPage>;
}

import type { RateLimitMetadata } from "./shared";
