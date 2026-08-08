// /dashboard/[companyId]/responses
//
// Creator Response Centre (WP05). Shows student response records with:
// - Student name, course, intervention, response type, blocker, response time
// - Later activity column (course progress after response)
// - Suppression/follow-up state
// - Actions: mark handled, open student, prepare manually reviewed follow-up
// - No AI auto-reply bypassing creator review
//
// FAIL-CLOSED: Calls requireCompanyAccess() at the top.

import "server-only";
import {
  requireCompanyAccess,
  renderAccessDeniedError,
} from "@/lib/auth/require-company-access";
import { CompanyPageHeader } from "@/components/rescueloop/company/state-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareReply } from "lucide-react";
import { db } from "@/lib/db";
import { ResponseCenterClient } from "@/components/rescueloop/creator/response-center-client";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ─── Auth guard (fail-closed) ────────────────────────────────
  let context;
  try {
    context = await requireCompanyAccess(companyId);
  } catch (error) {
    const rendered = renderAccessDeniedError(error, companyId);
    if (rendered) return <div className="mx-auto max-w-3xl">{rendered}</div>;
    throw error;
  }

  // ─── Load responses ─────────────────────────────────────────
  // Only fetch for connected mode (fixture mode has no real data)
  const responses = context.mode === "connected"
    ? await db.studentResponse.findMany({
        where: {
          intervention: {
            organizationId: context.organizationId,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          intervention: {
            select: {
              id: true,
              outcomeState: true,
              state: true,
              messagePreview: true,
              trigger: true,
              createdAt: true,
              respondedAt: true,
              campaign: {
                select: {
                  name: true,
                  confirmedMapping: {
                    select: {
                      course: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  // ─── Load suppressions ──────────────────────────────────────
  const suppressions = context.mode === "connected"
    ? await db.suppression.findMany({
        where: {
          organizationId: context.organizationId,
        },
        select: {
          studentId: true,
          scope: true,
          reason: true,
        },
      })
    : [];

  const suppressedStudentIds = new Set(suppressions.map((s) => s.studentId));

  // ─── Load post-response course activity ─────────────────────
  // For each response, check if the student had course activity after responding
  const studentIdsWithResponses = responses.map((r) => r.student.id);
  const postResponseActivity = context.mode === "connected" && studentIdsWithResponses.length > 0
    ? await db.progressEvent.findMany({
        where: {
          studentId: { in: studentIdsWithResponses },
          action: "completed",
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          studentId: true,
          createdAt: true,
          lessonTitle: true,
        },
      })
    : [];

  // Index post-response activity by student
  const activityByStudent = new Map<string, typeof postResponseActivity>();
  for (const event of postResponseActivity) {
    const existing = activityByStudent.get(event.studentId) ?? [];
    existing.push(event);
    activityByStudent.set(event.studentId, existing);
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl">
      <CompanyPageHeader
        title="Creator response centre"
        description="Every student response, with the intervention that prompted it."
      >
        <Badge variant="outline" className="font-mono text-[12px]">
          {responses.length} response{responses.length !== 1 ? "s" : ""}
        </Badge>
      </CompanyPageHeader>

      {responses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MessageSquareReply className="size-8 text-[var(--ink-muted)]" />
            <p className="text-[15px] font-medium text-[var(--ink-primary)]">
              Response centre
            </p>
            <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              When students respond to an Activation Rescue message, their replies will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ResponseCenterClient
          responses={responses.map((r) => ({
            id: r.id,
            responseType: r.responseType,
            blockerType: r.blockerType,
            note: r.note,
            createdAt: r.createdAt,
            student: {
              id: r.student.id,
              name: r.student.name,
              email: r.student.email,
            },
            intervention: {
              id: r.intervention.id,
              outcomeState: r.intervention.outcomeState,
              state: r.intervention.state,
              messagePreview: r.intervention.messagePreview,
              trigger: r.intervention.trigger,
              courseName:
                r.intervention.campaign?.confirmedMapping?.course?.name ?? "Unknown course",
              campaignName: r.intervention.campaign?.name ?? "Unknown campaign",
            },
            isSuppressed: suppressedStudentIds.has(r.student.id),
            laterActivity: (activityByStudent.get(r.student.id) ?? [])
              .filter((a) => a.createdAt >= r.createdAt)
              .map((a) => ({
                lessonTitle: a.lessonTitle,
                occurredAt: a.createdAt,
              })),
          }))}
          companyId={companyId}
        />
      )}
    </div>
  );
}
