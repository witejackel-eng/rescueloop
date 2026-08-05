-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'paused', 'suspended');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('pending', 'active', 'uninstalled', 'revoked');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'trialing', 'past_due', 'cancelling', 'cancelled', 'paused_membership');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'stalled');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('activation_rescue', 'early_progress_rescue', 'mid_course_rescue', 'near_finish_rescue', 'cancellation_rescue');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('active', 'paused', 'archived', 'draft');

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('manual', 'automatic');

-- CreateEnum
CREATE TYPE "EligibilityState" AS ENUM ('pending_evaluation', 'eligible', 'ineligible', 'suppressed', 'expired');

-- CreateEnum
CREATE TYPE "InterventionState" AS ENUM ('drafted', 'awaiting_approval', 'approved', 'scheduled', 'queued', 'delivery_attempted', 'notification_accepted', 'delivered', 'failed', 'stopped', 'dismissed');

-- CreateEnum
CREATE TYPE "DeliveryState" AS ENUM ('queued', 'attempted', 'api_accepted', 'failed', 'stopped_before_send', 'delivery_unknown', 'dead_lettered');

-- CreateEnum
CREATE TYPE "OutcomeState" AS ENUM ('no_response', 'opened', 'responded', 'reminded_later', 'requested_help', 'opted_out', 'course_started', 'progress_resumed', 'already_completed');

-- CreateEnum
CREATE TYPE "AttributionState" AS ENUM ('unattributed', 'strongly_associated', 'confirmed', 'estimated', 'rejected');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('continue_course', 'stuck', 'remind_later', 'already_completed', 'human_help', 'stop_reminders');

-- CreateEnum
CREATE TYPE "BlockerType" AS ENUM ('lack_of_time', 'material_difficult', 'unsure_next_step', 'expected_something_different', 'technical_problem', 'needs_creator_help');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('received', 'processing', 'processed', 'failed', 'duplicate');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('created', 'updated', 'deleted', 'approved', 'dismissed', 'scheduled', 'suppressed', 'unsuppressed', 'paused', 'resumed', 'sent', 'delivered', 'responded', 'opted_out', 'synced', 'configuration_changed');

-- CreateEnum
CREATE TYPE "DataDeletionStatus" AS ENUM ('requested', 'processing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "OutboxState" AS ENUM ('pending', 'dispatching', 'dispatched', 'failed', 'dead_letter');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('rescue', 'growth', 'scale', 'internal', 'pilot');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "whopUserId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'active',
    "planTier" TEXT NOT NULL DEFAULT 'rescue',
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whop_installations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whopCompanyId" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'pending',
    "requestedScopes" TEXT[],
    "grantedScopes" TEXT[],
    "installedById" TEXT,
    "installedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "whop_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_credentials" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "keyType" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whopProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalCourseId" TEXT NOT NULL,
    "externalExperienceId" TEXT,
    "name" TEXT NOT NULL,
    "lessonCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_course_mappings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "activationDelayDays" INTEGER NOT NULL DEFAULT 7,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "product_course_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whopUserId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "whopMembershipId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMPTZ NOT NULL,
    "renewalDate" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lastSyncedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'not_started',
    "enrolledAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_course_states" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "firstActivityAt" TIMESTAMPTZ,
    "lastActivityAt" TIMESTAMPTZ,
    "lastSyncedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_course_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "externalInteractionId" TEXT,
    "lessonIndex" INTEGER NOT NULL,
    "lessonTitle" TEXT,
    "action" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ NOT NULL,
    "webhookReceiptId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ NOT NULL,
    "webhookReceiptId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "whopPaymentId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "occurredAt" TIMESTAMPTZ NOT NULL,
    "webhookReceiptId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL DEFAULT 'activation_rescue',
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'active',
    "approvalMode" "ApprovalMode" NOT NULL DEFAULT 'manual',
    "maxMessagesPerStudent" INTEGER NOT NULL DEFAULT 2,
    "cooldownDays" INTEGER NOT NULL DEFAULT 14,
    "quietHoursStart" TEXT NOT NULL DEFAULT '20:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "stopAfterResponse" BOOLEAN NOT NULL DEFAULT true,
    "stopAfterProgress" BOOLEAN NOT NULL DEFAULT true,
    "stopAfterMembershipEnd" BOOLEAN NOT NULL DEFAULT true,
    "messageTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_versions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "rulesJson" JSONB NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_rules" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleValue" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_snapshots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignVersionId" TEXT NOT NULL,
    "state" "EligibilityState" NOT NULL DEFAULT 'pending_evaluation',
    "evidenceJson" JSONB NOT NULL,
    "detectedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,

    CONSTRAINT "eligibility_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignVersionId" TEXT,
    "eligibilitySnapshotId" TEXT,
    "state" "InterventionState" NOT NULL DEFAULT 'awaiting_approval',
    "outcomeState" "OutcomeState" NOT NULL DEFAULT 'no_response',
    "attributionState" "AttributionState" NOT NULL DEFAULT 'unattributed',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "trigger" TEXT NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "messagePreview" TEXT NOT NULL,
    "messageEdited" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ,
    "scheduledFor" TIMESTAMPTZ,
    "sentAt" TIMESTAMPTZ,
    "respondedAt" TIMESTAMPTZ,
    "recoveredAt" TIMESTAMPTZ,
    "cooldownUntil" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_attempts" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "state" "DeliveryState" NOT NULL DEFAULT 'queued',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "apiAcceptedAt" TIMESTAMPTZ,
    "deliveredAt" TIMESTAMPTZ,
    "failedAt" TIMESTAMPTZ,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_responses" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "responseType" "ResponseType" NOT NULL,
    "blockerType" "BlockerType",
    "note" TEXT,
    "accessTokenId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_access_tokens" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "revokedAt" TIMESTAMPTZ,
    "lastUsedAt" TIMESTAMPTZ,
    "consumedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocker_responses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "blocker" "BlockerType" NOT NULL,
    "note" TEXT,
    "interventionId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocker_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_requests" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reminderTime" TIMESTAMPTZ NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppressions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'organization',
    "reason" TEXT NOT NULL DEFAULT 'student_opt_out',
    "interventionId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_receipts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whopEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'received',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ,
    "payloadJson" JSONB NOT NULL,

    CONSTRAINT "webhook_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "interventionId" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "reason" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "value_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "interventionId" TEXT,
    "studentId" TEXT,
    "event" TEXT NOT NULL,
    "attributionLevel" "AttributionState" NOT NULL DEFAULT 'unattributed',
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "formula" TEXT,
    "policyVersion" TEXT NOT NULL DEFAULT '2026-08-01',
    "paymentEventId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "value_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_evidence" (
    "id" TEXT NOT NULL,
    "valueEventId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribution_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_deletion_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" "DataDeletionStatus" NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "state" "OutboxState" NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "dispatchedAt" TIMESTAMPTZ,
    "nextAttemptAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_executions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "outboxEventId" TEXT,
    "jobType" TEXT NOT NULL,
    "runId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "errorMessage" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dead_letter_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "outboxEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "deadLetteredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dead_letter_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "maxMonitoredMembers" INTEGER NOT NULL,
    "maxCourses" INTEGER NOT NULL,
    "maxCampaigns" INTEGER NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_entitlements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'pilot',
    "billingPeriodStart" TIMESTAMPTZ NOT NULL,
    "billingPeriodEnd" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscription_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_counters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "increment" INTEGER NOT NULL DEFAULT 1,
    "metadataJson" JSONB,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_whopUserId_key" ON "users"("whopUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "whop_installations_whopCompanyId_key" ON "whop_installations"("whopCompanyId");

-- CreateIndex
CREATE INDEX "whop_installations_organizationId_idx" ON "whop_installations"("organizationId");

-- CreateIndex
CREATE INDEX "integration_credentials_installationId_idx" ON "integration_credentials"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "products_whopProductId_key" ON "products"("whopProductId");

-- CreateIndex
CREATE INDEX "products_organizationId_idx" ON "products"("organizationId");

-- CreateIndex
CREATE INDEX "courses_organizationId_idx" ON "courses"("organizationId");

-- CreateIndex
CREATE INDEX "product_course_mappings_organizationId_idx" ON "product_course_mappings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "product_course_mappings_productId_courseId_key" ON "product_course_mappings"("productId", "courseId");

-- CreateIndex
CREATE INDEX "students_organizationId_idx" ON "students"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "students_organizationId_whopUserId_key" ON "students"("organizationId", "whopUserId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_whopMembershipId_key" ON "memberships"("whopMembershipId");

-- CreateIndex
CREATE INDEX "memberships_organizationId_idx" ON "memberships"("organizationId");

-- CreateIndex
CREATE INDEX "memberships_studentId_idx" ON "memberships"("studentId");

-- CreateIndex
CREATE INDEX "enrollments_organizationId_idx" ON "enrollments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_courseId_key" ON "enrollments"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "student_course_states_organizationId_idx" ON "student_course_states"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "student_course_states_studentId_courseId_key" ON "student_course_states"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "progress_events_organizationId_studentId_courseId_idx" ON "progress_events"("organizationId", "studentId", "courseId");

-- CreateIndex
CREATE INDEX "progress_events_occurredAt_idx" ON "progress_events"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "progress_events_organizationId_studentId_externalInteractio_key" ON "progress_events"("organizationId", "studentId", "externalInteractionId");

-- CreateIndex
CREATE INDEX "membership_events_organizationId_membershipId_idx" ON "membership_events"("organizationId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_whopPaymentId_key" ON "payment_events"("whopPaymentId");

-- CreateIndex
CREATE INDEX "payment_events_organizationId_membershipId_idx" ON "payment_events"("organizationId", "membershipId");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_versions_campaignId_versionNumber_key" ON "campaign_versions"("campaignId", "versionNumber");

-- CreateIndex
CREATE INDEX "eligibility_snapshots_organizationId_studentId_idx" ON "eligibility_snapshots"("organizationId", "studentId");

-- CreateIndex
CREATE INDEX "eligibility_snapshots_campaignId_state_idx" ON "eligibility_snapshots"("campaignId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "interventions_idempotencyKey_key" ON "interventions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "interventions_organizationId_state_idx" ON "interventions"("organizationId", "state");

-- CreateIndex
CREATE INDEX "interventions_studentId_idx" ON "interventions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_attempts_idempotencyKey_key" ON "delivery_attempts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "delivery_attempts_interventionId_idx" ON "delivery_attempts"("interventionId");

-- CreateIndex
CREATE INDEX "delivery_attempts_state_idx" ON "delivery_attempts"("state");

-- CreateIndex
CREATE INDEX "student_responses_interventionId_idx" ON "student_responses"("interventionId");

-- CreateIndex
CREATE INDEX "student_responses_studentId_idx" ON "student_responses"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_access_tokens_tokenHash_key" ON "student_access_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "student_access_tokens_organizationId_studentId_idx" ON "student_access_tokens"("organizationId", "studentId");

-- CreateIndex
CREATE INDEX "student_access_tokens_interventionId_idx" ON "student_access_tokens"("interventionId");

-- CreateIndex
CREATE INDEX "blocker_responses_organizationId_studentId_idx" ON "blocker_responses"("organizationId", "studentId");

-- CreateIndex
CREATE INDEX "reminder_requests_interventionId_idx" ON "reminder_requests"("interventionId");

-- CreateIndex
CREATE INDEX "suppressions_organizationId_idx" ON "suppressions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "suppressions_organizationId_studentId_scope_key" ON "suppressions"("organizationId", "studentId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_receipts_whopEventId_key" ON "webhook_receipts"("whopEventId");

-- CreateIndex
CREATE INDEX "webhook_receipts_organizationId_status_idx" ON "webhook_receipts"("organizationId", "status");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_objectType_objectId_idx" ON "audit_logs"("organizationId", "objectType", "objectId");

-- CreateIndex
CREATE INDEX "audit_logs_interventionId_idx" ON "audit_logs"("interventionId");

-- CreateIndex
CREATE UNIQUE INDEX "value_events_paymentEventId_key" ON "value_events"("paymentEventId");

-- CreateIndex
CREATE INDEX "value_events_organizationId_attributionLevel_idx" ON "value_events"("organizationId", "attributionLevel");

-- CreateIndex
CREATE INDEX "value_events_interventionId_idx" ON "value_events"("interventionId");

-- CreateIndex
CREATE INDEX "attribution_evidence_valueEventId_idx" ON "attribution_evidence"("valueEventId");

-- CreateIndex
CREATE INDEX "data_deletion_requests_organizationId_idx" ON "data_deletion_requests"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "outbox_events_organizationId_state_idx" ON "outbox_events"("organizationId", "state");

-- CreateIndex
CREATE INDEX "outbox_events_state_nextAttemptAt_idx" ON "outbox_events"("state", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "job_executions_organizationId_status_idx" ON "job_executions"("organizationId", "status");

-- CreateIndex
CREATE INDEX "job_executions_jobType_status_idx" ON "job_executions"("jobType", "status");

-- CreateIndex
CREATE INDEX "dead_letter_events_organizationId_idx" ON "dead_letter_events"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_tier_key" ON "plans"("tier");

-- CreateIndex
CREATE INDEX "subscription_entitlements_organizationId_idx" ON "subscription_entitlements"("organizationId");

-- CreateIndex
CREATE INDEX "usage_counters_organizationId_period_idx" ON "usage_counters"("organizationId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "usage_counters_organizationId_metric_period_key" ON "usage_counters"("organizationId", "metric", "period");

-- CreateIndex
CREATE INDEX "usage_events_organizationId_metric_occurredAt_idx" ON "usage_events"("organizationId", "metric", "occurredAt");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whop_installations" ADD CONSTRAINT "whop_installations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "whop_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_course_mappings" ADD CONSTRAINT "product_course_mappings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_course_mappings" ADD CONSTRAINT "product_course_mappings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_course_mappings" ADD CONSTRAINT "product_course_mappings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_states" ADD CONSTRAINT "student_course_states_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_states" ADD CONSTRAINT "student_course_states_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_versions" ADD CONSTRAINT "campaign_versions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_campaignVersionId_fkey" FOREIGN KEY ("campaignVersionId") REFERENCES "campaign_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_eligibilitySnapshotId_fkey" FOREIGN KEY ("eligibilitySnapshotId") REFERENCES "eligibility_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocker_responses" ADD CONSTRAINT "blocker_responses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppressions" ADD CONSTRAINT "suppressions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppressions" ADD CONSTRAINT "suppressions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_receipts" ADD CONSTRAINT "webhook_receipts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "value_events" ADD CONSTRAINT "value_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "value_events" ADD CONSTRAINT "value_events_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_evidence" ADD CONSTRAINT "attribution_evidence_valueEventId_fkey" FOREIGN KEY ("valueEventId") REFERENCES "value_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

