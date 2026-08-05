// Integration test setup — real PostgreSQL database.
//
// This file runs before every test file. It:
// 1. Verifies DATABASE_URL is set (skip gracefully if not)
// 2. Provides a shared PrismaClient for tests
// 3. Cleans all tenant-scoped test data after each test

import { PrismaClient } from '@prisma/client';

// Skip integration tests when no database is configured
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn(
    '⚠ DATABASE_URL not set — integration tests will be skipped. ' +
    'Set DATABASE_URL to a test PostgreSQL database to run them.'
  );
}

// Singleton Prisma client for integration tests (separate from the app's
// singleton so we can control logging independently)
export const testDb = new PrismaClient({
  log: process.env.INTEGRATION_LOG === '1' ? ['query', 'error', 'warn'] : ['error'],
});

// ─── Helpers for creating test fixtures ──────────────────────────

let orgCounter = 0;
const orgIds: string[] = [];
const userIds: string[] = [];

/**
 * Create a test organisation with a unique slug.
 * Returns the organisation ID. Tracked for cleanup.
 */
export async function createTestOrg(overrides?: { name?: string; planTier?: string }) {
  orgCounter++;
  const slug = `test-org-${Date.now()}-${orgCounter}-${Math.random().toString(36).slice(2, 6)}`;
  const org = await testDb.organization.create({
    data: {
      name: overrides?.name ?? `Test Org ${orgCounter}`,
      slug,
      planTier: overrides?.planTier ?? 'pilot',
      status: 'active',
    },
  });
  orgIds.push(org.id);
  return org;
}

/**
 * Create a test user. Tracked for cleanup.
 */
export async function createTestUser(overrides?: { email?: string; name?: string; whopUserId?: string }) {
  const idx = userIds.length + 1;
  const user = await testDb.user.create({
    data: {
      email: overrides?.email ?? `test-user-${Date.now()}-${idx}@test.rescueloop`,
      name: overrides?.name ?? `Test User ${idx}`,
      whopUserId: overrides?.whopUserId ?? `whop-user-test-${Date.now()}-${idx}`,
    },
  });
  userIds.push(user.id);
  return user;
}

/**
 * Add a member to an organisation.
 */
export async function addOrgMember(orgId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'owner') {
  return testDb.organizationMember.create({
    data: { organizationId: orgId, userId, role },
  });
}

/**
 * Create a test student in an organisation.
 */
export async function createTestStudent(orgId: string, overrides?: { email?: string; name?: string; whopUserId?: string }) {
  const idx = Math.random().toString(36).slice(2, 8);
  return testDb.student.create({
    data: {
      organizationId: orgId,
      whopUserId: overrides?.whopUserId ?? `whop-stu-${idx}`,
      email: overrides?.email ?? `student-${idx}@test.rescueloop`,
      name: overrides?.name ?? `Student ${idx}`,
    },
  });
}

/**
 * Create a product in an organisation.
 */
export async function createTestProduct(orgId: string, name?: string) {
  const idx = Math.random().toString(36).slice(2, 8);
  return testDb.product.create({
    data: {
      organizationId: orgId,
      whopProductId: `whop-prod-${idx}`,
      name: name ?? `Test Product ${idx}`,
    },
  });
}

/**
 * Create a course in an organisation.
 */
export async function createTestCourse(orgId: string, name?: string) {
  const idx = Math.random().toString(36).slice(2, 8);
  return testDb.course.create({
    data: {
      organizationId: orgId,
      externalCourseId: `ext-course-${idx}`,
      name: name ?? `Test Course ${idx}`,
      lessonCount: 10,
    },
  });
}

/**
 * Create a pending outbox event.
 */
export async function createTestOutboxEvent(orgId: string, overrides?: { eventType?: string; idempotencyKey?: string; maxAttempts?: number }) {
  const idx = Math.random().toString(36).slice(2, 8);
  return testDb.outboxEvent.create({
    data: {
      organizationId: orgId,
      eventType: overrides?.eventType ?? 'test/event',
      payloadJson: { test: true },
      idempotencyKey: overrides?.idempotencyKey ?? `idem-${idx}`,
      maxAttempts: overrides?.maxAttempts ?? 5,
      state: 'pending',
    },
  });
}

// ─── Cleanup ───────────────────────────────────────────────────

/**
 * Delete all test data in reverse dependency order.
 * Called after each test suite (afterAll) and also available manually.
 */
export async function cleanupTestData() {
  // Delete outbox events for test orgs
  if (orgIds.length > 0) {
    await testDb.deadLetterEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.outboxEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.usageReservation.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.usageEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.usageCounter.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.planOverride.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.subscriptionEntitlement.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.auditLog.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.syncCheckpoint.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.syncStage.deleteMany({
      where: { syncExecution: { organizationId: { in: orgIds } } },
    });
    await testDb.syncExecution.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.dataDeletionRequest.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.dataExportRequest.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.intervention.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.studentAccessToken.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.studentResponse.deleteMany({
      where: { intervention: { organizationId: { in: orgIds } } },
    });
    await testDb.blockerResponse.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.suppression.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.valueEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.campaign.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.studentCourseState.deleteMany({ where: { student: { organizationId: { in: orgIds } } } });
    await testDb.enrollment.deleteMany({ where: { student: { organizationId: { in: orgIds } } } });
    await testDb.progressEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.membership.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.student.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.productCourseMapping.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.course.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.product.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.integrationCredential.deleteMany({
      where: { installation: { organizationId: { in: orgIds } } },
    });
    await testDb.whopInstallation.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.organizationMember.deleteMany({ where: { organizationId: { in: orgIds } } });
    await testDb.organization.deleteMany({ where: { id: { in: orgIds } } });
  }

  // Clean up test users
  if (userIds.length > 0) {
    await testDb.user.deleteMany({ where: { id: { in: userIds } } });
  }

  orgIds.length = 0;
  userIds.length = 0;
}

// ─── Vitest hooks ─────────────────────────────────────────────

// afterAll: disconnect Prisma
afterAll(async () => {
  await cleanupTestData();
  await testDb.$disconnect();
}, 30000);
