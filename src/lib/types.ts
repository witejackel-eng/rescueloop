// ─────────────────────────────────────────────────────────────
// RescueLoop domain models
// These types define the core entities for the student-success
// and revenue-recovery platform. Mock data conforms to these
// types so the real backend can replace mock-data.ts later.
// ─────────────────────────────────────────────────────────────

export type AutomationState =
  | "audit_only"
  | "manual_approval"
  | "automatic"
  | "paused"
  | "connection_problem";

export type MembershipStatus =
  | "active"
  | "trialing"
  | "cancelling"
  | "cancelled"
  | "paused_membership";

export type RiskSegment =
  | "never_started"
  | "early_stall"
  | "mid_course_stall"
  | "near_completion"
  | "inactive_near_renewal"
  | "scheduled_cancellation";

export type Momentum =
  | "accelerating"
  | "steady"
  | "slowing"
  | "stopped"
  | "recovered";

export type InterventionState =
  | "detected"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "queued"
  | "sent"
  | "opened"
  | "responded"
  | "recovered"
  | "not_recovered"
  | "dismissed"
  | "stopped";

export type AttributionLevel =
  | "confirmed"
  | "strongly_associated"
  | "estimated"
  | "observed";

export type CampaignType =
  | "activation_rescue"
  | "early_progress_rescue"
  | "mid_course_rescue"
  | "near_finish_rescue"
  | "cancellation_rescue";

export type CampaignStatus = "active" | "paused" | "draft";

export type BlockerType =
  | "lack_of_time"
  | "material_difficult"
  | "unsure_next_step"
  | "expected_something_different"
  | "technical_problem"
  | "needs_creator_help";

export type QueueTab =
  | "awaiting_review"
  | "approved"
  | "scheduled"
  | "sent"
  | "responded"
  | "recovered"
  | "dismissed";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface Company {
  id: string;
  name: string;
  planCost: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  billingCycle: "monthly" | "annual" | "one_time";
  companyId: string;
}

export interface Course {
  id: string;
  name: string;
  lessonCount: number;
  studentCount: number;
  productId: string;
  dataAvailability: "full" | "partial" | "syncing";
}

export interface Membership {
  id: string;
  productId: string;
  status: MembershipStatus;
  startedAt: string;
  renewalDate: string;
  monthlyValue: number;
}

export interface ProgressEvent {
  date: string;
  lessonIndex: number;
  lessonTitle: string;
  action: "completed" | "started" | "stalled" | "returned";
}

export interface StudentCourseState {
  studentId: string;
  courseId: string;
  progressPercent: number;
  lessonsCompleted: number;
  lastActivityAt: string;
  currentLessonIndex: number;
  currentLessonTitle: string;
  riskSegment: RiskSegment;
  momentum: Momentum;
  progressHistory: ProgressEvent[];
  daysInactive: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  joinedAt: string;
  membership: Membership;
  courseStates: StudentCourseState[];
  excluded: boolean;
}

export interface Intervention {
  id: string;
  studentId: string;
  campaignId: string;
  state: InterventionState;
  trigger: string;
  recommendedAction: string;
  messagePreview: string;
  scheduledFor: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  recoveredAt: string | null;
  cooldownUntil: string | null;
  priority: Priority;
  attributionLevel: AttributionLevel;
  evidence: string[];
}

export interface Campaign {
  id: string;
  type: CampaignType;
  name: string;
  status: CampaignStatus;
  approvalMode: "manual" | "automatic";
  studentsDetected: number;
  interventionsSent: number;
  studentsResumed: number;
  rescueRate: number;
  rules: CampaignRules;
  safety: CampaignSafety;
  messageTemplate: string;
}

export interface CampaignRules {
  progressMin: number;
  progressMax: number;
  inactivityDaysMin: number;
  inactivityDaysMax: number;
  membershipStatuses: MembershipStatus[];
  renewalWindowDays: number;
  cooldownDays: number;
}

export interface CampaignSafety {
  maxMessagesPerMember: number;
  cooldownDays: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  stopAfterResponse: boolean;
  stopAfterProgressResumes: boolean;
  stopAfterMembershipEnds: boolean;
}

export interface BlockerResponse {
  id: string;
  studentId: string;
  blocker: BlockerType;
  note: string | null;
  createdAt: string;
}

export interface ValueEvent {
  id: string;
  event: string;
  studentId: string;
  studentName: string;
  intervention: string;
  evidence: string;
  attributionLevel: AttributionLevel;
  monetaryValue: number;
  date: string;
}

export interface Notification {
  id: string;
  type:
    | "help_request"
    | "cancellation_detection"
    | "recovery_confirmed"
    | "friction_finding"
    | "campaign_paused"
    | "sync_problem"
    | "plan_limit";
  title: string;
  description: string;
  createdAt: string;
  resolved: boolean;
  actionLabel: string;
  actionHref: string;
}

export interface FrictionFinding {
  id: string;
  lessonIndex: number;
  lessonTitle: string;
  stallRate: number;
  courseAverageStallRate: number;
  reportsCount: number;
  affectedStudents: number;
  recommendation: string;
  status: "new" | "planned" | "completed" | "dismissed";
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type:
    | "intervention_sent"
    | "student_responded"
    | "student_resumed"
    | "recovery_confirmed"
    | "blocker_collected"
    | "friction_detected"
    | "campaign_scheduled"
    | "member_activated"
    | "cancellation_reversed";
  studentName: string;
  detail: string;
  value?: number;
}

export interface RescueQueueRow {
  id: string;
  student: Student;
  trigger: string;
  progressPercent: number;
  lastActivityAt: string;
  membershipLabel: string;
  recommendedRescue: string;
  priority: Priority;
  interventionState: InterventionState;
  renewalDate: string;
  campaignType: CampaignType;
}
