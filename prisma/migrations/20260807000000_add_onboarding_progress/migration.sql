-- CreateTable: onboarding_progress
CREATE TABLE "onboarding_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL,
    "stepsJson" TEXT NOT NULL,
    "syncProgressJson" TEXT,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "onboarding_progress_organizationId_companyId_key" ON "onboarding_progress"("organizationId", "companyId");

-- AddForeignKey: onboarding_progress.organizationId → organizations.id (CASCADE)
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
