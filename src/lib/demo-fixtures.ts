// ─────────────────────────────────────────────────────────────
// RescueLoop Public Demo — Deterministic Fixture Data
// All values are explicitly illustrative.
// NO real customer data. NO API calls. NO mutations.
// ─────────────────────────────────────────────────────────────

import { daysAgo, daysFromNow } from "@/lib/dates";

// ── Overview Metrics ──────────────────────────────────────────
export const DEMO_METRICS = {
  membersMonitored: 742,
  needsReview: 23,
  awaitingApproval: 5,
  recentResponses: 18,
  observedReturns: 12,
  planMembers: 1000,
  planInterventions: 2000,
  usedInterventions: 118,
} as const;

// ── Recovery Pulse Funnel ─────────────────────────────────────
export const DEMO_RECOVERY_FUNNEL = [
  { stage: "Detected", count: 118, label: "Risk signals detected" },
  { stage: "Eligible", count: 96, label: "Met intervention criteria" },
  { stage: "Reviewed", count: 88, label: "Creator reviewed and approved" },
  { stage: "Contacted", count: 78, label: "RescueLoop experience delivered" },
  { stage: "Responded", count: 43, label: "Student responded" },
  { stage: "Resumed", count: 31, label: "Student resumed course activity" },
  { stage: "Retained", count: 7, label: "Membership confirmed retained" },
] as const;

// ── Rescue Queue Candidates ───────────────────────────────────
export interface DemoQueueCandidate {
  id: string;
  name: string;
  initials: string;
  course: string;
  membershipStatus: "active" | "trialing" | "cancelling" | "cancelled";
  monthlyValue: number;
  progress: number;
  lastActivity: string;
  daysInactive: number;
  priority: "low" | "medium" | "high" | "urgent";
  trigger: string;
  evidence: string[];
  cooldownUntil: string | null;
  contactHistory: string[];
  draftMessage: string;
  riskSegment: string;
  renewalDate: string;
  state: "awaiting_approval" | "approved" | "scheduled" | "sent" | "responded" | "dismissed";
}

export const DEMO_QUEUE_CANDIDATES: DemoQueueCandidate[] = [
  {
    id: "dq_maya",
    name: "Maya Thompson",
    initials: "MT",
    course: "Agency Growth System",
    membershipStatus: "active",
    monthlyValue: 79,
    progress: 48,
    lastActivity: daysAgo(8),
    daysInactive: 8,
    priority: "high",
    trigger: "Mid-course stall",
    evidence: [
      "Completed Lesson 14 on " + daysAgo(8),
      "No activity for 8 days",
      "Previously engaged with Lessons 12–14",
    ],
    cooldownUntil: null,
    contactHistory: [],
    draftMessage:
      "Hey Maya — I noticed you were making great progress through the Agency Growth System and paused around Lesson 15. Is there anything I can help unblock? I'm here if you want to talk through the material or skip ahead to what's next.",
    riskSegment: "Mid-course stall",
    renewalDate: daysFromNow(23),
    state: "awaiting_approval",
  },
  {
    id: "dq_devon",
    name: "Devon Park",
    initials: "DP",
    course: "Agency Growth System",
    membershipStatus: "active",
    monthlyValue: 79,
    progress: 72,
    lastActivity: daysAgo(12),
    daysInactive: 12,
    priority: "urgent",
    trigger: "Inactive near renewal",
    evidence: [
      "Last lesson activity " + daysAgo(12),
      "Membership renews in 4 days",
      "Completed 21 of 29 lessons — near completion",
    ],
    cooldownUntil: null,
    contactHistory: ["RescueLoop message sent " + daysAgo(6) + " — not opened"],
    draftMessage:
      "Devon — you're 72% through Agency Growth System and just a few lessons from the finish. Your membership renews soon, and I want to make sure you get full value. What's been keeping you from the last stretch?",
    riskSegment: "Inactive near renewal",
    renewalDate: daysFromNow(4),
    state: "awaiting_approval",
  },
  {
    id: "dq_sara",
    name: "Sara Klein",
    initials: "SK",
    course: "Agency Growth System",
    membershipStatus: "trialing",
    monthlyValue: 79,
    progress: 3,
    lastActivity: daysAgo(15),
    daysInactive: 15,
    priority: "medium",
    trigger: "Never started / stalled early",
    evidence: [
      "Completed only Lesson 1",
      "Trial started " + daysAgo(15),
      "No further activity detected",
    ],
    cooldownUntil: null,
    contactHistory: [],
    draftMessage:
      "Hi Sara — welcome to Agency Growth System! It looks like you got started with the first lesson but haven't continued. Sometimes the hardest part is getting into a rhythm. Would a quick walkthrough help?",
    riskSegment: "Never started",
    renewalDate: daysFromNow(16),
    state: "awaiting_approval",
  },
  {
    id: "dq_jamal",
    name: "Jamal Wright",
    initials: "JW",
    course: "Agency Growth System",
    membershipStatus: "cancelling",
    monthlyValue: 79,
    progress: 34,
    lastActivity: daysAgo(5),
    daysInactive: 5,
    priority: "high",
    trigger: "Review required",
    evidence: [
      "Cancellation scheduled",
      "Last activity " + daysAgo(5),
      "Completed 10 of 29 lessons",
    ],
    cooldownUntil: null,
    contactHistory: ["Cancellation notice received " + daysAgo(2)],
    draftMessage:
      "Jamal — I saw your cancellation request come through. Before it processes, I'd love to understand what's not working. If there's something I can fix or adjust, I'm here. Your progress so far is solid.",
    riskSegment: "Scheduled cancellation",
    renewalDate: daysFromNow(2),
    state: "awaiting_approval",
  },
];

// ── Members Table ─────────────────────────────────────────────
export interface DemoMember {
  id: string;
  name: string;
  initials: string;
  course: string;
  membership: "active" | "trialing" | "cancelling" | "cancelled" | "paused_membership";
  progress: number;
  lastActivity: string;
  status: "active" | "needs_attention" | "responded" | "paused_reminders";
  lastIntervention: string | null;
  lastResponse: string | null;
  suppressed: boolean;
}

export const DEMO_MEMBERS: DemoMember[] = [
  { id: "m1", name: "Maya Thompson", initials: "MT", course: "Agency Growth System", membership: "active", progress: 48, lastActivity: daysAgo(8), status: "needs_attention", lastIntervention: "Mid-course stall detected", lastResponse: null, suppressed: false },
  { id: "m2", name: "Devon Park", initials: "DP", course: "Agency Growth System", membership: "active", progress: 72, lastActivity: daysAgo(12), status: "needs_attention", lastIntervention: "Inactive near renewal", lastResponse: null, suppressed: false },
  { id: "m3", name: "Sara Klein", initials: "SK", course: "Agency Growth System", membership: "trialing", progress: 3, lastActivity: daysAgo(15), status: "needs_attention", lastIntervention: "Never started detected", lastResponse: null, suppressed: false },
  { id: "m4", name: "Jamal Wright", initials: "JW", course: "Agency Growth System", membership: "cancelling", progress: 34, lastActivity: daysAgo(5), status: "needs_attention", lastIntervention: "Cancellation review", lastResponse: null, suppressed: false },
  { id: "m5", name: "Olivia Brown", initials: "OB", course: "Agency Growth System", membership: "active", progress: 86, lastActivity: daysAgo(1), status: "responded", lastIntervention: "Near-completion check-in", lastResponse: "I need help", suppressed: false },
  { id: "m6", name: "Liam Chen", initials: "LC", course: "Agency Growth System", membership: "active", progress: 62, lastActivity: daysAgo(2), status: "responded", lastIntervention: "Mid-course rescue", lastResponse: "Continue course", suppressed: false },
  { id: "m7", name: "Ava Martinez", initials: "AM", course: "Agency Growth System", membership: "active", progress: 95, lastActivity: daysAgo(0), status: "active", lastIntervention: null, lastResponse: null, suppressed: false },
  { id: "m8", name: "Noah Williams", initials: "NW", course: "Agency Growth System", membership: "cancelled", progress: 21, lastActivity: daysAgo(30), status: "paused_reminders", lastIntervention: "Early stall rescue (dismissed)", lastResponse: "Stop reminders", suppressed: true },
  { id: "m9", name: "Emma Johnson", initials: "EJ", course: "Agency Growth System", membership: "active", progress: 55, lastActivity: daysAgo(3), status: "active", lastIntervention: null, lastResponse: null, suppressed: false },
  { id: "m10", name: "Ethan Davis", initials: "ED", course: "Agency Growth System", membership: "active", progress: 41, lastActivity: daysAgo(6), status: "needs_attention", lastIntervention: "Stall detected", lastResponse: null, suppressed: false },
  { id: "m11", name: "Sophia Lee", initials: "SL", course: "Agency Growth System", membership: "active", progress: 79, lastActivity: daysAgo(1), status: "active", lastIntervention: null, lastResponse: null, suppressed: false },
  { id: "m12", name: "Mason Taylor", initials: "MT", course: "Agency Growth System", membership: "trialing", progress: 10, lastActivity: daysAgo(4), status: "responded", lastIntervention: "Activation rescue", lastResponse: "I'm blocked", suppressed: false },
];

// ── Playbooks ─────────────────────────────────────────────────
export interface DemoPlaybook {
  id: string;
  name: string;
  criteria: string;
  cooldown: string;
  quietHours: string;
  messageTemplate: string;
  approvalBehavior: "manual" | "automatic";
  enabled: boolean;
  studentsDetected: number;
}

export const DEMO_PLAYBOOKS: DemoPlaybook[] = [
  {
    id: "pb_never",
    name: "Never started",
    criteria: "Progress < 5% after 7+ days",
    cooldown: "14 days after first contact",
    quietHours: "20:00–08:00 local time",
    messageTemplate: "Welcome nudge — encourages first lesson completion",
    approvalBehavior: "manual",
    enabled: true,
    studentsDetected: 34,
  },
  {
    id: "pb_early",
    name: "Early stall",
    criteria: "Progress 5–25%, inactive 7+ days",
    cooldown: "10 days after last contact",
    quietHours: "20:00–08:00 local time",
    messageTemplate: "Check-in — offers help with current lesson",
    approvalBehavior: "manual",
    enabled: true,
    studentsDetected: 28,
  },
  {
    id: "pb_mid",
    name: "Mid-course stall",
    criteria: "Progress 25–70%, inactive 7+ days",
    cooldown: "7 days after last contact",
    quietHours: "20:00–08:00 local time",
    messageTemplate: "Mid-course rescue — acknowledges progress, offers support",
    approvalBehavior: "manual",
    enabled: true,
    studentsDetected: 42,
  },
  {
    id: "pb_renewal",
    name: "Renewal review",
    criteria: "Inactive 10+ days with renewal in 14 days",
    cooldown: "5 days after last contact",
    quietHours: "20:00–08:00 local time",
    messageTemplate: "Renewal awareness — highlights remaining value and progress",
    approvalBehavior: "manual",
    enabled: true,
    studentsDetected: 14,
  },
];

// ── Student Responses ─────────────────────────────────────────
export interface DemoResponse {
  id: string;
  timestamp: string;
  student: string;
  course: string;
  response: "Continue course" | "I need help" | "I'm blocked" | "Stop reminders";
  followUpState: string;
}

export const DEMO_RESPONSES: DemoResponse[] = [
  { id: "r1", timestamp: daysAgo(0) + " 14:23", student: "Liam Chen", course: "Agency Growth System", response: "Continue course", followUpState: "Progress resumed — completed Lesson 18" },
  { id: "r2", timestamp: daysAgo(0) + " 11:05", student: "Olivia Brown", course: "Agency Growth System", response: "I need help", followUpState: "Awaiting creator response" },
  { id: "r3", timestamp: daysAgo(1) + " 09:17", student: "Mason Taylor", course: "Agency Growth System", response: "I'm blocked", followUpState: "Blocker reported: material_difficult" },
  { id: "r4", timestamp: daysAgo(1) + " 16:42", student: "Noah Williams", course: "Agency Growth System", response: "Stop reminders", followUpState: "Reminders suppressed" },
  { id: "r5", timestamp: daysAgo(2) + " 08:31", student: "Ava Martinez", course: "Agency Growth System", response: "Continue course", followUpState: "Completed final lesson" },
  { id: "r6", timestamp: daysAgo(3) + " 13:55", student: "Emma Johnson", course: "Agency Growth System", response: "I need help", followUpState: "Creator responded, student re-engaged" },
  { id: "r7", timestamp: daysAgo(4) + " 10:20", student: "Sophia Lee", course: "Agency Growth System", response: "Continue course", followUpState: "Completed Lesson 23" },
  { id: "r8", timestamp: daysAgo(5) + " 15:08", student: "Ethan Davis", course: "Agency Growth System", response: "I'm blocked", followUpState: "Blocker: unsure_next_step — guided to Lesson 12" },
];

// ── Outcomes (evidence-first) ─────────────────────────────────
export interface DemoOutcome {
  id: string;
  classification: "observed" | "strongly_associated" | "estimated_opportunity" | "confirmed_recovered";
  student: string;
  description: string;
  evidence: string[];
  date: string;
}

export const DEMO_OUTCOMES: DemoOutcome[] = [
  {
    id: "o1",
    classification: "confirmed_recovered",
    student: "Liam Chen",
    description: "Resumed course after intervention, completed 3 lessons",
    evidence: ["Intervention sent " + daysAgo(4), "Student opened RescueLoop experience", "Responded 'Continue course'", "Completed Lessons 16, 17, 18"],
    date: daysAgo(1),
  },
  {
    id: "o2",
    classification: "strongly_associated",
    student: "Ava Martinez",
    description: "Completed course after mid-course check-in",
    evidence: ["Check-in sent " + daysAgo(6), "Student opened RescueLoop experience", "Completed remaining lessons"],
    date: daysAgo(2),
  },
  {
    id: "o3",
    classification: "observed",
    student: "Emma Johnson",
    description: "Returned to course after requesting help",
    evidence: ["Help request received", "Creator responded", "Student completed next lesson"],
    date: daysAgo(3),
  },
  {
    id: "o4",
    classification: "estimated_opportunity",
    student: "Maya Thompson",
    description: "Mid-course stall — intervention drafted, awaiting approval",
    evidence: ["8 days inactive", "48% progress", "Previously engaged"],
    date: daysAgo(0),
  },
  {
    id: "o5",
    classification: "observed",
    student: "Sophia Lee",
    description: "Continued course after gentle nudge",
    evidence: ["Nudge sent " + daysAgo(5), "Responded 'Continue course'", "Completed Lesson 23"],
    date: daysAgo(4),
  },
];

// ── Insights ──────────────────────────────────────────────────
export interface DemoFrictionPoint {
  lesson: string;
  lessonIndex: number;
  stallRate: number;
  courseAverage: number;
  affectedStudents: number;
}

export const DEMO_FRICTION_POINTS: DemoFrictionPoint[] = [
  { lesson: "Lesson 7: Client Onboarding Setup", lessonIndex: 6, stallRate: 24, courseAverage: 10, affectedStudents: 18 },
  { lesson: "Lesson 14: Pricing Your Services", lessonIndex: 13, stallRate: 18, courseAverage: 10, affectedStudents: 12 },
  { lesson: "Lesson 3: Defining Your Niche", lessonIndex: 2, stallRate: 15, courseAverage: 10, affectedStudents: 9 },
  { lesson: "Lesson 22: Scaling Your Team", lessonIndex: 21, stallRate: 13, courseAverage: 10, affectedStudents: 7 },
];

export const DEMO_RESPONSE_PATTERNS = {
  continueCourse: 42,
  needHelp: 18,
  blocked: 12,
  stopReminders: 8,
} as const;

export const DEMO_ACTIVATION_PATTERNS = {
  totalStudents: 742,
  neverStarted: 34,
  startedButStalled: 56,
  activelyProgressing: 589,
  nearCompletion: 63,
} as const;

// ── Activity Timeline ─────────────────────────────────────────
export interface DemoActivityEvent {
  id: string;
  timestamp: string;
  type: "sync_completed" | "candidate_detected" | "draft_prepared" | "creator_edited" | "approved" | "student_opened" | "student_responded" | "course_activity_observed";
  actor: string;
  detail: string;
}

export const DEMO_ACTIVITY: DemoActivityEvent[] = [
  { id: "a1", timestamp: "2 min ago", type: "sync_completed", actor: "System", detail: "Membership sync completed — 742 members" },
  { id: "a2", timestamp: "18 min ago", type: "candidate_detected", actor: "RescueLoop", detail: "Maya Thompson flagged: Mid-course stall (8 days inactive)" },
  { id: "a3", timestamp: "18 min ago", type: "draft_prepared", actor: "RescueLoop", detail: "Draft support message prepared for Maya Thompson" },
  { id: "a4", timestamp: "1 hour ago", type: "creator_edited", actor: "You", detail: "Edited message for Devon Park — adjusted tone" },
  { id: "a5", timestamp: "1 hour ago", type: "approved", actor: "You", detail: "Approved intervention for Devon Park" },
  { id: "a6", timestamp: "3 hours ago", type: "student_opened", actor: "Liam Chen", detail: "Opened RescueLoop experience" },
  { id: "a7", timestamp: "3 hours ago", type: "student_responded", actor: "Liam Chen", detail: "Responded: 'Continue course'" },
  { id: "a8", timestamp: "4 hours ago", type: "course_activity_observed", actor: "Liam Chen", detail: "Completed Lesson 18 after returning to course" },
  { id: "a9", timestamp: "5 hours ago", type: "candidate_detected", actor: "RescueLoop", detail: "Sara Klein flagged: Never started (15 days inactive)" },
  { id: "a10", timestamp: "6 hours ago", type: "draft_prepared", actor: "RescueLoop", detail: "Draft support message prepared for Sara Klein" },
  { id: "a11", timestamp: "8 hours ago", type: "sync_completed", actor: "System", detail: "Course activity sync completed — 29 lessons" },
  { id: "a12", timestamp: "12 hours ago", type: "student_responded", actor: "Olivia Brown", detail: "Responded: 'I need help'" },
  { id: "a13", timestamp: "1 day ago", type: "course_activity_observed", actor: "Ava Martinez", detail: "Completed Lesson 28 — near course completion" },
  { id: "a14", timestamp: "1 day ago", type: "student_opened", actor: "Ava Martinez", detail: "Opened RescueLoop experience" },
  { id: "a15", timestamp: "2 days ago", type: "approved", actor: "You", detail: "Approved intervention for Liam Chen" },
  { id: "a16", timestamp: "2 days ago", type: "sync_completed", actor: "System", detail: "Full membership + activity sync" },
];

// ── System Health (Simulated) ─────────────────────────────────
export interface DemoHealthDomain {
  domain: string;
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  lastChecked: string;
  details?: string;
}

export const DEMO_HEALTH_DOMAINS: DemoHealthDomain[] = [
  { domain: "Whop connection", status: "healthy", message: "Connected", lastChecked: "2 min ago" },
  { domain: "Permissions", status: "healthy", message: "All scopes granted", lastChecked: "2 min ago" },
  { domain: "Membership sync", status: "healthy", message: "742 members synced", lastChecked: "2 min ago", details: "Last full sync: 2 min ago. Incremental syncs every 5 min." },
  { domain: "Course activity", status: "healthy", message: "29 lessons indexed", lastChecked: "5 min ago" },
  { domain: "Webhooks", status: "healthy", message: "All endpoints responding", lastChecked: "1 min ago", details: "4 active webhooks. Delivery success rate: 100%." },
  { domain: "Jobs", status: "healthy", message: "Queue processing normally", lastChecked: "30 sec ago", details: "Pending: 0. Processing: 1. Completed today: 47." },
  { domain: "Notifications", status: "healthy", message: "Delivery operational", lastChecked: "1 min ago" },
  { domain: "Billing", status: "degraded", message: "Usage refresh delayed", lastChecked: "15 min ago", details: "Usage counter refresh lag: ~12 min. Counts remain accurate within this window." },
  { domain: "Data freshness", status: "healthy", message: "All signals current", lastChecked: "2 min ago", details: "Max staleness: 2 min. Threshold: 15 min." },
];

// ── Plans & Usage ─────────────────────────────────────────────
export interface DemoPlan {
  id: string;
  name: string;
  price: number;
  memberLimit: number;
  interventionLimit: number;
}

export const DEMO_PLANS: DemoPlan[] = [
  { id: "plan_rescue", name: "Rescue", price: 29, memberLimit: 250, interventionLimit: 500 },
  { id: "plan_growth", name: "Growth", price: 59, memberLimit: 1000, interventionLimit: 2000 },
  { id: "plan_scale", name: "Scale", price: 119, memberLimit: 2500, interventionLimit: 5000 },
];

export const DEMO_CURRENT_PLAN = DEMO_PLANS[1]; // Growth plan
export const DEMO_USAGE = {
  membersUsed: 742,
  membersLimit: 1000,
  interventionsUsed: 118,
  interventionsLimit: 2000,
} as const;

// ── Course friction bar data ──────────────────────────────────
export const DEMO_LESSON_BARS = [
  { lesson: "L1", stallRate: 5 },
  { lesson: "L2", stallRate: 8 },
  { lesson: "L3", stallRate: 15 },
  { lesson: "L4", stallRate: 7 },
  { lesson: "L5", stallRate: 6 },
  { lesson: "L6", stallRate: 9 },
  { lesson: "L7", stallRate: 24 },
  { lesson: "L8", stallRate: 11 },
  { lesson: "L9", stallRate: 8 },
];
