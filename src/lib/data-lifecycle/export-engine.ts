// Data export engine — assembles all tenant data for a complete export.
//
// Exports include:
//   Organisation profile, Members, Courses, Products, Mappings,
//   Campaigns, Interventions, Responses, Suppressions,
//   Value events, Audit events, Usage data
//
// The export is assembled in-memory then handed to the job for storage.
// Download is via a time-limited opaque token — storage paths are never
// exposed to the caller.

import "server-only";
import { db } from "@/lib/db";

export interface ExportPayload {
  exportedAt: string;
  organizationId: string;
  organization: Record<string, unknown>;
  members: Record<string, unknown>[];
  products: Record<string, unknown>[];
  courses: Record<string, unknown>[];
  mappings: Record<string, unknown>[];
  campaigns: Record<string, unknown>[];
  interventions: Record<string, unknown>[];
  responses: Record<string, unknown>[];
  suppressions: Record<string, unknown>[];
  valueEvents: Record<string, unknown>[];
  auditLogs: Record<string, unknown>[];
  usageCounters: Record<string, unknown>[];
  usageEvents: Record<string, unknown>[];
}

/**
 * Assemble a complete data export for an organisation.
 * This is the core logic invoked by the durable export job.
 */
export async function assembleExport(
  organizationId: string,
): Promise<ExportPayload> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: { include: { user: true } },
      installations: true,
    },
  });

  if (!org) {
    throw new Error(`Organization ${organizationId} not found for export`);
  }

  const [
    products,
    courses,
    mappings,
    campaigns,
    interventions,
    responses,
    suppressions,
    valueEvents,
    auditLogs,
    usageCounters,
    usageEvents,
  ] = await Promise.all([
    db.product.findMany({ where: { organizationId } }),
    db.course.findMany({ where: { organizationId } }),
    db.productCourseMapping.findMany({ where: { organizationId } }),
    db.campaign.findMany({
      where: { organizationId },
      include: { versions: true },
    }),
    db.intervention.findMany({
      where: { organizationId },
      include: { deliveryAttempts: true },
    }),
    db.studentResponse.findMany({
      where: { intervention: { organizationId } },
    }),
    db.suppression.findMany({ where: { organizationId } }),
    db.valueEvent.findMany({
      where: { organizationId },
      include: { evidence: true },
    }),
    db.auditLog.findMany({ where: { organizationId } }),
    db.usageCounter.findMany({ where: { organizationId } }),
    db.usageEvent.findMany({ where: { organizationId } }),
  ]);

  // Strip internal IDs from user records for privacy — keep whopUserId for reference
  const safeMembers = org.members.map((m) => ({
    role: m.role,
    createdAt: m.createdAt,
    user: {
      whopUserId: m.user.whopUserId,
      name: m.user.name,
      // Email is partially redacted in export
      email: m.user.email
        ? redactEmail(m.user.email)
        : null,
    },
  }));

  return {
    exportedAt: new Date().toISOString(),
    organizationId,
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      planTier: org.planTier,
      timezone: org.timezone,
      createdAt: org.createdAt,
    },
    members: safeMembers,
    products: products.map((p) => ({ ...p })),
    courses: courses.map((c) => ({ ...c })),
    mappings: mappings.map((m) => ({ ...m })),
    campaigns: campaigns.map((c) => ({ ...c })),
    interventions: interventions.map((i) => ({ ...i })),
    responses: responses.map((r) => ({
      ...r,
      // Redact IP addresses in export
      ipAddress: r.ipAddress ? redactIp(r.ipAddress) : null,
    })),
    suppressions: suppressions.map((s) => ({ ...s })),
    valueEvents: valueEvents.map((v) => ({ ...v })),
    auditLogs: auditLogs.map((a) => ({ ...a })),
    usageCounters: usageCounters.map((u) => ({ ...u })),
    usageEvents: usageEvents.map((u) => ({ ...u })),
  };
}

/**
 * Redact an email for export: keep first char + domain.
 * e.g. "john@example.com" → "j***@example.com"
 */
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  return `${local[0]}***@${domain}`;
}

/**
 * Redact an IP address for export: keep first octet.
 * e.g. "192.168.1.1" → "192.*.*.*"
 */
function redactIp(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.*.*.*`;
  }
  return "***";
}
