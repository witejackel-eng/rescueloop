"server-only";
// Send-time safety re-check for intervention approval.
//
// Before allowing an intervention to be approved, we must re-verify
// that the conditions that made the student eligible still hold.
// This prevents approving an intervention if circumstances have
// changed since the eligibility snapshot was taken (e.g., the
// student got suppressed, the org was paused, etc.).

import { db } from "@/lib/db";
import { isWithinQuietHours } from "@/lib/eligibility/quiet-hours";

export interface SafetyCheckResult {
  condition: string;
  passed: boolean;
  detail: string;
}

export interface SafetyRecheckResult {
  safe: boolean;
  checks: SafetyCheckResult[];
}

/**
 * Perform a full safety re-check before approving an intervention.
 *
 * This is a lighter-weight check than the full eligibility engine:
 * it only verifies the conditions that could have changed between
 * eligibility detection and approval time.
 */
export async function performSafetyRecheck(params: {
  interventionId: string;
  organizationId: string;
  studentId: string;
  campaignId: string;
  now?: Date;
}): Promise<SafetyRecheckResult> {
  const now = params.now ?? new Date();
  const checks: SafetyCheckResult[] = [];

  // Fetch the organization with student context
  const [organization, campaign, student] = await Promise.all([
    db.organization.findUnique({
      where: { id: params.organizationId },
      select: {
        id: true,
        status: true,
        isPaused: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        timezone: true,
      },
    }),
    db.campaign.findUnique({
      where: { id: params.campaignId },
      select: {
        id: true,
        status: true,
        cooldownDays: true,
        maxMessagesPerOrg: true,
        maxMessagesPerStudent: true,
      },
    }),
    db.student.findUnique({
      where: { id: params.studentId },
      include: {
        suppressions: true,
        memberships: {
          where: {
            status: { in: ["active", "trialing"] },
          },
          take: 1,
        },
        interventions: {
          where: {
            state: {
              in: [
                "awaiting_approval",
                "approved",
                "scheduled",
                "queued",
                "delivery_attempted",
                "notification_accepted",
                "delivered",
              ],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  // 1. Organization is active
  const orgActive = organization?.status === "active";
  checks.push({
    condition: "organization_active",
    passed: orgActive,
    detail: orgActive
      ? "Organization is active"
      : `Organization status: ${organization?.status ?? "not found"}`,
  });

  // 2. Organization is not paused
  const orgNotPaused = !organization?.isPaused;
  checks.push({
    condition: "organization_not_paused",
    passed: orgNotPaused,
    detail: orgNotPaused
      ? "Organization is not paused"
      : "Organization is paused",
  });

  // 3. Campaign is active
  const campaignActive = campaign?.status === "active";
  checks.push({
    condition: "campaign_active",
    passed: campaignActive,
    detail: campaignActive
      ? "Campaign is active"
      : `Campaign status: ${campaign?.status ?? "not found"}`,
  });

  // 4. Student not suppressed
  const notSuppressed = student ? student.suppressions.length === 0 : false;
  checks.push({
    condition: "student_not_suppressed",
    passed: notSuppressed,
    detail: notSuppressed
      ? "Student is not suppressed"
      : student
        ? "Student is suppressed"
        : "Student not found",
  });

  // 5. No active intervention for student (excluding the current one)
  const hasOtherActiveIntervention = student
    ? student.interventions.some((iv) => iv.id !== params.interventionId)
    : false;
  checks.push({
    condition: "no_active_intervention",
    passed: !hasOtherActiveIntervention,
    detail: !hasOtherActiveIntervention
      ? "No other active intervention"
      : "Student has another active intervention",
  });

  // 6. Cooldown clear
  const cooldownDays = campaign?.cooldownDays ?? 14;
  const lastIntervention = student?.interventions.find(
    (iv) => iv.id !== params.interventionId,
  );
  const cooldownElapsed = !lastIntervention
    ? true
    : (now.getTime() - lastIntervention.createdAt.getTime()) /
        (1000 * 60 * 60 * 24) >=
      cooldownDays;
  checks.push({
    condition: "cooldown_clear",
    passed: cooldownElapsed,
    detail: cooldownElapsed
      ? "Cooldown period elapsed"
      : `Within ${cooldownDays}-day cooldown`,
  });

  // 7. Message limits not exceeded (org-wide)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [orgMessageCount, campaignMessageCount] = await Promise.all([
    db.intervention.count({
      where: {
        organizationId: params.organizationId,
        createdAt: { gte: thirtyDaysAgo },
        state: { in: ["notification_accepted", "delivered"] },
      },
    }),
    db.intervention.count({
      where: {
        organizationId: params.organizationId,
        campaignId: params.campaignId,
        studentId: params.studentId,
        createdAt: { gte: thirtyDaysAgo },
        state: { in: ["notification_accepted", "delivered"] },
      },
    }),
  ]);

  const maxMessagesPerOrg = campaign?.maxMessagesPerOrg ?? 100;
  const orgLimitClear = orgMessageCount < maxMessagesPerOrg;
  checks.push({
    condition: "org_message_limit_clear",
    passed: orgLimitClear,
    detail: orgLimitClear
      ? `Org messages: ${orgMessageCount}/${maxMessagesPerOrg}`
      : `Org message limit reached: ${orgMessageCount}/${maxMessagesPerOrg}`,
  });

  // 8. Message limits not exceeded (per-student per-campaign)
  const maxMessagesPerStudent = campaign?.maxMessagesPerStudent ?? 2;
  const campaignLimitClear = campaignMessageCount < maxMessagesPerStudent;
  checks.push({
    condition: "campaign_message_limit_clear",
    passed: campaignLimitClear,
    detail: campaignLimitClear
      ? `Campaign messages: ${campaignMessageCount}/${maxMessagesPerStudent}`
      : `Campaign message limit reached: ${campaignMessageCount}/${maxMessagesPerStudent}`,
  });

  // 9. Membership still active
  const membershipActive = student ? student.memberships.length > 0 : false;
  checks.push({
    condition: "membership_active",
    passed: membershipActive,
    detail: membershipActive
      ? "Active membership found"
      : "No active membership",
  });

  // 10. Quiet hours check
  const quietHoursStart = organization?.quietHoursStart ?? "20:00";
  const quietHoursEnd = organization?.quietHoursEnd ?? "08:00";
  const timezone = organization?.timezone ?? "America/New_York";
  const inQuietHours = isWithinQuietHours({
    quietHoursStart,
    quietHoursEnd,
    timezone,
    now,
  });
  checks.push({
    condition: "not_in_quiet_hours",
    passed: !inQuietHours,
    detail: inQuietHours
      ? `Within quiet hours (${quietHoursStart}–${quietHoursEnd} ${timezone})`
      : `Outside quiet hours (${quietHoursStart}–${quietHoursEnd} ${timezone})`,
  });

  const safe = checks.every((c) => c.passed);
  return { safe, checks };
}
