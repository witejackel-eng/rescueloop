// Students directory helpers — saved-view matching, filtering, and intervention
// lookup. Inlined into the lib (replacing the old students-directory.ts).

import type {
  InterventionState,
  MembershipStatus,
  RiskSegment,
  Student,
} from "./types";
import { INTERVENTIONS } from "./mock-data";

// Demo "today" used everywhere in the RescueLoop dataset
export const DEMO_TODAY = new Date();

// ── Saved view definitions ────────────────────────────────────
export type SavedViewId =
  | "all"
  | "needs_attention"
  | "never_started"
  | "inactive_7plus"
  | "renewing_this_week"
  | "cancellation_pending"
  | "previously_rescued";

export interface SavedViewDef {
  id: SavedViewId;
  label: string;
  description: string;
}

export const SAVED_VIEWS: SavedViewDef[] = [
  {
    id: "all",
    label: "All members",
    description: "Every member in the directory",
  },
  {
    id: "needs_attention",
    label: "Needs attention",
    description: "At-risk members not excluded from automation",
  },
  {
    id: "never_started",
    label: "Never started",
    description: "Paid but never opened the first lesson",
  },
  {
    id: "inactive_7plus",
    label: "Inactive 7+ days",
    description: "No activity in the last week",
  },
  {
    id: "renewing_this_week",
    label: "Renewing this week",
    description: "Membership renews within 7 days",
  },
  {
    id: "cancellation_pending",
    label: "Cancellation pending",
    description: "Membership scheduled to cancel",
  },
  {
    id: "previously_rescued",
    label: "Previously rescued",
    description: "Returned after an intervention",
  },
];

const NEEDS_ATTENTION_SEGMENTS: RiskSegment[] = [
  "never_started",
  "early_stall",
  "mid_course_stall",
  "near_completion",
  "scheduled_cancellation",
];

// ── Intervention lookup ───────────────────────────────────────
export function getInterventionState(
  studentId: string,
): InterventionState | null {
  return INTERVENTIONS.find((i) => i.studentId === studentId)?.state ?? null;
}

export function getInterventionForStudent(studentId: string) {
  return INTERVENTIONS.find((i) => i.studentId === studentId) ?? null;
}

// ── Date helpers ──────────────────────────────────────────────
export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ── Saved view matching ───────────────────────────────────────
export function matchesSavedView(
  student: Student,
  view: SavedViewId,
  excluded: Set<string>,
): boolean {
  const cs = student.courseStates[0];
  if (!cs) return false;
  switch (view) {
    case "all":
      return true;
    case "needs_attention":
      return (
        !excluded.has(student.id) &&
        NEEDS_ATTENTION_SEGMENTS.includes(cs.riskSegment)
      );
    case "never_started":
      return cs.riskSegment === "never_started";
    case "inactive_7plus":
      return cs.daysInactive >= 7;
    case "renewing_this_week": {
      const diff = daysBetween(DEMO_TODAY, new Date(student.membership.renewalDate));
      return diff >= 0 && diff <= 7;
    }
    case "cancellation_pending":
      return student.membership.status === "cancelling";
    case "previously_rescued":
      return cs.momentum === "recovered";
  }
}

export function countForView(
  students: Student[],
  view: SavedViewId,
  excluded: Set<string>,
): number {
  return students.filter((s) => matchesSavedView(s, view, excluded)).length;
}

// ── Filter bar ────────────────────────────────────────────────
export interface StudentFilters {
  search: string;
  membershipStatus: "all" | MembershipStatus;
  riskSegment: "all" | RiskSegment;
  progressMin: string;
  progressMax: string;
  lastActivity: "any" | "today" | "3d" | "7d" | "14d" | "30d";
  renewalWindow: "any" | "this_week" | "2_weeks" | "30_days";
  responseState: "any" | "responded" | "not_responded" | "recovered";
}

export const DEFAULT_FILTERS: StudentFilters = {
  search: "",
  membershipStatus: "all",
  riskSegment: "all",
  progressMin: "",
  progressMax: "",
  lastActivity: "any",
  renewalWindow: "any",
  responseState: "any",
};

export function isDefaultFilters(f: StudentFilters): boolean {
  return (
    f.search === "" &&
    f.membershipStatus === "all" &&
    f.riskSegment === "all" &&
    f.progressMin === "" &&
    f.progressMax === "" &&
    f.lastActivity === "any" &&
    f.renewalWindow === "any" &&
    f.responseState === "any"
  );
}

export function matchesFilters(student: Student, f: StudentFilters): boolean {
  const cs = student.courseStates[0];
  if (!cs) return false;

  // Search (name or email)
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    if (
      !student.name.toLowerCase().includes(q) &&
      !student.email.toLowerCase().includes(q)
    ) {
      return false;
    }
  }

  // Membership status
  if (f.membershipStatus !== "all" && student.membership.status !== f.membershipStatus) {
    return false;
  }

  // Risk segment
  if (f.riskSegment !== "all" && cs.riskSegment !== f.riskSegment) {
    return false;
  }

  // Progress range
  if (f.progressMin !== "" && cs.progressPercent < Number(f.progressMin)) {
    return false;
  }
  if (f.progressMax !== "" && cs.progressPercent > Number(f.progressMax)) {
    return false;
  }

  // Last activity threshold
  if (f.lastActivity !== "any") {
    if (f.lastActivity === "today" && cs.daysInactive !== 0) return false;
    if (f.lastActivity === "3d" && cs.daysInactive < 3) return false;
    if (f.lastActivity === "7d" && cs.daysInactive < 7) return false;
    if (f.lastActivity === "14d" && cs.daysInactive < 14) return false;
    if (f.lastActivity === "30d" && cs.daysInactive < 30) return false;
  }

  // Renewal window
  if (f.renewalWindow !== "any") {
    const diff = daysBetween(DEMO_TODAY, new Date(student.membership.renewalDate));
    if (diff < 0) return false;
    if (f.renewalWindow === "this_week" && diff > 7) return false;
    if (f.renewalWindow === "2_weeks" && diff > 14) return false;
    if (f.renewalWindow === "30_days" && diff > 30) return false;
  }

  // Response state (uses intervention lookup)
  if (f.responseState !== "any") {
    const state = getInterventionState(student.id);
    if (f.responseState === "responded" && state !== "responded") return false;
    if (
      f.responseState === "not_responded" &&
      (state === "responded" || state === "recovered")
    )
      return false;
    if (f.responseState === "recovered" && state !== "recovered") return false;
  }

  return true;
}
