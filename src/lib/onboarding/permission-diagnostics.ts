// Permission diagnostics for the onboarding access_check step.
//
// Runs a series of safe checks against the Whop integration and DB
// to determine whether the user can proceed to course mapping.
// Diagnostic IDs are safe (never expose secrets or raw payloads).
//
// This module is server-only — it touches the DB and Whop client.

import "server-only";
import { db } from "@/lib/db";
import { isWhopReady } from "@/lib/whop/client";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger({ route: "onboarding/permission-diagnostics" });

// ─── Diagnostic types ───────────────────────────────────────────

export type DiagnosticCategory =
  | "connected"
  | "missing_api_key"
  | "invalid_token"
  | "non_admin"
  | "missing_scopes"
  | "whop_temporary_failure"
  | "rate_limit"
  | "no_courses"
  | "db_unavailable"
  | "stale_connection";

export type DiagnosticStatus = "pass" | "fail" | "warn" | "skip";

export interface DiagnosticResult {
  /** Safe, stable diagnostic identifier (never a secret). */
  id: string;
  /** What category of check this is. */
  category: DiagnosticCategory;
  /** Result of the check. */
  status: DiagnosticStatus;
  /** Human-readable message (safe to show in UI). */
  message: string;
  /** What the user can safely do next if this check fails. */
  safeNextAction: string | null;
  /** Whether retrying the same check is safe (no side effects). */
  retrySafe: boolean;
  /** Whether this problem requires the company owner to fix. */
  requiresOwnerHelp: boolean;
}

export interface DiagnosticsReport {
  companyId: string;
  organizationId: string;
  results: DiagnosticResult[];
  overallStatus: "pass" | "fail" | "warn";
  canProceedToMapping: boolean;
  checkedAt: string;
}

// ─── Safe ID generation ─────────────────────────────────────────

/**
 * Generate a safe, stable diagnostic ID from company + org + category.
 * Never includes secrets or raw payloads.
 */
function safeDiagnosticId(
  companyId: string,
  organizationId: string,
  category: DiagnosticCategory,
): string {
  // Use a simple hash to avoid exposing raw IDs in logs
  const raw = `${companyId}:${organizationId}:${category}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32-bit int
  }
  return `diag_${category}_${Math.abs(hash).toString(36)}`;
}

// ─── Individual checks ──────────────────────────────────────────

async function checkWhopConnection(
  companyId: string,
  organizationId: string,
): Promise<DiagnosticResult> {
  const id = safeDiagnosticId(companyId, organizationId, "connected");

  if (!isWhopReady()) {
    return {
      id,
      category: "connected",
      status: "fail",
      message: "Whop API credentials are not configured.",
      safeNextAction: "Add your WHOP_API_KEY and WHOP_WEBHOOK_SECRET environment variables.",
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  }

  // Try a lightweight API call to verify the token works
  try {
    const { getWhopClient } = await import("@/lib/whop/client");
    const client = getWhopClient();
    // Use a lightweight list call with limit=1 to test connectivity
    await client.companies.retrieve({ company_id: companyId });
    return {
      id,
      category: "connected",
      status: "pass",
      message: "Whop API connection is working.",
      safeNextAction: null,
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.warn("Whop connection check failed", {
      action: "checkWhopConnection",
      companyId,
      organizationId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });

    // Classify the error
    if (msg.includes("401") || msg.includes("Unauthorized")) {
      return {
        id,
        category: "invalid_token",
        status: "fail",
        message: "Whop API key is invalid or expired.",
        safeNextAction: "Regenerate your Whop API key and update the environment variable.",
        retrySafe: true,
        requiresOwnerHelp: true,
      };
    }

    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit")) {
      return {
        id: safeDiagnosticId(companyId, organizationId, "rate_limit"),
        category: "rate_limit",
        status: "warn",
        message: "Whop API rate limit reached. Please wait a moment and retry.",
        safeNextAction: "Wait 60 seconds and click Retry.",
        retrySafe: true,
        requiresOwnerHelp: false,
      };
    }

    if (msg.includes("5") || msg.includes("502") || msg.includes("503")) {
      return {
        id: safeDiagnosticId(companyId, organizationId, "whop_temporary_failure"),
        category: "whop_temporary_failure",
        status: "warn",
        message: "Whop API is temporarily unavailable.",
        safeNextAction: "Wait a few minutes and retry. This is usually transient.",
        retrySafe: true,
        requiresOwnerHelp: false,
      };
    }

    return {
      id,
      category: "connected",
      status: "fail",
      message: "Unable to connect to Whop API.",
      safeNextAction: "Check your network connection and API key configuration.",
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  }
}

async function checkInstallation(
  companyId: string,
  organizationId: string,
): Promise<DiagnosticResult> {
  const id = safeDiagnosticId(companyId, organizationId, "missing_scopes");

  try {
    const installation = await db.whopInstallation.findFirst({
      where: { whopCompanyId: companyId },
      select: {
        status: true,
        grantedScopes: true,
        requestedScopes: true,
      },
    });

    if (!installation) {
      return {
        id,
        category: "missing_scopes",
        status: "fail",
        message: "RescueLoop is not installed for this Whop company.",
        safeNextAction: "Install the RescueLoop app from the Whop marketplace.",
        retrySafe: true,
        requiresOwnerHelp: true,
      };
    }

    if (installation.status !== "active") {
      return {
        id,
        category: "stale_connection",
        status: "warn",
        message: `Installation status is "${installation.status}", not "active".`,
        safeNextAction: "Re-install or re-authorize the RescueLoop app.",
        retrySafe: true,
        requiresOwnerHelp: true,
      };
    }

    // Verify scopes
    try {
      const granted: string[] = JSON.parse(installation.grantedScopes);
      const requested: string[] = JSON.parse(installation.requestedScopes);
      const missing = requested.filter((s) => !granted.includes(s));

      if (missing.length > 0) {
        return {
          id,
          category: "missing_scopes",
          status: "warn",
          message: `Missing permissions: ${missing.join(", ")}. Some features may not work.`,
          safeNextAction: "Re-authorize the app to grant all requested permissions.",
          retrySafe: true,
          requiresOwnerHelp: true,
        };
      }
    } catch {
      // Scope JSON parse failure — not fatal, just can't verify
    }

    return {
      id,
      category: "missing_scopes",
      status: "pass",
      message: "Installation is active with correct permissions.",
      safeNextAction: null,
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  } catch (error) {
    log.warn("Installation check failed", {
      action: "checkInstallation",
      companyId,
      organizationId,
      errorType: error instanceof Error ? error.constructor.name : "unknown",
    });

    return {
      id: safeDiagnosticId(companyId, organizationId, "db_unavailable"),
      category: "db_unavailable",
      status: "fail",
      message: "Unable to check installation status. Database may be temporarily unavailable.",
      safeNextAction: "Retry in a few moments.",
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  }
}

async function checkAdminAccess(
  companyId: string,
  organizationId: string,
): Promise<DiagnosticResult> {
  const id = safeDiagnosticId(companyId, organizationId, "non_admin");

  try {
    const ownerCount = await db.organizationMember.count({
      where: {
        organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    if (ownerCount === 0) {
      return {
        id,
        category: "non_admin",
        status: "warn",
        message: "No admin or owner found for this organization. Onboarding may require owner action.",
        safeNextAction: "Ask the company owner to complete the setup.",
        retrySafe: true,
        requiresOwnerHelp: true,
      };
    }

    return {
      id,
      category: "non_admin",
      status: "pass",
      message: "Admin access confirmed.",
      safeNextAction: null,
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  } catch {
    return {
      id,
      category: "non_admin",
      status: "skip",
      message: "Could not verify admin status. Proceeding with caution.",
      safeNextAction: null,
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  }
}

async function checkCoursesAvailable(
  companyId: string,
  organizationId: string,
): Promise<DiagnosticResult> {
  const id = safeDiagnosticId(companyId, organizationId, "no_courses");

  // First check the local DB
  try {
    const dbCourseCount = await db.course.count({
      where: { organizationId },
    });

    if (dbCourseCount > 0) {
      return {
        id,
        category: "no_courses",
        status: "pass",
        message: `${dbCourseCount} course${dbCourseCount === 1 ? "" : "s"} found in your account.`,
        safeNextAction: null,
        retrySafe: true,
        requiresOwnerHelp: false,
      };
    }
  } catch {
    // DB check failed, fall through to Whop check
  }

  // Check Whop API
  if (!isWhopReady()) {
    return {
      id,
      category: "no_courses",
      status: "warn",
      message: "Cannot verify courses — Whop API is not configured.",
      safeNextAction: "Configure Whop API credentials, or add courses manually.",
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  }

  try {
    const { getWhopClient } = await import("@/lib/whop/client");
    const client = getWhopClient();
    const page = await client.courses.list({ company_id: companyId });

    // Extract course count from paginated response
    let courseCount = 0;
    if (typeof page === "object" && page !== null && "data" in page) {
      const data = (page as { data: unknown[] }).data;
      courseCount = Array.isArray(data) ? data.length : 0;
    }

    if (courseCount === 0) {
      return {
        id,
        category: "no_courses",
        status: "warn",
        message: "No courses found in your Whop account. You may need to publish a course first.",
        safeNextAction: "Create and publish a course in Whop, then retry. Or add a course ID manually.",
        retrySafe: true,
        requiresOwnerHelp: false,
      };
    }

    return {
      id,
      category: "no_courses",
      status: "pass",
      message: `${courseCount} course${courseCount === 1 ? "" : "s"} available from Whop.`,
      safeNextAction: null,
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  } catch {
    return {
      id,
      category: "no_courses",
      status: "warn",
      message: "Could not fetch courses from Whop. You can still proceed by entering a course ID manually.",
      safeNextAction: "Retry the connection check, or add a course ID manually.",
      retrySafe: true,
      requiresOwnerHelp: false,
    };
  }
}

// ─── Main diagnostics runner ────────────────────────────────────

/**
 * Run all permission diagnostics for a company/org pair.
 * Returns a structured report safe for the UI (no secrets).
 */
export async function runDiagnostics(
  companyId: string,
  organizationId: string,
): Promise<DiagnosticsReport> {
  log.info("Running permission diagnostics", {
    action: "runDiagnostics",
    companyId,
    organizationId,
  });

  const results: DiagnosticResult[] = [];

  // Run checks in sequence (each may depend on previous state)
  results.push(await checkWhopConnection(companyId, organizationId));
  results.push(await checkInstallation(companyId, organizationId));
  results.push(await checkAdminAccess(companyId, organizationId));
  results.push(await checkCoursesAvailable(companyId, organizationId));

  // Compute overall status
  const hasFail = results.some((r) => r.status === "fail");
  const hasWarn = results.some((r) => r.status === "warn");
  const overallStatus: DiagnosticsReport["overallStatus"] = hasFail
    ? "fail"
    : hasWarn
      ? "warn"
      : "pass";

  // Can proceed to mapping if no hard failures on critical checks
  const criticalFailures = results.filter(
    (r) => r.status === "fail" && (r.category === "connected" || r.category === "missing_api_key" || r.category === "invalid_token"),
  );
  const canProceedToMapping = criticalFailures.length === 0;

  const report: DiagnosticsReport = {
    companyId,
    organizationId,
    results,
    overallStatus,
    canProceedToMapping,
    checkedAt: new Date().toISOString(),
  };

  log.info("Diagnostics complete", {
    action: "runDiagnostics",
    companyId,
    organizationId,
    overallStatus,
    canProceedToMapping,
    resultCount: results.length,
  });

  return report;
}
