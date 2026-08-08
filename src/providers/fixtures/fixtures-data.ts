import "server-only";

// ─────────────────────────────────────────────────────────────
// Fixture provider data — single source of truth.
//
// Hand-authored deterministic seeds with dates relative to `new Date()`
// so the fixture data never goes stale. Every call to `resetFixtureData()`
// regenerates the cached dataset from the seeds.
//
// Distribution targets (per task spec):
//   ~40% active-no-progress  (Activation Rescue candidates)
//   ~30% active-with-progress
//   ~20% trialing
//   ~10% cancelling/cancelled
// ─────────────────────────────────────────────────────────────

import type {
  ExternalCourse,
  ExternalCourseLessonInteraction,
  ExternalCourseStudent,
  ExternalMembership,
  ExternalMembershipStatus,
  ExternalProduct,
  RateLimitMetadata,
} from "@/providers/contracts";

// ── Fixture identity constants ───────────────────────────────

export const FIXTURE_COMPANY_ID = "co_fixture_cgl";
export const FIXTURE_APP_ID = "app_fixture_rescueloop";
export const FIXTURE_ADMIN_USER_ID = "user_fixture_admin";
export const FIXTURE_DEFAULT_USER_ID = FIXTURE_ADMIN_USER_ID;

export const FIXTURE_EXPERIENCE_AGENCY = "exp_agency";
export const FIXTURE_EXPERIENCE_FREELANCE = "exp_freelance";
export const FIXTURE_EXPERIENCE_CLIENT = "exp_client";

// ── Date helpers (relative to now) ───────────────────────────

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function isoMinutesAgo(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

function isoMinutesFromNow(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Cursor pagination helpers ────────────────────────────────
//
// Cursors are opaque base64url-encoded JSON. They encode the offset
// into the underlying fixture array so pagination is stable across
// calls within a single fixture generation.

export function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset })).toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined): number {
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

// ── Rate limit helper ────────────────────────────────────────
//
// Simulates realistic Whop rate-limit metadata. Deterministic values
// make fixture tests reproducible.

export function makeFixtureRateLimit(): RateLimitMetadata {
  return {
    remaining: 95,
    limit: 100,
    resetAt: isoMinutesFromNow(5),
  };
}

// ── Internal seed types ──────────────────────────────────────

interface ExperienceRecord {
  id: string;
  name: string;
}

interface StudentRecord {
  id: string;
  name: string;
  email: string;
}

interface ProductSeed {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  billingCycle: "monthly" | "annual" | "one_time";
  isPublished: boolean;
}

interface CourseSeed {
  id: string;
  title: string;
  experienceId: string;
  lessonCount: number;
  isPublished: boolean;
  lessonTitles: string[];
}

interface MembershipSeed {
  id: string;
  userId: string;
  productId: string;
  status: ExternalMembershipStatus;
  cancelAtPeriodEnd: boolean;
  joinedDaysAgo: number;
  renewalDaysFromNow: number | null;
  cancelledDaysAgo: number | null;
}

interface ProgressSeed {
  userId: string;
  courseId: string;
  lessonsCompleted: number;
  firstInteractionDaysAgo: number;
  lastInteractionDaysAgo: number;
}

// ── Static seeds (deterministic) ─────────────────────────────

const EXPERIENCES: ExperienceRecord[] = [
  { id: FIXTURE_EXPERIENCE_AGENCY, name: "Agency Accelerator Experience" },
  { id: FIXTURE_EXPERIENCE_FREELANCE, name: "Freelance Experience" },
  { id: FIXTURE_EXPERIENCE_CLIENT, name: "Client Mastery Experience" },
];

const STUDENTS: StudentRecord[] = [
  { id: "user_001", name: "Maya Chen", email: "maya.chen@example.com" },
  { id: "user_002", name: "James Okonkwo", email: "james.okonkwo@example.com" },
  { id: "user_003", name: "Sofia Ramirez", email: "sofia.ramirez@example.com" },
  { id: "user_004", name: "David Kim", email: "david.kim@example.com" },
  { id: "user_005", name: "Aisha Patel", email: "aisha.patel@example.com" },
  { id: "user_006", name: "Liam Murphy", email: "liam.murphy@example.com" },
  { id: "user_007", name: "Emma Thompson", email: "emma.thompson@example.com" },
  { id: "user_008", name: "Noah Williams", email: "noah.williams@example.com" },
  { id: "user_009", name: "Olivia Brown", email: "olivia.brown@example.com" },
  { id: "user_010", name: "Ethan Garcia", email: "ethan.garcia@example.com" },
  { id: "user_011", name: "Charlotte Davis", email: "charlotte.davis@example.com" },
  { id: "user_012", name: "Mason Lee", email: "mason.lee@example.com" },
  { id: "user_013", name: "Ava Martinez", email: "ava.martinez@example.com" },
  { id: "user_014", name: "Lucas Silva", email: "lucas.silva@example.com" },
  { id: "user_015", name: "Mia Johnson", email: "mia.johnson@example.com" },
];

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: "prod_agency_monthly",
    name: "Agency Accelerator ($79/mo)",
    priceCents: 7900,
    currency: "USD",
    billingCycle: "monthly",
    isPublished: true,
  },
  {
    id: "prod_freelance_pro",
    name: "Freelance Pro ($49/mo)",
    priceCents: 4900,
    currency: "USD",
    billingCycle: "monthly",
    isPublished: true,
  },
  {
    id: "prod_client_mastery",
    name: "Client Mastery ($129/mo)",
    priceCents: 12900,
    currency: "USD",
    billingCycle: "monthly",
    isPublished: true,
  },
  {
    id: "prod_workshop_onetime",
    name: "One-time Workshop ($199)",
    priceCents: 19900,
    currency: "USD",
    billingCycle: "one_time",
    isPublished: true,
  },
];

const AGENCY_LESSONS: string[] = [
  "Welcome & Course Roadmap",
  "Finding Your First Client",
  "Crafting Your Agency Positioning",
  "Pricing Your Services",
  "Building Your Service Menu",
  "Creating Your Portfolio",
  "Setting Up Your First Campaign",
  "Outreach Channels Overview",
  "Writing Outreach Messages",
  "Managing Your First Reply",
  "Discovery Call Framework",
  "Onboarding a Client",
  "Scope Creep Defense",
  "Project Management Basics",
  "Delivering Results",
  "Reporting to Clients",
  "Asking for Testimonials",
  "Scaling Your Offers",
  "Hiring Contractors",
  "Standardizing Delivery",
  "Building a Brand",
  "Hiring Your First VA",
  "Building SOPs",
  "Quality Assurance",
  "Retention Strategies",
  "Retainer Agreements",
  "Upselling Existing Clients",
  "Annual Planning",
  "Graduation & Next Steps",
];

const FREELANCE_LESSONS: string[] = [
  "Welcome to Freelancing",
  "Picking Your Niche",
  "Setting Your Rates",
  "Creating Your Profile",
  "Finding Your First Gig",
  "Writing Proposals",
  "Managing Client Expectations",
  "Time Tracking Basics",
  "Invoicing & Payments",
  "Handling Difficult Clients",
  "Scope & Change Orders",
  "Delivering Quality Work",
  "Building Long-Term Relationships",
  "Asking for Referrals",
  "Raising Your Rates",
  "Diversifying Income",
  "Going Full-Time",
  "Freelance Mistakes to Avoid",
];

const CLIENT_LESSONS: string[] = [
  "Welcome to Client Breakthrough",
  "Understanding Client Psychology",
  "The Discovery Process",
  "Mapping Client Goals",
  "Identifying Blockers",
  "Building Trust Quickly",
  "Active Listening Techniques",
  "Asking Powerful Questions",
  "Designing Breakthrough Sessions",
  "Facilitating Workshops",
  "Handling Resistance",
  "Managing Scope",
  "Delivering Bad News",
  "Negotiating Outcomes",
  "Conflict Resolution",
  "Building Accountability",
  "Measuring Progress",
  "Sustaining Change",
  "Closing Engagements",
  "Building Case Studies",
  "Marketing Your Expertise",
  "Pricing Premium Engagements",
  "Building a Consulting Team",
  "Long-Term Client Success",
];

const COURSE_SEEDS: CourseSeed[] = [
  {
    id: "cr_ags",
    title: "Agency Growth System",
    experienceId: FIXTURE_EXPERIENCE_AGENCY,
    lessonCount: AGENCY_LESSONS.length,
    isPublished: true,
    lessonTitles: AGENCY_LESSONS,
  },
  {
    id: "cr_ff",
    title: "Freelance Foundations",
    experienceId: FIXTURE_EXPERIENCE_FREELANCE,
    lessonCount: FREELANCE_LESSONS.length,
    isPublished: true,
    lessonTitles: FREELANCE_LESSONS,
  },
  {
    id: "cr_cb",
    title: "Client Breakthrough",
    experienceId: FIXTURE_EXPERIENCE_CLIENT,
    lessonCount: CLIENT_LESSONS.length,
    isPublished: true,
    lessonTitles: CLIENT_LESSONS,
  },
];

// 20 memberships:
//   8 active-no-progress (Activation Rescue candidates)   — mem_001..mem_008
//   6 active-with-progress                                — mem_009..mem_014
//   4 trialing                                            — mem_015..mem_018
//   2 cancelling / cancelled                              — mem_019..mem_020
const MEMBERSHIP_SEEDS: MembershipSeed[] = [
  // ── Active, no course progress (8) ──────────────────────────
  {
    id: "mem_001", userId: "user_001", productId: "prod_agency_monthly",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 9, renewalDaysFromNow: 21, cancelledDaysAgo: null,
  },
  {
    id: "mem_002", userId: "user_002", productId: "prod_agency_monthly",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 14, renewalDaysFromNow: 16, cancelledDaysAgo: null,
  },
  {
    id: "mem_003", userId: "user_003", productId: "prod_freelance_pro",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 11, renewalDaysFromNow: 19, cancelledDaysAgo: null,
  },
  {
    id: "mem_004", userId: "user_004", productId: "prod_agency_monthly",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 18, renewalDaysFromNow: 12, cancelledDaysAgo: null,
  },
  {
    id: "mem_005", userId: "user_005", productId: "prod_client_mastery",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 8, renewalDaysFromNow: 22, cancelledDaysAgo: null,
  },
  {
    id: "mem_006", userId: "user_006", productId: "prod_freelance_pro",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 22, renewalDaysFromNow: 8, cancelledDaysAgo: null,
  },
  {
    id: "mem_007", userId: "user_007", productId: "prod_agency_monthly",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 16, renewalDaysFromNow: 14, cancelledDaysAgo: null,
  },
  {
    id: "mem_008", userId: "user_008", productId: "prod_client_mastery",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 12, renewalDaysFromNow: 18, cancelledDaysAgo: null,
  },
  // ── Active, with course progress (6) ───────────────────────
  {
    id: "mem_009", userId: "user_009", productId: "prod_agency_monthly",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 45, renewalDaysFromNow: 15, cancelledDaysAgo: null,
  },
  {
    id: "mem_010", userId: "user_010", productId: "prod_agency_monthly",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 38, renewalDaysFromNow: 22, cancelledDaysAgo: null,
  },
  {
    id: "mem_011", userId: "user_011", productId: "prod_freelance_pro",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 31, renewalDaysFromNow: 29, cancelledDaysAgo: null,
  },
  {
    id: "mem_012", userId: "user_012", productId: "prod_client_mastery",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 52, renewalDaysFromNow: 8, cancelledDaysAgo: null,
  },
  {
    id: "mem_013", userId: "user_013", productId: "prod_agency_monthly",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 60, renewalDaysFromNow: 0, cancelledDaysAgo: null,
  },
  {
    id: "mem_014", userId: "user_014", productId: "prod_freelance_pro",
    status: "active", cancelAtPeriodEnd: false,
    joinedDaysAgo: 41, renewalDaysFromNow: 19, cancelledDaysAgo: null,
  },
  // ── Trialing (4) ───────────────────────────────────────────
  {
    id: "mem_015", userId: "user_015", productId: "prod_client_mastery",
    status: "trialing", cancelAtPeriodEnd: false,
    joinedDaysAgo: 4, renewalDaysFromNow: 3, cancelledDaysAgo: null,
  },
  {
    id: "mem_016", userId: "user_001", productId: "prod_freelance_pro",
    status: "trialing", cancelAtPeriodEnd: false,
    joinedDaysAgo: 6, renewalDaysFromNow: 1, cancelledDaysAgo: null,
  },
  {
    id: "mem_017", userId: "user_005", productId: "prod_agency_monthly",
    status: "trialing", cancelAtPeriodEnd: false,
    joinedDaysAgo: 9, renewalDaysFromNow: 5, cancelledDaysAgo: null,
  },
  {
    id: "mem_018", userId: "user_009", productId: "prod_client_mastery",
    status: "trialing", cancelAtPeriodEnd: false,
    joinedDaysAgo: 2, renewalDaysFromNow: 5, cancelledDaysAgo: null,
  },
  // ── Cancelling / cancelled (2) ─────────────────────────────
  {
    id: "mem_019", userId: "user_007", productId: "prod_agency_monthly",
    status: "cancelling", cancelAtPeriodEnd: true,
    joinedDaysAgo: 88, renewalDaysFromNow: 6, cancelledDaysAgo: null,
  },
  {
    id: "mem_020", userId: "user_013", productId: "prod_client_mastery",
    status: "cancelled", cancelAtPeriodEnd: false,
    joinedDaysAgo: 120, renewalDaysFromNow: null, cancelledDaysAgo: 12,
  },
];

// Course progress for 10 student-course pairs:
//   6 active-with-progress students (their primary course)
//   4 trialing students who briefly started the course
const PROGRESS_SEEDS: ProgressSeed[] = [
  // Active-with-progress (6)
  { userId: "user_009", courseId: "cr_ags", lessonsCompleted: 12, firstInteractionDaysAgo: 40, lastInteractionDaysAgo: 3 },
  { userId: "user_010", courseId: "cr_ags", lessonsCompleted: 5, firstInteractionDaysAgo: 35, lastInteractionDaysAgo: 14 },
  { userId: "user_011", courseId: "cr_ff", lessonsCompleted: 8, firstInteractionDaysAgo: 28, lastInteractionDaysAgo: 7 },
  { userId: "user_012", courseId: "cr_cb", lessonsCompleted: 22, firstInteractionDaysAgo: 50, lastInteractionDaysAgo: 1 },
  { userId: "user_013", courseId: "cr_ags", lessonsCompleted: 18, firstInteractionDaysAgo: 55, lastInteractionDaysAgo: 5 },
  { userId: "user_014", courseId: "cr_ff", lessonsCompleted: 3, firstInteractionDaysAgo: 38, lastInteractionDaysAgo: 21 },
  // Trialing-with-progress (4)
  { userId: "user_015", courseId: "cr_cb", lessonsCompleted: 2, firstInteractionDaysAgo: 3, lastInteractionDaysAgo: 4 },
  { userId: "user_001", courseId: "cr_ff", lessonsCompleted: 1, firstInteractionDaysAgo: 5, lastInteractionDaysAgo: 6 },
  { userId: "user_005", courseId: "cr_ags", lessonsCompleted: 4, firstInteractionDaysAgo: 8, lastInteractionDaysAgo: 9 },
  { userId: "user_009", courseId: "cr_cb", lessonsCompleted: 1, firstInteractionDaysAgo: 1, lastInteractionDaysAgo: 2 },
];

// ── Generated dataset ────────────────────────────────────────

interface FixtureDataset {
  experiences: ExperienceRecord[];
  students: StudentRecord[];
  courses: ExternalCourse[];
  products: ExternalProduct[];
  memberships: ExternalMembership[];
  lessonInteractions: ExternalCourseLessonInteraction[];
  courseStudents: ExternalCourseStudent[];
  sourceTimestamp: string;
}

function productPriceCents(productId: string): number {
  const product = PRODUCT_SEEDS.find((p) => p.id === productId);
  if (!product) {
    throw new Error(`Unknown fixture product: ${productId}`);
  }
  return product.priceCents;
}

function productCurrency(productId: string): string {
  const product = PRODUCT_SEEDS.find((p) => p.id === productId);
  if (!product) {
    throw new Error(`Unknown fixture product: ${productId}`);
  }
  return product.currency;
}

function courseLessonTitles(courseId: string): string[] {
  const course = COURSE_SEEDS.find((c) => c.id === courseId);
  if (!course) {
    throw new Error(`Unknown fixture course: ${courseId}`);
  }
  return course.lessonTitles;
}

function courseLessonCount(courseId: string): number {
  const course = COURSE_SEEDS.find((c) => c.id === courseId);
  if (!course) {
    throw new Error(`Unknown fixture course: ${courseId}`);
  }
  return course.lessonCount;
}

// Linearly interpolate the day-offset for a lesson interaction.
// lessonIndex is 1-indexed; returns a positive "days ago" value.
function interactionDayForLesson(
  lessonIndex: number,
  totalLessons: number,
  firstDay: number,
  lastDay: number,
): number {
  if (totalLessons <= 1) return lastDay;
  const t = (lessonIndex - 1) / (totalLessons - 1);
  return Math.round(firstDay - t * (firstDay - lastDay));
}

function buildDataset(): FixtureDataset {
  const sourceTimestamp = isoMinutesAgo(2);

  const courses: ExternalCourse[] = COURSE_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    experienceId: seed.experienceId,
    lessonCount: seed.lessonCount,
    isPublished: seed.isPublished,
    sourceTimestamp,
  }));

  const products: ExternalProduct[] = PRODUCT_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    priceCents: seed.priceCents,
    currency: seed.currency,
    billingCycle: seed.billingCycle,
    isPublished: seed.isPublished,
    sourceTimestamp,
  }));

  const memberships: ExternalMembership[] = MEMBERSHIP_SEEDS.map((seed) => ({
    id: seed.id,
    userId: seed.userId,
    productId: seed.productId,
    status: seed.status,
    cancelAtPeriodEnd: seed.cancelAtPeriodEnd,
    joinedAt: isoDaysAgo(seed.joinedDaysAgo),
    renewalDate: seed.renewalDaysFromNow === null ? null : isoDaysFromNow(seed.renewalDaysFromNow),
    cancelledAt: seed.cancelledDaysAgo === null ? null : isoDaysAgo(seed.cancelledDaysAgo),
    priceCents: productPriceCents(seed.productId),
    currency: productCurrency(seed.productId),
    sourceTimestamp,
  }));

  const lessonInteractions: ExternalCourseLessonInteraction[] = [];
  const courseStudents: ExternalCourseStudent[] = [];

  for (const prog of PROGRESS_SEEDS) {
    const totalLessons = courseLessonCount(prog.courseId);
    const lessonTitles = courseLessonTitles(prog.courseId);
    const completed = Math.min(prog.lessonsCompleted, totalLessons);

    for (let i = 1; i <= completed; i += 1) {
      const day = interactionDayForLesson(i, completed, prog.firstInteractionDaysAgo, prog.lastInteractionDaysAgo);
      lessonInteractions.push({
        id: `int_${prog.userId}_${prog.courseId}_l${i}`,
        userId: prog.userId,
        courseId: prog.courseId,
        lessonId: `lesson_${prog.courseId}_${i}`,
        lessonTitle: lessonTitles[i - 1] ?? null,
        completed: true,
        createdAt: isoDaysAgo(day),
        sourceTimestamp,
      });
    }

    const completionRate = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
    courseStudents.push({
      userId: prog.userId,
      courseId: prog.courseId,
      completionRate,
      completedLessons: completed,
      totalLessons,
      firstInteractionAt: isoDaysAgo(prog.firstInteractionDaysAgo),
      lastInteractionAt: isoDaysAgo(prog.lastInteractionDaysAgo),
      sourceTimestamp,
    });
  }

  return {
    experiences: EXPERIENCES,
    students: STUDENTS,
    courses,
    products,
    memberships,
    lessonInteractions,
    courseStudents,
    sourceTimestamp,
  };
}

// ── Cached dataset + getters ─────────────────────────────────

let cached: FixtureDataset | null = null;

function data(): FixtureDataset {
  if (!cached) {
    cached = buildDataset();
  }
  return cached;
}

export function getExperiences(): ExperienceRecord[] {
  return data().experiences;
}

export function getStudents(): StudentRecord[] {
  return data().students;
}

export function getCourses(): ExternalCourse[] {
  return data().courses;
}

export function getProducts(): ExternalProduct[] {
  return data().products;
}

export function getMemberships(): ExternalMembership[] {
  return data().memberships;
}

export function getLessonInteractions(): ExternalCourseLessonInteraction[] {
  return data().lessonInteractions;
}

export function getCourseStudents(): ExternalCourseStudent[] {
  return data().courseStudents;
}

export function getFixtureSourceTimestamp(): string {
  return data().sourceTimestamp;
}

/**
 * Drop the cached dataset so the next getter call regenerates it.
 * Useful for tests that need a clean fixture state.
 */
export function resetFixtureData(): void {
  cached = null;
}
