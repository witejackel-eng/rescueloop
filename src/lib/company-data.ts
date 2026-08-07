// ─────────────────────────────────────────────────────────────
// RescueLoop Company-Scoped Data Layer
// Provides mock data structured for real API fetch patterns.
// When the real backend is connected, swap fetch() calls here.
// ─────────────────────────────────────────────────────────────

import {
  DEMO_METRICS,
  DEMO_RECOVERY_FUNNEL,
  DEMO_QUEUE_CANDIDATES,
  DEMO_MEMBERS,
  DEMO_PLAYBOOKS,
  DEMO_RESPONSES,
  DEMO_OUTCOMES,
  DEMO_FRICTION_POINTS,
  DEMO_RESPONSE_PATTERNS,
  DEMO_ACTIVATION_PATTERNS,
  DEMO_ACTIVITY,
  DEMO_HEALTH_DOMAINS,
  DEMO_PLANS,
  DEMO_CURRENT_PLAN,
  DEMO_USAGE,
  DEMO_LESSON_BARS,
  type DemoQueueCandidate,
  type DemoMember,
  type DemoPlaybook,
  type DemoResponse,
  type DemoOutcome,
  type DemoFrictionPoint,
  type DemoActivityEvent,
  type DemoHealthDomain,
  type DemoPlan,
} from "./demo-fixtures";

// ── Company context ──────────────────────────────────────────
export interface CompanyContext {
  id: string;
  name: string;
  whopConnected: boolean;
  plan: string;
  planPrice: number;
  lastSync: string;
  onboardingComplete: boolean;
  systemHealth: "healthy" | "degraded" | "unhealthy";
  healthDomains: DemoHealthDomain[];
}

// Known companies for the connected dashboard
export const KNOWN_COMPANIES: Record<string, CompanyContext> = {
  co_cgl: {
    id: "co_cgl",
    name: "Creator Growth Lab",
    whopConnected: true,
    plan: "Growth",
    planPrice: 59,
    lastSync: "2 min ago",
    onboardingComplete: true,
    systemHealth: "healthy",
    healthDomains: DEMO_HEALTH_DOMAINS,
  },
  co_demo: {
    id: "co_demo",
    name: "Demo Company",
    whopConnected: true,
    plan: "Rescue",
    planPrice: 29,
    lastSync: "5 min ago",
    onboardingComplete: true,
    systemHealth: "degraded",
    healthDomains: DEMO_HEALTH_DOMAINS,
  },
};

export function getCompanyContext(companyId: string): CompanyContext | null {
  return KNOWN_COMPANIES[companyId] ?? null;
}

// ── Overview metrics ─────────────────────────────────────────
export interface CompanyOverviewMetrics {
  membersMonitored: number;
  needsReview: number;
  awaitingApproval: number;
  recentResponses: number;
  observedReturns: number;
  planMembers: number;
  planInterventions: number;
  usedInterventions: number;
}

export interface CompanyOverview {
  metrics: CompanyOverviewMetrics;
  recoveryFunnel: typeof DEMO_RECOVERY_FUNNEL;
  lessonBars: typeof DEMO_LESSON_BARS;
  recentActivity: DemoActivityEvent[];
}

export function getCompanyOverview(_companyId: string): CompanyOverview {
  return {
    metrics: { ...DEMO_METRICS },
    recoveryFunnel: [...DEMO_RECOVERY_FUNNEL],
    lessonBars: [...DEMO_LESSON_BARS],
    recentActivity: DEMO_ACTIVITY.slice(0, 6),
  };
}

// ── Full company data bundle ────────────────────────────────
export interface CompanyDataBundle {
  company: CompanyContext;
  overview: CompanyOverview;
  queueCandidates: DemoQueueCandidate[];
  members: DemoMember[];
  playbooks: DemoPlaybook[];
  responses: DemoResponse[];
  outcomes: DemoOutcome[];
  frictionPoints: DemoFrictionPoint[];
  responsePatterns: typeof DEMO_RESPONSE_PATTERNS;
  activationPatterns: typeof DEMO_ACTIVATION_PATTERNS;
  activity: DemoActivityEvent[];
  healthDomains: DemoHealthDomain[];
  plans: DemoPlan[];
  currentPlan: DemoPlan;
  usage: typeof DEMO_USAGE;
}

export function getCompanyDataBundle(companyId: string): CompanyDataBundle | null {
  const company = getCompanyContext(companyId);
  if (!company) return null;

  return {
    company,
    overview: getCompanyOverview(companyId),
    queueCandidates: [...DEMO_QUEUE_CANDIDATES],
    members: [...DEMO_MEMBERS],
    playbooks: [...DEMO_PLAYBOOKS],
    responses: [...DEMO_RESPONSES],
    outcomes: [...DEMO_OUTCOMES],
    frictionPoints: [...DEMO_FRICTION_POINTS],
    responsePatterns: { ...DEMO_RESPONSE_PATTERNS },
    activationPatterns: { ...DEMO_ACTIVATION_PATTERNS },
    activity: [...DEMO_ACTIVITY],
    healthDomains: [...DEMO_HEALTH_DOMAINS],
    plans: [...DEMO_PLANS],
    currentPlan: { ...DEMO_CURRENT_PLAN },
    usage: { ...DEMO_USAGE },
  };
}
