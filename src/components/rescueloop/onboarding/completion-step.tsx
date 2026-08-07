"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  CreditCard,
  Users,
  AlertTriangle,
} from "lucide-react";

interface CompletionStepProps {
  /** The company ID for routing. */
  companyId: string;
  /** Summary data for the completion card. */
  summary: {
    coursesConnected: number;
    totalMembers: number;
    candidateCount: number;
    safetyExclusions: number;
    thresholdDays: number;
  };
}

/** All onboarding steps complete. */
const STEPS_COMPLETE = [
  { label: "Access verified", icon: CheckCircle2 },
  { label: "Course mapped", icon: BookOpen },
  { label: "Sync completed", icon: CreditCard },
  { label: "Threshold configured", icon: AlertTriangle },
  { label: "Candidates evaluated", icon: Users },
] as const;

export function CompletionStep({
  companyId,
  summary,
}: CompletionStepProps) {
  const router = useRouter();
  const hasCandidates = summary.candidateCount > 0;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Closing Signal — one restrained confirmation */}
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--recovery-light)]">
        <CheckCircle2 className="size-7 text-[var(--recovery-green)]" />
      </div>

      {/* Heading */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
          Setup complete
        </h2>
        <p className="mt-2 max-w-md text-[14px] text-[var(--ink-secondary)]">
          RescueLoop is connected and monitoring. Here&apos;s what was
          configured.
        </p>
      </div>

      {/* Steps complete list */}
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-2 p-4">
          {STEPS_COMPLETE.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-md px-2 py-1.5"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--recovery-light)]">
                <Icon className="size-3.5 text-[var(--recovery-green)]" />
              </div>
              <span className="text-[13px] font-medium text-[var(--ink-primary)]">
                {label}
              </span>
              <CheckCircle2 className="ml-auto size-4 text-[var(--recovery-green)]" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <SummaryStat
          label="Courses connected"
          value={summary.coursesConnected}
        />
        <SummaryStat
          label="Members scanned"
          value={summary.totalMembers}
        />
        <SummaryStat
          label="Candidates found"
          value={summary.candidateCount}
          highlight={hasCandidates}
        />
        <SummaryStat
          label="Safety exclusions"
          value={summary.safetyExclusions}
        />
      </div>

      {/* Threshold badge */}
      <Badge
        variant="outline"
        className="border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/50 text-[var(--recovery-green)]"
      >
        <AlertTriangle className="size-3" />
        Threshold: {summary.thresholdDays} days
      </Badge>

      {/* Final confirmation */}
      <Card className="w-full max-w-md border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/30">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--recovery-green)]" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-medium text-[var(--ink-primary)]">
              Nothing has been sent.
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              All candidates are in your queue for review. You approve, edit, or
              dismiss each one individually.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next action */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {hasCandidates ? (
          <Button
            size="lg"
            className="gap-2"
            onClick={() =>
              router.push(
                `/dashboard/${encodeURIComponent(companyId)}/rescue-queue`,
              )
            }
          >
            Go to Rescue Queue
            <ArrowRight className="size-4" />
          </Button>
        ) : null}
        <Button
          size="lg"
          variant={hasCandidates ? "outline" : "default"}
          className="gap-2"
          onClick={() =>
            router.push(
              `/dashboard/${encodeURIComponent(companyId)}/overview`,
            )
          }
        >
          Go to Dashboard
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--surface)] p-3">
      <span
        className={`font-mono text-xl font-semibold ${
          highlight
            ? "text-[var(--warning)]"
            : "text-[var(--ink-primary)]"
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] text-[var(--ink-muted)]">{label}</span>
    </div>
  );
}
