// Mocked Whop providers — realistic Whop-shaped responses that implement
// the provider contracts without hitting the real Whop SDK.
//
// These simulate the mapper layer in `src/providers/whop/`, including:
//   - US→UK spelling normalization (canceling→cancelling, canceled→cancelled)
//   - Unknown status fallback to "cancelled"
//   - Cursor-based pagination with base64url cursors
//   - Partial / missing field fallbacks (empty strings, nulls)
//
// Used by the contract test suite to validate that both fixture and
// Whop adapters satisfy the same behavioural invariants.

import type {
  CoursePage,
  CoursesProvider,
  ExternalCourse,
  ExternalCourseLessonInteraction,
  ExternalCourseStudent,
  ExternalMembership,
  ExternalMembershipStatus,
  ExternalProduct,
  ListCourseStudentsParams,
  ListCoursesParams,
  ListMembershipsParams,
  ListProductsParams,
  ListProgressParams,
  MembershipPage,
  MembershipsProvider,
  NotificationResult,
  NotificationsProvider,
  ProductPage,
  ProductsProvider,
  ProgressPage,
  ProgressProvider,
  SendNotificationParams,
  CourseStudentPage,
  RateLimitMetadata,
} from "@/providers/contracts";

// ── Whop-shaped source types ────────────────────────────────────
// These mirror what the real @whop/sdk returns before mapping.

interface WhopCourseSource {
  id: string;
  title: string | null;
  experience_id?: string | null;
  visibility: "visible" | "hidden";
  updated_at: string;
  chapters?: { lessons?: { id: string }[] }[];
}

interface WhopProductSource {
  id: string;
  title: string;
  visibility: "visible" | "hidden";
  updated_at: string;
}

type WhopMembershipStatusSource =
  | "trialing"
  | "active"
  | "past_due"
  | "completed"
  | "canceled"
  | "expired"
  | "unresolved"
  | "drafted"
  | "canceling"
  | (string & {}); // allow unknown statuses

interface WhopMembershipSource {
  id: string;
  user?: { id: string } | null;
  product?: { id: string } | null;
  status: WhopMembershipStatusSource;
  cancel_at_period_end: boolean;
  joined_at: string;
  created_at: string;
  renewal_period_end: string | null;
  canceled_at: string | null;
  currency?: string | null;
  updated_at: string;
}

interface WhopLessonInteractionSource {
  id: string;
  user?: { id: string } | null;
  lesson?: { id: string; title?: string | null } | null;
  course?: { id?: string } | null;
  completed: boolean;
  created_at: string;
}

interface WhopCourseStudentSource {
  user?: { id: string } | null;
  completion_rate: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  first_interaction_at: string | null;
  last_interaction_at: string | null;
}

// ── Cursor helpers ──────────────────────────────────────────────

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset })).toString("base64url");
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"));
    if (typeof decoded.o === "number" && Number.isFinite(decoded.o) && decoded.o >= 0) {
      return Math.floor(decoded.o);
    }
    return 0;
  } catch {
    return 0;
  }
}

// ── Mappers (mirrors src/providers/whop/) ───────────────────────

function unixToIso(unixSeconds: string | null | undefined): string | null {
  if (!unixSeconds) return null;
  const seconds = Number(unixSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

const DEFAULT_PAGE_SIZE = 25;

function makeRateLimit(): RateLimitMetadata {
  return {
    remaining: 95,
    limit: 100,
    resetAt: new Date(Date.now() + 300_000).toISOString(),
  };
}

// ── Whop course mapper ──────────────────────────────────────────

function mapWhopCourse(src: WhopCourseSource): ExternalCourse {
  return {
    id: src.id,
    title: src.title ?? null,
    experienceId: src.experience_id ?? "",
    lessonCount: src.chapters?.reduce(
      (sum, ch) => sum + (ch.lessons?.length ?? 0),
      0,
    ) ?? 0,
    isPublished: src.visibility === "visible",
    sourceTimestamp: src.updated_at,
  };
}

// ── Whop product mapper ─────────────────────────────────────────

function mapWhopProduct(src: WhopProductSource): ExternalProduct {
  return {
    id: src.id,
    name: src.title,
    priceCents: 0,
    currency: "usd",
    billingCycle: "monthly",
    isPublished: src.visibility === "visible",
    sourceTimestamp: src.updated_at,
  };
}

// ── Whop membership mapper ──────────────────────────────────────

function fromWhopStatus(status: WhopMembershipStatusSource): ExternalMembershipStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceling":
      return "cancelling";
    case "canceled":
      return "cancelled";
    case "expired":
    case "completed":
    case "unresolved":
    case "drafted":
      return "cancelled";
    default:
      return "cancelled";
  }
}

function mapWhopMembership(src: WhopMembershipSource): ExternalMembership {
  return {
    id: src.id,
    userId: src.user?.id ?? "",
    productId: src.product?.id ?? "",
    status: fromWhopStatus(src.status),
    cancelAtPeriodEnd: src.cancel_at_period_end,
    joinedAt: unixToIso(src.joined_at) ?? src.created_at,
    renewalDate: unixToIso(src.renewal_period_end),
    cancelledAt: unixToIso(src.canceled_at),
    priceCents: 0,
    currency: src.currency ?? "usd",
    sourceTimestamp: src.updated_at,
  };
}

// ── Whop progress mapper ───────────────────────────────────────

function mapWhopLessonInteraction(
  src: WhopLessonInteractionSource,
  fallbackCourseId: string,
): ExternalCourseLessonInteraction {
  return {
    id: src.id,
    userId: src.user?.id ?? "",
    courseId: src.course?.id ?? fallbackCourseId,
    lessonId: src.lesson?.id ?? "",
    lessonTitle: src.lesson?.title ?? null,
    completed: src.completed,
    createdAt: src.created_at,
    sourceTimestamp: src.created_at,
  };
}

function mapWhopCourseStudent(
  src: WhopCourseStudentSource,
  courseId: string,
  nowIso: string,
): ExternalCourseStudent {
  return {
    userId: src.user?.id ?? "",
    courseId,
    completionRate: src.completion_rate,
    completedLessons: src.completed_lessons_count,
    totalLessons: src.total_lessons_count,
    firstInteractionAt: unixToIso(src.first_interaction_at),
    lastInteractionAt: unixToIso(src.last_interaction_at),
    sourceTimestamp: nowIso,
  };
}

// ── Realistic Whop-shaped source data ───────────────────────────

const now = new Date();
function isoDaysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function unixDaysAgo(days: number): string {
  return String(Math.floor((Date.now() - days * 86400000) / 1000));
}

const WHOP_COURSE_SOURCES: WhopCourseSource[] = [
  {
    id: "cr_whop_ags",
    title: "Agency Growth System",
    experience_id: "exp_whop_agency",
    visibility: "visible",
    updated_at: isoDaysAgo(1),
    chapters: Array.from({ length: 29 }, (_, i) => ({
      lessons: [{ id: `lesson_ags_${i + 1}` }],
    })),
  },
  {
    id: "cr_whop_ff",
    title: "Freelance Foundations",
    experience_id: "exp_whop_freelance",
    visibility: "visible",
    updated_at: isoDaysAgo(2),
    chapters: Array.from({ length: 18 }, (_, i) => ({
      lessons: [{ id: `lesson_ff_${i + 1}` }],
    })),
  },
  {
    id: "cr_whop_cb",
    title: "Client Breakthrough",
    experience_id: "exp_whop_client",
    visibility: "visible",
    updated_at: isoDaysAgo(0),
    chapters: Array.from({ length: 24 }, (_, i) => ({
      lessons: [{ id: `lesson_cb_${i + 1}` }],
    })),
  },
];

const WHOP_PRODUCT_SOURCES: WhopProductSource[] = [
  {
    id: "prod_whop_monthly",
    title: "Agency Accelerator ($79/mo)",
    visibility: "visible",
    updated_at: isoDaysAgo(5),
  },
  {
    id: "prod_whop_freelance",
    title: "Freelance Pro ($49/mo)",
    visibility: "visible",
    updated_at: isoDaysAgo(3),
  },
  {
    id: "prod_whop_client",
    title: "Client Mastery ($129/mo)",
    visibility: "visible",
    updated_at: isoDaysAgo(1),
  },
  {
    id: "prod_whop_workshop",
    title: "One-time Workshop ($199)",
    visibility: "hidden",
    updated_at: isoDaysAgo(0),
  },
];

const WHOP_MEMBERSHIP_SOURCES: WhopMembershipSource[] = [
  {
    id: "mem_whop_001",
    user: { id: "whop_user_001" },
    product: { id: "prod_whop_monthly" },
    status: "active",
    cancel_at_period_end: false,
    joined_at: unixDaysAgo(10),
    created_at: isoDaysAgo(10),
    renewal_period_end: String(Math.floor((Date.now() + 20 * 86400000) / 1000)),
    canceled_at: null,
    currency: "usd",
    updated_at: isoDaysAgo(0),
  },
  {
    id: "mem_whop_002",
    user: { id: "whop_user_002" },
    product: { id: "prod_whop_freelance" },
    status: "active",
    cancel_at_period_end: false,
    joined_at: unixDaysAgo(15),
    created_at: isoDaysAgo(15),
    renewal_period_end: String(Math.floor((Date.now() + 15 * 86400000) / 1000)),
    canceled_at: null,
    currency: "usd",
    updated_at: isoDaysAgo(0),
  },
  {
    id: "mem_whop_003",
    user: { id: "whop_user_003" },
    product: { id: "prod_whop_client" },
    status: "trialing",
    cancel_at_period_end: false,
    joined_at: unixDaysAgo(3),
    created_at: isoDaysAgo(3),
    renewal_period_end: String(Math.floor((Date.now() + 4 * 86400000) / 1000)),
    canceled_at: null,
    currency: "usd",
    updated_at: isoDaysAgo(0),
  },
  {
    id: "mem_whop_004",
    user: { id: "whop_user_004" },
    product: { id: "prod_whop_monthly" },
    status: "canceling",
    cancel_at_period_end: true,
    joined_at: unixDaysAgo(60),
    created_at: isoDaysAgo(60),
    renewal_period_end: String(Math.floor((Date.now() + 5 * 86400000) / 1000)),
    canceled_at: null,
    currency: "usd",
    updated_at: isoDaysAgo(1),
  },
  {
    id: "mem_whop_005",
    user: { id: "whop_user_005" },
    product: { id: "prod_whop_client" },
    status: "canceled",
    cancel_at_period_end: false,
    joined_at: unixDaysAgo(90),
    created_at: isoDaysAgo(90),
    renewal_period_end: null,
    canceled_at: String(Math.floor((Date.now() - 10 * 86400000) / 1000)),
    currency: "usd",
    updated_at: isoDaysAgo(10),
  },
  {
    id: "mem_whop_006",
    user: { id: "whop_user_006" },
    product: { id: "prod_whop_freelance" },
    status: "past_due",
    cancel_at_period_end: false,
    joined_at: unixDaysAgo(30),
    created_at: isoDaysAgo(30),
    renewal_period_end: String(Math.floor((Date.now() - 2 * 86400000) / 1000)),
    canceled_at: null,
    currency: "usd",
    updated_at: isoDaysAgo(2),
  },
];

const WHOP_LESSON_INTERACTION_SOURCES: WhopLessonInteractionSource[] = [
  {
    id: "int_whop_001",
    user: { id: "whop_user_001" },
    lesson: { id: "lesson_ags_1", title: "Welcome & Course Roadmap" },
    course: { id: "cr_whop_ags" },
    completed: true,
    created_at: isoDaysAgo(8),
  },
  {
    id: "int_whop_002",
    user: { id: "whop_user_001" },
    lesson: { id: "lesson_ags_2", title: "Finding Your First Client" },
    course: { id: "cr_whop_ags" },
    completed: true,
    created_at: isoDaysAgo(7),
  },
  {
    id: "int_whop_003",
    user: { id: "whop_user_002" },
    lesson: { id: "lesson_ff_1", title: "Welcome to Freelancing" },
    course: { id: "cr_whop_ff" },
    completed: true,
    created_at: isoDaysAgo(12),
  },
];

const WHOP_COURSE_STUDENT_SOURCES: WhopCourseStudentSource[] = [
  {
    user: { id: "whop_user_001" },
    completion_rate: 7,
    completed_lessons_count: 2,
    total_lessons_count: 29,
    first_interaction_at: unixDaysAgo(8),
    last_interaction_at: unixDaysAgo(7),
  },
  {
    user: { id: "whop_user_002" },
    completion_rate: 6,
    completed_lessons_count: 1,
    total_lessons_count: 18,
    first_interaction_at: unixDaysAgo(12),
    last_interaction_at: unixDaysAgo(12),
  },
];

// ── Notification log ────────────────────────────────────────────

interface NotificationLogEntry {
  providerMessageId: string;
  sentAt: string;
  params: SendNotificationParams;
}

const notificationLog: NotificationLogEntry[] = [];
let notificationCounter = 0;

// ── Mocked Whop Provider Implementations ────────────────────────

export class MockedWhopCoursesProvider implements CoursesProvider {
  private readonly sources: WhopCourseSource[];

  constructor(sources?: WhopCourseSource[]) {
    this.sources = sources ?? WHOP_COURSE_SOURCES;
  }

  async list(params: ListCoursesParams): Promise<CoursePage> {
    void params.companyId;
    const all = this.sources.map(mapWhopCourse);
    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);
    const items = all.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor: nextOffset < all.length ? encodeCursor(nextOffset) : null,
      rateLimit: makeRateLimit(),
    };
  }

  async retrieve(courseId: string): Promise<ExternalCourse | null> {
    const src = this.sources.find((s) => s.id === courseId);
    return src ? mapWhopCourse(src) : null;
  }
}

export class MockedWhopProductsProvider implements ProductsProvider {
  private readonly sources: WhopProductSource[];

  constructor(sources?: WhopProductSource[]) {
    this.sources = sources ?? WHOP_PRODUCT_SOURCES;
  }

  async list(params: ListProductsParams): Promise<ProductPage> {
    void params.companyId;
    const all = this.sources.map(mapWhopProduct);
    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);
    const items = all.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor: nextOffset < all.length ? encodeCursor(nextOffset) : null,
      rateLimit: makeRateLimit(),
    };
  }

  async retrieve(productId: string): Promise<ExternalProduct | null> {
    const src = this.sources.find((s) => s.id === productId);
    return src ? mapWhopProduct(src) : null;
  }
}

export class MockedWhopMembershipsProvider implements MembershipsProvider {
  private readonly sources: WhopMembershipSource[];

  constructor(sources?: WhopMembershipSource[]) {
    this.sources = sources ?? WHOP_MEMBERSHIP_SOURCES;
  }

  async list(params: ListMembershipsParams): Promise<MembershipPage> {
    void params.companyId;
    const all = this.sources.map(mapWhopMembership);
    const filtered = all.filter((m) => {
      if (params.productId && m.productId !== params.productId) return false;
      if (params.status && m.status !== params.status) return false;
      return true;
    });
    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);
    const items = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor: nextOffset < filtered.length ? encodeCursor(nextOffset) : null,
      rateLimit: makeRateLimit(),
    };
  }

  async retrieve(membershipId: string): Promise<ExternalMembership | null> {
    const src = this.sources.find((s) => s.id === membershipId);
    return src ? mapWhopMembership(src) : null;
  }
}

export class MockedWhopProgressProvider implements ProgressProvider {
  private readonly interactionSources: WhopLessonInteractionSource[];
  private readonly studentSources: WhopCourseStudentSource[];
  private readonly courseId: string;

  constructor(
    interactionSources?: WhopLessonInteractionSource[],
    studentSources?: WhopCourseStudentSource[],
    courseId?: string,
  ) {
    this.interactionSources = interactionSources ?? WHOP_LESSON_INTERACTION_SOURCES;
    this.studentSources = studentSources ?? WHOP_COURSE_STUDENT_SOURCES;
    this.courseId = courseId ?? "cr_whop_ags";
  }

  async listLessonInteractions(params: ListProgressParams): Promise<ProgressPage> {
    void params.companyId;
    const all = this.interactionSources
      .filter((s) => (s.course?.id ?? this.courseId) === params.courseId)
      .map((s) => mapWhopLessonInteraction(s, params.courseId));
    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);
    const items = all.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor: nextOffset < all.length ? encodeCursor(nextOffset) : null,
      rateLimit: makeRateLimit(),
    };
  }

  async listCourseStudents(params: ListCourseStudentsParams): Promise<CourseStudentPage> {
    void params.companyId;
    const nowIso = new Date().toISOString();
    const all = this.studentSources.map((s) =>
      mapWhopCourseStudent(s, params.courseId, nowIso),
    );
    const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
    const offset = decodeCursor(params.cursor);
    const items = all.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor: nextOffset < all.length ? encodeCursor(nextOffset) : null,
      rateLimit: makeRateLimit(),
    };
  }
}

export class MockedWhopNotificationsProvider implements NotificationsProvider {
  async send(params: SendNotificationParams): Promise<NotificationResult> {
    notificationCounter += 1;
    const providerMessageId = `whop_mock_msg_${notificationCounter.toString().padStart(6, "0")}`;
    notificationLog.push({
      providerMessageId,
      sentAt: new Date().toISOString(),
      params,
    });
    return { accepted: true, providerMessageId: null };
  }
}

// ── Test helpers: expose source data and mappers for contract tests ──

export {
  WHOP_COURSE_SOURCES,
  WHOP_PRODUCT_SOURCES,
  WHOP_MEMBERSHIP_SOURCES,
  WHOP_LESSON_INTERACTION_SOURCES,
  WHOP_COURSE_STUDENT_SOURCES,
  fromWhopStatus,
  mapWhopMembership,
  mapWhopCourse,
  mapWhopProduct,
};

/** Clear notification log between tests. */
export function clearMockedNotificationLog(): void {
  notificationLog.length = 0;
  notificationCounter = 0;
}

/** Access the notification send log. */
export function getMockedNotificationLog(): readonly NotificationLogEntry[] {
  return notificationLog;
}

/** Re-export source types for test construction. */
export type {
  WhopCourseSource,
  WhopProductSource,
  WhopMembershipSource,
  WhopMembershipStatusSource,
  WhopLessonInteractionSource,
  WhopCourseStudentSource,
};
