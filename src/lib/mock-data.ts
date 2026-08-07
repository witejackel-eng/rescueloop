import type {
  ActivityEvent,
  AutomationState,
  BlockerResponse,
  Campaign,
  Company,
  Course,
  FrictionFinding,
  Intervention,
  Notification,
  Product,
  Student,
  ValueEvent,
} from "./types";
import { daysAgo, daysFromNow, minutesAgoIso, hoursAgoIso, daysAgoIso } from "@/lib/dates";

// ─────────────────────────────────────────────────────────────
// RescueLoop demo account — one coherent dataset used everywhere
// Company: Creator Growth Lab · Product: Agency Accelerator ($79/mo)
// Course: Agency Growth System (29 lessons, 742 students)
// ─────────────────────────────────────────────────────────────

export const COMPANY: Company = {
  id: "co_cgl",
  name: "Creator Growth Lab",
  planCost: 29,
};

export const PRODUCT: Product = {
  id: "pr_agency",
  name: "Agency Accelerator",
  price: 79,
  billingCycle: "monthly",
  companyId: COMPANY.id,
};

export const COURSE: Course = {
  id: "cr_ags",
  name: "Agency Growth System",
  lessonCount: 29,
  studentCount: 742,
  productId: PRODUCT.id,
  dataAvailability: "full",
};

// Secondary courses for onboarding selection
export const COURSES_FOR_SELECTION: Course[] = [
  COURSE,
  {
    id: "cr_fc",
    name: "Freelance Foundations",
    lessonCount: 18,
    studentCount: 412,
    productId: "pr_freelance",
    dataAvailability: "full",
  },
  {
    id: "cr_cb",
    name: "Client Breakthrough",
    lessonCount: 24,
    studentCount: 588,
    productId: "pr_client",
    dataAvailability: "partial",
  },
  {
    id: "cr_scale",
    name: "Scale to Seven Figures",
    lessonCount: 36,
    studentCount: 318,
    productId: "pr_scale",
    dataAvailability: "full",
  },
];

export const AUTOMATION_STATE: AutomationState = "manual_approval";

export const LAST_SYNC = "just now";
export const NEXT_SYNC = "in 13 minutes";

// ── Aggregate KPIs (consistent across every page) ────────────
export const KPIS = {
  totalStudents: 742,
  lessonCount: 29,
  atRiskStudents: 118,
  interventionsSent: 78,
  studentsReengaged: 31,
  firstTimeActivations: 9,
  cancellationsReversed: 3,
  confirmedRecoveredRevenue: 237,
  estimated90DayRetainedValue: 711,
  creatorActionRequests: 11,
  planCost: 29,
  creatorActionsAvoided: 63,
  confirmedValueToCost: 8.2,
} as const;

// ── Recovery funnel ──────────────────────────────────────────
export const RECOVERY_FUNNEL = [
  { stage: "Detected", count: 118, label: "Members matching a risk signal" },
  { stage: "Eligible", count: 96, label: "Passed cooldown & safety checks" },
  { stage: "Contacted", count: 78, label: "Intervention delivered" },
  { stage: "Responded", count: 43, label: "Student replied or returned" },
  { stage: "Resumed", count: 31, label: "Completed a lesson after contact" },
  { stage: "Retained", count: 7, label: "Still active after 14 days" },
];

// ── Attention queue summary ──────────────────────────────────
export const ATTENTION_ITEMS = [
  {
    id: "att_1",
    label: "Students expected something different",
    count: 4,
    severity: "warning" as const,
    href: "/rescue-queue",
  },
  {
    id: "att_2",
    label: "Technical problems reported",
    count: 3,
    severity: "critical" as const,
    href: "/insights",
  },
  {
    id: "att_3",
    label: "Cancellation reviews pending",
    count: 2,
    severity: "critical" as const,
    href: "/rescue-queue",
  },
  {
    id: "att_4",
    label: "Direct help requests",
    count: 2,
    severity: "warning" as const,
    href: "/rescue-queue",
  },
];

// ── Risk segments ────────────────────────────────────────────
export const RISK_SEGMENTS = [
  {
    id: "never_started",
    label: "Never started",
    count: 17,
    trend: 3,
    rescueRate: 53,
    description: "Paid but never opened the first lesson",
  },
  {
    id: "early_stall",
    label: "Early stall",
    count: 31,
    trend: -5,
    rescueRate: 41,
    description: "Started but stalled before 20% progress",
  },
  {
    id: "mid_course_stall",
    label: "Mid-course stall",
    count: 42,
    trend: 8,
    rescueRate: 34,
    description: "Stalled between 20% and 70% progress",
  },
  {
    id: "near_completion",
    label: "Near completion",
    count: 28,
    trend: -2,
    rescueRate: 61,
    description: "Stalled after 70% progress",
  },
];

// ── Course progression funnel (Insights) ─────────────────────
export const COURSE_FUNNEL = [
  { stage: "Started course", count: 812 },
  { stage: "Completed first module", count: 693 },
  { stage: "Reached midpoint", count: 426 },
  { stage: "Reached final module", count: 211 },
  { stage: "Completed course", count: 153 },
];

// ── Blocker analysis ─────────────────────────────────────────
export const BLOCKER_ANALYSIS = [
  { blocker: "Lack of time", percent: 38, count: 29 },
  { blocker: "Material is difficult", percent: 24, count: 18 },
  { blocker: "Unsure what to do next", percent: 17, count: 13 },
  { blocker: "Expected something different", percent: 9, count: 7 },
  { blocker: "Technical problem", percent: 7, count: 5 },
  { blocker: "Needs creator help", percent: 5, count: 4 },
];

// ── Lesson friction map ──────────────────────────────────────
export const LESSON_FRICTION = [
  { lesson: "L2: Finding Your First Client", stallRate: 6, affected: 4 },
  { lesson: "L4: Pricing Your Services", stallRate: 8, affected: 6 },
  { lesson: "L7: Setting Up Your First Campaign", stallRate: 24, affected: 18 },
  { lesson: "L9: Writing Outreach Messages", stallRate: 12, affected: 9 },
  { lesson: "L12: Onboarding a Client", stallRate: 7, affected: 5 },
  { lesson: "L15: Delivering Results", stallRate: 11, affected: 8 },
  { lesson: "L18: Scaling Your Offers", stallRate: 14, affected: 10 },
  { lesson: "L22: Hiring Your First VA", stallRate: 9, affected: 6 },
  { lesson: "L26: Retainer Agreements", stallRate: 5, affected: 3 },
];

export const COURSE_AVERAGE_STALL_RATE = 10;

// ── Friction findings ────────────────────────────────────────
export const FRICTION_FINDINGS: FrictionFinding[] = [
  {
    id: "ff_l7",
    lessonIndex: 7,
    lessonTitle: "Setting Up Your First Campaign",
    stallRate: 24,
    courseAverageStallRate: 10,
    reportsCount: 6,
    affectedStudents: 18,
    recommendation: "Add a setup walkthrough video to Lesson 7",
    status: "new",
  },
  {
    id: "ff_l18",
    lessonIndex: 18,
    lessonTitle: "Scaling Your Offers",
    stallRate: 14,
    courseAverageStallRate: 10,
    reportsCount: 4,
    affectedStudents: 10,
    recommendation: "Add a pricing calculator template to Lesson 18",
    status: "planned",
  },
  {
    id: "ff_l9",
    lessonIndex: 9,
    lessonTitle: "Writing Outreach Messages",
    stallRate: 12,
    courseAverageStallRate: 10,
    reportsCount: 3,
    affectedStudents: 9,
    recommendation: "Provide 5 message templates alongside Lesson 9",
    status: "new",
  },
];

// ── Named students ───────────────────────────────────────────
type StudentSeed = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  membershipStatus: Student["membership"]["status"];
  renewalDate: string;
  progress: number;
  lessonsCompleted: number;
  lastActivityAt: string;
  currentLessonIndex: number;
  currentLessonTitle: string;
  riskSegment: Student["courseStates"][number]["riskSegment"];
  momentum: Student["courseStates"][number]["momentum"];
  daysInactive: number;
  progressHistory: { date: string; lessonIndex: number; lessonTitle: string; action: "completed" | "started" | "stalled" | "returned" }[];
  interventionState: Intervention["state"];
  trigger: string;
  recommendedRescue: string;
  priority: Intervention["priority"];
  campaignType: Campaign["type"];
  messagePreview: string;
  attributionLevel: Intervention["attributionLevel"];
  evidence: string[];
  excluded: boolean;
};

const STUDENT_SEEDS: StudentSeed[] = [
  {
    id: "st_001",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    joinedAt: daysAgo(20),
    membershipStatus: "active",
    renewalDate: daysFromNow(11),
    progress: 0,
    lessonsCompleted: 0,
    lastActivityAt: daysAgo(20),
    currentLessonIndex: 0,
    currentLessonTitle: "Welcome to Agency Growth System",
    riskSegment: "never_started",
    momentum: "stopped",
    daysInactive: 23,
    progressHistory: [
      { date: daysAgo(20), lessonIndex: 0, lessonTitle: "Welcome", action: "started" },
    ],
    interventionState: "awaiting_approval",
    trigger: "Paid 23 days ago, never opened Lesson 1",
    recommendedRescue: "Activation Rescue — friendly nudge",
    priority: "high",
    campaignType: "activation_rescue",
    messagePreview:
      "Hi Maya, I noticed you haven't had a chance to dive into Agency Growth System yet. No pressure at all — the first lesson is only 8 minutes. Want me to point you to the quickest place to start?",
    attributionLevel: "estimated",
    evidence: ["Membership active", "0% progress", "23 days since join"],
    excluded: false,
  },
  {
    id: "st_002",
    name: "James Okonkwo",
    email: "james.okonkwo@example.com",
    joinedAt: daysAgo(24),
    membershipStatus: "active",
    renewalDate: daysFromNow(7),
    progress: 14,
    lessonsCompleted: 4,
    lastActivityAt: daysAgo(4),
    currentLessonIndex: 5,
    currentLessonTitle: "Pricing Your Services",
    riskSegment: "early_stall",
    momentum: "slowing",
    daysInactive: 7,
    progressHistory: [
      { date: daysAgo(24), lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: daysAgo(22), lessonIndex: 1, lessonTitle: "Finding Your First Client", action: "completed" },
      { date: daysAgo(18), lessonIndex: 2, lessonTitle: "Niche Selection", action: "completed" },
      { date: daysAgo(12), lessonIndex: 3, lessonTitle: "Service Offers", action: "completed" },
      { date: daysAgo(8), lessonIndex: 4, lessonTitle: "Positioning", action: "completed" },
      { date: daysAgo(4), lessonIndex: 5, lessonTitle: "Pricing Your Services", action: "stalled" },
    ],
    interventionState: "awaiting_approval",
    trigger: "Stalled at Lesson 5 for 7 days",
    recommendedRescue: "Early Progress Rescue — offer pricing help",
    priority: "medium",
    campaignType: "early_progress_rescue",
    messagePreview:
      "Hi James, you're off to a strong start — 4 lessons in two weeks. Pricing can be tricky. Would a quick pricing reference sheet help you move forward?",
    attributionLevel: "strongly_associated",
    evidence: ["4 lessons completed", "Stalled at pricing lesson", "7 days inactive"],
    excluded: false,
  },
  {
    id: "st_003",
    name: "Sofia Ramirez",
    email: "sofia.ramirez@example.com",
    joinedAt: "2025-12-15",
    membershipStatus: "active",
    renewalDate: daysFromNow(14),
    progress: 38,
    lessonsCompleted: 11,
    lastActivityAt: daysAgo(7),
    currentLessonIndex: 12,
    currentLessonTitle: "Onboarding a Client",
    riskSegment: "mid_course_stall",
    momentum: "stopped",
    daysInactive: 10,
    progressHistory: [
      { date: "2025-12-15", lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: "2025-12-20", lessonIndex: 5, lessonTitle: "Pricing Your Services", action: "completed" },
      { date: daysAgo(30), lessonIndex: 8, lessonTitle: "Writing Outreach Messages", action: "completed" },
      { date: daysAgo(17), lessonIndex: 10, lessonTitle: "Discovery Calls", action: "completed" },
      { date: daysAgo(7), lessonIndex: 11, lessonTitle: "Proposals", action: "completed" },
      { date: daysAgo(7), lessonIndex: 12, lessonTitle: "Onboarding a Client", action: "stalled" },
    ],
    interventionState: "scheduled",
    trigger: "Inactive 10 days mid-course",
    recommendedRescue: "Mid-Course Rescue — check in on onboarding",
    priority: "medium",
    campaignType: "mid_course_rescue",
    messagePreview:
      "Hi Sofia, you're over a third of the way through — that's real progress. The onboarding lesson can feel like a lot. Want me to share a simple onboarding checklist?",
    attributionLevel: "strongly_associated",
    evidence: ["11 lessons completed", "38% progress", "10 days inactive"],
    excluded: false,
  },
  {
    id: "st_004",
    name: "David Kim",
    email: "david.kim@example.com",
    joinedAt: "2025-11-20",
    membershipStatus: "cancelling",
    renewalDate: daysFromNow(19),
    progress: 72,
    lessonsCompleted: 21,
    lastActivityAt: daysAgo(2),
    currentLessonIndex: 22,
    currentLessonTitle: "Hiring Your First VA",
    riskSegment: "scheduled_cancellation",
    momentum: "slowing",
    daysInactive: 5,
    progressHistory: [
      { date: "2025-11-20", lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: "2025-12-10", lessonIndex: 8, lessonTitle: "Writing Outreach Messages", action: "completed" },
      { date: "2025-12-28", lessonIndex: 15, lessonTitle: "Delivering Results", action: "completed" },
      { date: daysAgo(12), lessonIndex: 20, lessonTitle: "Retainer Offers", action: "completed" },
      { date: daysAgo(2), lessonIndex: 21, lessonTitle: "Scope Creep", action: "completed" },
    ],
    interventionState: "awaiting_approval",
    trigger: "Cancellation scheduled before completion",
    recommendedRescue: "Cancellation Rescue — understand the blocker",
    priority: "urgent",
    campaignType: "cancellation_rescue",
    messagePreview:
      "Hi David, I saw your cancellation is scheduled. You're 72% through the course — genuinely close. Can I ask what's getting in the way? I'd rather help you finish than lose your progress.",
    attributionLevel: "confirmed",
    evidence: ["Cancellation scheduled", "72% progress", "5 days inactive"],
    excluded: false,
  },
  {
    id: "st_005",
    name: "Aisha Patel",
    email: "aisha.patel@example.com",
    joinedAt: "2025-12-01",
    membershipStatus: "active",
    renewalDate: daysFromNow(0),
    progress: 89,
    lessonsCompleted: 26,
    lastActivityAt: daysAgo(10),
    currentLessonIndex: 27,
    currentLessonTitle: "Retainer Agreements",
    riskSegment: "near_completion",
    momentum: "slowing",
    daysInactive: 13,
    progressHistory: [
      { date: "2025-12-01", lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: "2025-12-20", lessonIndex: 10, lessonTitle: "Discovery Calls", action: "completed" },
      { date: daysAgo(22), lessonIndex: 18, lessonTitle: "Scaling Your Offers", action: "completed" },
      { date: daysAgo(10), lessonIndex: 26, lessonTitle: "Final Push", action: "completed" },
    ],
    interventionState: "awaiting_approval",
    trigger: "Near completion, inactive 13 days",
    recommendedRescue: "Near-Finish Rescue — celebrate + finish line",
    priority: "high",
    campaignType: "near_finish_rescue",
    messagePreview:
      "Hi Aisha, you're at 89% — just 3 lessons from finishing. That's remarkable. Want a quick plan to close out the last few lessons this week?",
    attributionLevel: "strongly_associated",
    evidence: ["26 lessons completed", "89% progress", "13 days inactive"],
    excluded: false,
  },
  {
    id: "st_006",
    name: "Liam Murphy",
    email: "liam.murphy@example.com",
    joinedAt: daysAgo(17),
    membershipStatus: "active",
    renewalDate: daysFromNow(14),
    progress: 7,
    lessonsCompleted: 2,
    lastActivityAt: daysAgo(2),
    currentLessonIndex: 3,
    currentLessonTitle: "Niche Selection",
    riskSegment: "early_stall",
    momentum: "slowing",
    daysInactive: 5,
    progressHistory: [
      { date: daysAgo(17), lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: daysAgo(10), lessonIndex: 1, lessonTitle: "Finding Your First Client", action: "completed" },
      { date: daysAgo(2), lessonIndex: 2, lessonTitle: "Niche Selection", action: "stalled" },
    ],
    interventionState: "awaiting_approval",
    trigger: "Stalled at Lesson 3 for 5 days",
    recommendedRescue: "Early Progress Rescue — niche clarity",
    priority: "medium",
    campaignType: "early_progress_rescue",
    messagePreview:
      "Hi Liam, picking a niche can feel like a big decision. A lot of members find it easier after a 5-minute exercise. Want me to share it?",
    attributionLevel: "estimated",
    evidence: ["2 lessons completed", "7% progress", "5 days inactive"],
    excluded: false,
  },
  {
    id: "st_007",
    name: "Emma Thompson",
    email: "emma.thompson@example.com",
    joinedAt: "2025-10-10",
    membershipStatus: "active",
    renewalDate: daysFromNow(9),
    progress: 45,
    lessonsCompleted: 13,
    lastActivityAt: daysAgo(4),
    currentLessonIndex: 14,
    currentLessonTitle: "Delivering Results",
    riskSegment: "mid_course_stall",
    momentum: "steady",
    daysInactive: 7,
    progressHistory: [
      { date: "2025-10-10", lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: "2025-11-01", lessonIndex: 6, lessonTitle: "Setting Up Your First Campaign", action: "completed" },
      { date: "2025-11-20", lessonIndex: 10, lessonTitle: "Discovery Calls", action: "completed" },
      { date: daysAgo(4), lessonIndex: 13, lessonTitle: "Proposals", action: "completed" },
    ],
    interventionState: "sent",
    trigger: "Inactive 7 days mid-course",
    recommendedRescue: "Mid-Course Rescue — delivering results",
    priority: "medium",
    campaignType: "mid_course_rescue",
    messagePreview:
      "Hi Emma, you're nearly halfway. The delivering-results lesson is where things get practical — want a quick case study to anchor it?",
    attributionLevel: "strongly_associated",
    evidence: ["13 lessons completed", "45% progress", "7 days inactive"],
    excluded: false,
  },
  {
    id: "st_008",
    name: "Noah Williams",
    email: "noah.williams@example.com",
    joinedAt: "2025-12-20",
    membershipStatus: "active",
    renewalDate: daysFromNow(19),
    progress: 0,
    lessonsCompleted: 0,
    lastActivityAt: "2025-12-20",
    currentLessonIndex: 0,
    currentLessonTitle: "Welcome to Agency Growth System",
    riskSegment: "never_started",
    momentum: "stopped",
    daysInactive: 39,
    progressHistory: [
      { date: "2025-12-20", lessonIndex: 0, lessonTitle: "Welcome", action: "started" },
    ],
    interventionState: "sent",
    trigger: "Paid 39 days ago, never started",
    recommendedRescue: "Activation Rescue — re-introduce the course",
    priority: "high",
    campaignType: "activation_rescue",
    messagePreview:
      "Hi Noah, Agency Growth System is ready whenever you are. The first lesson is short and gives you a clear map. Want me to open it for you?",
    attributionLevel: "estimated",
    evidence: ["Membership active", "0% progress", "39 days since join"],
    excluded: false,
  },
  {
    id: "st_009",
    name: "Olivia Brown",
    email: "olivia.brown@example.com",
    joinedAt: "2025-11-05",
    membershipStatus: "active",
    renewalDate: daysFromNow(4),
    progress: 42,
    lessonsCompleted: 12,
    lastActivityAt: daysAgo(3),
    currentLessonIndex: 13,
    currentLessonTitle: "Proposals",
    riskSegment: "mid_course_stall",
    momentum: "recovered",
    daysInactive: 3,
    progressHistory: [
      { date: "2025-11-05", lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: "2025-12-01", lessonIndex: 8, lessonTitle: "Writing Outreach Messages", action: "completed" },
      { date: daysAgo(17), lessonIndex: 11, lessonTitle: "Proposals", action: "stalled" },
      { date: daysAgo(3), lessonIndex: 12, lessonTitle: "Proposals", action: "returned" },
    ],
    interventionState: "recovered",
    trigger: "Returned after mid-course intervention",
    recommendedRescue: "Already recovered — monitor",
    priority: "low",
    campaignType: "mid_course_rescue",
    messagePreview:
      "Hi Olivia, glad to see you back. You're making great progress on proposals. Let me know if anything blocks you.",
    attributionLevel: "confirmed",
    evidence: ["Returned after intervention", "Progress 38% → 42%", "Completed a lesson after contact"],
    excluded: false,
  },
  {
    id: "st_010",
    name: "Ethan Garcia",
    email: "ethan.garcia@example.com",
    joinedAt: "2025-12-28",
    membershipStatus: "active",
    renewalDate: daysFromNow(27),
    progress: 3,
    lessonsCompleted: 1,
    lastActivityAt: daysAgo(7),
    currentLessonIndex: 2,
    currentLessonTitle: "Niche Selection",
    riskSegment: "early_stall",
    momentum: "stopped",
    daysInactive: 10,
    progressHistory: [
      { date: "2025-12-28", lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: daysAgo(7), lessonIndex: 1, lessonTitle: "Finding Your First Client", action: "stalled" },
    ],
    interventionState: "responded",
    trigger: "Stalled at Lesson 2, responded to nudge",
    recommendedRescue: "Early Progress Rescue — follow up",
    priority: "medium",
    campaignType: "early_progress_rescue",
    messagePreview:
      "Hi Ethan, thanks for replying. The niche lesson is next — it's shorter than it looks. Want a 3-step version?",
    attributionLevel: "strongly_associated",
    evidence: ["1 lesson completed", "Responded to intervention", "10 days inactive"],
    excluded: false,
  },
  {
    id: "st_011",
    name: "Charlotte Davis",
    email: "charlotte.davis@example.com",
    joinedAt: "2025-09-15",
    membershipStatus: "active",
    renewalDate: daysFromNow(14),
    progress: 95,
    lessonsCompleted: 28,
    lastActivityAt: daysAgo(1),
    currentLessonIndex: 29,
    currentLessonTitle: "Course Completion",
    riskSegment: "near_completion",
    momentum: "accelerating",
    daysInactive: 2,
    progressHistory: [
      { date: "2025-09-15", lessonIndex: 0, lessonTitle: "Welcome", action: "completed" },
      { date: "2025-11-01", lessonIndex: 10, lessonTitle: "Discovery Calls", action: "completed" },
      { date: daysAgo(22), lessonIndex: 20, lessonTitle: "Retainer Offers", action: "completed" },
      { date: daysAgo(1), lessonIndex: 28, lessonTitle: "Final Review", action: "completed" },
    ],
    interventionState: "recovered",
    trigger: "Near completion, returned after nudge",
    recommendedRescue: "Already recovered — celebrate",
    priority: "low",
    campaignType: "near_finish_rescue",
    messagePreview:
      "Hi Charlotte, you're at 95% — incredible. The final lesson wraps everything into a launch plan. Almost there!",
    attributionLevel: "confirmed",
    evidence: ["28 lessons completed", "95% progress", "Returned after intervention"],
    excluded: false,
  },
  {
    id: "st_012",
    name: "Mason Lee",
    email: "mason.lee@example.com",
    joinedAt: daysAgo(29),
    membershipStatus: "active",
    renewalDate: daysFromNow(2),
    progress: 0,
    lessonsCompleted: 0,
    lastActivityAt: daysAgo(29),
    currentLessonIndex: 0,
    currentLessonTitle: "Welcome to Agency Growth System",
    riskSegment: "never_started",
    momentum: "stopped",
    daysInactive: 29,
    progressHistory: [
      { date: daysAgo(29), lessonIndex: 0, lessonTitle: "Welcome", action: "started" },
    ],
    interventionState: "dismissed",
    trigger: "Paid 29 days ago, never started",
    recommendedRescue: "Activation Rescue — dismissed by creator",
    priority: "low",
    campaignType: "activation_rescue",
    messagePreview: "",
    attributionLevel: "estimated",
    evidence: ["Dismissed by creator", "0% progress", "29 days since join"],
    excluded: true,
  },
];

function buildStudent(seed: StudentSeed): Student {
  return {
    id: seed.id,
    name: seed.name,
    email: seed.email,
    avatarInitials: seed.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase(),
    joinedAt: seed.joinedAt,
    membership: {
      id: `mb_${seed.id}`,
      productId: PRODUCT.id,
      status: seed.membershipStatus,
      startedAt: seed.joinedAt,
      renewalDate: seed.renewalDate,
      monthlyValue: PRODUCT.price,
    },
    courseStates: [
      {
        studentId: seed.id,
        courseId: COURSE.id,
        progressPercent: seed.progress,
        lessonsCompleted: seed.lessonsCompleted,
        lastActivityAt: seed.lastActivityAt,
        currentLessonIndex: seed.currentLessonIndex,
        currentLessonTitle: seed.currentLessonTitle,
        riskSegment: seed.riskSegment,
        momentum: seed.momentum,
        progressHistory: seed.progressHistory,
        daysInactive: seed.daysInactive,
      },
    ],
    excluded: seed.excluded,
  };
}

export const STUDENTS: Student[] = STUDENT_SEEDS.map(buildStudent);

// ── Interventions derived from seeds ─────────────────────────
export const INTERVENTIONS: Intervention[] = STUDENT_SEEDS.map((s) => ({
  id: `iv_${s.id}`,
  studentId: s.id,
  campaignId: `cm_${s.campaignType}`,
  state: s.interventionState,
  trigger: s.trigger,
  recommendedAction: s.recommendedRescue,
  messagePreview: s.messagePreview,
  scheduledFor: s.interventionState === "scheduled" ? `${daysFromNow(1)}T09:00:00` : null,
  sentAt:
    ["sent", "opened", "responded", "recovered", "not_recovered"].includes(s.interventionState)
      ? `${daysAgo(3)}T09:00:00`
      : null,
  respondedAt: ["responded", "recovered"].includes(s.interventionState)
    ? `${daysAgo(2)}T14:00:00`
    : null,
  recoveredAt: s.interventionState === "recovered" ? `${daysAgo(1)}T10:00:00` : null,
  cooldownUntil: `${daysFromNow(13)}T00:00:00`,
  priority: s.priority,
  attributionLevel: s.attributionLevel,
  evidence: s.evidence,
}));

// ── Rescue queue rows ────────────────────────────────────────
export const RESCUE_QUEUE_ROWS = STUDENT_SEEDS.filter((s) => !s.excluded).map((s) => {
  const student = STUDENTS.find((st) => st.id === s.id)!;
  return {
    id: `rq_${s.id}`,
    student,
    trigger: s.trigger,
    progressPercent: s.progress,
    lastActivityAt: s.lastActivityAt,
    membershipLabel: membershipLabel(s.membershipStatus, s.renewalDate),
    recommendedRescue: s.recommendedRescue,
    priority: s.priority,
    interventionState: s.interventionState,
    renewalDate: s.renewalDate,
    campaignType: s.campaignType,
  };
});

function membershipLabel(status: string, renewal: string): string {
  const map: Record<string, string> = {
    active: `Active · renews ${renewal}`,
    trialing: "Trial",
    cancelling: `Cancelling ${renewal}`,
    cancelled: "Cancelled",
    paused_membership: "Paused",
  };
  return map[status] ?? status;
}

// ── Campaigns ───────────────────────────────────────────────
export const CAMPAIGNS: Campaign[] = [
  {
    id: "cm_activation_rescue",
    type: "activation_rescue",
    name: "Activation Rescue",
    status: "active",
    approvalMode: "automatic",
    studentsDetected: 17,
    interventionsSent: 12,
    studentsResumed: 6,
    rescueRate: 50,
    rules: {
      progressMin: 0,
      progressMax: 0,
      inactivityDaysMin: 7,
      inactivityDaysMax: 999,
      membershipStatuses: ["active", "trialing"],
      renewalWindowDays: 0,
      cooldownDays: 14,
    },
    safety: {
      maxMessagesPerMember: 2,
      cooldownDays: 14,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      stopAfterResponse: true,
      stopAfterProgressResumes: true,
      stopAfterMembershipEnds: true,
    },
    messageTemplate:
      "Hi {{first_name}}, I noticed you haven't had a chance to dive into {{course_name}} yet. No pressure at all — the first lesson is only {{lesson_duration}}. Want me to point you to the quickest place to start?",
  },
  {
    id: "cm_early_progress_rescue",
    type: "early_progress_rescue",
    name: "Early Progress Rescue",
    status: "active",
    approvalMode: "automatic",
    studentsDetected: 31,
    interventionsSent: 22,
    studentsResumed: 9,
    rescueRate: 41,
    rules: {
      progressMin: 1,
      progressMax: 20,
      inactivityDaysMin: 5,
      inactivityDaysMax: 30,
      membershipStatuses: ["active", "trialing"],
      renewalWindowDays: 0,
      cooldownDays: 10,
    },
    safety: {
      maxMessagesPerMember: 3,
      cooldownDays: 10,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      stopAfterResponse: true,
      stopAfterProgressResumes: true,
      stopAfterMembershipEnds: true,
    },
    messageTemplate:
      "Hi {{first_name}}, you're off to a start with {{course_name}}. {{current_lesson}} can trip people up. Want me to share a quick reference?",
  },
  {
    id: "cm_mid_course_rescue",
    type: "mid_course_rescue",
    name: "Mid-Course Rescue",
    status: "active",
    approvalMode: "automatic",
    studentsDetected: 42,
    interventionsSent: 28,
    studentsResumed: 10,
    rescueRate: 36,
    rules: {
      progressMin: 21,
      progressMax: 70,
      inactivityDaysMin: 7,
      inactivityDaysMax: 45,
      membershipStatuses: ["active", "trialing"],
      renewalWindowDays: 0,
      cooldownDays: 14,
    },
    safety: {
      maxMessagesPerMember: 3,
      cooldownDays: 14,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      stopAfterResponse: true,
      stopAfterProgressResumes: true,
      stopAfterMembershipEnds: true,
    },
    messageTemplate:
      "Hi {{first_name}}, you're {{progress_percent}} through {{course_name}} — real progress. {{current_lesson}} is where it gets practical. Want a quick case study to anchor it?",
  },
  {
    id: "cm_near_finish_rescue",
    type: "near_finish_rescue",
    name: "Near-Finish Rescue",
    status: "active",
    approvalMode: "automatic",
    studentsDetected: 28,
    interventionsSent: 16,
    studentsResumed: 6,
    rescueRate: 38,
    rules: {
      progressMin: 71,
      progressMax: 99,
      inactivityDaysMin: 7,
      inactivityDaysMax: 60,
      membershipStatuses: ["active", "trialing"],
      renewalWindowDays: 0,
      cooldownDays: 14,
    },
    safety: {
      maxMessagesPerMember: 2,
      cooldownDays: 14,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      stopAfterResponse: true,
      stopAfterProgressResumes: true,
      stopAfterMembershipEnds: true,
    },
    messageTemplate:
      "Hi {{first_name}}, you're at {{progress_percent}} — just a few lessons from finishing {{course_name}}. Want a quick plan to close out this week?",
  },
  {
    id: "cm_cancellation_rescue",
    type: "cancellation_rescue",
    name: "Cancellation Rescue",
    status: "active",
    approvalMode: "manual",
    studentsDetected: 5,
    interventionsSent: 0,
    studentsResumed: 0,
    rescueRate: 0,
    rules: {
      progressMin: 0,
      progressMax: 100,
      inactivityDaysMin: 0,
      inactivityDaysMax: 999,
      membershipStatuses: ["cancelling"],
      renewalWindowDays: 7,
      cooldownDays: 21,
    },
    safety: {
      maxMessagesPerMember: 1,
      cooldownDays: 21,
      quietHoursStart: "20:00",
      quietHoursEnd: "08:00",
      stopAfterResponse: true,
      stopAfterProgressResumes: true,
      stopAfterMembershipEnds: true,
    },
    messageTemplate:
      "Hi {{first_name}}, I saw your cancellation is scheduled. You're {{progress_percent}} through {{course_name}}. Can I ask what's getting in the way? I'd rather help you finish than lose your progress.",
  },
];

// ── Value events (ledger) ───────────────────────────────────
export const VALUE_EVENTS: ValueEvent[] = [
  {
    id: "ve_001",
    event: "Cancellation reversed",
    studentId: "st_009",
    studentName: "Olivia Brown",
    intervention: "Mid-Course Rescue",
    evidence: "Student returned, completed Lesson 12, reversed cancellation",
    attributionLevel: "confirmed",
    monetaryValue: 79,
    date: daysAgo(1),
  },
  {
    id: "ve_002",
    event: "Member activated",
    studentId: "st_008",
    studentName: "Noah Williams",
    intervention: "Activation Rescue",
    evidence: "First lesson completed after 39-day inactivity",
    attributionLevel: "confirmed",
    monetaryValue: 79,
    date: daysAgo(2),
  },
  {
    id: "ve_003",
    event: "Lesson completed after contact",
    studentId: "st_009",
    studentName: "Olivia Brown",
    intervention: "Mid-Course Rescue",
    evidence: "Progress increased from 38% to 42% within 48h of message",
    attributionLevel: "confirmed",
    monetaryValue: 0,
    date: daysAgo(2),
  },
  {
    id: "ve_004",
    event: "Resumed after stall",
    studentId: "st_010",
    studentName: "Ethan Garcia",
    intervention: "Early Progress Rescue",
    evidence: "Student responded to nudge; no lesson completed yet",
    attributionLevel: "strongly_associated",
    monetaryValue: 79,
    date: daysAgo(2),
  },
  {
    id: "ve_005",
    event: "Near completion returned",
    studentId: "st_011",
    studentName: "Charlotte Davis",
    intervention: "Near-Finish Rescue",
    evidence: "Returned after 13-day gap, completed Lesson 28",
    attributionLevel: "confirmed",
    monetaryValue: 79,
    date: daysAgo(1),
  },
  {
    id: "ve_006",
    event: "Estimated 90-day retention",
    studentId: "st_007",
    studentName: "Emma Thompson",
    intervention: "Mid-Course Rescue",
    evidence: "Intervention sent; response pending; modeled retention probability",
    attributionLevel: "estimated",
    monetaryValue: 237,
    date: daysAgo(3),
  },
  {
    id: "ve_007",
    event: "Cancellation reversed",
    studentId: "st_004",
    studentName: "David Kim",
    intervention: "Cancellation Rescue",
    evidence: "Cancellation reversed after creator follow-up",
    attributionLevel: "confirmed",
    monetaryValue: 79,
    date: daysFromNow(0),
  },
];

// ── Notifications ────────────────────────────────────────────
export const NOTIFICATIONS: Notification[] = [
  // ── Today ──────────────────────────────────────────────
  {
    id: "nt_001",
    type: "help_request",
    category: "response",
    title: "David Kim needs your help",
    description: "David reported needing help from the creator before completing the course.",
    createdAt: "12 minutes ago",
    createdAtIso: minutesAgoIso(12),
    resolved: false,
    dismissed: false,
    actionLabel: "Review request",
    actionHref: "/students",
  },
  {
    id: "nt_002",
    type: "cancellation_detection",
    category: "rescue",
    title: "5 cancellations scheduled this week",
    description: "Cancellation Rescue campaign is in manual-approval mode for these students.",
    createdAt: "38 minutes ago",
    createdAtIso: minutesAgoIso(38),
    resolved: false,
    dismissed: false,
    actionLabel: "Review cancellations",
    actionHref: "/rescue-queue",
  },
  {
    id: "nt_003",
    type: "recovery_confirmed",
    category: "rescue",
    title: "Olivia Brown's recovery confirmed",
    description: "Progress moved from 38% to 42% after the Mid-Course Rescue message.",
    createdAt: "1 hour ago",
    createdAtIso: hoursAgoIso(1),
    resolved: false,
    dismissed: false,
    actionLabel: "View evidence",
    actionHref: "/outcomes",
  },
  {
    id: "nt_004",
    type: "friction_finding",
    category: "rescue",
    title: "Lesson 7 stall rate is 2.4× the course average",
    description: "18 students stalled after “Setting Up Your First Campaign.”",
    createdAt: "2 hours ago",
    createdAtIso: hoursAgoIso(2),
    resolved: false,
    dismissed: false,
    actionLabel: "See friction finding",
    actionHref: "/insights",
  },
  {
    id: "nt_005",
    type: "sync_problem",
    category: "system",
    title: "Whop membership sync retrying",
    description: "The last membership sync encountered a rate limit. Retrying in 4 minutes.",
    createdAt: "3 hours ago",
    createdAtIso: hoursAgoIso(3),
    resolved: false,
    dismissed: false,
    actionLabel: "View sync status",
    actionHref: "/settings/health",
  },
  {
    id: "nt_006",
    type: "plan_limit",
    category: "system",
    title: "Approaching monthly intervention limit",
    description: "78 of 100 monthly interventions used. Resets on Feb 12.",
    createdAt: "5 hours ago",
    createdAtIso: hoursAgoIso(5),
    resolved: true,
    dismissed: false,
    actionLabel: "View plan",
    actionHref: "/usage",
  },
  {
    id: "nt_007",
    type: "creator_mention",
    category: "mention",
    title: "Maya Patel mentioned you in a response",
    description: "“Could @creator share the niche targeting checklist? I keep getting stuck on audience research.”",
    createdAt: "6 hours ago",
    createdAtIso: hoursAgoIso(6),
    resolved: false,
    dismissed: false,
    actionLabel: "View response",
    actionHref: "/responses",
  },
  {
    id: "nt_008",
    type: "recovery_confirmed",
    category: "rescue",
    title: "Ethan Garcia returned to the course",
    description: "Completed Lesson 12 — Early Progress Rescue attributed to the recovery.",
    createdAt: "8 hours ago",
    createdAtIso: hoursAgoIso(8),
    resolved: false,
    dismissed: false,
    actionLabel: "View evidence",
    actionHref: "/outcomes",
  },
  // ── Earlier this week ──────────────────────────────────
  {
    id: "nt_009",
    type: "help_request",
    category: "response",
    title: "Sofia Ramirez requested a 1:1 call",
    description: "Sofia asked for a strategy session before continuing Module 4.",
    createdAt: "Yesterday",
    createdAtIso: hoursAgoIso(26),
    resolved: true,
    dismissed: false,
    actionLabel: "Open inbox",
    actionHref: "/responses",
  },
  {
    id: "nt_010",
    type: "cancellation_detection",
    category: "rescue",
    title: "3 new cancellation candidates detected",
    description: "Near-Renewal Rescue campaign flagged three members with declining engagement.",
    createdAt: "Yesterday",
    createdAtIso: hoursAgoIso(28),
    resolved: false,
    dismissed: false,
    actionLabel: "Review queue",
    actionHref: "/rescue-queue",
  },
  {
    id: "nt_011",
    type: "sync_problem",
    category: "system",
    title: "Course progress sync completed with warnings",
    description: "12 of 14 courses synced. Two courses have stale progress data older than 48h.",
    createdAt: "2 days ago",
    createdAtIso: daysAgoIso(2),
    resolved: true,
    dismissed: false,
    actionLabel: "View sync status",
    actionHref: "/settings/health",
  },
  {
    id: "nt_012",
    type: "member_mention",
    category: "mention",
    title: "Aisha Patel mentioned you in a blocker report",
    description: "“@creator the Module 3 download link seems broken — can you confirm?”",
    createdAt: "2 days ago",
    createdAtIso: daysAgoIso(2),
    resolved: false,
    dismissed: false,
    actionLabel: "View report",
    actionHref: "/students",
  },
  {
    id: "nt_013",
    type: "friction_finding",
    category: "rescue",
    title: "New friction pattern: Lesson 12 exit rate at 31%",
    description: "9 students abandoned after the budgeting exercise. Recommendation drafted.",
    createdAt: "3 days ago",
    createdAtIso: daysAgoIso(3),
    resolved: false,
    dismissed: false,
    actionLabel: "See finding",
    actionHref: "/insights",
  },
  {
    id: "nt_014",
    type: "campaign_paused",
    category: "system",
    title: "Near-Finish Rescue campaign paused",
    description: "Automatic pause triggered after 3 consecutive non-responses. Review the rules.",
    createdAt: "3 days ago",
    createdAtIso: daysAgoIso(3),
    resolved: true,
    dismissed: false,
    actionLabel: "Resume campaign",
    actionHref: "/playbooks",
  },
  // ── Earlier this month ─────────────────────────────────
  {
    id: "nt_015",
    type: "recovery_confirmed",
    category: "rescue",
    title: "Recovery milestone: $2,140 in retained revenue this month",
    description: "27 students recovered across 4 rescue campaigns. Strongest attribution: Mid-Course Rescue.",
    createdAt: "5 days ago",
    createdAtIso: daysAgoIso(5),
    resolved: true,
    dismissed: false,
    actionLabel: "View outcomes",
    actionHref: "/outcomes",
  },
  {
    id: "nt_016",
    type: "help_request",
    category: "response",
    title: "Noah Williams submitted feedback",
    description: "“Loving the rescue messages — they actually got me back on track.” Positive sentiment logged.",
    createdAt: "6 days ago",
    createdAtIso: daysAgoIso(6),
    resolved: true,
    dismissed: false,
    actionLabel: "View feedback",
    actionHref: "/responses",
  },
  {
    id: "nt_017",
    type: "creator_mention",
    category: "mention",
    title: "Charlotte Davis mentioned you in the community thread",
    description: "“@creator your reply to my blocker was a lifesaver — thank you!”",
    createdAt: "1 week ago",
    createdAtIso: daysAgoIso(7),
    resolved: true,
    dismissed: false,
    actionLabel: "Open thread",
    actionHref: "/responses",
  },
  {
    id: "nt_018",
    type: "plan_limit",
    category: "system",
    title: "Monthly intervention limit reset",
    description: "Your February quota is now available. 100 interventions remaining.",
    createdAt: "12 days ago",
    createdAtIso: daysAgoIso(12),
    resolved: true,
    dismissed: false,
    actionLabel: "View plan",
    actionHref: "/usage",
  },
  {
    id: "nt_019",
    type: "cancellation_detection",
    category: "rescue",
    title: "Cancellation wave detected (3 weeks ago)",
    description: "7 cancellations clustered in 48h. Cancellation Rescue campaign auto-queued.",
    createdAt: "3 weeks ago",
    createdAtIso: daysAgoIso(21),
    resolved: true,
    dismissed: false,
    actionLabel: "View archive",
    actionHref: "/outcomes",
  },
  {
    id: "nt_020",
    type: "sync_problem",
    category: "system",
    title: "Whop webhook delivery lagged (resolved)",
    description: "Webhook events were delayed ~6 minutes. Service is back to normal latency.",
    createdAt: "1 month ago",
    createdAtIso: daysAgoIso(33),
    resolved: true,
    dismissed: false,
    actionLabel: "View incident",
    actionHref: "/settings/health",
  },
];

// Unresolved count for the notification badge
export const UNRESOLVED_NOTIFICATION_COUNT = NOTIFICATIONS.filter((n) => !n.resolved).length;

// ── Activity feed ───────────────────────────────────────────
export const ACTIVITY_FEED: ActivityEvent[] = [
  {
    id: "ac_001",
    timestamp: "2 minutes ago",
    type: "recovery_confirmed",
    studentName: "David Kim",
    detail: "Cancellation reversed — returned to Lesson 22",
    value: 79,
  },
  {
    id: "ac_002",
    timestamp: "12 minutes ago",
    type: "student_responded",
    studentName: "Ethan Garcia",
    detail: "Replied to Early Progress Rescue — “I'll try the niche exercise tonight.”",
  },
  {
    id: "ac_003",
    timestamp: "38 minutes ago",
    type: "intervention_sent",
    studentName: "Sofia Ramirez",
    detail: "Mid-Course Rescue scheduled for 9:00 AM tomorrow",
  },
  {
    id: "ac_004",
    timestamp: "1 hour ago",
    type: "blocker_collected",
    studentName: "Aisha Patel",
    detail: "Reported: “I don't know what to do next.”",
  },
  {
    id: "ac_005",
    timestamp: "2 hours ago",
    type: "friction_detected",
    studentName: "Lesson 7",
    detail: "Stall rate 24% — 2.4× course average",
  },
  {
    id: "ac_006",
    timestamp: "3 hours ago",
    type: "member_activated",
    studentName: "Noah Williams",
    detail: "Completed first lesson after 39-day inactivity",
    value: 79,
  },
  {
    id: "ac_007",
    timestamp: "5 hours ago",
    type: "student_resumed",
    studentName: "Charlotte Davis",
    detail: "Completed Lesson 28 — progress 89% → 95%",
  },
  {
    id: "ac_008",
    timestamp: "6 hours ago",
    type: "cancellation_reversed",
    studentName: "Olivia Brown",
    detail: "Reversed scheduled cancellation after Mid-Course Rescue",
    value: 79,
  },
  {
    id: "ac_009",
    timestamp: "8 hours ago",
    type: "campaign_scheduled",
    studentName: "Near-Finish Rescue",
    detail: "16 interventions queued for 9:00 AM tomorrow",
  },
  {
    id: "ac_010",
    timestamp: "10 hours ago",
    type: "intervention_sent",
    studentName: "Emma Thompson",
    detail: "Mid-Course Rescue delivered — case study attached",
  },
];

// ── Blocker responses (student-facing) ──────────────────────
export const BLOCKER_RESPONSES: BlockerResponse[] = [
  { id: "br_001", studentId: "st_009", blocker: "unsure_next_step", note: "Not sure what comes after proposals.", createdAt: daysAgo(2) },
  { id: "br_002", studentId: "st_010", blocker: "lack_of_time", note: "Work got busy this week.", createdAt: daysAgo(2) },
  { id: "br_003", studentId: "st_004", blocker: "needs_creator_help", note: "Need a 1:1 before I continue.", createdAt: daysFromNow(0) },
  { id: "br_004", studentId: "st_005", blocker: "material_difficult", note: "Retainer agreements are confusing.", createdAt: daysAgo(3) },
];

// ── Onboarding audit results ────────────────────────────────
export const ONBOARDING_AUDIT_STEPS = [
  { id: "step_1", label: "Memberships synchronized", detail: "742 members matched to Agency Accelerator", status: "done" as const },
  { id: "step_2", label: "Course students synchronized", detail: "742 students enrolled in Agency Growth System", status: "done" as const },
  { id: "step_3", label: "Course-product relationship confirmed", detail: "Agency Accelerator → Agency Growth System", status: "done" as const },
  { id: "step_4", label: "Progress history analysed", detail: "29 lessons · 812 enrolment events processed", status: "done" as const },
  { id: "step_5", label: "Detecting recovery opportunities", detail: "118 risk signals identified", status: "done" as const },
];

export const ONBOARDING_RESULTS = [
  { id: "r_1", label: "Paid but never started", count: 17, severity: "warning" as const },
  { id: "r_2", label: "Started but stalled", count: 31, severity: "warning" as const },
  { id: "r_3", label: "Inactive before renewal", count: 8, severity: "critical" as const },
  { id: "r_4", label: "Scheduled cancellations", count: 5, severity: "critical" as const },
];

// ── Weekly recovery trend (chart) ───────────────────────────
export const WEEKLY_RECOVERY = [
  { day: "Mon", detected: 14, contacted: 9, resumed: 4 },
  { day: "Tue", detected: 12, contacted: 8, resumed: 3 },
  { day: "Wed", detected: 18, contacted: 11, resumed: 5 },
  { day: "Thu", detected: 15, contacted: 10, resumed: 4 },
  { day: "Fri", detected: 20, contacted: 14, resumed: 6 },
  { day: "Sat", detected: 11, contacted: 7, resumed: 3 },
  { day: "Sun", detected: 9, contacted: 6, resumed: 2 },
];

// ── Helper: get student by id ───────────────────────────────
export function getStudentById(id: string): Student | undefined {
  return STUDENTS.find((s) => s.id === id);
}

export function getCampaignByType(type: Campaign["type"]): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.type === type);
}

export function getCampaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}
