// /companies/[companyId]/queue
//
// Server component. Shows database-backed Activation Rescue candidates
// (interventions with state = "awaiting_approval") for the admin's org.

import Link from "next/link";
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
import { QueueActions } from "@/components/rescueloop/company/queue-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Inferred type for the queue query payload (used by the candidate card).
type QueueCandidate = Prisma.InterventionGetPayload<{
  where: { state: "awaiting_approval" };
  include: {
    student: {
      select: {
        id: true;
        name: true;
        email: true;
        whopUserId: true;
        memberships: {
          include: {
            product: {
              select: { id: true; name: true; whopProductId: true };
            };
          };
        };
        studentStates: {
          select: {
            progressPercent: true;
            lessonsCompleted: true;
            totalLessons: true;
            lastActivityAt: true;
            firstActivityAt: true;
            course: { select: { id: true; name: true } };
          };
        };
      };
    };
    campaign: {
      select: {
        id: true;
        name: true;
        type: true;
        cooldownDays: true;
        maxMessagesPerStudent: true;
        quietHoursStart: true;
        quietHoursEnd: true;
      };
    };
    campaignVersion: { select: { id: true; versionNumber: true } };
    eligibilitySnapshot: {
      select: { id: true; detectedAt: true; evidenceJson: true };
    };
  };
}>;

export default async function QueuePage({
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
    return <>{AuthErrorCardFor(error)}</>;
  }

  // Load awaiting-approval interventions with all the evidence joins
  const interventions = await db.intervention.findMany({
    where: {
      organizationId: ctx.organizationId,
      state: "awaiting_approval",
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          whopUserId: true,
          memberships: {
            include: {
              product: {
                select: { id: true, name: true, whopProductId: true },
              },
            },
          },
          studentStates: {
            select: {
              progressPercent: true,
              lessonsCompleted: true,
              totalLessons: true,
              lastActivityAt: true,
              firstActivityAt: true,
              course: { select: { id: true, name: true } },
            },
          },
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
          type: true,
          cooldownDays: true,
          maxMessagesPerStudent: true,
          quietHoursStart: true,
          quietHoursEnd: true,
        },
      },
      campaignVersion: {
        select: { id: true, versionNumber: true },
      },
      eligibilitySnapshot: {
        select: { id: true, detectedAt: true, evidenceJson: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <CompanyPageHeader
        title="Rescue queue"
        description="Activation Rescue candidates awaiting your review. Approve, schedule, or dismiss each one."
      >
        <Badge variant="outline" className="font-mono text-[12px]">
          {interventions.length} awaiting
        </Badge>
      </CompanyPageHeader>

      {interventions.length === 0 ? (
        <EmptyStateCard
          title="No Activation Rescue candidates detected yet"
          description="When members match your campaign rules, they'll appear here for your review. Eligibility is re-evaluated as new activity syncs from Whop."
          icon={ListChecks}
          actionHref={`/companies/${encodeURIComponent(companyId)}/onboarding`}
          actionLabel="Configure campaign"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {interventions.map((iv) => (
            <QueueCandidateCard
              key={iv.id}
              companyId={companyId}
              intervention={iv}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AuthErrorCardFor(error: unknown) {
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
        description="Only company admins can view the rescue queue."
        hint={error.message}
      />
    );
  }
  return (
    <AuthErrorCard
      title="Something went wrong"
      description="An unexpected error occurred while loading this page."
    />
  );
}

// ─── Candidate card ──────────────────────────────────────────

function QueueCandidateCard({
  companyId,
  intervention,
}: {
  companyId: string;
  intervention: QueueCandidate;
}) {
  const { student, campaign, campaignVersion, eligibilitySnapshot } =
    intervention;
  const membership = student.memberships[0];
  const courseState = student.studentStates[0];

  const studentName =
    student.name ?? student.email ?? `user_${student.whopUserId.slice(-6)}`;

  // Safety checks from the eligibility evidence (stored at detection time)
  const checks = extractChecks(eligibilitySnapshot?.evidenceJson);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 font-serif text-[18px]">
              {studentName}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ink-secondary)]">
              {membership && (
                <span className="font-mono">
                  {membership.product.name} · {membership.status}
                </span>
              )}
              <span className="text-[var(--ink-muted)]">·</span>
              <span className="font-mono">
                detected {formatRelative(eligibilitySnapshot?.detectedAt ?? intervention.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className="font-mono text-[11px] uppercase tracking-wide"
            >
              {intervention.priority}
            </Badge>
            {campaignVersion && (
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                v{campaignVersion.versionNumber}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Trigger + message preview */}
        <div className="flex flex-col gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
              Trigger
            </span>
            <span className="text-[13px] text-[var(--ink-primary)]">
              {intervention.trigger}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            {intervention.messagePreview}
          </p>
        </div>

        {/* Evidence grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <EvidenceBlock title="Membership">
            {membership ? (
              <ul className="flex flex-col gap-1 font-mono text-[12px] text-[var(--ink-secondary)]">
                <li>status: {membership.status}</li>
                <li>joined: {formatDate(membership.joinedAt)}</li>
                {membership.renewalDate && (
                  <li>renewal: {formatDate(membership.renewalDate)}</li>
                )}
                <li>price: {formatCents(membership.priceCents, membership.currency)}</li>
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--ink-muted)]">No membership</p>
            )}
          </EvidenceBlock>

          <EvidenceBlock title="Course">
            {courseState ? (
              <ul className="flex flex-col gap-1 font-mono text-[12px] text-[var(--ink-secondary)]">
                <li>{courseState.course.name}</li>
                <li>
                  {courseState.lessonsCompleted}/{courseState.totalLessons} lessons
                </li>
                <li>{courseState.progressPercent}%</li>
                {courseState.lastActivityAt && (
                  <li>last: {formatRelative(courseState.lastActivityAt)}</li>
                )}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--ink-muted)]">
                No course activity recorded
              </p>
            )}
          </EvidenceBlock>

          <EvidenceBlock title="Safety checks">
            {checks.length > 0 ? (
              <ul className="flex flex-col gap-1 text-[12px]">
                {checks.slice(0, 6).map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 font-mono text-[var(--ink-secondary)]"
                  >
                    <span
                      className={
                        c.passed
                          ? "text-[var(--recovery-green)]"
                          : "text-[var(--critical)]"
                      }
                    >
                      {c.passed ? "✓" : "✕"}
                    </span>
                    <span className="truncate">{c.condition}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--ink-muted)]">
                No snapshot stored
              </p>
            )}
          </EvidenceBlock>
        </div>

        {/* Campaign context */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--hairline)] pt-3 font-mono text-[11px] text-[var(--ink-muted)]">
          <span>campaign: {campaign.name}</span>
          <span>type: {campaign.type}</span>
          <span>cooldown: {campaign.cooldownDays}d</span>
          <span>max: {campaign.maxMessagesPerStudent}/mo</span>
          <span>
            quiet: {campaign.quietHoursStart}–{campaign.quietHoursEnd}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-3">
          <Link
            href={`/companies/${encodeURIComponent(companyId)}/responses`}
            className="text-[12px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
          >
            View student responses →
          </Link>
          <QueueActions
            companyId={companyId}
            interventionId={intervention.id}
            studentName={studentName}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

interface SafetyCheck {
  condition: string;
  passed: boolean;
  detail: string;
}

function extractChecks(evidence: unknown): SafetyCheck[] {
  if (!evidence || typeof evidence !== "object") return [];
  const e = evidence as { checks?: SafetyCheck[] };
  return Array.isArray(e.checks) ? e.checks : [];
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
