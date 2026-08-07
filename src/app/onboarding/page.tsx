"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  ShieldCheck,
  Users,
  BookOpen,
  CreditCard,
  Activity,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RescueLoopLogo } from "@/components/shared/logo";
import { StatusPill } from "@/components/shared/status-pills";
import {
  COURSES_FOR_SELECTION,
  PRODUCT,
  ONBOARDING_AUDIT_STEPS,
  ONBOARDING_RESULTS,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

const STEPS = [
  { id: 1, label: "Introduction" },
  { id: 2, label: "Select course" },
  { id: 3, label: "Confirm mapping" },
  { id: 4, label: "Audit" },
  { id: 5, label: "Results" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  const selectedCourse = COURSES_FOR_SELECTION.find((c) => c.id === selectedCourseId);

  function next() {
    if (step < 5) setStep(step + 1);
  }
  function back() {
    if (step > 1) setStep(step - 1);
  }

  function startAudit() {
    setAuditRunning(true);
    setAuditComplete(false);
    setTimeout(() => {
      setAuditRunning(false);
      setAuditComplete(true);
    }, 2600);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F4F1]">
      {/* Header */}
      <header className="border-b border-[#E3E5DF] bg-[#FFFFFF]">
        <div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-4 lg:px-6">
          <RescueLoopLogo />
          <Button asChild variant="ghost" size="sm">
            <Link href="/overview">Skip to demo</Link>
          </Button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-[#E3E5DF] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-[900px] items-center gap-2 px-4 py-3 lg:px-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  step > s.id
                    ? "bg-[#147D68] text-white"
                    : step === s.id
                      ? "bg-[#147D68] text-white"
                      : "bg-[#F0F2EC] text-[#6A706A]",
                )}
              >
                {step > s.id ? <CheckCircle2 className="size-4" /> : s.id}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  step >= s.id ? "text-[#171A17]" : "text-[#6A706A]",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
                    step > s.id ? "bg-[#147D68]" : "bg-[#E3E5DF]",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-4 py-8 lg:px-6">
        <AnimatePresence mode="wait">
          {step === 1 && <StepIntroduction key="step1" onNext={next} />}
          {step === 2 && (
            <StepSelectCourse
              key="step2"
              selectedId={selectedCourseId}
              onSelect={(id) => {
                setSelectedCourseId(id);
              }}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && selectedCourse && (
            <StepConfirmMapping
              key="step3"
              courseName={selectedCourse.name}
              productName={PRODUCT.name}
              productPrice={PRODUCT.price}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 4 && (
            <StepAudit
              key="step4"
              running={auditRunning}
              complete={auditComplete}
              onStart={startAudit}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 5 && (
            <StepResults
              key="step5"
              onReview={() => router.push("/rescue-queue")}
              onAdjustRules={() => router.push("/campaigns")}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StepIntroduction({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col items-center justify-center text-center"
    >
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#E8F5EF]">
        <Sparkles className="size-7 text-[#147D68]" />
      </div>
      <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-[#171A17] sm:text-4xl">
        Recover more value from the members you already have.
      </h1>
      <p className="mt-4 max-w-lg text-base text-[#6A706A] sm:text-lg">
        RescueLoop identifies members who haven&apos;t started, stopped
        progressing, or may leave without reaching their goal — then sends
        respectful, high-signal recovery interventions.
      </p>

      <Card className="mt-8 w-full max-w-md border-[#C7E6D5] bg-[#F0FAF6]">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="size-5 shrink-0 text-[#27966A]" />
          <div className="text-left">
            <p className="text-sm font-medium text-[#171A17]">
              Nothing will be sent automatically.
            </p>
            <p className="mt-1 text-sm text-[#6A706A]">
              You review the first rescue candidates before activation.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="mt-8 gap-2" onClick={onNext}>
        Run my first recovery audit
        <ArrowRight className="size-4" />
      </Button>
    </motion.div>
  );
}

function StepSelectCourse({
  selectedId,
  onSelect,
  onNext,
  onBack,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#171A17]">
          Select a course to audit
        </h2>
        <p className="mt-1 text-sm text-[#6A706A]">
          Choose the course you want RescueLoop to monitor for recovery opportunities.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {COURSES_FOR_SELECTION.map((course) => {
          const selected = selectedId === course.id;
          return (
            <button
              key={course.id}
              onClick={() => onSelect(course.id)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-[14px] border bg-[#FFFFFF] p-4 text-left transition-all hover:border-[#147D68] hover:shadow-sm",
                selected ? "border-[#147D68] ring-2 ring-[#147D68]/15" : "border-[#E3E5DF]",
              )}
            >
              <div className="flex w-full items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#E8F5EF]">
                  <BookOpen className="size-4.5 text-[#147D68]" />
                </div>
                {selected && (
                  <CheckCircle2 className="size-5 text-[#147D68]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#171A17]">{course.name}</p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-[#6A706A]">
                  <span className="flex items-center gap-1">
                    <BookOpen className="size-3" />
                    {course.lessonCount} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {course.studentCount} students
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill className="border-[#E3E5DF] bg-[#F8F8F5] text-[#6A706A]">
                  {course.dataAvailability === "full"
                    ? "Data ready"
                    : course.dataAvailability === "partial"
                      ? "Partial data"
                      : "Syncing"}
                </StatusPill>
                <span className="text-xs text-[#6A706A]">
                  {course.id === "cr_ags" ? "Recurring · $79/mo" : "Recurring"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!selectedId}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function StepConfirmMapping({
  courseName,
  productName,
  productPrice,
  onNext,
  onBack,
}: {
  courseName: string;
  productName: string;
  productPrice: number;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#171A17]">
          Confirm product mapping
        </h2>
        <p className="mt-1 text-sm text-[#6A706A]">
          We need to confirm which paid product grants access to this course.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#E8F5EF]">
                <CreditCard className="size-6 text-[#147D68]" />
              </div>
              <p className="text-sm font-semibold text-[#171A17]">{productName}</p>
              <p className="text-xs text-[#6A706A]">{formatCurrency(productPrice)}/month</p>
              <StatusPill className="border-[#C7E6D5] bg-[#E8F5EF] text-[#27966A]">
                Recurring
              </StatusPill>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-[#E3E5DF] sm:w-16" />
              <ArrowRight className="size-4 text-[#6A706A]" />
              <div className="h-px w-8 bg-[#E3E5DF] sm:w-16" />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#E8F0FE]">
                <BookOpen className="size-6 text-[#4C7ECF]" />
              </div>
              <p className="text-sm font-semibold text-[#171A17]">{courseName}</p>
              <p className="text-xs text-[#6A706A]">29 lessons · 742 students</p>
              <StatusPill className="border-[#C9DCF5] bg-[#E8F0FE] text-[#4C7ECF]">
                Course
              </StatusPill>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#C7E6D5] bg-[#F0FAF6] p-3">
            <p className="text-xs text-[#6A706A]">
              <CheckCircle2 className="mr-1.5 inline size-3.5 text-[#27966A]" />
              RescueLoop will use this mapping to connect membership payments
              with course progress. You can change this later in Settings.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Confirm mapping
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function StepAudit({
  running,
  complete,
  onStart,
  onNext,
  onBack,
}: {
  running: boolean;
  complete: boolean;
  onStart: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#171A17]">
          Running your first audit
        </h2>
        <p className="mt-1 text-sm text-[#6A706A]">
          RescueLoop is synchronizing memberships, analyzing progress, and
          detecting recovery opportunities.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-1">
            {ONBOARDING_AUDIT_STEPS.map((step, i) => {
              const visible = complete || running;
              const isActive = running && i === Math.floor((Date.now() / 500) % ONBOARDING_AUDIT_STEPS.length);
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 transition-all",
                    !visible && "opacity-40",
                  )}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center">
                    {complete || (running && i < 3) ? (
                      <CheckCircle2 className="size-5 text-[#27966A]" />
                    ) : isActive ? (
                      <Loader2 className="size-5 animate-spin text-[#147D68]" />
                    ) : (
                      <div className="size-5 rounded-full border-2 border-[#E3E5DF]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#171A17]">{step.label}</p>
                    <p className="text-xs text-[#6A706A]">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {!running && !complete && (
            <Button className="mt-6 w-full gap-2" size="lg" onClick={onStart}>
              <Search className="size-4" />
              Start audit
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={running}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {complete && (
          <Button onClick={onNext}>
            View results
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function StepResults({
  onReview,
  onAdjustRules,
}: {
  onReview: () => void;
  onAdjustRules: () => void;
}) {
  const total = ONBOARDING_RESULTS.reduce((sum, r) => sum + r.count, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6 text-center">
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-[#E8F5EF]">
          <CheckCircle2 className="size-7 text-[#27966A]" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#171A17] sm:text-3xl">
          Your audit found {total} recovery opportunities
        </h2>
        <p className="mt-2 text-sm text-[#6A706A]">
          No messages have been sent. You&apos;re in full control.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ONBOARDING_RESULTS.map((result) => (
          <Card key={result.id} className="gap-0 py-4">
            <CardContent className="flex items-center gap-4 px-4">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl",
                  result.severity === "critical"
                    ? "bg-[#F4E8E6]"
                    : "bg-[#FEF3E2]",
                )}
              >
                <Activity
                  className={cn(
                    "size-6",
                    result.severity === "critical" ? "text-[#C64D45]" : "text-[#D89222]",
                  )}
                />
              </div>
              <div>
                <p className="tabular-mono text-2xl font-semibold text-[#171A17]">
                  {result.count}
                </p>
                <p className="text-sm text-[#6A706A]">{result.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4 border-[#C7E6D5] bg-[#F0FAF6]">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="size-5 shrink-0 text-[#27966A]" />
          <p className="text-sm text-[#171A17]">
            <span className="font-medium">Nothing has been sent.</span>{" "}
            <span className="text-[#6A706A]">
              Review each rescue candidate and approve the ones you want to
              contact. You can also adjust detection rules before sending.
            </span>
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" className="gap-2" onClick={onReview}>
          Review rescue candidates
          <ArrowRight className="size-4" />
        </Button>
        <Button size="lg" variant="outline" className="gap-2" onClick={onAdjustRules}>
          <Settings2 className="size-4" />
          Adjust detection rules
        </Button>
      </div>
    </motion.div>
  );
}
