// Onboarding state machine for the install-to-first-value journey.
// States: entry → access_check → mapping → first_sync → threshold → preview → complete
//
// This module is imported by both server and client code. It must NOT
// import "server-only" or touch secrets.

// ─── Step & status types ────────────────────────────────────────

export type OnboardingStep =
  | 'entry'
  | 'access_check'
  | 'mapping'
  | 'first_sync'
  | 'threshold'
  | 'preview'
  | 'complete';

export type OnboardingStatus = 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface OnboardingStepState {
  step: OnboardingStep;
  status: OnboardingStatus;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
}

export interface OnboardingState {
  companyId: string;
  organizationId: string;
  currentStep: OnboardingStep;
  steps: Record<OnboardingStep, OnboardingStepState>;
  lastUpdated: string;
}

// ─── Step order & transitions ───────────────────────────────────

export const STEP_ORDER: OnboardingStep[] = [
  'entry',
  'access_check',
  'mapping',
  'first_sync',
  'threshold',
  'preview',
  'complete',
];

/** Human-readable labels for each step. */
export const STEP_LABELS: Record<OnboardingStep, string> = {
  entry: 'Getting started',
  access_check: 'Checking access',
  mapping: 'Course mapping',
  first_sync: 'First sync',
  threshold: 'Setting thresholds',
  preview: 'Preview',
  complete: 'Complete',
};

/** Short descriptions shown in the stepper. */
export const STEP_DESCRIPTIONS: Record<OnboardingStep, string> = {
  entry: 'Welcome to RescueLoop',
  access_check: 'Verifying Whop connection and permissions',
  mapping: 'Link your Whop courses to products',
  first_sync: 'Pulling your member and progress data',
  threshold: 'Choose when RescueLoop should act',
  preview: 'Review your first rescue candidate',
  complete: 'You\'re all set!',
};

/**
 * Return the next step after `current`, or null if already at the end.
 */
export function getNextStep(current: OnboardingStep): OnboardingStep | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

/**
 * Return the numeric index of a step (0-based).
 */
export function getStepIndex(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step);
}

/**
 * Check if a given step is completed in the state machine.
 */
export function isStepComplete(state: OnboardingState, step: OnboardingStep): boolean {
  return state.steps[step]?.status === 'completed';
}

/**
 * Check if all prerequisites for `targetStep` are satisfied.
 * Every step before the target must be completed.
 */
export function canAdvanceTo(state: OnboardingState, targetStep: OnboardingStep): boolean {
  const targetIdx = getStepIndex(targetStep);
  for (let i = 0; i < targetIdx; i++) {
    if (!isStepComplete(state, STEP_ORDER[i])) return false;
  }
  return true;
}

// ─── Factory helpers ────────────────────────────────────────────

/**
 * Create the initial onboarding state at the `entry` step.
 */
export function createInitialState(
  companyId: string,
  organizationId: string,
): OnboardingState {
  const now = new Date().toISOString();
  const steps: Record<OnboardingStep, OnboardingStepState> = {} as Record<
    OnboardingStep,
    OnboardingStepState
  >;

  for (const step of STEP_ORDER) {
    steps[step] = {
      step,
      status: step === 'entry' ? 'in_progress' : 'skipped',
      startedAt: step === 'entry' ? now : '',
      completedAt: null,
      error: null,
      metadata: {},
    };
  }

  return {
    companyId,
    organizationId,
    currentStep: 'entry',
    steps,
    lastUpdated: now,
  };
}

/**
 * Mark a step as completed and advance `currentStep` to the next step
 * (if the completed step *is* the current step).
 */
export function completeStep(
  state: OnboardingState,
  step: OnboardingStep,
  metadata?: Record<string, unknown>,
): OnboardingState {
  const now = new Date().toISOString();
  const updatedSteps = { ...state.steps };

  updatedSteps[step] = {
    ...updatedSteps[step],
    status: 'completed',
    completedAt: now,
    metadata: { ...updatedSteps[step].metadata, ...metadata },
  };

  // Auto-advance currentStep if we just completed it
  const nextStep = getNextStep(step);
  const shouldAdvance = step === state.currentStep && nextStep !== null;

  return {
    ...state,
    currentStep: shouldAdvance ? nextStep! : state.currentStep,
    steps: updatedSteps,
    lastUpdated: now,
  };
}

/**
 * Mark a step as failed with an error message.
 */
export function failStep(
  state: OnboardingState,
  step: OnboardingStep,
  error: string,
): OnboardingState {
  const now = new Date().toISOString();
  const updatedSteps = { ...state.steps };

  updatedSteps[step] = {
    ...updatedSteps[step],
    status: 'failed',
    error,
    completedAt: null,
  };

  return {
    ...state,
    steps: updatedSteps,
    lastUpdated: now,
  };
}

/**
 * Compute overall progress as a fraction (0..1).
 */
export function getProgressFraction(state: OnboardingState): number {
  const completed = STEP_ORDER.filter((s) => isStepComplete(state, s)).length;
  return completed / STEP_ORDER.length;
}

/**
 * Compute overall progress as a percentage (0..100), rounded.
 */
export function getProgressPercent(state: OnboardingState): number {
  return Math.round(getProgressFraction(state) * 100);
}

/**
 * Serialize to JSON for DB storage.
 */
export function serializeOnboardingState(state: OnboardingState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize from DB JSON. Returns null if invalid.
 */
export function deserializeOnboardingState(json: string): OnboardingState | null {
  try {
    const parsed = JSON.parse(json) as OnboardingState;
    // Basic shape validation
    if (
      typeof parsed.companyId === 'string' &&
      typeof parsed.organizationId === 'string' &&
      typeof parsed.currentStep === 'string' &&
      STEP_ORDER.includes(parsed.currentStep) &&
      typeof parsed.steps === 'object'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
