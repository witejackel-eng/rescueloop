"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Clock,
  Ban,
  Heart,
  BookOpen,
  Compass,
  Wrench,
  MessageCircle,
  Loader2,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

type ResponseType =
  | "continue_course"
  | "stuck"
  | "remind_later"
  | "already_completed"
  | "human_help"
  | "stop_reminders";

type BlockerType =
  | "lack_of_time"
  | "material_difficult"
  | "unsure_next_step"
  | "expected_something_different"
  | "technical_problem"
  | "needs_creator_help";

type View =
  | "main"
  | "stuck"
  | "remind"
  | "stop_confirm"
  | "done";

interface RescueExperienceProps {
  token: string;
  experienceId: string;
  studentName: string;
  courseName: string;
  creatorName: string;
  productName: string | null;
  lessonsCompleted: number;
  totalLessons: number;
  progressPercent: number;
  nextLessonIndex: number;
  whySupport: string;
  messagePreview: string;
  lessonDuration: string;
  quietHours: [string, string];
}

// ─── Blocker options ─────────────────────────────────────────

const BLOCKER_OPTIONS: Array<{
  id: BlockerType;
  label: string;
  icon: LucideIcon;
  confirmation: string;
}> = [
  {
    id: "lack_of_time",
    label: "I don\u2019t have enough time right now",
    icon: Clock,
    confirmation:
      "That\u2019s completely okay. We\u2019ll save your spot and you can pick up whenever you\u2019re ready \u2014 your progress won\u2019t go anywhere.",
  },
  {
    id: "material_difficult",
    label: "The material is difficult",
    icon: BookOpen,
    confirmation:
      "Thanks for letting us know. We\u2019ll send a simpler breakdown of the lesson that\u2019s been tricky.",
  },
  {
    id: "unsure_next_step",
    label: "I don\u2019t know what to do next",
    icon: Compass,
    confirmation:
      "Got it. We\u2019ll send you a quick guide on what to do next so you\u2019re not guessing.",
  },
  {
    id: "expected_something_different",
    label: "I expected something different",
    icon: HelpCircle,
    confirmation:
      "Thank you for telling us. We\u2019ll share this with the creator so they can make the course clearer.",
  },
  {
    id: "technical_problem",
    label: "I have a technical problem",
    icon: Wrench,
    confirmation:
      "Sorry about that. We\u2019ll look into it and get back to you.",
  },
  {
    id: "needs_creator_help",
    label: "I need help from the creator",
    icon: MessageCircle,
    confirmation:
      "We\u2019ve let the creator know you\u2019d like some help. They\u2019ll reach out soon.",
  },
];

// ─── Remind-me-later options ─────────────────────────────────

const REMIND_OPTIONS = [
  { hours: 3, label: "In 3 hours" },
  { hours: 24, label: "Tomorrow" },
  { hours: 72, label: "In 3 days" },
  { hours: 168, label: "Next week" },
];

// ─── Confirmation copy by response type ──────────────────────

const CONFIRMATION_COPY: Record<ResponseType, { title: string; body: string }> = {
  continue_course: {
    title: "Great \u2014 pick up where you left off.",
    body: "Your spot is saved. The next lesson is ready whenever you are.",
  },
  stuck: {
    title: "Thanks for sharing that.",
    body: "We\u2019ll use this to send you the right help. You\u2019ll hear from us soon.",
  },
  remind_later: {
    title: "No problem \u2014 we\u2019ll remind you.",
    body: "We\u2019ll send one gentle nudge at the time you chose. No pressure.",
  },
  already_completed: {
    title: "Amazing \u2014 congrats on finishing!",
    body: "We\u2019ve noted you\u2019ve completed this. We won\u2019t send further reminders for it.",
  },
  human_help: {
    title: "We\u2019ve flagged this for the team.",
    body: "Someone will reach out personally to help you move forward. You don\u2019t need to do anything else right now.",
  },
  stop_reminders: {
    title: "Done \u2014 we won\u2019t send further reminders.",
    body: "Your choice is recorded. If you change your mind, just open the next lesson whenever you\u2019re ready.",
  },
};

// ─── Response type labels (for already-responded view) ───────

const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  continue_course: "Continue course",
  stuck: "Something is blocking me",
  remind_later: "Remind me later",
  already_completed: "Already completed",
  human_help: "I need help",
  stop_reminders: "Stop reminders",
};

const BLOCKER_TYPE_LABELS: Record<BlockerType, string> = {
  lack_of_time: "Not enough time",
  material_difficult: "Material is difficult",
  unsure_next_step: "Unsure of next step",
  expected_something_different: "Expected something different",
  technical_problem: "Technical problem",
  needs_creator_help: "Need creator help",
};

// ─── Component ───────────────────────────────────────────────

export function RescueExperience({
  token,
  experienceId,
  studentName,
  courseName,
  creatorName,
  productName,
  lessonsCompleted,
  totalLessons,
  progressPercent,
  nextLessonIndex,
  whySupport,
  messagePreview,
  lessonDuration,
}: RescueExperienceProps) {
  const [view, setView] = useState<View>("main");
  const [busy, setBusy] = useState<ResponseType | null>(null);
  const [completedType, setCompletedType] = useState<ResponseType | null>(null);
  const [stuckBlocker, setStuckBlocker] = useState<BlockerType | null>(null);
  const [stuckNote, setStuckNote] = useState("");
  const [remindHours, setRemindHours] = useState<number>(24);

  const firstName = studentName.split(" ")[0] || studentName;

  async function respond(
    type: ResponseType,
    extra?: Record<string, unknown>,
  ) {
    setBusy(type);
    try {
      const res = await fetch(
        `/api/experiences/${encodeURIComponent(experienceId)}/rescue/${encodeURIComponent(token)}/respond`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            responseType: type,
            ...extra,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        // Even on error, move to a calm done-state so the student isn't stuck
        console.error("[rescue] respond failed", json);
      }
      setCompletedType(type);
      setView("done");
    } catch (error) {
      console.error("[rescue] network error", error);
      setCompletedType(type);
      setView("done");
    } finally {
      setBusy(null);
    }
  }

  // ─── Done view ─────────────────────────────────────────────
  if (view === "done" && completedType) {
    const copy = CONFIRMATION_COPY[completedType];
    const blocker = BLOCKER_OPTIONS.find((b) => b.id === stuckBlocker);
    return (
      <DoneScreen
        title={copy.title}
        body={
          completedType === "stuck" && blocker
            ? blocker.confirmation
            : copy.body
        }
        showContinue={completedType !== "stop_reminders"}
      />
    );
  }

  // ─── Stuck view ────────────────────────────────────────────
  if (view === "stuck") {
    return (
      <StuckView
        selected={stuckBlocker}
        onSelect={setStuckBlocker}
        note={stuckNote}
        onNoteChange={setStuckNote}
        onBack={() => setView("main")}
        onSubmit={() =>
          stuckBlocker &&
          respond("stuck", { blockerType: stuckBlocker, note: stuckNote || undefined })
        }
        busy={busy === "stuck"}
      />
    );
  }

  // ─── Remind-me view ────────────────────────────────────────
  if (view === "remind") {
    return (
      <RemindView
        selectedHours={remindHours}
        onSelect={setRemindHours}
        onBack={() => setView("main")}
        onSubmit={() => respond("remind_later", { remindInHours: remindHours })}
        busy={busy === "remind_later"}
      />
    );
  }

  // ─── Stop-reminders confirmation ───────────────────────────
  if (view === "stop_confirm") {
    return (
      <StopConfirmView
        onBack={() => setView("main")}
        onConfirm={() => respond("stop_reminders")}
        busy={busy === "stop_reminders"}
      />
    );
  }

  // ─── Main view ─────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-8 sm:py-12">
      {/* Greeting + course context */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-1.5"
      >
        <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--recovery-green)]">
          {creatorName}
        </p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[var(--ink-primary)] sm:text-[32px]">
          Hi {firstName} <span aria-hidden="true">👋</span>
        </h1>
        <p className="text-[15px] text-[var(--ink-secondary)]">{courseName}</p>
      </motion.header>

      {/* Creator's intervention message */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.04 }}
        aria-label="Message from creator"
      >
        <Card className="gap-3 rounded-2xl border-[var(--hairline)] bg-[var(--surface)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--recovery-light)]">
              <MessageCircle className="size-[18px] text-[var(--recovery-green)]" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                Message from {creatorName}
              </p>
              <p className="text-[15px] leading-relaxed text-[var(--ink-primary)]">
                {messagePreview}
              </p>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Progress */}
      {totalLessons > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          aria-label="Your progress"
        >
          <Card className="gap-4 rounded-2xl border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-medium text-[var(--ink-primary)]">
                Your progress
              </span>
              <span className="font-mono text-[20px] font-semibold text-[var(--recovery-green)] tabular-nums">
                {progressPercent}%
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2.5 rounded-full bg-[var(--canvas-elevated)]"
            />
            <p className="text-[14px] text-[var(--ink-secondary)]">
              <span className="font-mono font-medium tabular-nums text-[var(--ink-primary)]">
                {lessonsCompleted}
              </span>{" "}
              of{" "}
              <span className="font-mono font-medium tabular-nums text-[var(--ink-primary)]">
                {totalLessons}
              </span>{" "}
              lessons done
            </p>
          </Card>
        </motion.section>
      )}

      {/* Primary choices */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.12 }}
        aria-label="What would you like to do?"
        className="flex flex-col gap-3"
      >
        <h2 className="text-[18px] font-semibold leading-snug text-[var(--ink-primary)]">
          What would you like to do?
        </h2>

        {/* Continue course — primary action */}
        <Card className="gap-5 rounded-2xl border-[var(--hairline)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium uppercase tracking-wide text-[var(--recovery-green)]">
              Up next
            </span>
            <h3 className="text-[18px] font-semibold leading-snug text-[var(--ink-primary)]">
              Lesson {nextLessonIndex}
            </h3>
            <p className="text-[14px] text-[var(--ink-secondary)]">
              {lessonDuration}
            </p>
          </div>
          <Button
            size="lg"
            aria-label="Continue course"
            className="h-12 w-full rounded-xl bg-[var(--recovery-green)] text-[15px] font-medium text-white shadow-sm hover:bg-[var(--recovery-green)]/90 disabled:opacity-60"
            disabled={busy !== null}
            onClick={() => respond("continue_course")}
          >
            {busy === "continue_course" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Continue course
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </Card>

        {/* I need help — secondary primary action */}
        <Button
          variant="outline"
          size="lg"
          aria-label="I need help"
          className="h-12 w-full justify-center gap-2 rounded-xl border-[var(--hairline)] bg-[var(--surface)] text-[15px] font-medium text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)] disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => respond("human_help")}
        >
          {busy === "human_help" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Heart className="size-4 text-[var(--recovery-green)]" />
              I need help
            </>
          )}
        </Button>

        {/* Something is blocking me — secondary primary action */}
        <Button
          variant="outline"
          size="lg"
          aria-label="Something is blocking me"
          className="h-12 w-full justify-center gap-2 rounded-xl border-[var(--hairline)] bg-[var(--surface)] text-[15px] font-medium text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)] disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => setView("stuck")}
        >
          <HelpCircle className="size-4 text-[var(--recovery-green)]" />
          Something is blocking me
        </Button>
      </motion.section>

      {/* Secondary actions */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.16 }}
        className="flex flex-col gap-2.5"
      >
        <Button
          variant="ghost"
          size="lg"
          aria-label="Remind me later"
          className="h-11 w-full rounded-xl text-[15px] font-medium text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => setView("remind")}
        >
          Remind me later
        </Button>
      </motion.div>

      {/* Tertiary actions */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="flex flex-col gap-2 border-t border-[var(--hairline)] pt-4"
      >
        <Button
          variant="ghost"
          size="sm"
          aria-label="I already completed this"
          className="h-9 w-full justify-center text-[13px] font-medium text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => respond("already_completed")}
        >
          {busy === "already_completed" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "I already completed this"
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Stop all reminders"
          className="h-9 w-full justify-center text-[12px] font-medium text-[var(--ink-muted)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-secondary)] disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => setView("stop_confirm")}
        >
          I don&apos;t want reminders
        </Button>
      </motion.div>

      {/* Encouragement — no churn/revenue language */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.24 }}
        className="mt-1 text-center text-[14px] leading-relaxed text-[var(--ink-muted)]"
      >
        You&apos;re making real progress. Every lesson gets you closer to your
        goal.
      </motion.p>
    </div>
  );
}

// ─── Stuck view (blocker taxonomy) ───────────────────────────

function StuckView({
  selected,
  onSelect,
  note,
  onNoteChange,
  onBack,
  onSubmit,
  busy,
}: {
  selected: BlockerType | null;
  onSelect: (b: BlockerType) => void;
  note: string;
  onNoteChange: (n: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-8 sm:py-12">
      <button
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1 text-[14px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
        aria-label="Go back to main choices"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key="stuck-form"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-6"
        >
          <header className="flex flex-col gap-2">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[var(--ink-primary)] sm:text-[28px]">
              What&apos;s getting in the way?
            </h1>
            <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)]">
              No pressure — this helps us send you the right help.
            </p>
          </header>

          <RadioGroup
            value={selected ?? ""}
            onValueChange={(v) => onSelect(v as BlockerType)}
            className="gap-2.5"
            aria-label="Choose what's blocking you"
          >
            {BLOCKER_OPTIONS.map((opt) => {
              const isSelected = selected === opt.id;
              const Icon = opt.icon;
              return (
                <Label
                  key={opt.id}
                  htmlFor={`blocker-${opt.id}`}
                  className={cn(
                    "flex min-h-[56px] cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200",
                    isSelected
                      ? "border-[var(--recovery-green)] bg-[var(--recovery-light)]/40"
                      : "border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--canvas-elevated)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isSelected
                        ? "bg-[var(--recovery-light)] text-[var(--recovery-green)]"
                        : "bg-[var(--canvas-elevated)] text-[var(--ink-muted)]",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="flex-1 text-[16px] font-medium leading-snug text-[var(--ink-primary)]">
                    {opt.label}
                  </span>
                  <RadioGroupItem
                    id={`blocker-${opt.id}`}
                    value={opt.id}
                    className={cn(
                      "size-5 border-2",
                      isSelected
                        ? "border-[var(--recovery-green)] text-[var(--recovery-green)]"
                        : "border-[var(--ink-muted)] text-transparent",
                    )}
                  />
                </Label>
              );
            })}
          </RadioGroup>

          {/* Optional free-text note (sensitive: minimize retention) */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="blocker-note"
              className="text-[14px] font-medium text-[var(--ink-secondary)]"
            >
              Anything else?{" "}
              <span className="text-[var(--ink-muted)]">(optional)</span>
            </Label>
            <Textarea
              id="blocker-note"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Share anything that would help us support you."
              rows={3}
              maxLength={2000}
              aria-label="Optional note about what's blocking you"
              className="min-h-[88px] rounded-xl border-[var(--hairline)] bg-[var(--surface)] text-[15px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--recovery-green)] focus-visible:ring-[var(--recovery-green)]/20"
            />
            <p className="text-[12px] text-[var(--ink-muted)]">
              Your note is stored securely and only shared with the course creator.
            </p>
          </div>

          <Button
            size="lg"
            disabled={!selected || busy}
            onClick={onSubmit}
            aria-label="Submit your feedback"
            className="h-12 w-full rounded-xl bg-[var(--recovery-green)] text-[15px] font-medium text-white shadow-sm hover:bg-[var(--recovery-green)]/90 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Share feedback"
            )}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Remind-me-later view ────────────────────────────────────

function RemindView({
  selectedHours,
  onSelect,
  onBack,
  onSubmit,
  busy,
}: {
  selectedHours: number;
  onSelect: (h: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-8 sm:py-12">
      <button
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1 text-[14px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
        aria-label="Go back to main choices"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-6"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[var(--ink-primary)] sm:text-[28px]">
            When should we remind you?
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            We&apos;ll send one gentle nudge. No follow-ups after that.
          </p>
        </header>

        <RadioGroup
          value={String(selectedHours)}
          onValueChange={(v) => onSelect(parseInt(v, 10))}
          className="gap-2.5"
          aria-label="Choose when to be reminded"
        >
          {REMIND_OPTIONS.map((opt) => {
            const isSelected = selectedHours === opt.hours;
            return (
              <Label
                key={opt.hours}
                htmlFor={`remind-${opt.hours}`}
                className={cn(
                  "flex min-h-[52px] cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200",
                  isSelected
                    ? "border-[var(--recovery-green)] bg-[var(--recovery-light)]/40"
                    : "border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--canvas-elevated)]",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--canvas-elevated)] text-[var(--ink-muted)]">
                  <Clock className="size-[18px]" />
                </span>
                <span className="flex-1 text-[16px] font-medium leading-snug text-[var(--ink-primary)]">
                  {opt.label}
                </span>
                <RadioGroupItem
                  id={`remind-${opt.hours}`}
                  value={String(opt.hours)}
                  className={cn(
                    "size-5 border-2",
                    isSelected
                      ? "border-[var(--recovery-green)] text-[var(--recovery-green)]"
                      : "border-[var(--ink-muted)] text-transparent",
                  )}
                />
              </Label>
            );
          })}
        </RadioGroup>

        <Button
          size="lg"
          disabled={busy}
          onClick={onSubmit}
          aria-label="Set reminder"
          className="h-12 w-full rounded-xl bg-[var(--recovery-green)] text-[15px] font-medium text-white shadow-sm hover:bg-[var(--recovery-green)]/90"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Remind me
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Stop-reminders confirmation ─────────────────────────────
// No dark patterns — clear, honest, immediately effective.
// "I don't want reminders" creates a Suppression right away.

function StopConfirmView({
  onBack,
  onConfirm,
  busy,
}: {
  onBack: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 py-8 sm:py-12">
      <button
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1 text-[14px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
        aria-label="Go back to main choices"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-5 pt-2 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--critical-light)]">
          <Ban className="size-9 text-[var(--critical)]" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--ink-primary)]">
            Stop all reminders?
          </h1>
          <p className="mx-auto max-w-sm text-[16px] leading-relaxed text-[var(--ink-secondary)]">
            We won&apos;t send you any further messages about this course. You
            can still continue on your own whenever you&apos;re ready.
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-2.5">
          <Button
            size="lg"
            disabled={busy}
            onClick={onConfirm}
            aria-label="Confirm: stop all reminders"
            className="h-12 w-full rounded-xl bg-[var(--critical)] text-[15px] font-medium text-white shadow-sm hover:bg-[var(--critical)]/90 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Ban className="size-4" />
                Stop reminders
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onBack}
            disabled={busy}
            className="h-11 w-full rounded-xl text-[15px] font-medium text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)]"
          >
            Keep reminders
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Done screen ─────────────────────────────────────────────

function DoneScreen({
  title,
  body,
  showContinue,
}: {
  title: string;
  body: string;
  showContinue: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-5 px-4 py-12 text-center sm:py-20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="flex size-16 items-center justify-center rounded-full bg-[var(--recovery-light)]"
      >
        <CheckCircle2 className="size-9 text-[var(--recovery-green)]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--ink-primary)]">
          {title}
        </h1>
        <p className="mx-auto max-w-sm text-[16px] leading-relaxed text-[var(--ink-secondary)]">
          {body}
        </p>
      </motion.div>

      {showContinue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="mt-4 w-full"
        >
          <Button
            size="lg"
            className="h-12 w-full rounded-xl bg-[var(--recovery-green)] text-[15px] font-medium text-white shadow-sm hover:bg-[var(--recovery-green)]/90"
            onClick={() => {
              // Best-effort: send the student back to Whop
              window.history.back();
            }}
          >
            Back to course
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Already-responded view ──────────────────────────────────
// Shown when the student has already submitted a response.
// Never exposes churn/revenue/candidate ranking language.

export function AlreadyRespondedView({
  responseType,
  blockerType,
  studentName,
  courseName,
  creatorName,
  respondedAt,
}: {
  responseType: string;
  blockerType?: string | null;
  studentName: string;
  courseName: string;
  creatorName: string;
  respondedAt: Date;
}) {
  const firstName = studentName.split(" ")[0] || studentName;
  const typeLabel =
    RESPONSE_TYPE_LABELS[responseType as ResponseType] ?? responseType;
  const blockerLabel =
    blockerType && blockerType in BLOCKER_TYPE_LABELS
      ? BLOCKER_TYPE_LABELS[blockerType as BlockerType]
      : null;

  const responseCopy = CONFIRMATION_COPY[responseType as ResponseType];

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-5 px-4 py-12 text-center sm:py-20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="flex size-16 items-center justify-center rounded-full bg-[var(--recovery-light)]"
      >
        <CheckCircle2 className="size-9 text-[var(--recovery-green)]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--ink-primary)]">
          You&apos;ve already responded
        </h1>
        <p className="mx-auto max-w-sm text-[16px] leading-relaxed text-[var(--ink-secondary)]">
          {responseCopy?.body ??
            `You chose "${typeLabel}" for ${courseName}.`}
        </p>
      </motion.div>

      {/* Show their choice */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="flex flex-wrap items-center justify-center gap-2"
      >
        <Badge variant="outline" className="text-[13px]">
          {typeLabel}
        </Badge>
        {blockerLabel && (
          <Badge variant="secondary" className="text-[13px]">
            {blockerLabel}
          </Badge>
        )}
      </motion.div>

      {responseType !== "stop_reminders" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="mt-4 w-full"
        >
          <Button
            size="lg"
            className="h-12 w-full rounded-xl bg-[var(--recovery-green)] text-[15px] font-medium text-white shadow-sm hover:bg-[var(--recovery-green)]/90"
            onClick={() => {
              window.history.back();
            }}
          >
            Back to course
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Link error screen (invalid / expired / stopped) ─────────

export function StudentLinkError({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--canvas)] px-4">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--canvas-elevated)]">
          <HelpCircle className="size-9 text-[var(--ink-muted)]" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-[24px] leading-tight text-[var(--ink-primary)]">
            {title}
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
