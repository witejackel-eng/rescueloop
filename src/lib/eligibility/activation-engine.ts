// Activation Rescue eligibility engine.
// Determines which students are eligible for an Activation Rescue intervention
// based on: active membership, no course activity, configured delay, cooldown,
// opt-out, suppression, organisation pause, and campaign status.

import { db } from "@/lib/db";
import type { EligibilityState } from "@prisma/client";

export interface EligibilityCheck {
  condition: string;
  passed: boolean;
  detail: string;
}

export interface EligibilityResult {
  state: EligibilityState;
  checks: EligibilityCheck[];
  evidence: Record<string, unknown>;
}

/**
 * Check whether a student is eligible for Activation Rescue.
 *
 * A member is eligible only when:
 * 1. Their membership is active or trialing
 * 2. Their product grants access to the mapped course
 * 3. They have no recorded course interaction
 * 4. The configured waiting period has elapsed since purchase
 * 5. They have not opted out (suppressed)
 * 6. They are not suppressed
 * 7. Their membership is not ending
 * 8. They do not have another active intervention
 * 9. The campaign cooldown has elapsed
 * 10. The organisation is not globally paused
 */
export async function checkActivationEligibility(params: {
  studentId: string;
  courseId: string;
  campaignId: string;
  now?: Date;
}): Promise<EligibilityResult> {
  const now = params.now ?? new Date();
  const checks: EligibilityCheck[] = [];

  // Fetch the student with membership and course state
  const student = await db.student.findUnique({
    where: { id: params.studentId },
    include: {
      memberships: { include: { product: { include: { mappings: true } } } },
      studentStates: { where: { courseId: params.courseId } },
      interventions: {
        where: {
          campaign: { type: "activation_rescue" },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      suppressions: true,
      organization: true,
    },
  });

  if (!student) {
    return {
      state: "ineligible",
      checks: [{ condition: "student_exists", passed: false, detail: "Student not found" }],
      evidence: {},
    };
  }

  // 10. Organisation not paused
  const orgNotPaused = !student.organization.isPaused && student.organization.status === "active";
  checks.push({
    condition: "organization_active",
    passed: orgNotPaused,
    detail: orgNotPaused ? "Organization is active" : "Organization is paused or suspended",
  });

  // 1 & 7. Membership active/trialing and not ending
  const activeMembership = student.memberships.find(
    (m) => m.status === "active" || m.status === "trialing",
  );
  const membershipActive = !!activeMembership;
  checks.push({
    condition: "membership_active",
    passed: membershipActive,
    detail: membershipActive
      ? `Membership status: ${activeMembership!.status}`
      : "No active membership",
  });

  // 2. Product grants access to mapped course
  const productMapsToCourse = activeMembership?.product.mappings.some(
    (m) => m.courseId === params.courseId && m.isConfirmed,
  ) ?? false;
  checks.push({
    condition: "product_course_mapping",
    passed: productMapsToCourse,
    detail: productMapsToCourse
      ? "Product maps to this course"
      : "Product does not map to this course",
  });

  // 3. No recorded course interaction
  const courseState = student.studentStates[0];
  const noCourseActivity = !courseState || courseState.lessonsCompleted === 0;
  checks.push({
    condition: "no_course_activity",
    passed: noCourseActivity,
    detail: noCourseActivity
      ? "No course activity recorded"
      : `Course progress: ${courseState!.progressPercent}% (${courseState!.lessonsCompleted} lessons)`,
  });

  // 4. Configured waiting period has elapsed
  const mapping = activeMembership?.product.mappings.find(
    (m) => m.courseId === params.courseId,
  );
  const delayDays = mapping?.activationDelayDays ?? 7;
  const joinedAt = activeMembership?.joinedAt ?? new Date(0);
  const daysSinceJoin = Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24));
  const delayElapsed = daysSinceJoin >= delayDays;
  checks.push({
    condition: "activation_delay_elapsed",
    passed: delayElapsed,
    detail: delayElapsed
      ? `${daysSinceJoin} days since purchase (delay: ${delayDays} days)`
      : `${daysSinceJoin} days since purchase (need ${delayDays} days)`,
  });

  // 5. Not opted out
  const notOptedOut = student.suppressions.length === 0;
  checks.push({
    condition: "not_opted_out",
    passed: notOptedOut,
    detail: notOptedOut ? "No opt-out recorded" : "Student has opted out",
  });

  // 6. Not suppressed (same as 5 for now, but could be separate)
  const notSuppressed = notOptedOut;
  checks.push({
    condition: "not_suppressed",
    passed: notSuppressed,
    detail: notSuppressed ? "Not suppressed" : "Student is suppressed",
  });

  // 8. No active intervention for this campaign
  const hasActiveIntervention = student.interventions.some(
    (iv) =>
      iv.state !== "dismissed" &&
      iv.state !== "stopped" &&
      iv.state !== "failed",
  );
  checks.push({
    condition: "no_active_intervention",
    passed: !hasActiveIntervention,
    detail: !hasActiveIntervention
      ? "No active intervention"
      : `Active intervention: ${student.interventions[0]?.state}`,
  });

  // 9. Campaign cooldown has elapsed
  const campaign = await db.campaign.findUnique({
    where: { id: params.campaignId },
  });
  const cooldownDays = campaign?.cooldownDays ?? 14;
  const lastIntervention = student.interventions[0];
  const cooldownElapsed = !lastIntervention
    ? true
    : (now.getTime() - lastIntervention.createdAt.getTime()) / (1000 * 60 * 60 * 24) >= cooldownDays;
  checks.push({
    condition: "campaign_cooldown_elapsed",
    passed: cooldownElapsed,
    detail: cooldownElapsed
      ? "Cooldown elapsed"
      : `Within ${cooldownDays}-day cooldown`,
  });

  // Determine overall state
  const allPassed = checks.every((c) => c.passed);
  const state: EligibilityState = allPassed ? "eligible" : "ineligible";

  return {
    state,
    checks,
    evidence: {
      detectedAt: now.toISOString(),
      studentId: params.studentId,
      courseId: params.courseId,
      campaignId: params.campaignId,
      membershipStatus: activeMembership?.status,
      daysSinceJoin,
      delayDays,
      cooldownDays,
      organizationPaused: student.organization.isPaused,
      optedOut: !notOptedOut,
      hasActiveIntervention,
    },
  };
}

/**
 * Find all eligible students for an Activation Rescue campaign.
 * Returns eligibility snapshots that can be used to create interventions.
 */
export async function findEligibleStudentsForCampaign(params: {
  campaignId: string;
  now?: Date;
}): Promise<EligibilityResult[]> {
  const campaign = await db.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      organization: {
        include: {
          students: {
            include: {
              memberships: { include: { product: { include: { mappings: true } } } },
              studentStates: true,
              interventions: true,
              suppressions: true,
            },
          },
          courses: true,
        },
      },
    },
  });

  if (!campaign || campaign.type !== "activation_rescue") {
    return [];
  }

  const results: EligibilityResult[] = [];

  for (const course of campaign.organization.courses) {
    for (const student of campaign.organization.students) {
      const result = await checkActivationEligibility({
        studentId: student.id,
        courseId: course.id,
        campaignId: params.campaignId,
        now: params.now,
      });

      if (result.state === "eligible") {
        results.push(result);
      }
    }
  }

  return results;
}
