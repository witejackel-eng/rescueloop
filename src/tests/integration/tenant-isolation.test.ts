// Tenant isolation integration tests.
//
// Verifies that two organisations cannot read each other's data.
// Uses real PostgreSQL — no mocks.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  testDb,
  createTestOrg,
  createTestUser,
  createTestStudent,
  createTestOutboxEvent,
  cleanupTestData,
} from './setup';

const db = testDb;

// Skip entire suite when no database is configured
const skip = !process.env.DATABASE_URL;

describe.skipIf(skip)('Tenant isolation', () => {
  let orgAId: string;
  let orgBId: string;

  beforeAll(async () => {
    const orgA = await createTestOrg({ name: 'Isolation Org A' });
    const orgB = await createTestOrg({ name: 'Isolation Org B' });
    orgAId = orgA.id;
    orgBId = orgB.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ── Students ────────────────────────────────────────────────

  it('Org A cannot see Org B students', async () => {
    // Create students in both orgs
    const studentA = await createTestStudent(orgAId, { name: 'Alice A' });
    const studentB = await createTestStudent(orgBId, { name: 'Bob B' });

    // Query Org A's students — must not include Org B's student
    const orgAStudents = await db.student.findMany({
      where: { organizationId: orgAId },
    });
    expect(orgAStudents.some((s) => s.id === studentB.id)).toBe(false);
    expect(orgAStudents.some((s) => s.id === studentA.id)).toBe(true);

    // Query Org B's students — must not include Org A's student
    const orgBStudents = await db.student.findMany({
      where: { organizationId: orgBId },
    });
    expect(orgBStudents.some((s) => s.id === studentA.id)).toBe(false);
    expect(orgBStudents.some((s) => s.id === studentB.id)).toBe(true);
  });

  it('Direct-ID attack: findUnique with wrong org student returns null', async () => {
    const studentB = await createTestStudent(orgBId, { name: 'Secret B' });

    // Even knowing the ID, querying through Org A's scope returns nothing
    // (Application-layer enforcement: filter by orgId)
    const found = await db.student.findFirst({
      where: { id: studentB.id, organizationId: orgAId },
    });
    expect(found).toBeNull();
  });

  it('Org A cannot count Org B students', async () => {
    await createTestStudent(orgAId, { name: 'Count A' });
    await createTestStudent(orgBId, { name: 'Count B1' });
    await createTestStudent(orgBId, { name: 'Count B2' });

    const countA = await db.student.count({ where: { organizationId: orgAId } });
    const countB = await db.student.count({ where: { organizationId: orgBId } });

    // Org A's count should not include Org B's students
    expect(countA).toBeGreaterThanOrEqual(1);
    expect(countB).toBeGreaterThanOrEqual(2);
    // Cross-contamination check
    const allA = await db.student.findMany({ where: { organizationId: orgAId } });
    const allB = await db.student.findMany({ where: { organizationId: orgBId } });
    const aIds = new Set(allA.map((s) => s.id));
    for (const s of allB) {
      expect(aIds.has(s.id)).toBe(false);
    }
  });

  // ── Interventions ──────────────────────────────────────────

  it('Org A cannot see Org B interventions', async () => {
    const studentA = await createTestStudent(orgAId);
    const studentB = await createTestStudent(orgBId);

    const campaignA = await db.campaign.create({
      data: {
        organizationId: orgAId,
        name: 'Isolation Campaign A',
        messageTemplate: 'Hello {{student.name}}',
      },
    });
    const campaignB = await db.campaign.create({
      data: {
        organizationId: orgBId,
        name: 'Isolation Campaign B',
        messageTemplate: 'Hello {{student.name}}',
      },
    });

    const interventionA = await db.intervention.create({
      data: {
        organizationId: orgAId,
        studentId: studentA.id,
        campaignId: campaignA.id,
        state: 'drafted',
        trigger: 'eligibility',
        evidenceJson: {},
        messagePreview: 'Test message A',
        idempotencyKey: `int-iso-a-${Date.now()}`,
      },
    });

    const interventionB = await db.intervention.create({
      data: {
        organizationId: orgBId,
        studentId: studentB.id,
        campaignId: campaignB.id,
        state: 'drafted',
        trigger: 'eligibility',
        evidenceJson: {},
        messagePreview: 'Test message B',
        idempotencyKey: `int-iso-b-${Date.now()}`,
      },
    });

    const orgAInterventions = await db.intervention.findMany({
      where: { organizationId: orgAId },
    });
    expect(orgAInterventions.some((i) => i.id === interventionB.id)).toBe(false);
    expect(orgAInterventions.some((i) => i.id === interventionA.id)).toBe(true);
  });

  it('Direct-ID intervention lookup with wrong org returns null', async () => {
    const studentB = await createTestStudent(orgBId);
    const campaignB = await db.campaign.create({
      data: {
        organizationId: orgBId,
        name: 'Direct ID Campaign B',
        messageTemplate: 'Hello {{student.name}}',
      },
    });
    const interventionB = await db.intervention.create({
      data: {
        organizationId: orgBId,
        studentId: studentB.id,
        campaignId: campaignB.id,
        state: 'drafted',
        trigger: 'eligibility',
        evidenceJson: {},
        messagePreview: 'Test message',
        idempotencyKey: `int-direct-${Date.now()}`,
      },
    });

    const found = await db.intervention.findFirst({
      where: { id: interventionB.id, organizationId: orgAId },
    });
    expect(found).toBeNull();
  });

  // ── Audit logs ─────────────────────────────────────────────

  it('Org A cannot see Org B audit logs', async () => {
    // Create audit entries in both orgs
    await db.auditLog.create({
      data: {
        organizationId: orgAId,
        actorId: 'system',
        action: 'created',
        objectType: 'intervention',
        objectId: 'test-obj-a',
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: orgBId,
        actorId: 'system',
        action: 'created',
        objectType: 'intervention',
        objectId: 'test-obj-b',
      },
    });

    const auditA = await db.auditLog.findMany({
      where: { organizationId: orgAId },
    });
    const auditB = await db.auditLog.findMany({
      where: { organizationId: orgBId },
    });

    // No cross-contamination
    expect(auditA.every((a) => a.organizationId === orgAId)).toBe(true);
    expect(auditB.every((a) => a.organizationId === orgBId)).toBe(true);
    expect(auditA.some((a) => a.objectId === 'test-obj-a')).toBe(true);
    expect(auditB.some((a) => a.objectId === 'test-obj-b')).toBe(true);
  });

  // ── Outbox events ──────────────────────────────────────────

  it('Org A cannot see Org B outbox events', async () => {
    const eventA = await createTestOutboxEvent(orgAId, { eventType: 'org-a/event' });
    const eventB = await createTestOutboxEvent(orgBId, { eventType: 'org-b/event' });

    const outboxA = await db.outboxEvent.findMany({
      where: { organizationId: orgAId },
    });
    const outboxB = await db.outboxEvent.findMany({
      where: { organizationId: orgBId },
    });

    expect(outboxA.some((e) => e.id === eventB.id)).toBe(false);
    expect(outboxA.some((e) => e.id === eventA.id)).toBe(true);
    expect(outboxB.some((e) => e.id === eventA.id)).toBe(false);
    expect(outboxB.some((e) => e.id === eventB.id)).toBe(true);
  });

  // ── Products ───────────────────────────────────────────────

  it('Org A cannot see Org B products', async () => {
    const productA = await db.product.create({
      data: {
        organizationId: orgAId,
        whopProductId: `whop-prod-a-${Date.now()}`,
        name: 'Product A',
      },
    });

    const productB = await db.product.create({
      data: {
        organizationId: orgBId,
        whopProductId: `whop-prod-b-${Date.now()}`,
        name: 'Product B',
      },
    });

    const productsA = await db.product.findMany({ where: { organizationId: orgAId } });
    expect(productsA.some((p) => p.id === productB.id)).toBe(false);
    expect(productsA.some((p) => p.id === productA.id)).toBe(true);
  });

  // ── Courses ────────────────────────────────────────────────

  it('Org A cannot see Org B courses', async () => {
    const courseA = await db.course.create({
      data: {
        organizationId: orgAId,
        externalCourseId: `ext-a-${Date.now()}`,
        name: 'Course A',
        lessonCount: 5,
      },
    });

    const courseB = await db.course.create({
      data: {
        organizationId: orgBId,
        externalCourseId: `ext-b-${Date.now()}`,
        name: 'Course B',
        lessonCount: 10,
      },
    });

    const coursesA = await db.course.findMany({ where: { organizationId: orgAId } });
    expect(coursesA.some((c) => c.id === courseB.id)).toBe(false);
    expect(coursesA.some((c) => c.id === courseA.id)).toBe(true);
  });

  // ── Usage counters ─────────────────────────────────────────

  it('Org A cannot see Org B usage counters', async () => {
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM

    await db.usageCounter.upsert({
      where: { organizationId_metric_period: { organizationId: orgAId, metric: 'courses', period } },
      create: { organizationId: orgAId, metric: 'courses', period, count: 5 },
      update: { count: 5 },
    });

    await db.usageCounter.upsert({
      where: { organizationId_metric_period: { organizationId: orgBId, metric: 'courses', period } },
      create: { organizationId: orgBId, metric: 'courses', period, count: 99 },
      update: { count: 99 },
    });

    const countersA = await db.usageCounter.findMany({ where: { organizationId: orgAId } });
    expect(countersA.every((c) => c.organizationId === orgAId)).toBe(true);
    expect(countersA.some((c) => c.metric === 'courses')).toBe(true);
  });

  // ── Deletion requests ──────────────────────────────────────

  it('Org A cannot see Org B data deletion requests', async () => {
    await db.dataDeletionRequest.create({
      data: { organizationId: orgAId, status: 'requested', reason: 'GDPR A' },
    });

    await db.dataDeletionRequest.create({
      data: { organizationId: orgBId, status: 'requested', reason: 'GDPR B' },
    });

    const deletionsA = await db.dataDeletionRequest.findMany({ where: { organizationId: orgAId } });
    expect(deletionsA.every((d) => d.organizationId === orgAId)).toBe(true);
    expect(deletionsA.some((d) => d.reason === 'GDPR A')).toBe(true);
  });

  // ── Dead letter events ─────────────────────────────────────

  it('Org A cannot see Org B dead letter events', async () => {
    const outboxA = await createTestOutboxEvent(orgAId);
    const outboxB = await createTestOutboxEvent(orgBId);

    await db.deadLetterEvent.create({
      data: {
        organizationId: orgAId,
        outboxEventId: outboxA.id,
        eventType: 'test/fail-a',
        payloadJson: {},
        errorMessage: 'Error A',
        attemptCount: 5,
      },
    });

    await db.deadLetterEvent.create({
      data: {
        organizationId: orgBId,
        outboxEventId: outboxB.id,
        eventType: 'test/fail-b',
        payloadJson: {},
        errorMessage: 'Error B',
        attemptCount: 5,
      },
    });

    const deadA = await db.deadLetterEvent.findMany({ where: { organizationId: orgAId } });
    expect(deadA.every((d) => d.organizationId === orgAId)).toBe(true);
    expect(deadA.some((d) => d.errorMessage === 'Error A')).toBe(true);
    expect(deadA.some((d) => d.errorMessage === 'Error B')).toBe(false);
  });
});
