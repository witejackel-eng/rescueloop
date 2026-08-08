"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  Clock,
  Radio,
} from "lucide-react";

interface ZeroCandidateStateProps {
  /** The threshold in days that produced zero candidates. */
  thresholdDays: number;
  /** When the data was last synced. */
  syncedAt: string;
  /** The company ID for routing. */
  companyId: string;
}

export function ZeroCandidateState({
  thresholdDays,
  syncedAt,
  companyId,
}: ZeroCandidateStateProps) {
  const router = useRouter();

  const formattedSyncDate = new Date(syncedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Closing Signal — one restrained confirmation */}
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--recovery-light)]">
        <CheckCircle2 className="size-7 text-[var(--recovery-green)]" />
      </div>

      {/* Heading — zero candidates IS success */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
          Scan completed successfully
        </h2>
        <p className="mt-2 max-w-md text-[14px] text-[var(--ink-secondary)]">
          No members currently meet the {thresholdDays}-day inactivity
          threshold. This means your members are engaged.
        </p>
      </div>

      {/* Explanation cards */}
      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-1">
        <Card className="gap-0 border-[var(--hairline)] py-0">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                No members currently meet the threshold
              </p>
              <p className="text-[12px] text-[var(--ink-secondary)]">
                At {thresholdDays} days of inactivity, no one qualifies for an
                intervention. This is a healthy state.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-[var(--hairline)] py-0">
          <CardContent className="flex items-start gap-3 p-4">
            <Radio className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                Threshold can be adjusted
              </p>
              <p className="text-[12px] text-[var(--ink-secondary)]">
                Try a lower threshold if you want to catch members earlier in
                their inactivity window.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-[var(--hairline)] py-0">
          <CardContent className="flex items-start gap-3 p-4">
            <Clock className="mt-0.5 size-4 shrink-0 text-[var(--recovery-green)]" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-medium text-[var(--ink-primary)]">
                Data synced {formattedSyncDate}
              </p>
              <p className="text-[12px] text-[var(--ink-secondary)]">
                RescueLoop uses the latest membership and progress data. The
                next sync will pick up any new inactivity patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring promise */}
      <Card className="w-full max-w-lg border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/30">
        <CardContent className="flex items-start gap-3 py-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--recovery-green)]" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-medium text-[var(--ink-primary)]">
              We&apos;ll continue monitoring
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              RescueLoop watches for new inactivity patterns and will notify you
              when candidates appear. No action needed right now.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Go to dashboard */}
      <Button
        size="lg"
        className="gap-2"
        onClick={() =>
          router.push(
            `/dashboard/${encodeURIComponent(companyId)}/overview`,
          )
        }
      >
        Go to dashboard
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
