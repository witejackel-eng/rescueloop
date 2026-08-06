-- EnumTypes
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'paused', 'suspended');
CREATE TYPE "MemberRole" AS ENUM ('owner', 'admin', 'member');
CREATE TYPE "InstallationStatus" AS ENUM ('pending', 'active', 'uninstalled', 'revoked');
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'trialing', 'past_due', 'cancelling', 'cancelled', 'paused_membership');
CREATE TYPE "EnrollmentStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'stalled');
CREATE TYPE "CampaignType" AS ENUM ('activation_rescue', 'early_progress_rescue', 'mid_course_rescue', 'near_finish_rescue', 'cancellation_rescue');
CREATE TYPE "CampaignStatus" AS ENUM ('active', 'paused', 'archived', 'draft');
CREATE TYPE "ApprovalMode" AS ENUM ('manual', 'automatic');
CREATE TYPE "EligibilityState" AS ENUM ('pending_evaluation', 'eligible', 'ineligible', 'suppressed', 'expired');
CREATE TYPE "InterventionState" AS ENUM ('drafted', 'awaiting_approval', 'approved', 'scheduled', 'queued', 'delivery_attempted', 'notification_accepted', 'delivered', 'failed', 'stopped', 'dismissed');
CREATE TYPE "DeliveryState" AS ENUM ('queued', 'attempted', 'api_accepted', 'failed', 'stopped_before_send', 'delivery_unknown', 'dead_lettered');
CREATE TYPE "OutcomeState" AS ENUM ('no_response', 'opened', 'responded', 'reminded_later', 'requested_help', 'opted_out', 'course_started', 'progress_resumed', 'already_completed');
CREATE TYPE "AttributionState" AS ENUM ('unattributed', 'strongly_associated', 'confirmed', 'estimated', 'rejected');
CREATE TYPE "ResponseType" AS ENUM ('continue_course', 'stuck', 'remind_later', 'already_completed', 'human_help', 'stop_reminders');
CREATE TYPE "BlockerType" AS ENUM ('lack_of_time', 'material_difficult', 'unsure_next_step', 'expected_something_different', 'technical_problem', 'needs_creator_help');
CREATE TYPE "WebhookStatus" AS ENUM ('received', 'processing', 'processed', 'failed', 'duplicate');
CREATE TYPE "AuditAction" AS ENUM ('created', 'updated', 'deleted', 'approved', 'dismissed', 'scheduled', 'suppressed', 'unsuppressed', 'paused', 'resumed', 'sent', 'delivered', 'responded', 'opted_out', 'synced', 'configuration_changed');
CREATE TYPE "DataDeletionStatus" AS ENUM ('requested', 'verified', 'scheduled', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE "DataExportStatus" AS ENUM ('Requested', 'Processing', 'Completed', 'Failed', 'Expired');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE "OutboxState" AS ENUM ('pending', 'dispatching', 'dispatched', 'failed', 'dead_letter');
CREATE TYPE "PlanTier" AS ENUM ('rescue', 'growth', 'scale', 'internal', 'pilot');
CREATE TYPE "ReservationStatus" AS ENUM ('reserved', 'committed', 'released');
CREATE TYPE "PilotReviewStatus" AS ENUM ('New', 'Reviewing', 'Qualified', 'Contacted', 'Accepted', 'Rejected', 'Withdrawn');
CREATE TYPE "SyncExecutionState" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE "SyncStageState" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');
CREATE TYPE "SyncTrigger" AS ENUM ('manual', 'scheduled', 'webhook', 'resumption');
CREATE TYPE "ReconciliationState" AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE "ReconciliationOutcomeClassification" AS ENUM ('matched', 'membership_without_course_activity', 'course_activity_without_membership', 'unmapped_product', 'missing_source_fields', 'stale_source_record');
CREATE TYPE "ReconciliationResolutionState" AS ENUM ('pending', 'resolved', 'ignored', 'escalated');

-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whopUserId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "users_whopUserId_key" ON "users"("whopUserId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable: organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'active',
    "planTier" TEXT NOT NULL DEFAULT 'rescue',
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateTable: plans
CREATE TABLE "plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "maxMonitoredMembers" INTEGER NOT NULL,
    "maxCourses" INTEGER NOT NULL,
    "maxCampaigns" INTEGER NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "maxCandidatesEvaluated" INTEGER NOT NULL,
    "maxInterventionsCreated" INTEGER NOT NULL,
    "maxNotificationsAccepted" INTEGER NOT NULL,
    "maxStoredEvents" INTEGER NOT NULL,
    "maxExports" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "plans_tier_key" ON "plans"("tier");

-- CreateTable: pilot_applications
CREATE TABLE "pilot_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "whopBusinessUrl" TEXT,
    "email" TEXT NOT NULL,
    "approximatePayingMembers" INTEGER,
    "courses" TEXT,
    "typicalMembershipPrice" DOUBLE PRECISION,
    "monthlyNewMembers" INTEGER,
    "currentFollowUpProcess" TEXT,
    "primaryRetentionConcern" TEXT,
    "preferredPilotTiming" TEXT NOT NULL,
    "consentToContact" BOOLEAN NOT NULL,
    "reviewStatus" "PilotReviewStatus" NOT NULL DEFAULT 'New',
    "hp" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP WITH TIME ZONE,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "pilot_applications_reviewStatus_idx" ON "pilot_applications"("reviewStatus");
CREATE INDEX "pilot_applications_email_idx" ON "pilot_applications"("email");

-- CreateTable: internal_audit_logs
CREATE TABLE "internal_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "tenantScope" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "reason" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "internal_audit_logs_actorId_idx" ON "internal_audit_logs"("actorId");
CREATE INDEX "internal_audit_logs_objectType_objectId_idx" ON "internal_audit_logs"("objectType", "objectId");
CREATE INDEX "internal_audit_logs_tenantScope_idx" ON "internal_audit_logs"("tenantScope");

-- CreateTable: organization_members
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: whop_installations
CREATE TABLE "whop_installations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "whopCompanyId" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'pending',
    "requestedScopes" TEXT[] NOT NULL,
    "grantedScopes" TEXT[] NOT NULL,
    "installedById" TEXT,
    "installedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "whop_installations_whopCompanyId_key" ON "whop_installations"("whopCompanyId");
CREATE INDEX "whop_installations_organizationId_idx" ON "whop_installations"("organizationId");

ALTER TABLE "whop_installations" ADD CONSTRAINT "whop_installations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: integration_credentials
CREATE TABLE "integration_credentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationId" TEXT NOT NULL,
    "keyType" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "integration_credentials_installationId_idx" ON "integration_credentials"("installationId");

ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "whop_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: products
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "whopProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "products_whopProductId_key" ON "products"("whopProductId");
CREATE INDEX "products_organizationId_idx" ON "products"("organizationId");

ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: courses
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "externalCourseId" TEXT NOT NULL,
    "externalExperienceId" TEXT,
    "name" TEXT NOT NULL,
    "lessonCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "courses_organizationId_idx" ON "courses"("organizationId");

ALTER TABLE "courses" ADD CONSTRAINT "courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: students
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "whopUserId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "students_organizationId_whopUserId_key" ON "students"("organizationId", "whopUserId");
CREATE INDEX "students_organizationId_idx" ON "students"("organizationId");

ALTER TABLE "students" ADD CONSTRAINT "students_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: product_course_mappings
CREATE TABLE "product_course_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "activationDelayDays" INTEGER NOT NULL DEFAULT 7,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "product_course_mappings_productId_courseId_key" ON "product_course_mappings"("productId", "courseId");
CREATE INDEX "product_course_mappings_organizationId_idx" ON "product_course_mappings"("organizationId");

ALTER TABLE "product_course_mappings" ADD CONSTRAINT "product_course_mappings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_course_mappings" ADD CONSTRAINT "product_course_mappings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_course_mappings" ADD CONSTRAINT "product_course_mappings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: memberships
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "whopMembershipId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "renewalDate" TIMESTAMP WITH TIME ZONE,
    "cancelledAt" TIMESTAMP WITH TIME ZONE,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lastSyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "memberships_whopMembershipId_key" ON "memberships"("whopMembershipId");
CREATE INDEX "memberships_organizationId_idx" ON "memberships"("organizationId");
CREATE INDEX "memberships_studentId_idx" ON "memberships"("studentId");

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: enrollments
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'not_started',
    "enrolledAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "enrollments_studentId_courseId_key" ON "enrollments"("studentId", "courseId");
CREATE INDEX "enrollments_organizationId_idx" ON "enrollments"("organizationId");

ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: student_course_states
CREATE TABLE "student_course_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "firstActivityAt" TIMESTAMP WITH TIME ZONE,
    "lastActivityAt" TIMESTAMP WITH TIME ZONE,
    "lastSyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "student_course_states_studentId_courseId_key" ON "student_course_states"("studentId", "courseId");
CREATE INDEX "student_course_states_organizationId_idx" ON "student_course_states"("organizationId");

ALTER TABLE "student_course_states" ADD CONSTRAINT "student_course_states_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_course_states" ADD CONSTRAINT "student_course_states_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: progress_events
CREATE TABLE "progress_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "externalInteractionId" TEXT,
    "lessonId" TEXT,
    "lessonIndex" INTEGER NOT NULL,
    "lessonTitle" TEXT,
    "action" TEXT NOT NULL,
    "payloadHash" TEXT,
    "sourceTimestamp" TIMESTAMP WITH TIME ZONE,
    "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceVersion" TEXT,
    "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "webhookReceiptId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "progress_events_organizationId_studentId_externalInteractionId_key" ON "progress_events"("organizationId", "studentId", "externalInteractionId");
CREATE UNIQUE INDEX "progress_events_organizationId_payloadHash_key" ON "progress_events"("organizationId", "payloadHash");
CREATE INDEX "progress_events_organizationId_studentId_courseId_idx" ON "progress_events"("organizationId", "studentId", "courseId");
CREATE INDEX "progress_events_occurredAt_idx" ON "progress_events"("occurredAt");
CREATE INDEX "progress_events_sourceTimestamp_idx" ON "progress_events"("sourceTimestamp");

ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: membership_events
CREATE TABLE "membership_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "webhookReceiptId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "membership_events_organizationId_membershipId_idx" ON "membership_events"("organizationId", "membershipId");

ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: payment_events
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "whopPaymentId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "webhookReceiptId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "payment_events_whopPaymentId_key" ON "payment_events"("whopPaymentId");
CREATE INDEX "payment_events_organizationId_membershipId_idx" ON "payment_events"("organizationId", "membershipId");

ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: campaigns
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL DEFAULT 'activation_rescue',
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'active',
    "approvalMode" "ApprovalMode" NOT NULL DEFAULT 'manual',
    "maxMessagesPerStudent" INTEGER NOT NULL DEFAULT 2,
    "maxMessagesPerOrg" INTEGER NOT NULL DEFAULT 100,
    "cooldownDays" INTEGER NOT NULL DEFAULT 14,
    "quietHoursStart" TEXT NOT NULL DEFAULT '20:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "stopAfterResponse" BOOLEAN NOT NULL DEFAULT true,
    "stopAfterProgress" BOOLEAN NOT NULL DEFAULT true,
    "stopAfterMembershipEnd" BOOLEAN NOT NULL DEFAULT true,
    "messageTemplate" TEXT NOT NULL,
    "confirmedMappingId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_confirmedMappingId_fkey" FOREIGN KEY ("confirmedMappingId") REFERENCES "product_course_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: campaign_versions
CREATE TABLE "campaign_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "rulesJson" JSONB NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "campaign_versions_campaignId_versionNumber_key" ON "campaign_versions"("campaignId", "versionNumber");

ALTER TABLE "campaign_versions" ADD CONSTRAINT "campaign_versions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: campaign_rules
CREATE TABLE "campaign_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: eligibility_snapshots
CREATE TABLE "eligibility_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignVersionId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "state" "EligibilityState" NOT NULL DEFAULT 'pending_evaluation',
    "evidenceJson" JSONB NOT NULL,
    "detectedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eligibilityWindowStart" TIMESTAMP WITH TIME ZONE,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "eligibility_snapshots_idempotencyKey_key" ON "eligibility_snapshots"("idempotencyKey");
CREATE UNIQUE INDEX "eligibility_snapshots_studentId_campaignVersionId_eligibilityWindowStart_key" ON "eligibility_snapshots"("studentId", "campaignVersionId", "eligibilityWindowStart");
CREATE INDEX "eligibility_snapshots_organizationId_studentId_idx" ON "eligibility_snapshots"("organizationId", "studentId");
CREATE INDEX "eligibility_snapshots_campaignId_state_idx" ON "eligibility_snapshots"("campaignId", "state");

-- CreateTable: webhook_receipts
CREATE TABLE "webhook_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "whopEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'received',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP WITH TIME ZONE,
    "payloadJson" JSONB NOT NULL
);

CREATE UNIQUE INDEX "webhook_receipts_whopEventId_key" ON "webhook_receipts"("whopEventId");
CREATE INDEX "webhook_receipts_organizationId_status_idx" ON "webhook_receipts"("organizationId", "status");

ALTER TABLE "webhook_receipts" ADD CONSTRAINT "webhook_receipts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: interventions
CREATE TABLE "interventions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "approvedAt" TIMESTAMP WITH TIME ZONE,
    "scheduledFor" TIMESTAMP WITH TIME ZONE,
    "sentAt" TIMESTAMP WITH TIME ZONE,
    "respondedAt" TIMESTAMP WITH TIME ZONE,
    "recoveredAt" TIMESTAMP WITH TIME ZONE,
    "cooldownUntil" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "interventions_idempotencyKey_key" ON "interventions"("idempotencyKey");
CREATE INDEX "interventions_organizationId_state_idx" ON "interventions"("organizationId", "state");
CREATE INDEX "interventions_studentId_idx" ON "interventions"("studentId");

ALTER TABLE "interventions" ADD CONSTRAINT "interventions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_campaignVersionId_fkey" FOREIGN KEY ("campaignVersionId") REFERENCES "campaign_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_eligibilitySnapshotId_fkey" FOREIGN KEY ("eligibilitySnapshotId") REFERENCES "eligibility_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: delivery_attempts
CREATE TABLE "delivery_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interventionId" TEXT NOT NULL,
    "state" "DeliveryState" NOT NULL DEFAULT 'queued',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "apiAcceptedAt" TIMESTAMP WITH TIME ZONE,
    "deliveredAt" TIMESTAMP WITH TIME ZONE,
    "failedAt" TIMESTAMP WITH TIME ZONE,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "delivery_attempts_idempotencyKey_key" ON "delivery_attempts"("idempotencyKey");
CREATE INDEX "delivery_attempts_interventionId_idx" ON "delivery_attempts"("interventionId");
CREATE INDEX "delivery_attempts_state_idx" ON "delivery_attempts"("state");

ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: student_responses
CREATE TABLE "student_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interventionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "responseType" "ResponseType" NOT NULL,
    "blockerType" "BlockerType",
    "note" TEXT,
    "accessTokenId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "student_responses_interventionId_idx" ON "student_responses"("interventionId");
CREATE INDEX "student_responses_studentId_idx" ON "student_responses"("studentId");

ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: student_access_tokens
CREATE TABLE "student_access_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "revokedAt" TIMESTAMP WITH TIME ZONE,
    "lastUsedAt" TIMESTAMP WITH TIME ZONE,
    "consumedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "student_access_tokens_tokenHash_key" ON "student_access_tokens"("tokenHash");
CREATE INDEX "student_access_tokens_organizationId_studentId_idx" ON "student_access_tokens"("organizationId", "studentId");
CREATE INDEX "student_access_tokens_interventionId_idx" ON "student_access_tokens"("interventionId");

-- CreateTable: blocker_responses
CREATE TABLE "blocker_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "blocker" "BlockerType" NOT NULL,
    "note" TEXT,
    "interventionId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "blocker_responses_organizationId_studentId_idx" ON "blocker_responses"("organizationId", "studentId");

ALTER TABLE "blocker_responses" ADD CONSTRAINT "blocker_responses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: reminder_requests
CREATE TABLE "reminder_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interventionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reminderTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "reminder_requests_interventionId_idx" ON "reminder_requests"("interventionId");

-- CreateTable: suppressions
CREATE TABLE "suppressions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'organization',
    "reason" TEXT NOT NULL DEFAULT 'student_opt_out',
    "interventionId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "suppressions_organizationId_studentId_scope_key" ON "suppressions"("organizationId", "studentId", "scope");
CREATE INDEX "suppressions_organizationId_idx" ON "suppressions"("organizationId");

ALTER TABLE "suppressions" ADD CONSTRAINT "suppressions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "suppressions" ADD CONSTRAINT "suppressions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "audit_logs_organizationId_objectType_objectId_idx" ON "audit_logs"("organizationId", "objectType", "objectId");
CREATE INDEX "audit_logs_interventionId_idx" ON "audit_logs"("interventionId");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: value_events
CREATE TABLE "value_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "value_events_paymentEventId_key" ON "value_events"("paymentEventId");
CREATE INDEX "value_events_organizationId_attributionLevel_idx" ON "value_events"("organizationId", "attributionLevel");
CREATE INDEX "value_events_interventionId_idx" ON "value_events"("interventionId");

ALTER TABLE "value_events" ADD CONSTRAINT "value_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "value_events" ADD CONSTRAINT "value_events_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: attribution_evidence
CREATE TABLE "attribution_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valueEventId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "attribution_evidence_valueEventId_idx" ON "attribution_evidence"("valueEventId");

ALTER TABLE "attribution_evidence" ADD CONSTRAINT "attribution_evidence_valueEventId_fkey" FOREIGN KEY ("valueEventId") REFERENCES "value_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: data_deletion_requests
CREATE TABLE "data_deletion_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" "DataDeletionStatus" NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "verifiedAt" TIMESTAMP WITH TIME ZONE,
    "scheduledAt" TIMESTAMP WITH TIME ZONE,
    "processedAt" TIMESTAMP WITH TIME ZONE,
    "requestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX "data_deletion_requests_organizationId_idx" ON "data_deletion_requests"("organizationId");
CREATE INDEX "data_deletion_requests_status_idx" ON "data_deletion_requests"("status");

ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: data_export_requests
CREATE TABLE "data_export_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" "DataExportStatus" NOT NULL DEFAULT 'Requested',
    "downloadToken" TEXT NOT NULL,
    "downloadExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX "data_export_requests_downloadToken_key" ON "data_export_requests"("downloadToken");
CREATE INDEX "data_export_requests_organizationId_idx" ON "data_export_requests"("organizationId");
CREATE INDEX "data_export_requests_downloadToken_idx" ON "data_export_requests"("downloadToken");
CREATE INDEX "data_export_requests_status_idx" ON "data_export_requests"("status");

ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: outbox_events
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "state" "OutboxState" NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "dispatchedAt" TIMESTAMP WITH TIME ZONE,
    "nextAttemptAt" TIMESTAMP WITH TIME ZONE,
    "externalEventId" TEXT,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP WITH TIME ZONE,
    "leaseExpiresAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");
CREATE INDEX "outbox_events_organizationId_state_idx" ON "outbox_events"("organizationId", "state");
CREATE INDEX "outbox_events_state_nextAttemptAt_idx" ON "outbox_events"("state", "nextAttemptAt");
CREATE INDEX "outbox_events_state_claimedBy_leaseExpiresAt_idx" ON "outbox_events"("state", "claimedBy", "leaseExpiresAt");

-- CreateTable: job_executions
CREATE TABLE "job_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "outboxEventId" TEXT,
    "jobType" TEXT NOT NULL,
    "runId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP WITH TIME ZONE,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "errorMessage" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "job_executions_organizationId_status_idx" ON "job_executions"("organizationId", "status");
CREATE INDEX "job_executions_jobType_status_idx" ON "job_executions"("jobType", "status");

-- CreateTable: dead_letter_events
CREATE TABLE "dead_letter_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "outboxEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "deadLetteredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "dead_letter_events_organizationId_idx" ON "dead_letter_events"("organizationId");

-- CreateTable: subscription_entitlements
CREATE TABLE "subscription_entitlements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'pilot',
    "billingPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
    "billingPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "subscription_entitlements_organizationId_idx" ON "subscription_entitlements"("organizationId");

-- CreateTable: usage_counters
CREATE TABLE "usage_counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "usage_counters_organizationId_metric_period_key" ON "usage_counters"("organizationId", "metric", "period");
CREATE INDEX "usage_counters_organizationId_period_idx" ON "usage_counters"("organizationId", "period");

-- CreateTable: usage_events
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "increment" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT,
    "metadataJson" JSONB,
    "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "usage_events_idempotencyKey_key" ON "usage_events"("idempotencyKey");
CREATE INDEX "usage_events_organizationId_metric_occurredAt_idx" ON "usage_events"("organizationId", "metric", "occurredAt");

-- CreateTable: usage_reservations
CREATE TABLE "usage_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'reserved',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "usage_reservations_idempotencyKey_key" ON "usage_reservations"("idempotencyKey");
CREATE INDEX "usage_reservations_organizationId_metric_period_idx" ON "usage_reservations"("organizationId", "metric", "period");
CREATE INDEX "usage_reservations_status_idx" ON "usage_reservations"("status");

-- CreateTable: plan_overrides
CREATE TABLE "plan_overrides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "overrideLimit" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "plan_overrides_organizationId_metric_idx" ON "plan_overrides"("organizationId", "metric");
CREATE INDEX "plan_overrides_expiresAt_idx" ON "plan_overrides"("expiresAt");

-- CreateTable: sync_executions
CREATE TABLE "sync_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'whop',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "trigger" "SyncTrigger" NOT NULL DEFAULT 'manual',
    "requestedBy" TEXT,
    "state" "SyncExecutionState" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "errorSummary" TEXT,
    "jobId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "sync_executions_organizationId_state_idx" ON "sync_executions"("organizationId", "state");
CREATE INDEX "sync_executions_provider_state_idx" ON "sync_executions"("provider", "state");

ALTER TABLE "sync_executions" ADD CONSTRAINT "sync_executions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: sync_stages
CREATE TABLE "sync_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "syncExecutionId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "state" "SyncStageState" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsRead" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "sync_stages_syncExecutionId_idx" ON "sync_stages"("syncExecutionId");
CREATE INDEX "sync_stages_resourceType_state_idx" ON "sync_stages"("resourceType", "state");

ALTER TABLE "sync_stages" ADD CONSTRAINT "sync_stages_syncExecutionId_fkey" FOREIGN KEY ("syncExecutionId") REFERENCES "sync_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: sync_checkpoints
CREATE TABLE "sync_checkpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "syncExecutionId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "cursor" TEXT,
    "sourceWatermark" TEXT,
    "lastCompletedPage" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "sync_checkpoints_organizationId_resource_key" ON "sync_checkpoints"("organizationId", "resource");
CREATE INDEX "sync_checkpoints_organizationId_resource_idx" ON "sync_checkpoints"("organizationId", "resource");

ALTER TABLE "sync_checkpoints" ADD CONSTRAINT "sync_checkpoints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sync_checkpoints" ADD CONSTRAINT "sync_checkpoints_syncExecutionId_fkey" FOREIGN KEY ("syncExecutionId") REFERENCES "sync_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: reconciliation_runs
CREATE TABLE "reconciliation_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "syncExecutionId" TEXT,
    "matched" INTEGER NOT NULL DEFAULT 0,
    "membershipWithoutCourseActivity" INTEGER NOT NULL DEFAULT 0,
    "courseActivityWithoutMembership" INTEGER NOT NULL DEFAULT 0,
    "unmappedProduct" INTEGER NOT NULL DEFAULT 0,
    "missingSourceFields" INTEGER NOT NULL DEFAULT 0,
    "staleSourceRecord" INTEGER NOT NULL DEFAULT 0,
    "totalEvaluated" INTEGER NOT NULL DEFAULT 0,
    "state" "ReconciliationState" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "reconciliation_runs_organizationId_courseId_idx" ON "reconciliation_runs"("organizationId", "courseId");
CREATE INDEX "reconciliation_runs_state_idx" ON "reconciliation_runs"("state");

ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_syncExecutionId_fkey" FOREIGN KEY ("syncExecutionId") REFERENCES "sync_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: reconciliation_outcomes
CREATE TABLE "reconciliation_outcomes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconciliationRunId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "membershipId" TEXT,
    "courseId" TEXT NOT NULL,
    "mappingId" TEXT,
    "classification" "ReconciliationOutcomeClassification" NOT NULL,
    "resolutionState" "ReconciliationResolutionState" NOT NULL DEFAULT 'pending',
    "evidenceJson" JSONB,
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "reconciliation_outcomes_reconciliationRunId_idx" ON "reconciliation_outcomes"("reconciliationRunId");
CREATE INDEX "reconciliation_outcomes_organizationId_classification_idx" ON "reconciliation_outcomes"("organizationId", "classification");
CREATE INDEX "reconciliation_outcomes_studentId_idx" ON "reconciliation_outcomes"("studentId");

ALTER TABLE "reconciliation_outcomes" ADD CONSTRAINT "reconciliation_outcomes_reconciliationRunId_fkey" FOREIGN KEY ("reconciliationRunId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
