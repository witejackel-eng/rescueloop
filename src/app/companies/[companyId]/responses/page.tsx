// /companies/[companyId]/responses
//
// Server component. Shows database-backed StudentResponse records for the
// admin's org, joined with Intervention + Student. Human-help and
// stop-reminders responses are visually highlighted.

import { requireCompanyAdmin } from "@/lib/auth/whop-auth";
import {
  InstallationMissingError,
  MissingTokenError,
  InvalidTokenError,
  WhopUnavailableError,
  InsufficientAccessError,
} from "@/lib/auth/whop-auth";
import { db } from "@/lib/db";
import {
  AuthErrorCard,
  CompanyPageHeader,
  EmptyStateCard,
  InstallationRequiredCard,
} from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  BellOff,
  MessageSquareReply,
  Clock3,
  CheckCheck,
  HelpCircle,
} from "lucide-react";
import type { ResponseType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  let ctx;
  try {
    ctx = await requireCompanyAdmin(companyId);
  } catch (error) {
    if (error instanceof InstallationMissingError) {
      return (
        <div className="mx-auto max-w-3xl">
          <InstallationRequiredCard companyId={companyId} />
        </div>
      );
    }
    if (error instanceof MissingTokenError) {
      return (
        <AuthErrorCard
          title="Sign in required"
          description="Open this page from your Whop dashboard to verify your admin access."
          hint="Missing Whop user token"
        />
      );
    }
    if (error instanceof InvalidTokenError) {
      return (
        <AuthErrorCard
          title="Session expired"
          description="Your Whop session has expired. Please reopen this page from your Whop dashboard."
          hint="Invalid or expired token"
        />
      );
    }
    if (error instanceof WhopUnavailableError) {
      return (
        <AuthErrorCard
          title="Whop is unavailable"
          description="We couldn't reach Whop to verify your access. Please try again in a moment."
          hint="Authentication service unavailable"
        />
      );
    }
    if (error instanceof InsufficientAccessError) {
      return (
        <AuthErrorCard
          title="Admin access required"
          description="Only company admins can view creator responses."
          hint={error.message}
        />
      );
    }
    throw error;
  }

  const responses = await db.studentResponse.findMany({
    where: {
      intervention: { organizationId: ctx.organizationId },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      student: {
        select: { id: true, name: true, email: true, whopUserId: true },
      },
      intervention: {
        select: {
          id: true,
          state: true,
          outcomeState: true,
          trigger: true,
          messagePreview: true,
          createdAt: true,
          campaign: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Creator response centre"
        description="Every student response, with the intervention that prompted it. Human-help and stop-reminders are surfaced first."
      >
        <Badge variant="outline" className="font-mono text-[12px]">
          {responses.length} response{responses.length === 1 ? "" : "s"}
        </Badge>
      </CompanyPageHeader>

      {responses.length === 0 ? (
        <EmptyStateCard
          title="No student responses yet"
          description="When students respond to an Activation Rescue message — continue, stuck, remind me, human help, or stop reminders — their replies will appear here."
          icon={MessageSquareReply}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {responses.map((r) => (
            <ResponseRow key={r.id} response={r} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ResponseRowProps {
  response: Awaited<ReturnType<typeof db.studentResponse.findMany>>[number] & {
    student: { name: string | null; email: string | null; whopUserId: string };
    intervention: {
      id: string;
      state: string;
      outcomeState: string;
      trigger: string;
      messagePreview: string;
      createdAt: Date;
      campaign: { name: string } | null;
    };
  };
}

function ResponseRow({ response }: ResponseRowProps) {
  const { student, intervention } = response;
  const studentName =
    student.name ?? student.email ?? `user_${student.whopUserId.slice(-6)}`;
  const meta = responseMeta[response.responseType];
  const highlighted =
    response.responseType === "human_help" ||
    response.responseType === "stop_reminders";

  return (
    <Card
      className={
        highlighted
          ? "border-l-2 border-l-[var(--warning)] bg-[var(--warning-light)]/20"
          : ""
      }
    >
      <CardContent className="flex flex-col gap-3 py-4">
        {/* Top row: icon + name + type + time */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md"
            style={{ background: meta.bg }}
          >
            <meta.Icon className="size-4" style={{ color: meta.color }} />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-medium text-[var(--ink-primary)]">
                {studentName}
              </span>
              <Badge
                variant="outline"
                className="font-mono text-[11px] uppercase tracking-wide"
                style={{ color: meta.color, borderColor: meta.color }}
              >
                {meta.label}
              </Badge>
              {response.blockerType && (
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  blocker: {response.blockerType}
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              {formatDateTime(response.createdAt)}
            </span>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-[11px] uppercase tracking-wide"
          >
            {intervention.outcomeState}
          </Badge>
        </div>

        {/* Note (if any) */}
        {response.note && (
          <blockquote className="border-l-2 border-[var(--hairline)] pl-3 text-[13px] italic text-[var(--ink-secondary)]">
            “{response.note}”
          </blockquote>
        )}

        {/* Original intervention context */}
        <div className="rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[var(--ink-muted)]">
            <span>intervention: {intervention.id.slice(-8)}</span>
            {intervention.campaign && (
              <span>campaign: {intervention.campaign.name}</span>
            )}
            <span>state: {intervention.state}</span>
            <span>sent: {formatDate(intervention.createdAt)}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12px] text-[var(--ink-secondary)]">
            {intervention.messagePreview}
          </p>
        </div>

        {/* Remind-later scheduling */}
        {response.responseType === "remind_later" && (
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">
            Reminder scheduled from this response.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Response-type metadata ──────────────────────────────────

const responseMeta: Record<
  ResponseType,
  { label: string; color: string; bg: string; Icon: typeof Heart }
> = {
  continue_course: {
    label: "Continue course",
    color: "var(--recovery-green)",
    bg: "var(--recovery-light)",
    Icon: CheckCheck,
  },
  stuck: {
    label: "Stuck",
    color: "var(--warning)",
    bg: "var(--warning-light)",
    Icon: HelpCircle,
  },
  remind_later: {
    label: "Remind later",
    color: "var(--info)",
    bg: "rgba(61, 107, 140, 0.10)",
    Icon: Clock3,
  },
  already_completed: {
    label: "Already completed",
    color: "var(--recovery-green)",
    bg: "var(--recovery-light)",
    Icon: CheckCheck,
  },
  human_help: {
    label: "Human help",
    color: "var(--critical)",
    bg: "var(--critical-light)",
    Icon: Heart,
  },
  stop_reminders: {
    label: "Stop reminders",
    color: "var(--critical)",
    bg: "var(--critical-light)",
    Icon: BellOff,
  },
};

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
