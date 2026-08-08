import "server-only";
// Whop Marketplace Manifest — WP08
//
// Single source of truth for the RescueLoop Whop App Store listing.
// Mirrors the canonical product contract: "Activation rescue for Whop creators.
// Close the loop before they leave. Nothing sends without your approval."
//
// Every field here is what the Whop App Store listing page will display.
// Any change to copy MUST be reviewed against:
//   - CANONICAL_PRODUCT_CONTRACT.md truth rules
//   - THREAT_MODEL.md (no inflated causality, no autonomous sends)
//   - WHOP_SOURCE_OF_TRUTH_2026-08-07.md (Stable APIs only)

export interface MarketplaceListing {
  /** App name shown in Whop App Store. */
  name: string;
  /** One-line tagline (≤80 chars). */
  tagline: string;
  /** Short description (≤200 chars). */
  shortDescription: string;
  /** Core bullet points. */
  coreBullets: readonly string[];
  /** Trust statement. */
  trust: string;
  /** Forbidden claims — never used in any public surface. */
  forbiddenClaims: readonly string[];
}

export const MARKETPLACE_LISTING: MarketplaceListing = {
  name: "RescueLoop",
  tagline: "Activation rescue for Whop creators.",
  shortDescription:
    "Find members who never started or lost momentum, review a respectful support message, and see what happened next.",
  coreBullets: [
    "Detect students who may need help using evidence-backed eligibility rules.",
    "See the evidence behind every candidate before you act.",
    "Review and edit every message. Nothing sends without your approval.",
    "Track student responses, observed returns, and reported blockers.",
    "Understand course friction without fake attribution or inflated revenue.",
  ],
  trust: "Nothing sends without your approval.",
  forbiddenClaims: [
    "guaranteed retention",
    "recovered revenue",
    "autonomous saves",
    "churn risk",
    "cancellation probability",
    "conversion pressure",
    // Additional v1-final prohibitions (Section 5 of the v1 completion brief):
    // Never sum confirmed + strongly associated + estimated into a single total.
    "Total defended value",
    // Confirmed recovered value must remain $0 unless an auditable
    // monetary recovery rule is satisfied.
    "Confirmed recovered value",
    // Never use "live demo" for simulated content — say "interactive demo"
    // or "simulated workspace" instead.
    "live demo",
    // Never call an ordinary post-intervention payment "confirmed recovery".
    "Payment received after a documented intervention",
  ],
} as const;

// ─── App views ─────────────────────────────────────────────────

export interface AppViewEntry {
  /** Path inside the Whop iframe. */
  path: string;
  /** Human-readable label. */
  label: string;
  /** Whop surface where this view appears. */
  surface: "creator_dashboard" | "student_experience" | "marketing";
  /** Whether the view is iframe-embedded. */
  iframeEmbedded: boolean;
}

export const APP_VIEWS: readonly AppViewEntry[] = [
  {
    path: "/dashboard/[companyId]",
    label: "Overview",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/dashboard/[companyId]/rescue-queue",
    label: "Rescue Queue",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/dashboard/[companyId]/students",
    label: "Students",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/dashboard/[companyId]/responses",
    label: "Response Center",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/dashboard/[companyId]/insights",
    label: "Course Intelligence",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/dashboard/[companyId]/value",
    label: "Value Ledger",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/dashboard/[companyId]/usage",
    label: "Plan & Usage",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/dashboard/[companyId]/settings",
    label: "Settings",
    surface: "creator_dashboard",
    iframeEmbedded: true,
  },
  {
    path: "/experiences/[experienceId]/rescue/[token]",
    label: "Student Experience",
    surface: "student_experience",
    iframeEmbedded: false, // opaque token link, opens in standard browser
  },
  {
    path: "/",
    label: "Marketing Site",
    surface: "marketing",
    iframeEmbedded: false,
  },
] as const;

// ─── Permissions (minimal, justified) ──────────────────────────

export interface PermissionEntry {
  /** Whop permission identifier. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Why RescueLoop needs it — must reference a real feature. */
  justification: string;
  /** Which feature uses it. */
  usedBy: string;
  /** Required vs optional. */
  required: boolean;
  /** What happens if the creator declines. */
  declineFallback: string;
  /** Whether the creator must re-approve if scope changes. */
  reapprovalOnScopeChange: boolean;
}

export const PERMISSIONS: readonly PermissionEntry[] = [
  {
    id: "read_company_courses",
    label: "Read courses and experiences",
    justification:
      "Required to sync the creator's course roster so RescueLoop can identify students who have not started or have lost momentum.",
    usedBy: "Onboarding sync, Rescue Queue eligibility engine",
    required: true,
    declineFallback:
      "Onboarding cannot complete; RescueLoop cannot identify candidates.",
    reapprovalOnScopeChange: false,
  },
  {
    id: "read_company_members",
    label: "Read members and membership status",
    justification:
      "Required to know which users are enrolled in which course and whether their membership is active, past_due, or cancelled — this is the eligibility signal.",
    usedBy: "Onboarding sync, Rescue Queue eligibility engine",
    required: true,
    declineFallback:
      "RescueLoop cannot determine who is enrolled or who has lost access.",
    reapprovalOnScopeChange: false,
  },
  {
    id: "read_course_progress",
    label: "Read lesson progress per enrolled member",
    justification:
      "Required to detect the 'never started' and 'lost momentum' eligibility signals and to observe course activity after an intervention (for outcome evidence only — never for causal claims).",
    usedBy: "Rescue Queue eligibility, Outcome Engine",
    required: true,
    declineFallback:
      "RescueLoop cannot detect who needs help or observe what happened next.",
    reapprovalOnScopeChange: false,
  },
  {
    id: "send_notification_to_member",
    label: "Send a notification to a specific member",
    justification:
      "Required to deliver a creator-approved support message to a single student. RescueLoop NEVER sends autonomously — every notification requires explicit creator approval at send time, and the safety re-check runs immediately before submission.",
    usedBy: "Rescue Queue → Approve → Whop submission",
    required: true,
    declineFallback:
      "RescueLoop can show candidates but cannot deliver any message.",
    reapprovalOnScopeChange: true,
  },
  {
    id: "manage_webhooks",
    label: "Register and receive webhook events",
    justification:
      "Required to receive Whop events for membership changes, payment status (so entitlements are server-authoritative), and notification delivery receipts. Webhooks are verified using Standard Webhooks signatures and deduplicated.",
    usedBy: "Whop webhook ingestion, Entitlement Engine",
    required: true,
    declineFallback:
      "Entitlements and notification receipts must be polled — slow and brittle.",
    reapprovalOnScopeChange: true,
  },
] as const;

// ─── Iframe behavior ───────────────────────────────────────────

/**
 * Whop embeds RescueLoop inside an iframe. The official guidance is:
 *   - The iframe inherits Whop's user-token cookie via `x-whop-user-token` header.
 *   - The app must NOT set `X-Frame-Options: DENY` on embedded routes.
 *   - The app SHOULD set `Content-Security-Policy: frame-ancestors https://*.whop.com`
 *     to prevent any non-Whop origin from embedding the app.
 *   - Student experience routes (opaque token links) MUST set
 *     `X-Frame-Options: DENY` to prevent clickjacking.
 */
export const IFRAME_POLICY = {
  /** Allowed parent origins for embedded views. */
  allowedFrameAncestors: ["https://*.whop.com", "https://whop.com"],
  /** Routes that must NEVER be iframe-embedded (student tokens, internal). */
  denyIframeRoutes: [
    "/experiences/[experienceId]/rescue/[token]",
    "/student-rescue",
    "/student-rescue/blocker",
    "/internal",
    "/api/internal",
  ],
  /** Routes that ARE designed to be embedded. */
  embeddedRoutes: ["/dashboard/[companyId]", "/onboarding"],
} as const;

// ─── Listing readiness ─────────────────────────────────────────

export interface ListingReadinessCheck {
  id: string;
  label: string;
  status: "ready" | "blocked" | "pending";
  rationale: string;
}

/**
 * Static readiness checklist for the marketplace listing.
 * Runtime checks (screenshot files exist, legal pages return 200, etc.) live in tests.
 */
export const LISTING_READINESS_STATIC: readonly ListingReadinessCheck[] = [
  {
    id: "name",
    label: "App name set",
    status: "ready",
    rationale: "RescueLoop — matches brand assets and manifest.",
  },
  {
    id: "tagline",
    label: "Tagline under 80 chars",
    status: "ready",
    rationale: "Verified by manifest test.",
  },
  {
    id: "permissions_minimal",
    label: "Permissions minimal and justified",
    status: "ready",
    rationale: "Five permissions, each with feature justification and decline fallback.",
  },
  {
    id: "iframe_policy",
    label: "Iframe policy defined",
    status: "ready",
    rationale: "frame-ancestors whitelisted to whop.com; student routes deny iframe.",
  },
  {
    id: "truth_language",
    label: "Listing uses truth language only",
    status: "ready",
    rationale: "Forbidden claims list enforced; copy reviewed against product contract.",
  },
  {
    id: "screenshots",
    label: "5 marketplace screenshots captured",
    status: "pending",
    rationale: "Screenshots captured from fixture-only data and committed under /public/marketplace.",
  },
  {
    id: "video",
    label: "30–60s product video",
    status: "pending",
    rationale: "Script and storyboard ready; capture pending controlled pilot.",
  },
  {
    id: "legal_pages",
    label: "Privacy, Terms, Security, Data Processing live",
    status: "ready",
    rationale: "All four legal pages render at /legal/*.",
  },
  {
    id: "support",
    label: "Support / uninstall / data lifecycle documented",
    status: "ready",
    rationale: "docs/DATA_LIFECYCLE.md and docs/operations/NEON_MIGRATION_BASELINE.md cover uninstall, export, deletion.",
  },
  {
    id: "p0_p1_free",
    label: "No known P0/P1 defects",
    status: "ready",
    rationale: "CI 7/7 green; no open P0/P1 issues tracked.",
  },
] as const;

// ─── Truth-language guard ──────────────────────────────────────

/**
 * Throws if any forbidden claim appears in supplied copy.
 * Used by the manifest test and by the listing page at build time.
 */
export function assertNoForbiddenClaims(copy: string): void {
  const lower = copy.toLowerCase();
  for (const claim of MARKETPLACE_LISTING.forbiddenClaims) {
    if (lower.includes(claim.toLowerCase())) {
      throw new Error(
        `Marketplace copy contains forbidden claim: "${claim}". ` +
        `This violates the canonical product contract.`,
      );
    }
  }
}
