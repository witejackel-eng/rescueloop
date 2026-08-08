// Fixture/Connected mode separation for RescueLoop onboarding.
//
// Fixture mode uses deterministic local data for demos and development.
// Connected mode requires real Whop credentials and database access.
// Routes that require real data must call ensureConnectedMode() to
// prevent accidental fixture-data leakage in production.

// ── Mode detection ────────────────────────────────────────────

/** Whether the app is running in fixture/demo mode. */
export function isFixtureMode(): boolean {
  return (
    process.env.RESCUELOOP_FIXTURE_MODE === "1" ||
    process.env.RESCUELOOP_FIXTURE_MODE === "true"
  );
}

/** Throws if fixture mode is active and the route requires real data. */
export function ensureConnectedMode(): void {
  if (isFixtureMode()) {
    throw new FixtureModeError(
      "This operation requires connected mode. Fixture data cannot be used for real onboarding actions.",
    );
  }
}

/** Typed error for fixture-mode guard violations. */
export class FixtureModeError extends Error {
  readonly code = "FIXTURE_MODE_GUARD" as const;

  constructor(message: string) {
    super(message);
    this.name = "FixtureModeError";
  }
}

// ── Fixture data factory ──────────────────────────────────────
// Simulated data for the onboarding demo experience.

export interface FixtureCandidate {
  id: string;
  name: string;
  email: string;
  courseName: string;
  productName: string;
  membershipStatus: "active" | "trialing" | "cancelling" | "cancelled";
  startDate: string;
  progressEvidence: string;
  inactivityDays: number;
  eligibilityReason: string;
  unknownEvidence: boolean;
  suppressed: boolean;
  cooldownUntil: string | null;
}

export interface FixtureOnboardingState {
  step: "access" | "course-mapped" | "sync" | "threshold" | "candidates" | "complete";
  companyId: string;
  companyName: string;
  totalMembers: number;
  syncedAt: string;
  coursesConnected: number;
  safetyExclusions: number;
  candidates: FixtureCandidate[];
}

export const FIXTURE_COMPANY_ID = "co_fixture_cgl";

/** Generate fixture onboarding state with simulated candidates. */
export function getFixtureOnboardingState(
  thresholdDays: number,
): FixtureOnboardingState {
  const now = new Date();
  const isoDaysAgo = (d: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    return dt.toISOString();
  };

  const allCandidates: FixtureCandidate[] = [
    {
      id: "fc_1",
      name: "Maya Chen",
      email: "maya@example.com",
      courseName: "Creator Growth Accelerator",
      productName: "Growth Membership",
      membershipStatus: "active",
      startDate: isoDaysAgo(14),
      progressEvidence: "Completed 3 of 29 lessons, then stopped",
      inactivityDays: 9,
      eligibilityReason: "Active member with no lesson activity in threshold window",
      unknownEvidence: false,
      suppressed: false,
      cooldownUntil: null,
    },
    {
      id: "fc_2",
      name: "Jordan Rivera",
      email: "jordan.r@example.com",
      courseName: "Creator Growth Accelerator",
      productName: "Growth Membership",
      membershipStatus: "active",
      startDate: isoDaysAgo(22),
      progressEvidence: "Completed 8 of 29 lessons, stalled at module 3",
      inactivityDays: 11,
      eligibilityReason: "Active member stalled mid-course beyond threshold",
      unknownEvidence: false,
      suppressed: false,
      cooldownUntil: null,
    },
    {
      id: "fc_3",
      name: "Sam Okafor",
      email: "sam.ok@example.com",
      courseName: "Creator Growth Accelerator",
      productName: "Growth Membership",
      membershipStatus: "trialing",
      startDate: isoDaysAgo(5),
      progressEvidence: "No lessons started",
      inactivityDays: 5,
      eligibilityReason: "Trialing member who never activated",
      unknownEvidence: true,
      suppressed: false,
      cooldownUntil: null,
    },
    {
      id: "fc_4",
      name: "Priya Sharma",
      email: "priya.s@example.com",
      courseName: "Agency Playbook",
      productName: "Agency Membership",
      membershipStatus: "active",
      startDate: isoDaysAgo(30),
      progressEvidence: "Last activity 12 days ago (lesson 18/24)",
      inactivityDays: 12,
      eligibilityReason: "Active member with prolonged inactivity",
      unknownEvidence: false,
      suppressed: false,
      cooldownUntil: null,
    },
    {
      id: "fc_5",
      name: "Alex Kim",
      email: "alex.kim@example.com",
      courseName: "Creator Growth Accelerator",
      productName: "Growth Membership",
      membershipStatus: "active",
      startDate: isoDaysAgo(8),
      progressEvidence: "Completed lesson 1 only",
      inactivityDays: 6,
      eligibilityReason: "Active member with minimal progress after purchase",
      unknownEvidence: false,
      suppressed: true,
      cooldownUntil: isoDaysAgo(-2),
    },
    {
      id: "fc_6",
      name: "Riley Nguyen",
      email: "riley.n@example.com",
      courseName: "Freelance Blueprint",
      productName: "Freelance Tier",
      membershipStatus: "cancelling",
      startDate: isoDaysAgo(45),
      progressEvidence: "Was active, then scheduled cancellation",
      inactivityDays: 15,
      eligibilityReason: "Cancelling member with recent activity drop",
      unknownEvidence: true,
      suppressed: false,
      cooldownUntil: null,
    },
  ];

  // Filter candidates by threshold (inactivity >= thresholdDays)
  const candidates = allCandidates.filter(
    (c) => c.inactivityDays >= thresholdDays,
  );

  return {
    step: "threshold",
    companyId: FIXTURE_COMPANY_ID,
    companyName: "Fixture Demo Company",
    totalMembers: 742,
    syncedAt: now.toISOString(),
    coursesConnected: 3,
    safetyExclusions: 12,
    candidates,
  };
}

/** Fixture candidate count at a given threshold (for preview). */
export function getFixtureCandidateCount(thresholdDays: number): number {
  return getFixtureOnboardingState(thresholdDays).candidates.length;
}

/** Sample candidates (3-5 examples) for preview. */
export function getFixtureCandidateSamples(
  thresholdDays: number,
  limit = 5,
): FixtureCandidate[] {
  return getFixtureOnboardingState(thresholdDays).candidates.slice(0, limit);
}
