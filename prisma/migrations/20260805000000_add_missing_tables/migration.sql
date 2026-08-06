-- AddMissingTables
-- Migration covering all models added after the initial migration.
-- Tables: data_export_requests, usage_reservations, plan_overrides,
--         pilot_applications, internal_audit_logs, sync_executions,
--         sync_stages, sync_checkpoints, reconciliation_outcomes,
--         reconciliation_runs

-- ─── New Enums ──────────────────────────────────────────────

CREATE TYPE "DataExportStatus" AS ENUM ('Requested', 'Processing', 'Completed', 'Failed', 'Expired');

CREATE TYPE "PilotReviewStatus" AS ENUM ('New', 'Reviewing', 'Qualified', 'Contacted', 'Accepted', 'Rejected', 'Withdrawn');

CREATE TYPE "ReconciliationOutcomeClassification" AS ENUM ('matched', 'membership_without_course_activity', 'course_activity_without_membership', 'unmapped_product', 'missing_source_fields', 'stale_source_record');

CREATE TYPE "ReconciliationResolutionState" AS ENUM ('pending', 'resolved', 'ignored', 'escalated');

CREATE TYPE "ReconciliationState" AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TYPE "ReservationStatus" AS ENUM ('reserved', 'committed', 'released');

CREATE TYPE "SyncExecutionState" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

CREATE TYPE "SyncStageState" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

CREATE TYPE "SyncTrigger" AS ENUM ('manual', 'scheduled', 'webhook', 'resumption');

-- ─── data_export_requests ───────────────────────────────────

CREATE TABLE "data_export_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" "DataExportStatus" NOT NULL DEFAULT 'Requested',
    "downloadToken" TEXT NOT NULL,
    "downloadExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_export_requests_organizationId_idx" ON "data_export_requests"("organizationId");
CREATE UNIQUE INDEX "data_export_requests_downloadToken_key" ON "data_export_requests"("downloadToken");
CREATE INDEX "data_export_requests_status_idx" ON "data_export_requests"("status");

ALTER TABLE "data_export_requests"
    ADD CONSTRAINT "data_export_requests_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── usage_reservations ─────────────────────────────────────

CREATE TABLE "usage_reservations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'reserved',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "usage_reservations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "usage_reservations_organizationId_metric_period_idx" ON "usage_reservations"("organizationId", "metric", "period");
CREATE UNIQUE INDEX "usage_reservations_idempotencyKey_key" ON "usage_reservations"("idempotencyKey");
CREATE INDEX "usage_reservations_status_idx" ON "usage_reservations"("status");

-- ─── plan_overrides ─────────────────────────────────────────

CREATE TABLE "plan_overrides" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "overrideLimit" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "plan_overrides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_overrides_organizationId_metric_idx" ON "plan_overrides"("organizationId", "metric");
CREATE INDEX "plan_overrides_expiresAt_idx" ON "plan_overrides"("expiresAt");

-- ─── pilot_applications ─────────────────────────────────────

CREATE TABLE "pilot_applications" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "pilot_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pilot_applications_reviewStatus_idx" ON "pilot_applications"("reviewStatus");
CREATE INDEX "pilot_applications_email_idx" ON "pilot_applications"("email");

-- ─── internal_audit_logs ────────────────────────────────────

CREATE TABLE "internal_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "tenantScope" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "reason" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "internal_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "internal_audit_logs_actorId_idx" ON "internal_audit_logs"("actorId");
CREATE INDEX "internal_audit_logs_objectType_objectId_idx" ON "internal_audit_logs"("objectType", "objectId");
CREATE INDEX "internal_audit_logs_tenantScope_idx" ON "internal_audit_logs"("tenantScope");

-- ─── sync_executions ────────────────────────────────────────

CREATE TABLE "sync_executions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'whop',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "trigger" "SyncTrigger" NOT NULL DEFAULT 'manual',
    "requestedBy" TEXT,
    "state" "SyncExecutionState" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "errorSummary" TEXT,
    "jobId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "sync_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sync_executions_organizationId_state_idx" ON "sync_executions"("organizationId", "state");
CREATE INDEX "sync_executions_provider_state_idx" ON "sync_executions"("provider", "state");

ALTER TABLE "sync_executions"
    ADD CONSTRAINT "sync_executions_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── sync_stages ────────────────────────────────────────────

CREATE TABLE "sync_stages" (
    "id" TEXT NOT NULL,
    "syncExecutionId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "state" "SyncStageState" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsRead" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "sync_stages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sync_stages_syncExecutionId_idx" ON "sync_stages"("syncExecutionId");
CREATE INDEX "sync_stages_resourceType_state_idx" ON "sync_stages"("resourceType", "state");

ALTER TABLE "sync_stages"
    ADD CONSTRAINT "sync_stages_syncExecutionId_fkey"
    FOREIGN KEY ("syncExecutionId") REFERENCES "sync_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── sync_checkpoints ───────────────────────────────────────

CREATE TABLE "sync_checkpoints" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "syncExecutionId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "cursor" TEXT,
    "sourceWatermark" TEXT,
    "lastCompletedPage" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "sync_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sync_checkpoints_organizationId_resource_key" ON "sync_checkpoints"("organizationId", "resource");
CREATE INDEX "sync_checkpoints_organizationId_resource_idx" ON "sync_checkpoints"("organizationId", "resource");

ALTER TABLE "sync_checkpoints"
    ADD CONSTRAINT "sync_checkpoints_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sync_checkpoints"
    ADD CONSTRAINT "sync_checkpoints_syncExecutionId_fkey"
    FOREIGN KEY ("syncExecutionId") REFERENCES "sync_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── reconciliation_runs ────────────────────────────────────

CREATE TABLE "reconciliation_runs" (
    "id" TEXT NOT NULL,
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
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reconciliation_runs_organizationId_courseId_idx" ON "reconciliation_runs"("organizationId", "courseId");
CREATE INDEX "reconciliation_runs_state_idx" ON "reconciliation_runs"("state");

ALTER TABLE "reconciliation_runs"
    ADD CONSTRAINT "reconciliation_runs_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reconciliation_runs"
    ADD CONSTRAINT "reconciliation_runs_syncExecutionId_fkey"
    FOREIGN KEY ("syncExecutionId") REFERENCES "sync_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── reconciliation_outcomes ────────────────────────────────

CREATE TABLE "reconciliation_outcomes" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "reconciliation_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reconciliation_outcomes_reconciliationRunId_idx" ON "reconciliation_outcomes"("reconciliationRunId");
CREATE INDEX "reconciliation_outcomes_organizationId_classification_idx" ON "reconciliation_outcomes"("organizationId", "classification");
CREATE INDEX "reconciliation_outcomes_studentId_idx" ON "reconciliation_outcomes"("studentId");

ALTER TABLE "reconciliation_outcomes"
    ADD CONSTRAINT "reconciliation_outcomes_reconciliationRunId_fkey"
    FOREIGN KEY ("reconciliationRunId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
