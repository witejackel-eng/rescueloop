"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  User,
  BookOpen,
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  Snowflake,
} from "lucide-react";
import { formatDate } from "@/lib/format";

export interface Candidate {
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

interface CandidatePreviewStepProps {
  /** The company ID for routing. */
  companyId: string;
  /** Candidates found at the configured threshold. */
  candidates: Candidate[];
  /** The threshold in days used to generate this list. */
  thresholdDays: number;
}

const membershipColor: Record<string, string> = {
  active: "bg-[var(--recovery-light)] text-[var(--recovery-green)] border-[var(--recovery-green)]/20",
  trialing: "bg-[var(--canvas-elevated)] text-[var(--ink-secondary)] border-[var(--hairline)]",
  cancelling: "bg-[var(--signal-light)] text-[var(--warning)] border-[var(--warning)]/20",
  cancelled: "bg-[var(--canvas-elevated)] text-[var(--ink-muted)] border-[var(--hairline)]",
};

export function CandidatePreviewStep({
  companyId,
  candidates,
  thresholdDays,
}: CandidatePreviewStepProps) {
  const router = useRouter();
  const hasCandidates = candidates.length > 0;

  if (!hasCandidates) {
    return <ZeroCandidateInline thresholdDays={thresholdDays} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
          Recovery candidates at {thresholdDays}-day threshold
        </h2>
        <p className="mt-1 text-[14px] text-[var(--ink-secondary)]">
          {candidates.length} member{candidates.length === 1 ? "" : "s"} meet
          the inactivity criteria. Review their details below.
        </p>
      </div>

      {/* Nothing sent banner */}
      <Card className="border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/30">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--recovery-green)]" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-medium text-[var(--ink-primary)]">
              Nothing has been sent.
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              These candidates are in preview only. No messages have been
              generated or queued. You will review and approve each one
              individually.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 py-2">
        <Eye className="size-3.5 text-[var(--ink-muted)]" />
        <p className="text-[12px] text-[var(--ink-secondary)]">
          Previewing never generates or sends a message. Candidates will appear
          in your Rescue Queue for review.
        </p>
      </div>

      {/* Candidate list */}
      <div className="flex flex-col gap-3">
        {candidates.map((candidate) => (
          <CandidateRow key={candidate.id} candidate={candidate} />
        ))}
      </div>

      {/* Continue button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          className="gap-2"
          onClick={() =>
            router.push(`/dashboard/${encodeURIComponent(companyId)}/rescue-queue`)
          }
        >
          Continue to Rescue Queue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: Candidate }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
          {/* Avatar */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--canvas-elevated)]">
            <User className="size-4 text-[var(--ink-secondary)]" />
          </div>

          {/* Main info */}
          <div className="flex flex-1 flex-col gap-2">
            {/* Name + badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-semibold text-[var(--ink-primary)]">
                {candidate.name}
              </span>
              <span className="font-mono text-[12px] text-[var(--ink-muted)]">
                {candidate.email}
              </span>
              <Badge
                variant="outline"
                className={membershipColor[candidate.membershipStatus]}
              >
                {candidate.membershipStatus}
              </Badge>
              {candidate.unknownEvidence && (
                <Badge
                  variant="outline"
                  className="border-[var(--warning)]/20 bg-[var(--signal-light)] text-[var(--warning)]"
                >
                  <AlertTriangle className="size-3" />
                  Unknown evidence
                </Badge>
              )}
              {candidate.suppressed && (
                <Badge
                  variant="outline"
                  className="border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-muted)]"
                >
                  <Snowflake className="size-3" />
                  Suppressed
                </Badge>
              )}
            </div>

            {/* Course + product */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--ink-secondary)]">
              <span className="flex items-center gap-1">
                <BookOpen className="size-3" />
                {candidate.courseName}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="size-3" />
                {candidate.productName}
              </span>
            </div>

            {/* Start date + progress evidence */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--ink-secondary)]">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Started {formatDate(candidate.startDate)}
              </span>
              <span>{candidate.progressEvidence}</span>
            </div>

            {/* Eligibility reason */}
            <p className="text-[12px] text-[var(--ink-secondary)]">
              <span className="font-medium text-[var(--ink-primary)]">Reason: </span>
              {candidate.eligibilityReason}
            </p>
          </div>

          {/* Inactivity + cooldown */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 rounded-md bg-[var(--signal-light)] px-2.5 py-1">
              <Clock className="size-3.5 text-[var(--warning)]" />
              <span className="font-mono text-[13px] font-semibold text-[var(--warning)]">
                {candidate.inactivityDays}d
              </span>
            </div>
            <span className="text-[11px] text-[var(--ink-muted)]">inactive</span>
            {candidate.cooldownUntil && (
              <span className="text-[11px] text-[var(--ink-muted)]">
                Cooldown until {formatDate(candidate.cooldownUntil)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Inline zero-candidate state shown within the preview step. */
function ZeroCandidateInline({
  thresholdDays,
}: {
  thresholdDays: number;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--recovery-light)]">
        <CheckCircle2 className="size-7 text-[var(--recovery-green)]" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
          No candidates at {thresholdDays} days
        </h2>
        <p className="mt-2 max-w-md text-[14px] text-[var(--ink-secondary)]">
          This is a good sign — no members currently meet the {thresholdDays}-day
          inactivity threshold. Your members are engaged.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-[13px] text-[var(--ink-secondary)]">
        <p>
          You can{" "}
          <span className="font-medium text-[var(--ink-primary)]">
            adjust the threshold
          </span>{" "}
          to see if a lower value surfaces candidates.
        </p>
        <p>
          RescueLoop will{" "}
          <span className="font-medium text-[var(--ink-primary)]">
            continue monitoring
          </span>{" "}
          and notify you when candidates appear.
        </p>
      </div>
    </div>
  );
}
