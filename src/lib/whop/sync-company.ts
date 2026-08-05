import "server-only";

import { RiskState, RiskType, SyncRunStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { whopConfig, whopListAll } from "@/lib/whop/api";

type JsonRecord = Record<string, any>;

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function userFrom(record: JsonRecord): JsonRecord {
  return record.user ?? record.member?.user ?? record.member ?? {};
}

function riskFingerprint(type: RiskType, memberId: string, courseId?: string | null): string {
  return `${type}:${memberId}:${courseId ?? "none"}`;
}

export async function syncWhopCompany(companyId = whopConfig.defaultCompanyId) {
  const installation = await prisma.companyInstallation.upsert({
    where: { whopCompanyId: companyId },
    update: {
      whopAppId: whopConfig.appId,
      lastSyncStartedAt: new Date(),
      lastSyncError: null,
    },
    create: {
      whopCompanyId: companyId,
      whopAppId: whopConfig.appId,
      lastSyncStartedAt: new Date(),
    },
  });

  const syncRun = await prisma.syncRun.create({
    data: {
      companyId: installation.id,
      status: SyncRunStatus.RUNNING,
    },
  });

  try {
    const courses = await whopListAll<JsonRecord>("/courses", {
      company_id: companyId,
    });

    const memberships = await whopListAll<JsonRecord>("/memberships", {
      company_id: companyId,
    });

    let lessonsSynced = 0;
    let enrollmentsSynced = 0;
    const memberIds = new Set<string>();
    const courseIds = new Set<string>();

    for (const rawCourse of courses) {
      const whopCourseId = String(rawCourse.id);
      courseIds.add(whopCourseId);

      const course = await prisma.whopCourse.upsert({
        where: { whopCourseId },
        update: {
          title: text(rawCourse.title) ?? "Untitled course",
          description: text(rawCourse.description),
          tagline: text(rawCourse.tagline),
          coverImageUrl: text(rawCourse.cover_image?.url ?? rawCourse.cover_image_url),
          certificateEnabled: Boolean(rawCourse.certificate_enabled),
          lessonsInOrder: Boolean(rawCourse.require_lessons_in_order),
          studentCount: numberValue(rawCourse.student_count),
          whopUpdatedAt: asDate(rawCourse.updated_at),
          lastSyncedAt: new Date(),
          isArchived: false,
        },
        create: {
          companyId: installation.id,
          whopCourseId,
          title: text(rawCourse.title) ?? "Untitled course",
          description: text(rawCourse.description),
          tagline: text(rawCourse.tagline),
          coverImageUrl: text(rawCourse.cover_image?.url ?? rawCourse.cover_image_url),
          certificateEnabled: Boolean(rawCourse.certificate_enabled),
          lessonsInOrder: Boolean(rawCourse.require_lessons_in_order),
          studentCount: numberValue(rawCourse.student_count),
          whopCreatedAt: asDate(rawCourse.created_at),
          whopUpdatedAt: asDate(rawCourse.updated_at),
        },
      });

      const [lessons, courseStudents] = await Promise.all([
        whopListAll<JsonRecord>("/lessons", { course_id: whopCourseId }),
        whopListAll<JsonRecord>("/course_students", { course_id: whopCourseId }),
      ]);

      for (const rawLesson of lessons) {
        await prisma.whopLesson.upsert({
          where: { whopLessonId: String(rawLesson.id) },
          update: {
            title: text(rawLesson.title) ?? "Untitled lesson",
            order: rawLesson.order === undefined ? null : numberValue(rawLesson.order),
            lessonType: text(rawLesson.lesson_type ?? rawLesson.type),
            content: text(rawLesson.content),
            thumbnailUrl: text(rawLesson.thumbnail?.url ?? rawLesson.thumbnail_url),
            unlockAfterDays:
              rawLesson.unlock_after_days === undefined
                ? null
                : numberValue(rawLesson.unlock_after_days),
            lastSyncedAt: new Date(),
          },
          create: {
            courseId: course.id,
            whopLessonId: String(rawLesson.id),
            title: text(rawLesson.title) ?? "Untitled lesson",
            order: rawLesson.order === undefined ? null : numberValue(rawLesson.order),
            lessonType: text(rawLesson.lesson_type ?? rawLesson.type),
            content: text(rawLesson.content),
            thumbnailUrl: text(rawLesson.thumbnail?.url ?? rawLesson.thumbnail_url),
            unlockAfterDays:
              rawLesson.unlock_after_days === undefined
                ? null
                : numberValue(rawLesson.unlock_after_days),
            whopCreatedAt: asDate(rawLesson.created_at),
          },
        });
        lessonsSynced += 1;
      }

      await prisma.whopCourse.update({
        where: { id: course.id },
        data: {
          lessonCount: lessons.length,
          studentCount: courseStudents.length,
        },
      });

      for (const rawStudent of courseStudents) {
        const rawUser = userFrom(rawStudent);
        const whopUserId = String(rawUser.id ?? rawStudent.user_id ?? rawStudent.id);
        memberIds.add(whopUserId);

        const member = await prisma.whopMember.upsert({
          where: {
            companyId_whopUserId: {
              companyId: installation.id,
              whopUserId,
            },
          },
          update: {
            email: text(rawUser.email),
            name: text(rawUser.name),
            username: text(rawUser.username),
            profilePicUrl: text(rawUser.profile_pic_url ?? rawUser.profile_picture?.url),
            lastActivityAt: asDate(rawStudent.last_interaction_at),
          },
          create: {
            companyId: installation.id,
            whopUserId,
            email: text(rawUser.email),
            name: text(rawUser.name),
            username: text(rawUser.username),
            profilePicUrl: text(rawUser.profile_pic_url ?? rawUser.profile_picture?.url),
            joinedAt: asDate(rawStudent.created_at),
            lastActivityAt: asDate(rawStudent.last_interaction_at),
          },
        });

        await prisma.courseEnrollment.upsert({
          where: { whopCourseStudentId: String(rawStudent.id) },
          update: {
            memberId: member.id,
            completionRate: numberValue(rawStudent.completion_rate),
            completedLessons: numberValue(rawStudent.completed_lessons_count),
            totalLessons: numberValue(rawStudent.total_lessons_count, lessons.length),
            firstInteractionAt: asDate(rawStudent.first_interaction_at),
            lastInteractionAt: asDate(rawStudent.last_interaction_at),
            lastSyncedAt: new Date(),
          },
          create: {
            companyId: installation.id,
            courseId: course.id,
            memberId: member.id,
            whopCourseStudentId: String(rawStudent.id),
            completionRate: numberValue(rawStudent.completion_rate),
            completedLessons: numberValue(rawStudent.completed_lessons_count),
            totalLessons: numberValue(rawStudent.total_lessons_count, lessons.length),
            firstInteractionAt: asDate(rawStudent.first_interaction_at),
            lastInteractionAt: asDate(rawStudent.last_interaction_at),
          },
        });
        enrollmentsSynced += 1;
      }
    }

    for (const rawMembership of memberships) {
      const rawUser = userFrom(rawMembership);
      const whopUserId = String(rawUser.id ?? rawMembership.user_id ?? rawMembership.id);
      memberIds.add(whopUserId);

      const member = await prisma.whopMember.upsert({
        where: {
          companyId_whopUserId: {
            companyId: installation.id,
            whopUserId,
          },
        },
        update: {
          whopMemberId: text(rawMembership.member?.id ?? rawMembership.member_id),
          email: text(rawUser.email),
          name: text(rawUser.name),
          username: text(rawUser.username),
          profilePicUrl: text(rawUser.profile_pic_url ?? rawUser.profile_picture?.url),
          joinedAt: asDate(rawMembership.joined_at),
        },
        create: {
          companyId: installation.id,
          whopUserId,
          whopMemberId: text(rawMembership.member?.id ?? rawMembership.member_id),
          email: text(rawUser.email),
          name: text(rawUser.name),
          username: text(rawUser.username),
          profilePicUrl: text(rawUser.profile_pic_url ?? rawUser.profile_picture?.url),
          joinedAt: asDate(rawMembership.joined_at),
        },
      });

      await prisma.whopMembership.upsert({
        where: { whopMembershipId: String(rawMembership.id) },
        update: {
          memberId: member.id,
          status: String(rawMembership.status ?? "unknown"),
          cancelAtPeriodEnd: Boolean(rawMembership.cancel_at_period_end),
          canceledAt: asDate(rawMembership.canceled_at),
          cancellationReason: text(rawMembership.cancellation_reason),
          productId: text(rawMembership.product?.id ?? rawMembership.product_id),
          productTitle: text(rawMembership.product?.title ?? rawMembership.product?.name),
          planId: text(rawMembership.plan?.id ?? rawMembership.plan_id),
          formattedRenewalPrice: text(rawMembership.formatted_renewal_price),
          initialPricePaid: text(rawMembership.initial_price_paid),
          currency: text(rawMembership.currency),
          renewalPeriodStart: asDate(rawMembership.renewal_period_start),
          renewalPeriodEnd: asDate(rawMembership.renewal_period_end),
          manageUrl: text(rawMembership.manage_url),
          paymentCollectionPaused: Boolean(rawMembership.payment_collection_paused),
          joinedAt: asDate(rawMembership.joined_at),
          whopUpdatedAt: asDate(rawMembership.updated_at),
          lastSyncedAt: new Date(),
        },
        create: {
          companyId: installation.id,
          memberId: member.id,
          whopMembershipId: String(rawMembership.id),
          status: String(rawMembership.status ?? "unknown"),
          cancelAtPeriodEnd: Boolean(rawMembership.cancel_at_period_end),
          canceledAt: asDate(rawMembership.canceled_at),
          cancellationReason: text(rawMembership.cancellation_reason),
          productId: text(rawMembership.product?.id ?? rawMembership.product_id),
          productTitle: text(rawMembership.product?.title ?? rawMembership.product?.name),
          planId: text(rawMembership.plan?.id ?? rawMembership.plan_id),
          formattedRenewalPrice: text(rawMembership.formatted_renewal_price),
          initialPricePaid: text(rawMembership.initial_price_paid),
          currency: text(rawMembership.currency),
          renewalPeriodStart: asDate(rawMembership.renewal_period_start),
          renewalPeriodEnd: asDate(rawMembership.renewal_period_end),
          manageUrl: text(rawMembership.manage_url),
          paymentCollectionPaused: Boolean(rawMembership.payment_collection_paused),
          joinedAt: asDate(rawMembership.joined_at),
          whopCreatedAt: asDate(rawMembership.created_at),
          whopUpdatedAt: asDate(rawMembership.updated_at),
        },
      });
    }

    if (courseIds.size > 0) {
      await prisma.whopCourse.updateMany({
        where: {
          companyId: installation.id,
          whopCourseId: { notIn: [...courseIds] },
        },
        data: { isArchived: true },
      });
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { companyId: installation.id },
      include: {
        member: true,
        course: true,
      },
    });

    let risksOpened = 0;
    const now = new Date();
    const inactiveCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const enrollment of enrollments) {
      let type: RiskType | null = null;
      let reason = "";
      let score = 50;

      if (!enrollment.firstInteractionAt && enrollment.completionRate <= 0) {
        type = RiskType.NEVER_STARTED;
        reason = "Student has access but has not started the course.";
        score = 70;
      } else if (
        enrollment.lastInteractionAt &&
        enrollment.lastInteractionAt < inactiveCutoff &&
        enrollment.completionRate < 100
      ) {
        type = RiskType.INACTIVE;
        reason = "Student has not interacted with the course for at least 7 days.";
        score = Math.min(95, 60 + Math.floor((now.getTime() - enrollment.lastInteractionAt.getTime()) / 86_400_000));
      }

      if (!type) continue;

      const fingerprint = riskFingerprint(type, enrollment.memberId, enrollment.courseId);
      const existing = await prisma.riskDetection.findUnique({ where: { fingerprint } });

      await prisma.riskDetection.upsert({
        where: { fingerprint },
        update: {
          state: RiskState.OPEN,
          score,
          reason,
          detectedAt: existing?.state === RiskState.OPEN ? existing.detectedAt : now,
          resolvedAt: null,
          evidence: {
            completionRate: enrollment.completionRate,
            completedLessons: enrollment.completedLessons,
            totalLessons: enrollment.totalLessons,
            firstInteractionAt: enrollment.firstInteractionAt,
            lastInteractionAt: enrollment.lastInteractionAt,
          },
        },
        create: {
          fingerprint,
          companyId: installation.id,
          memberId: enrollment.memberId,
          courseId: enrollment.courseId,
          enrollmentId: enrollment.id,
          type,
          score,
          reason,
          evidence: {
            completionRate: enrollment.completionRate,
            completedLessons: enrollment.completedLessons,
            totalLessons: enrollment.totalLessons,
            firstInteractionAt: enrollment.firstInteractionAt,
            lastInteractionAt: enrollment.lastInteractionAt,
          },
        },
      });

      if (!existing || existing.state !== RiskState.OPEN) risksOpened += 1;
    }

    const cancellingMemberships = await prisma.whopMembership.findMany({
      where: {
        companyId: installation.id,
        OR: [
          { cancelAtPeriodEnd: true },
          { status: { in: ["cancelling", "canceling"] } },
        ],
      },
    });

    for (const membership of cancellingMemberships) {
      const fingerprint = riskFingerprint(RiskType.CANCELLATION_PENDING, membership.memberId);
      const existing = await prisma.riskDetection.findUnique({ where: { fingerprint } });

      await prisma.riskDetection.upsert({
        where: { fingerprint },
        update: {
          state: RiskState.OPEN,
          score: 95,
          reason: "Membership is scheduled to cancel.",
          resolvedAt: null,
          evidence: {
            membershipId: membership.whopMembershipId,
            status: membership.status,
            renewalPeriodEnd: membership.renewalPeriodEnd,
            cancellationReason: membership.cancellationReason,
          },
        },
        create: {
          fingerprint,
          companyId: installation.id,
          memberId: membership.memberId,
          type: RiskType.CANCELLATION_PENDING,
          score: 95,
          reason: "Membership is scheduled to cancel.",
          evidence: {
            membershipId: membership.whopMembershipId,
            status: membership.status,
            renewalPeriodEnd: membership.renewalPeriodEnd,
            cancellationReason: membership.cancellationReason,
          },
        },
      });

      if (!existing || existing.state !== RiskState.OPEN) risksOpened += 1;
    }

    const finishedAt = new Date();

    await prisma.$transaction([
      prisma.companyInstallation.update({
        where: { id: installation.id },
        data: {
          lastSyncedAt: finishedAt,
          lastSyncError: null,
        },
      }),
      prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: SyncRunStatus.SUCCEEDED,
          finishedAt,
          coursesSynced: courses.length,
          lessonsSynced,
          membersSynced: memberIds.size,
          membershipsSynced: memberships.length,
          enrollmentsSynced,
          risksOpened,
        },
      }),
    ]);

    return {
      connected: true,
      companyId,
      coursesSynced: courses.length,
      lessonsSynced,
      membersSynced: memberIds.size,
      membershipsSynced: memberships.length,
      enrollmentsSynced,
      risksOpened,
      finishedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync failure";

    await prisma.$transaction([
      prisma.companyInstallation.update({
        where: { id: installation.id },
        data: { lastSyncError: message },
      }),
      prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: SyncRunStatus.FAILED,
          finishedAt: new Date(),
          error: message,
        },
      }),
    ]);

    throw error;
  }
}
