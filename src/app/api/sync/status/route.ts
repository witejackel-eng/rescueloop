import { prisma } from "@/lib/prisma";
import { whopConfig } from "@/lib/whop/api";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const installation = await prisma.companyInstallation.findUnique({
    where: { whopCompanyId: whopConfig.defaultCompanyId },
    include: {
      _count: {
        select: {
          courses: true,
          members: true,
          memberships: true,
          enrollments: true,
          riskDetections: true,
        },
      },
      syncRuns: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!installation) {
    return Response.json({
      connected: true,
      synced: false,
      companyId: whopConfig.defaultCompanyId,
    });
  }

  return Response.json({
    connected: true,
    synced: Boolean(installation.lastSyncedAt),
    companyId: installation.whopCompanyId,
    lastSyncedAt: installation.lastSyncedAt,
    lastSyncError: installation.lastSyncError,
    counts: installation._count,
    latestRun: installation.syncRuns[0] ?? null,
  });
}
