"server-only";
// Activation Rescue eligibility engine.
// Determines which students are eligible for an Activation Rescue intervention
// based on the full 17-check eligibility criteria from Phase 12.
//
// Checks:
//  1. Organisation active
//  2. Organisation not paused
//  3. Installation active
//  4. Campaign active
//  5. Campaign is Activation Rescue
//  6. Manual approval enabled
//  7. Campaign version exists
//  8. Confirmed mapping belongs to campaign
//  9. Membership belongs to mapped product
// 10. Membership active or trialing
// 11. Membership not ending
// 12. Activation delay elapsed
// 13. Course activity absent
// 14. No course-, campaign- or organisation-level suppression
// 15. No existing equivalent active intervention
// 16. Campaign cooldown clear
// 17. Organisation-wide message limit clear
// 18. Campaign message limit clear
// 19. Plan allows monitored member
// 20. Source data sufficiently fresh

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

const SOURCE_FRESHNESS_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check whether a student is eligible for Activation Rescue.
 *
 * Phase 12: All 17+ checks are explicitly verified.
 * Operates only on the campaign's confirmed mapping.
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
      organization: {
        include: { installations: true },
      },
    },
  });

  if (!student) {
    return {
      state: "ineligible",
      checks: [{ condition: "student_exists", passed: false, detail: "Student not found" }],
      evidence: {},
    };
  }

  // 1. Organisation active
  const orgActive = student.organization.status === "active";
  checks.push({
    condition: "organization_active",
    passed: orgActive,
    detail: orgActive ? "Organization is active" : `Organization status: ${student.organization.status}`,
  });

  // 2. Organisation not paused
  const orgNotPaused = !student.organization.isPaused;
  checks.push({
    condition: "organization_not_paused",
    passed: orgNotPaused,
    detail: orgNotPaused ? "Organization is not paused" : "Organization is paused",
  });

  // 3. Installation active
  const hasActiveInstallation = student.organization.installations.some((i) => i.status === "active");
  checks.push({
    condition: "installation_active",
    passed: hasActiveInstallation,
    detail: hasActiveInstallation ? "Active installation found" : "No active installation",
  });

  // 4. Campaign active
  const campaign = await db.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      confirmedMapping: true,
    },
  });

  const campaignActive = campaign?.status === "active";
  checks.push({
    condition: "campaign_active",
    passed: campaignActive,
    detail: campaignActive ? "Campaign is active" : `Campaign status: ${campaign?.status ?? "not found"}`,
  });

  // 5. Campaign is Activation Rescue
  const campaignIsActivationRescue = campaign?.type === "activation_rescue";
  checks.push({
    condition: "campaign_is_activation_rescue",
    passed: campaignIsActivationRescue,
    detail: campaignIsActivationRescue ? "Campaign is Activation Rescue" : `Campaign type: ${campaign?.type ?? "not found"}`,
  });

  // 6. Manual approval enabled
  const manualApproval = campaign?.approvalMode === "manual";
  checks.push({
    condition: "manual_approval_enabled",
    passed: manualApproval,
    detail: manualApproval ? "Manual approval enabled" : `Approval mode: ${campaign?.approvalMode ?? "not found"}`,
  });

  // 7. Campaign version exists
  const latestVersion = campaign?.versions[0];
  const campaignVersionExists = !!latestVersion;
  checks.push({
    condition: "campaign_version_exists",
    passed: campaignVersionExists,
    detail: campaignVersionExists ? `Version ${latestVersion!.versionNumber} exists` : "No campaign version",
  });

  // 8. Confirmed mapping belongs to campaign
  const confirmedMappingBelongsToCampaign = !!campaign?.confirmedMapping;
  checks.push({
    condition: "confirmed_mapping_belongs_to_campaign",
    passed: confirmedMappingBelongsToCampaign,
    detail: confirmedMappingBelongsToCampaign
      ? "Confirmed mapping exists for campaign"
      : "No confirmed mapping for campaign",
  });

  // 9. Membership belongs to mapped product
  const mapping = campaign?.confirmedMapping ??
    student.memberships
      .flatMap((m) => m.product.mappings)
      .find((m) => m.courseId === params.courseId && m.isConfirmed) ?? null;

  const mappedProductId = mapping?.productId ?? campaign?.confirmedMapping?.productId;
  const activeMembership = student.memberships.find((m) => {
    if (m.status !== "active" && m.status !== "trialing") return false;
    if (mappedProductId && m.productId !== mappedProductId) return false;
    return true;
  });

  const membershipBelongsToMappedProduct = !!activeMembership && (!mappedProductId || activeMembership.productId === mappedProductId);
  checks.push({
    condition: "membership_belongs_to_mapped_product",
    passed: membershipBelongsToMappedProduct,
    detail: membershipBelongsToMappedProduct
      ? `Membership product matches mapped product`
      : "No membership for mapped product",
  });

  // 10. Membership active or trialing
  const membershipActive = !!activeMembership;
  checks.push({
    condition: "membership_active_or_trialing",
    passed: membershipActive,
    detail: membershipActive
      ? `Membership status: ${activeMembership!.status}`
      : "No active membership",
  });

  // 11. Membership not ending
  const membershipNotEnding = !activeMembership?.renewalDate || activeMembership.renewalDate > now;
  checks.push({
    condition: "membership_not_ending",
    passed: membershipNotEnding,
    detail: membershipNotEnding
      ? "Membership not ending"
      : "Membership renewal date has passed",
  });

  // 12. Activation delay elapsed
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

  // 13. Course activity absent
  const courseState = student.studentStates[0];
  const noCourseActivity = !courseState || courseState.lessonsCompleted === 0;
  checks.push({
    condition: "course_activity_absent",
    passed: noCourseActivity,
    detail: noCourseActivity
      ? "No course activity recorded"
      : `Course progress: ${courseState!.progressPercent}% (${courseState!.lessonsCompleted} lessons)`,
  });

  // 14. No course-, campaign- or organisation-level suppression
  const notSuppressed = student.suppressions.length === 0;
  checks.push({
    condition: "not_suppressed",
    passed: notSuppressed,
    detail: notSuppressed ? "No suppression recorded" : "Student is suppressed",
  });

  // 15. No existing equivalent active intervention
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

  // 16. Campaign cooldown clear
  const cooldownDays = campaign?.cooldownDays ?? 14;
  const lastIntervention = student.interventions[0];
  const cooldownElapsed = !lastIntervention
    ? true
    : (now.getTime() - lastIntervention.createdAt.getTime()) / (1000 * 60 * 60 * 24) >= cooldownDays;
  checks.push({
    condition: "campaign_cooldown_clear",
    passed: cooldownElapsed,
    detail: cooldownElapsed
      ? "Cooldown elapsed"
      : `Within ${cooldownDays}-day cooldown`,
  });

  // 17. Organisation-wide message limit clear
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const orgMessageCount = campaign
    ? await db.intervention.count({
        where: {
          organizationId: student.organizationId,
          createdAt: { gte: thirtyDaysAgo },
          state: { in: ["notification_accepted", "delivered"] },
        },
      })
    : 0;
  const maxMessagesPerOrg = campaign?.maxMessagesPerOrg ?? 100;
  const orgLimitClear = orgMessageCount < maxMessagesPerOrg;
  checks.push({
    condition: "org_message_limit_clear",
    passed: orgLimitClear,
    detail: orgLimitClear
      ? `Org messages: ${orgMessageCount}/${maxMessagesPerOrg}`
      : `Org message limit reached: ${orgMessageCount}/${maxMessagesPerOrg}`,
  });

  // 18. Campaign message limit clear
  const campaignMessageCount = campaign
    ? await db.intervention.count({
        where: {
          organizationId: student.organizationId,
          campaignId: params.campaignId,
          createdAt: { gte: thirtyDaysAgo },
          state: { in: ["notification_accepted", "delivered"] },
        },
      })
    : 0;
  const maxMessagesPerCampaign = campaign?.maxMessagesPerStudent ?? 2;
  const campaignLimitClear = campaignMessageCount < maxMessagesPerCampaign;
  checks.push({
    condition: "campaign_message_limit_clear",
    passed: campaignLimitClear,
    detail: campaignLimitClear
      ? `Campaign messages: ${campaignMessageCount}/${maxMessagesPerCampaign}`
      : `Campaign message limit reached: ${campaignMessageCount}/${maxMessagesPerCampaign}`,
  });

  // 19. Plan allows monitored member
  const entitlement = await db.subscriptionEntitlement.findFirst({
    where: { organizationId: student.organizationId },
  });
  const plan = entitlement
    ? await db.plan.findUnique({ where: { tier: entitlement.planTier } })
    : null;
  const maxMonitoredMembers = plan?.maxMonitoredMembers ?? Infinity;
  const currentMonitoredMembers = await db.membership.count({
    where: {
      organizationId: student.organizationId,
      status: { in: ["active", "trialing"] },
    },
  });
  const planAllows = currentMonitoredMembers < maxMonitoredMembers;
  checks.push({
    condition: "plan_allows_monitored_member",
    passed: planAllows,
    detail: planAllows
      ? `Monitored: ${currentMonitoredMembers}/${maxMonitoredMembers}`
      : `Plan limit reached: ${currentMonitoredMembers}/${maxMonitoredMembers}`,
  });

  // 20. Source data sufficiently fresh
  const latestCheckpoint = await db.syncCheckpoint.findFirst({
    where: { organizationId: student.organizationId, resource: "memberships" },
    orderBy: { updatedAt: "desc" },
  });
  const sourceDataFresh = latestCheckpoint
    ? (now.getTime() - latestCheckpoint.updatedAt.getTime()) < SOURCE_FRESHNESS_MAX_AGE_MS
    : false;
  checks.push({
    condition: "source_data_fresh",
    passed: sourceDataFresh,
    detail: sourceDataFresh
      ? "Source data is fresh"
      : "Source data is stale (>24h since last sync)",
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
      organizationStatus: student.organization.status,
      installationActive: hasActiveInstallation,
      notSuppressed,
      hasActiveIntervention,
      campaignActive,
      campaignIsActivationRescue,
      manualApproval,
      campaignVersionExists,
      confirmedMappingBelongsToCampaign,
      orgLimitClear,
      campaignLimitClear,
      planAllows,
      sourceDataFresh,
    },
  };
}

/**
 * Find all eligible students for an Activation Rescue campaign.
 * Returns eligibility snapshots that can be used to create interventions.
 *
 * Phase 12: Operates only on the campaign's confirmed mapping.
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
          installations: true,
        },
      },
      confirmedMapping: true,
    },
  });

  if (!campaign || campaign.type !== "activation_rescue") {
    return [];
  }

  const results: EligibilityResult[] = [];

  // Phase 12: Use only the campaign's confirmed mapping
  const mapping = campaign.confirmedMapping;
  if (!mapping) {
    return []; // No confirmed mapping — no candidates possible
  }

  const courseId = mapping.courseId;

  // Only evaluate students who have a membership for the mapped product
  const eligibleStudents = campaign.organization.students.filter((student) =>
    student.memberships.some(
      (m) =>
        m.productId === mapping.productId &&
        (m.status === "active" || m.status === "trialing"),
    ),
  );

  for (const student of eligibleStudents) {
    const result = await checkActivationEligibility({
      studentId: student.id,
      courseId,
      campaignId: params.campaignId,
      now: params.now,
    });

    if (result.state === "eligible") {
      results.push(result);
    }
  }

  return results;
}
