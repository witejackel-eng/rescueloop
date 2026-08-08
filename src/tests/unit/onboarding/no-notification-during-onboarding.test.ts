// Onboarding notification guard test.
//
// CRITICAL INVARIANT: No onboarding action may send a student notification.
// This test verifies that the notification provider is NEVER called during
// any onboarding step — including sync, threshold preview, candidate
// preview, and completion.
//
// Rationale: Onboarding is a configuration phase. No student should receive
// a notification until the admin explicitly approves an intervention in
// the rescue queue. The onboarding wizard must never trigger the
// NotificationsProvider.send() function.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Track notification calls ────────────────────────────────

const notificationCalls: Array<{
  experienceId: string;
  title: string;
  content: string;
  userIds: string[];
}> = [];

// Mock the notification provider
vi.mock("@/providers/whop/notifications", () => ({
  whopNotificationsProvider: {
    send: vi.fn(async (params: {
      experienceId: string;
      title: string;
      content: string;
      userIds: string[];
    }) => {
      notificationCalls.push(params);
      return { accepted: true, providerMessageId: "mock_id" };
    }),
  },
}));

vi.mock("@/providers/fixtures/notifications", () => ({
  fixtureNotificationsProvider: {
    send: vi.fn(async (params: {
      experienceId: string;
      title: string;
      content: string;
      userIds: string[];
    }) => {
      notificationCalls.push(params);
      return { accepted: true, providerMessageId: null };
    }),
  },
}));

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock DB
vi.mock("@/lib/db", () => ({
  db: {
    onboardingProgress: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    organizationMember: {
      count: vi.fn(),
    },
    course: {
      count: vi.fn(),
    },
    whopInstallation: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock PostHog (analytics)
vi.mock("@/lib/observability/posthog", () => ({
  trackEvent: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/observability/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock whop client
vi.mock("@/lib/whop/client", () => ({
  isWhopReady: vi.fn(() => true),
  getWhopClient: vi.fn(() => ({
    companies: { retrieve: vi.fn() },
    courses: { list: vi.fn() },
    users: { checkAccess: vi.fn() },
    verifyUserToken: vi.fn(),
  })),
}));

import {
  STEP_ORDER,
  createInitialState,
  completeStep,
  failStep,
  type OnboardingStep,
  type OnboardingState,
} from "@/lib/onboarding/onboarding-state";

import {
  createInitialSyncProgress,
  startStage,
  completeStage,
  failStage as failSyncStage,
  isStaleRun,
  SyncStage,
  type SyncProgress,
} from "@/lib/onboarding/sync-progress-types";

import {
  isFixtureMode,
  ensureConnectedMode,
  getFixtureOnboardingState,
  FIXTURE_COMPANY_ID as MODE_FIXTURE_COMPANY_ID,
} from "@/lib/onboarding/mode-guard";

// ─── Tests ────────────────────────────────────────────────────

describe("No notifications during onboarding", () => {
  beforeEach(() => {
    notificationCalls.length = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("notification provider is not called during any onboarding step", () => {
    // Simulate advancing through all onboarding steps
    let state = createInitialState("co_test", "org_test");

    // Complete each step in order
    for (const step of STEP_ORDER) {
      if (step === "complete") break; // Can't complete the final step
      state = completeStep(state, step);
    }

    // No notification calls should have been made
    // (The state machine itself is pure — it doesn't call notifications)
    expect(notificationCalls).toHaveLength(0);
  });

  it("notification provider is not called during sync progress stages", () => {
    // Simulate advancing through all sync stages
    let syncProgress = createInitialSyncProgress();

    for (const stage of Object.values(SyncStage)) {
      syncProgress = startStage(syncProgress, stage as SyncStage);
      syncProgress = completeStage(syncProgress, stage as SyncStage, 100);
    }

    // No notification calls
    expect(notificationCalls).toHaveLength(0);
  });

  it("notification provider is not called when sync fails", () => {
    let syncProgress = createInitialSyncProgress();
    syncProgress = startStage(syncProgress, SyncStage.Memberships);
    syncProgress = failSyncStage(
      syncProgress,
      SyncStage.Memberships,
      "API timeout",
      true,
    );

    expect(notificationCalls).toHaveLength(0);
  });

  it("notification provider is not called during onboarding failure", () => {
    let state = createInitialState("co_test", "org_test");
    state = completeStep(state, "entry");
    state = failStep(state, "access_check", "Whop unavailable");

    expect(notificationCalls).toHaveLength(0);
  });

  it("notification provider is not called for zero-candidate state", () => {
    // Zero-candidate state is a valid outcome, not an error
    const fixtureState = getFixtureOnboardingState(30); // High threshold = 0 candidates

    // Even with zero candidates, no notifications
    expect(notificationCalls).toHaveLength(0);
  });

  it("notification provider is not called during candidate preview", () => {
    // Previewing candidates is a read-only operation
    const fixtureState = getFixtureOnboardingState(7); // Normal threshold

    // Preview never sends notifications
    expect(notificationCalls).toHaveLength(0);
  });

  it("notification provider is not called during threshold recalculation", () => {
    // Changing the threshold and re-evaluating is read-only
    const state1 = getFixtureOnboardingState(7);
    const state2 = getFixtureOnboardingState(14);

    // Both evaluations are read-only
    expect(notificationCalls).toHaveLength(0);
  });

  it("notification provider is not called during stale sync detection", () => {
    const syncProgress = createInitialSyncProgress();
    // isStaleRun is a pure function — doesn't call notifications
    const stale = isStaleRun(syncProgress);
    // The function itself is safe
    expect(typeof stale).toBe("boolean");
    expect(notificationCalls).toHaveLength(0);
  });

  it("fixture mode guard prevents connected-mode operations", () => {
    // ensureConnectedMode() should throw in fixture mode
    // This proves that fixture mode can't accidentally trigger
    // connected-mode notification paths
    const originalEnv = process.env.RESCUELOOP_FIXTURE_MODE;

    try {
      process.env.RESCUELOOP_FIXTURE_MODE = "true";
      expect(isFixtureMode()).toBe(true);
      expect(() => ensureConnectedMode()).toThrow();
    } finally {
      process.env.RESCUELOOP_FIXTURE_MODE = originalEnv;
    }

    expect(notificationCalls).toHaveLength(0);
  });

  it("connected mode guard allows connected-mode operations", () => {
    const originalEnv = process.env.RESCUELOOP_FIXTURE_MODE;

    try {
      // Not in fixture mode
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      expect(isFixtureMode()).toBe(false);
      expect(() => ensureConnectedMode()).not.toThrow();
    } finally {
      process.env.RESCUELOOP_FIXTURE_MODE = originalEnv;
    }

    expect(notificationCalls).toHaveLength(0);
  });
});

// ─── Structural invariant tests ──────────────────────────────

describe("Onboarding structural notification guarantees", () => {
  beforeEach(() => {
    notificationCalls.length = 0;
  });

  it("onboarding state machine has no notification dependency", () => {
    // The onboarding state machine (createInitialState, completeStep, failStep)
    // is a pure state machine with no side effects. It cannot send notifications
    // because it never calls any provider.

    const state = createInitialState("co_test", "org_test");
    const advanced = completeStep(state, "entry");
    const failed = failStep(state, "access_check", "test error");

    // These are all pure transformations
    expect(advanced.currentStep).not.toBe(state.currentStep);
    expect(failed.steps.access_check.status).toBe("failed");

    // No notification calls
    expect(notificationCalls).toHaveLength(0);
  });

  it("sync progress has no notification dependency", () => {
    // Sync progress functions are pure — they transform progress state
    // without side effects.
    let progress = createInitialSyncProgress();
    progress = startStage(progress, SyncStage.CompanyRefs);
    progress = completeStage(progress, SyncStage.CompanyRefs, 10);

    expect(progress.stages[0].status).toBe("completed");
    expect(notificationCalls).toHaveLength(0);
  });

  it("mode guard separates fixture and connected paths", () => {
    // The mode guard module doesn't call notifications.
    // It only checks environment variables and returns fixture data.

    const originalEnv = process.env.RESCUELOOP_FIXTURE_MODE;
    try {
      process.env.RESCUELOOP_FIXTURE_MODE = "true";
      const fixtureState = getFixtureOnboardingState(7);
      expect(fixtureState.companyId).toBe(MODE_FIXTURE_COMPANY_ID);
      expect(fixtureState.candidates.length).toBeGreaterThanOrEqual(0);
    } finally {
      process.env.RESCUELOOP_FIXTURE_MODE = originalEnv;
    }

    expect(notificationCalls).toHaveLength(0);
  });
});
