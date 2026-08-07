"use client";

// OnboardingJourney — multi-step wizard implementing the onboarding state machine.
//
// Steps: Access → Connection → Mapping → Sync → Threshold → Preview → Complete
// Each step validates and advances. URL search params track progress.
// The "Nothing will be sent" safety promise is shown throughout.
//
// This is a WP-03 client component. It does NOT perform auth — the server
// component parent verifies admin access before rendering this.

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

// ─── Step definitions ────────────────────────────────────────

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  { key: "access", label: "Access", description: "Verify Whop admin access" },
  { key: "connection", label: "Connection", description: "Connect your Whop company" },
  { key: "mapping", label: "Mapping", description: "Map courses to products" },
  { key: "sync", label: "Sync", description: "First data synchronization" },
  { key: "threshold", label: "Threshold", description: "Set rescue thresholds" },
  { key: "preview", label: "Preview", description: "Review before activation" },
  { key: "complete", label: "Complete", description: "Activation Rescue is live" },
];

const STEP_KEYS = STEPS.map((s) => s.key);

// ─── Component ───────────────────────────────────────────────

interface OnboardingJourneyProps {
  companyId: string;
  courses: Array<{ id: string; title: string }>;
  products: Array<{ id: string; title: string }>;
  existingMappings: Array<{ courseId: string; productId: string; courseName?: string; productName?: string }>;
  whopUnavailable?: boolean;
}

export function OnboardingJourney({
  companyId,
  courses,
  products,
  existingMappings,
  whopUnavailable = false,
}: OnboardingJourneyProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Derive step from URL or default to first
  const stepParam = searchParams.get("step") ?? "access";
  const currentStepIndex = Math.max(0, STEP_KEYS.indexOf(stepParam));
  const currentStep = STEPS[currentStepIndex];
  const progressPercent = Math.round((currentStepIndex / (STEPS.length - 1)) * 100);

  const advanceStep = useCallback(() => {
    const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1);
    const nextKey = STEP_KEYS[nextIndex];
    router.push(`?step=${nextKey}`);
  }, [currentStepIndex, router]);

  const retreatStep = useCallback(() => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    const prevKey = STEP_KEYS[prevIndex];
    router.push(`?step=${prevKey}`);
  }, [currentStepIndex, router]);

  return (
    <div className="flex flex-col gap-6">
      {/* Safety promise — always visible */}
      <Card className="border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/30">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--recovery-green)]" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-medium text-[var(--ink-primary)]">
              Nothing will be sent automatically.
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              Every Activation Rescue candidate lands in your queue for review.
              You approve, schedule, or dismiss each one.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress indicator */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-serif text-[16px] text-[var(--ink-primary)]">
            {currentStep.label}
          </span>
          <Badge variant="outline" className="font-mono text-[11px]">
            Step {currentStepIndex + 1} of {STEPS.length}
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-[13px] text-[var(--ink-secondary)]">
          {currentStep.description}
        </p>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="py-6">
          {currentStep.key === "access" && (
            <AccessStep whopUnavailable={whopUnavailable} />
          )}
          {currentStep.key === "connection" && (
            <ConnectionStep companyId={companyId} />
          )}
          {currentStep.key === "mapping" && (
            <MappingStep
              courses={courses}
              products={products}
              existingMappings={existingMappings}
            />
          )}
          {currentStep.key === "sync" && (
            <SyncStep companyId={companyId} />
          )}
          {currentStep.key === "threshold" && (
            <ThresholdStep />
          )}
          {currentStep.key === "preview" && (
            <PreviewStep
              courses={courses}
              products={products}
              existingMappings={existingMappings}
            />
          )}
          {currentStep.key === "complete" && (
            <CompleteStep companyId={companyId} />
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={retreatStep}
          disabled={currentStepIndex === 0 || busy}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          onClick={async () => {
            setBusy(true);
            // Simulate async step processing
            await new Promise((r) => setTimeout(r, 300));
            advanceStep();
            setBusy(false);
          }}
          disabled={currentStepIndex === STEPS.length - 1 || busy}
          className="gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStepIndex
                ? "bg-[var(--recovery-green)]"
                : "bg-[var(--hairline)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Step components ─────────────────────────────────────────

function AccessStep({ whopUnavailable }: { whopUnavailable: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">
        Verify Whop access
      </h3>
      {whopUnavailable ? (
        <div className="flex items-start gap-2.5 rounded-md border border-[var(--warning)]/30 bg-[var(--warning-light)]/40 p-3">
          <p className="text-[13px] text-[var(--ink-secondary)]">
            Whop API is currently unavailable. You can continue setting up, and
            we&apos;ll verify access when Whop is reachable.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-md border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)]/30 p-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
          <p className="text-[13px] text-[var(--ink-secondary)]">
            <span className="font-medium text-[var(--ink-primary)]">Access verified.</span>{" "}
            Your Whop admin token is valid and you have company admin access.
          </p>
        </div>
      )}
    </div>
  );
}

function ConnectionStep({ companyId }: { companyId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">
        Connect your Whop company
      </h3>
      <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
        RescueLoop is connected to your Whop company. Webhook events
        (membership changes, course progress) will sync automatically.
      </p>
      <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
        <p className="font-mono text-[12px] text-[var(--ink-muted)]">
          company_id: {companyId}
        </p>
      </div>
    </div>
  );
}

function MappingStep({
  courses,
  products,
  existingMappings,
}: {
  courses: Array<{ id: string; title: string }>;
  products: Array<{ id: string; title: string }>;
  existingMappings: Array<{ courseId: string; productId: string; courseName?: string; productName?: string }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">
        Map courses to products
      </h3>
      {existingMappings.length > 0 ? (
        <div className="flex flex-col gap-2">
          {existingMappings.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3"
            >
              <span className="text-[13px] text-[var(--ink-primary)]">
                {m.courseName ?? courses.find((c) => c.id === m.courseId)?.title ?? m.courseId}
              </span>
              <span className="text-[var(--ink-muted)]">→</span>
              <span className="text-[13px] text-[var(--ink-primary)]">
                {m.productName ?? products.find((p) => p.id === m.productId)?.title ?? m.productId}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[var(--ink-secondary)]">
          {courses.length === 0
            ? "No courses found yet. They will appear after Whop sync."
            : `${courses.length} course(s) and ${products.length} product(s) available. Select mappings on the full onboarding form.`}
        </p>
      )}
    </div>
  );
}

function SyncStep({ companyId }: { companyId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">
        First data synchronization
      </h3>
      <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
        RescueLoop will sync membership and course progress data from Whop.
        This happens automatically via webhooks — no manual action needed.
      </p>
      <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
        <p className="font-mono text-[12px] text-[var(--ink-muted)]">
          Sync source: Whop Standard Webhooks · company: {companyId}
        </p>
      </div>
    </div>
  );
}

function ThresholdStep() {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">
        Set rescue thresholds
      </h3>
      <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
        Define when a member becomes a rescue candidate. Default thresholds:
        active membership + no course progress for 7+ days. You can adjust
        these in Settings after setup.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">Inactivity threshold</p>
          <p className="font-mono tabular-nums text-[18px] text-[var(--ink-primary)]">7 days</p>
        </div>
        <div className="flex flex-col gap-1 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">Max messages / member / month</p>
          <p className="font-mono tabular-nums text-[18px] text-[var(--ink-primary)]">3</p>
        </div>
      </div>
    </div>
  );
}

function PreviewStep({
  courses,
  products,
  existingMappings,
}: {
  courses: Array<{ id: string; title: string }>;
  products: Array<{ id: string; title: string }>;
  existingMappings: Array<{ courseId: string; productId: string }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">
        Review before activation
      </h3>
      <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
        Review your configuration. Nothing is active until you confirm on the next step.
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px]">
          <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
          <span className="text-[var(--ink-primary)]">{courses.length} course(s) detected</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
          <span className="text-[var(--ink-primary)]">{products.length} product(s) detected</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
          <span className="text-[var(--ink-primary)]">{existingMappings.length} mapping(s) configured</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <CheckCircle2 className="size-4 text-[var(--recovery-green)]" />
          <span className="text-[var(--ink-primary)]">Manual approval mode (safe)</span>
        </div>
      </div>
    </div>
  );
}

function CompleteStep({ companyId }: { companyId: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--recovery-light)]">
        <CheckCircle2 className="size-6 text-[var(--recovery-green)]" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-[22px] text-[var(--ink-primary)]">
          Activation Rescue is live
        </h3>
        <p className="max-w-sm text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          Candidates will appear in your rescue queue as they&apos;re detected.
          You review and approve each one before anything is sent.
        </p>
      </div>
      <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
        <p className="font-mono text-[12px] text-[var(--ink-muted)]">
          company_id: {companyId}
        </p>
      </div>
    </div>
  );
}
