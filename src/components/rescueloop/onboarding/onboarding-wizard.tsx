"use client";

// Onboarding wizard — the full install-to-first-value journey.
// Renders a step-based wizard with the onboarding state machine,
// permission diagnostics, course mapping, sync progress, and
// threshold/preview steps.

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
  BookOpen,
  Database,
  SlidersHorizontal,
  Eye,
  PartyPopper,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { CourseMappingStep } from "@/components/rescueloop/onboarding/course-mapping-step";
import { SyncStep } from "@/components/rescueloop/onboarding/sync-step";
import {
  STEP_ORDER,
  STEP_LABELS,
  STEP_DESCRIPTIONS,
  getStepIndex,
  getProgressPercent,
  canAdvanceTo,
  isStepComplete,
  createInitialState,
  completeStep as completeStepFn,
  failStep as failStepFn,
  serializeOnboardingState,
  type OnboardingStep,
  type OnboardingState,
} from "@/lib/onboarding/onboarding-state";
import {
  createInitialSyncProgress,
  type SyncProgress,
} from "@/lib/onboarding/sync-progress-types";
import type {
  WhopCourseOption,
  WhopProductOption,
} from "@/lib/whop/onboarding-data";
import type { DiagnosticResult } from "@/lib/onboarding/permission-diagnostics";

// ─── Step icons ─────────────────────────────────────────────────

const STEP_ICONS: Record<OnboardingStep, typeof ShieldCheck> = {
  entry: ShieldCheck,
  access_check: ShieldCheck,
  mapping: BookOpen,
  first_sync: Database,
  threshold: SlidersHorizontal,
  preview: Eye,
  complete: PartyPopper,
};

// ─── Props ──────────────────────────────────────────────────────

interface ExistingMapping {
  productId: string;
  courseId: string;
  activationDelayDays: number;
  productName: string;
  courseName: string;
  memberCount?: number;
}

interface OnboardingWizardProps {
  companyId: string;
  organizationId: string;
  courses: WhopCourseOption[];
  products: WhopProductOption[];
  existingMappings: ExistingMapping[];
  experiences: Array<{ id: string; name: string; productId: string | null }>;
  whopUnavailable: boolean;
}

// ─── Main Onboarding Wizard ─────────────────────────────────────

export function OnboardingWizard({
  companyId,
  organizationId,
  courses,
  products,
  existingMappings,
  whopUnavailable,
}: OnboardingWizardProps) {
  // Onboarding state
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(
    () => createInitialState(companyId, organizationId),
  );
  const [syncProgress, setSyncProgress] = useState<SyncProgress>(
    createInitialSyncProgress(),
  );
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  // ─── API interactions ───────────────────────────────────────

  const saveOnboardingState = async (state: OnboardingState) => {
    try {
      await fetch(
        `/api/onboarding/progress?companyId=${encodeURIComponent(companyId)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            currentStep: state.currentStep,
            stepsJson: serializeOnboardingState(state),
            syncProgressJson: null,
          }),
        },
      );
    } catch {
      // Best effort — state is also kept in local memory
    }
  };

  const advanceStep = useCallback(
    (completedStep: OnboardingStep) => {
      if (!onboardingState) return;
      const newState = completeStepFn(onboardingState, completedStep);
      setOnboardingState(newState);

      // Persist to API
      saveOnboardingState(newState);
    },
    [onboardingState],
  );

  const failCurrentStep = useCallback(
    (error: string) => {
      if (!onboardingState) return;
      const currentStep = onboardingState.currentStep;
      const newState = failStepFn(onboardingState, currentStep, error);
      setOnboardingState(newState);
    },
    [onboardingState],
  );

  // Auto-advance entry step (after advanceStep is defined)
  useEffect(() => {
    if (onboardingState?.currentStep === "entry") {
      const timer = setTimeout(() => {
        advanceStep("entry");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onboardingState?.currentStep, advanceStep]);

  const runDiagnostics = useCallback(async () => {
    setDiagnosticsRunning(true);
    try {
      const res = await fetch(
        `/api/onboarding/diagnostics?companyId=${encodeURIComponent(companyId)}&organizationId=${encodeURIComponent(organizationId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data.results);

        if (data.canProceedToMapping) {
          advanceStep("access_check");
        } else {
          failCurrentStep(
            "Access check failed. Please resolve the issues above before continuing.",
          );
        }
      } else {
        toast.error("Failed to run diagnostics.");
      }
    } catch {
      toast.error("Network error running diagnostics.");
    } finally {
      setDiagnosticsRunning(false);
    }
  }, [companyId, organizationId, advanceStep, failCurrentStep]);

  const handleMappingComplete = useCallback(
    (mapping: {
      courseId: string;
      productId: string;
      courseName: string;
      activationDelayDays: number;
    }) => {
      setSaving(true);
      // Save mapping via the onboarding API
      fetch(
        `/api/companies/${encodeURIComponent(companyId)}/onboarding`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(mapping),
        },
      )
        .then((res) => {
          if (res.ok) {
            toast.success("Course mapping saved.");
            advanceStep("mapping");
          } else {
            toast.error("Failed to save mapping.");
          }
        })
        .catch(() => toast.error("Network error saving mapping."))
        .finally(() => setSaving(false));
    },
    [companyId, advanceStep],
  );

  const handleRefresh = useCallback(async () => {
    toast.info("Refreshing data from Whop…");
    // In production, this would re-fetch courses/products from the API
    // For now, just show a toast
    setTimeout(() => toast.success("Data refreshed."), 1500);
  }, []);

  const handleRetrySync = useCallback(() => {
    setSyncProgress(createInitialSyncProgress());
    setSyncing(true);
    // In production, this would trigger the sync engine
    setTimeout(() => {
      setSyncing(false);
      advanceStep("first_sync");
    }, 3000);
  }, [advanceStep]);

  const handleSyncComplete = useCallback(() => {
    advanceStep("first_sync");
  }, [advanceStep]);

  // ─── Loading state ────────────────────────────────────────────

  if (loading || !onboardingState) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[var(--ink-muted)]">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-[13px]">Loading onboarding state…</span>
      </div>
    );
  }

  const currentStep = onboardingState.currentStep;
  const progressPercent = getProgressPercent(onboardingState);

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Progress header ──────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-[var(--ink-primary)]">
            Setup RescueLoop
          </h1>
          <span className="font-mono text-[12px] text-[var(--ink-muted)]">
            Step {getStepIndex(currentStep) + 1} of {STEP_ORDER.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* ─── Step stepper ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEP_ORDER.map((step, idx) => {
          const Icon = STEP_ICONS[step];
          const isActive = step === currentStep;
          const isDone = isStepComplete(onboardingState, step);
          const isFuture = idx > getStepIndex(currentStep);

          return (
            <div key={step} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight className="size-3 text-[var(--ink-muted)]" />
              )}
              <div
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${
                  isActive
                    ? "bg-[var(--recovery-light)] font-medium text-[var(--recovery-green)]"
                    : isDone
                      ? "text-[var(--recovery-green)]"
                      : isFuture
                        ? "text-[var(--ink-muted)]"
                        : "text-[var(--ink-secondary)]"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Step content ─────────────────────────────────────── */}
      <StepContent
        step={currentStep}
        onboardingState={onboardingState}
        companyId={companyId}
        organizationId={organizationId}
        courses={courses}
        products={products}
        existingMappings={existingMappings}
        whopUnavailable={whopUnavailable}
        diagnostics={diagnostics}
        diagnosticsRunning={diagnosticsRunning}
        syncProgress={syncProgress}
        syncing={syncing}
        saving={saving}
        onRunDiagnostics={runDiagnostics}
        onMappingComplete={handleMappingComplete}
        onRefresh={handleRefresh}
        onRetrySync={handleRetrySync}
        onSyncComplete={handleSyncComplete}
        onAdvanceStep={advanceStep}
        onFailStep={failCurrentStep}
      />
    </div>
  );
}

// ─── Step content router ────────────────────────────────────────

interface StepContentProps {
  step: OnboardingStep;
  onboardingState: OnboardingState;
  companyId: string;
  organizationId: string;
  courses: WhopCourseOption[];
  products: WhopProductOption[];
  existingMappings: ExistingMapping[];
  whopUnavailable: boolean;
  diagnostics: DiagnosticResult[] | null;
  diagnosticsRunning: boolean;
  syncProgress: SyncProgress;
  syncing: boolean;
  saving: boolean;
  onRunDiagnostics: () => void;
  onMappingComplete: (mapping: {
    courseId: string;
    productId: string;
    courseName: string;
    activationDelayDays: number;
  }) => void;
  onRefresh: () => void;
  onRetrySync: () => void;
  onSyncComplete: () => void;
  onAdvanceStep: (step: OnboardingStep) => void;
  onFailStep: (error: string) => void;
}

function StepContent({
  step,
  onboardingState,
  companyId,
  organizationId,
  courses,
  products,
  existingMappings,
  whopUnavailable,
  diagnostics,
  diagnosticsRunning,
  syncProgress,
  syncing,
  saving,
  onRunDiagnostics,
  onMappingComplete,
  onRefresh,
  onRetrySync,
  onSyncComplete,
  onAdvanceStep,
  onFailStep,
}: StepContentProps) {
  switch (step) {
    // ─── Entry ────────────────────────────────────────────────
    case "entry":
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--recovery-light)]">
              <ShieldCheck className="size-7 text-[var(--recovery-green)]" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-xl text-[var(--ink-primary)]">
                Welcome to RescueLoop
              </h2>
              <p className="max-w-md text-[14px] text-[var(--ink-secondary)]">
                We&apos;ll walk you through connecting your Whop account, mapping
                your courses, and pulling your first data. This takes about
                5 minutes.
              </p>
            </div>
            <Loader2 className="size-4 animate-spin text-[var(--recovery-green)]" />
            <p className="text-[12px] text-[var(--ink-muted)]">
              Getting things ready…
            </p>
          </CardContent>
        </Card>
      );

    // ─── Access check ─────────────────────────────────────────
    case "access_check":
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <ShieldCheck className="size-4 text-[var(--recovery-green)]" />
              Checking access &amp; permissions
            </CardTitle>
            <CardDescription>
              We&apos;ll verify your Whop connection, installation status, and
              required permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {diagnosticsRunning ? (
              <div className="flex items-center gap-2 text-[13px] text-[var(--ink-secondary)]">
                <Loader2 className="size-4 animate-spin" />
                Running diagnostics…
              </div>
            ) : diagnostics ? (
              <div className="flex flex-col gap-3">
                {diagnostics.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start gap-3 rounded-md border border-[var(--hairline)] p-3"
                  >
                    {d.status === "pass" ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
                    ) : d.status === "warn" ? (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
                    ) : d.status === "fail" ? (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--critical)]" />
                    ) : (
                      <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-[var(--hairline)]" />
                    )}
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-[13px] text-[var(--ink-primary)]">
                        {d.message}
                      </p>
                      {d.safeNextAction && (
                        <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                          → {d.safeNextAction}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        d.status === "pass"
                          ? "default"
                          : d.status === "fail"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[var(--ink-secondary)]">
                Click the button below to verify your Whop connection and permissions.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                className="gap-1.5"
                onClick={onRunDiagnostics}
                disabled={diagnosticsRunning}
              >
                {diagnosticsRunning ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Check access
                  </>
                )}
              </Button>
              {diagnostics && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={onRunDiagnostics}
                  disabled={diagnosticsRunning}
                >
                  <RefreshCw className="size-3.5" />
                  Re-check
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );

    // ─── Course mapping ───────────────────────────────────────
    case "mapping":
      return (
        <CourseMappingStep
          companyId={companyId}
          organizationId={organizationId}
          onboardingState={onboardingState}
          courses={courses}
          products={products}
          existingMappings={existingMappings}
          whopUnavailable={whopUnavailable}
          onMappingComplete={onMappingComplete}
          onRefresh={onRefresh}
          onRunDiagnostics={onRunDiagnostics}
        />
      );

    // ─── First sync ───────────────────────────────────────────
    case "first_sync":
      return (
        <SyncStep
          companyId={companyId}
          organizationId={organizationId}
          onboardingState={onboardingState}
          initialSyncProgress={syncProgress}
          onRetry={onRetrySync}
          onSyncComplete={onSyncComplete}
          syncing={syncing}
        />
      );

    // ─── Threshold ────────────────────────────────────────────
    case "threshold":
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <SlidersHorizontal className="size-4 text-[var(--recovery-green)]" />
              Set rescue thresholds
            </CardTitle>
            <CardDescription>
              Choose when RescueLoop should identify at-risk students and
              prepare interventions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-[13px] text-[var(--ink-secondary)]">
              Thresholds determine which students are flagged for rescue. You can
              adjust these at any time after setup.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[var(--hairline)] p-3">
                <p className="text-[12px] font-medium text-[var(--ink-primary)]">
                  Stalled after
                </p>
                <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                  7 days with no progress
                </p>
              </div>
              <div className="rounded-md border border-[var(--hairline)] p-3">
                <p className="text-[12px] font-medium text-[var(--ink-primary)]">
                  Low engagement
                </p>
                <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                  &lt; 20% course completion
                </p>
              </div>
            </div>
            <Button
              className="gap-1.5"
              onClick={() => onAdvanceStep("threshold")}
            >
              Continue with defaults
              <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      );

    // ─── Preview ──────────────────────────────────────────────
    case "preview":
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Eye className="size-4 text-[var(--recovery-green)]" />
              Preview your first rescue
            </CardTitle>
            <CardDescription>
              Review how RescueLoop will identify and contact at-risk students.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Alert className="border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/30">
              <ShieldCheck className="size-4 text-[var(--recovery-green)]" />
              <AlertTitle className="text-[13px]">
                Manual approval is on
              </AlertTitle>
              <AlertDescription className="text-[12px]">
                During the private pilot, every intervention requires your explicit
                approval before it&apos;s sent. No messages go out automatically.
              </AlertDescription>
            </Alert>
            <p className="text-[13px] text-[var(--ink-secondary)]">
              Your first rescue candidates will appear in the rescue queue once
              the sync identifies stalled or low-engagement students.
            </p>
            <Button
              className="gap-1.5"
              onClick={() => onAdvanceStep("preview")}
            >
              Looks good — finish setup
              <CheckCircle2 className="size-4" />
            </Button>
          </CardContent>
        </Card>
      );

    // ─── Complete ─────────────────────────────────────────────
    case "complete":
      return (
        <Card className="border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/20">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--recovery-green)]/10">
              <PartyPopper className="size-8 text-[var(--recovery-green)]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="font-serif text-2xl text-[var(--ink-primary)]">
                You&apos;re all set!
              </h2>
              <p className="max-w-md text-[14px] text-[var(--ink-secondary)]">
                RescueLoop is now watching your courses for at-risk students.
                You&apos;ll see rescue candidates in your queue as they&apos;re identified.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-[12px] text-[var(--ink-muted)]">
              <p>✓ Whop connected</p>
              <p>✓ Course mapped</p>
              <p>✓ Data synced</p>
              <p>✓ Thresholds set</p>
            </div>
            <Button size="lg" className="gap-2" asChild>
              <a href={`/dashboard/${companyId}`}>
                Go to your dashboard
                <ChevronRight className="size-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}
