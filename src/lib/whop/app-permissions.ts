// App permissions document for RescueLoop's Whop marketplace listing.
//
// Defines minimal permissions with justification, required vs optional status,
// decline fallback behavior, and re-approval behavior. Only permissions that
// are actively needed by the application are declared — no speculative scope.
//
// This module is consumed by:
//   - The marketplace listing page (to display permissions to creators)
//   - The onboarding permission diagnostics (to check granted vs required)
//   - The Whop SDK client setup (to request correct scopes)

// ─── Permission type ──────────────────────────────────────────────

export interface AppPermission {
  /** Machine-readable permission key matching Whop API scope names. */
  key: string;

  /** Human-readable name shown in the marketplace listing. */
  name: string;

  /** Short description of what this permission enables. */
  description: string;

  /** Which endpoint or feature uses this permission. */
  usedBy: string;

  /** Why this permission is needed — honest, specific justification. */
  justification: string;

  /** Whether this permission is required for the app to function. */
  required: boolean;

  /** What happens if the creator declines this permission. */
  declineFallback: string;

  /** What happens if the permission is revoked and later re-approved. */
  reapprovalBehavior: string;
}

// ─── Permission definitions ───────────────────────────────────────

/**
 * All permissions declared by RescueLoop for the Whop marketplace.
 *
 * DESIGN PRINCIPLES:
 *   - Minimal scope: only permissions actively used by running code
 *   - Honest fallbacks: declining a required permission means the app
 *     cannot function (we say so, not a degraded lie)
 *   - No speculative permissions for future features
 */
export const APP_PERMISSIONS: AppPermission[] = [
  {
    key: "send_notifications",
    name: "Send notifications",
    description:
      "Send intervention messages to students who have been identified as needing support, after you review and approve each message.",
    usedBy: "Notification provider (intervention delivery)",
    justification:
      "Core function: RescueLoop delivers creator-approved support messages to students. Without this, the app cannot send any interventions.",
    required: true,
    declineFallback:
      "The app cannot deliver interventions. Students will not receive support messages. The rescue queue will still identify candidates, but no outreach is possible.",
    reapprovalBehavior:
      "Pending and approved-but-undelivered interventions become deliverable. Previously dismissed interventions are not retried. New interventions will be sent normally.",
  },
  {
    key: "read_courses",
    name: "Read courses",
    description:
      "Read course structure, lesson lists, and student progress data to detect activation patterns.",
    usedBy: "Courses provider (onboarding sync + eligibility engine)",
    justification:
      "Required to map courses during onboarding, detect students who have not started or lost momentum, and compute eligibility based on progress.",
    required: true,
    declineFallback:
      "The app cannot detect students needing help. Course mapping, progress tracking, and the rescue queue will be empty. The dashboard shows an integration-not-configured state.",
    reapprovalBehavior:
      "Course data is re-synced from Whop. Eligibility is recomputed on the next sync cycle. Previously mapped courses are restored if they still exist on Whop.",
  },
  {
    key: "read_memberships",
    name: "Read memberships",
    description:
      "Read membership status and renewal data to understand enrollment and churn signals.",
    usedBy: "Memberships provider (webhook sync + eligibility engine)",
    justification:
      "Required to track membership status changes (activated, cancelled, expiring) and determine which students are currently enrolled and may need support.",
    required: true,
    declineFallback:
      "The app cannot track membership changes. New students will not appear, and cancelled students will not be detected. Existing synced data remains but becomes stale.",
    reapprovalBehavior:
      "Membership data is re-synced from Whop. Stale memberships are updated. New memberships since revocation are backfilled on the next sync cycle.",
  },
  {
    key: "read_experiences",
    name: "Read experiences",
    description:
      "Read experience data to generate deep links that take students directly to their course within the Whop embed.",
    usedBy: "Student access tokens (deep-link generation)",
    justification:
      "Optional: used to generate experience-scoped deep links in student intervention messages, so students land in the right course context. Without this, links still work but may not be context-specific.",
    required: false,
    declineFallback:
      "Intervention links use a generic course URL instead of an experience-scoped deep link. Students may need to navigate to their course manually after clicking.",
    reapprovalBehavior:
      "Future intervention links will include experience-scoped deep links. Previously sent links with generic URLs continue to work.",
  },
];

// ─── Derived helpers ──────────────────────────────────────────────

/**
 * Get all permissions that are required for the app to function.
 * These are the permissions whose denial means the app cannot
 * provide its core value proposition.
 */
export function getRequiredPermissions(): AppPermission[] {
  return APP_PERMISSIONS.filter((p) => p.required);
}

/**
 * Get all optional permissions. These enhance the experience
 * but the app functions (with graceful degradation) without them.
 */
export function getOptionalPermissions(): AppPermission[] {
  return APP_PERMISSIONS.filter((p) => !p.required);
}

/**
 * Check whether a set of granted permission keys satisfies
 * all required permissions. Returns missing keys if not.
 */
export function getMissingRequiredPermissions(
  grantedKeys: Set<string>,
): string[] {
  return getRequiredPermissions()
    .filter((p) => !grantedKeys.has(p.key))
    .map((p) => p.key);
}
