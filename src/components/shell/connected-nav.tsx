// Connected company navigation data.
//
// Single source of truth for the nav items rendered inside ConnectedShell.
// Every href ALWAYS includes companyId so a creator inside
// /dashboard/[companyId]/... is never sent to a demo route.
//
// WP-03: Canonical routes are now under /dashboard/[companyId]/.
// The legacy /companies/[companyId]/* paths redirect to /dashboard/.
//
// This module is safe to import from both client and server components
// (no "server-only" import, no server-only APIs).

import {
  LayoutDashboard,
  ListChecks,
  Users,
  Megaphone,
  MessageSquareReply,
  BarChart3,
  DollarSign,
  Settings as SettingsIcon,
  RefreshCw,
  ScrollText,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export type ConnectedEnvironment = "fixture" | "whop" | "unconfigured";

export type InstallationState = "active" | "missing" | "unknown";

export interface ConnectedNavItem {
  /** Stable key used for active-state matching and React keys. */
  key: string;
  /** Visible label in the nav rail + mobile sheet. */
  label: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Last path segment, e.g. "overview" for /companies/[id]/overview. */
  segment: string;
  /** One-line description shown in tooltips / mobile sheet. */
  description: string;
  /** When true, the item appears in the mobile bottom tab bar. */
  mobilePrimary: boolean;
}

/**
 * The full set of company-scoped nav items. Order matters — it drives
 * the order of the desktop nav rail and the mobile "More" sheet.
 *
 * Mobile primary tabs (4): Overview, Queue, Campaigns, Responses.
 */
export const CONNECTED_NAV_ITEMS: ConnectedNavItem[] = [
  {
    key: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    segment: "",
    description: "Recovery pulse + system status",
    mobilePrimary: true,
  },
  {
    key: "queue",
    label: "Queue",
    icon: ListChecks,
    segment: "rescue-queue",
    description: "Activation Rescue candidates awaiting review",
    mobilePrimary: true,
  },
  {
    key: "students",
    label: "Students",
    icon: Users,
    segment: "students",
    description: "Member directory + course progress",
    mobilePrimary: false,
  },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    segment: "campaigns",
    description: "Rescue campaigns + message templates",
    mobilePrimary: true,
  },
  {
    key: "responses",
    label: "Responses",
    icon: MessageSquareReply,
    segment: "responses",
    description: "Student response centre",
    mobilePrimary: true,
  },
  {
    key: "insights",
    label: "Insights",
    icon: BarChart3,
    segment: "insights",
    description: "Friction findings + course funnels",
    mobilePrimary: false,
  },
  {
    key: "value",
    label: "Value",
    icon: DollarSign,
    segment: "value",
    description: "Attribution ledger + ROI",
    mobilePrimary: false,
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    segment: "settings",
    description: "Organisation + safety rules",
    mobilePrimary: false,
  },
  {
    key: "sync",
    label: "Sync",
    icon: RefreshCw,
    segment: "sync",
    description: "Whop sync health + webhook log",
    mobilePrimary: false,
  },
  {
    key: "audit",
    label: "Audit",
    icon: ScrollText,
    segment: "audit",
    description: "Immutable audit log",
    mobilePrimary: false,
  },
  {
    key: "usage",
    label: "Usage",
    icon: Gauge,
    segment: "usage",
    description: "Plan limits + consumption",
    mobilePrimary: false,
  },
];

/** Items shown in the mobile bottom tab bar. */
export const MOBILE_PRIMARY_ITEMS: ConnectedNavItem[] =
  CONNECTED_NAV_ITEMS.filter((i) => i.mobilePrimary);

/** Items shown in the mobile "More" sheet. */
export const MOBILE_MORE_ITEMS: ConnectedNavItem[] = CONNECTED_NAV_ITEMS.filter(
  (i) => !i.mobilePrimary,
);

/**
 * Build a company-scoped href. Always interpolates companyId so the
 * result is always inside /dashboard/[companyId]/...
 *
 * WP-03: Canonical base is now /dashboard/ instead of /companies/.
 */
export function buildCompanyHref(companyId: string, segment: string): string {
  const base = `/dashboard/${encodeURIComponent(companyId)}`;
  return segment ? `${base}/${segment}` : base;
}

/**
 * Determine which nav item is active for the given pathname.
 *
 * Matches the path segment immediately after /dashboard/[companyId]/.
 * Also matches the legacy /companies/[companyId]/ prefix for compatibility.
 * Returns null when the pathname is outside the company scope.
 */
export function getActiveConnectedNavKey(
  pathname: string,
  companyId: string,
): string | null {
  const encodedId = encodeURIComponent(companyId);
  const dashboardPrefix = `/dashboard/${encodedId}/`;
  const legacyPrefix = `/companies/${encodedId}/`;

  let rest: string | null = null;
  if (pathname.startsWith(dashboardPrefix)) {
    rest = pathname.slice(dashboardPrefix.length);
  } else if (pathname.startsWith(legacyPrefix)) {
    rest = pathname.slice(legacyPrefix.length);
  }

  // Also match exact /dashboard/[companyId] (no trailing slash)
  if (!rest && pathname === `/dashboard/${encodedId}`) {
    rest = "";
  }

  if (rest === null) return null;
  const segment = rest.split("/")[0] ?? "";
  const item = CONNECTED_NAV_ITEMS.find((i) => i.segment === segment);
  return item?.key ?? null;
}

/**
 * Visual metadata for the environment badge. Used by both the top bar
 * and the desktop nav rail tooltip.
 */
export const ENVIRONMENT_BADGE: Record<
  ConnectedEnvironment,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  fixture: {
    label: "FIXTURE",
    dotClass: "bg-[var(--warning)]",
    textClass: "text-[var(--warning)]",
    bgClass: "bg-[var(--warning-light)]/60 border-[var(--warning)]/30",
  },
  whop: {
    label: "CONNECTED",
    dotClass: "bg-[var(--recovery-green)]",
    textClass: "text-[var(--recovery-green)]",
    bgClass: "bg-[var(--recovery-light)]/60 border-[var(--recovery-green)]/30",
  },
  unconfigured: {
    label: "NOT CONFIGURED",
    dotClass: "bg-[var(--critical)]",
    textClass: "text-[var(--critical)]",
    bgClass: "bg-[var(--critical-light)]/60 border-[var(--critical)]/30",
  },
};

/** Human-readable label for the environment badge (used in tooltips). */
export const ENVIRONMENT_LABEL: Record<ConnectedEnvironment, string> = {
  fixture: "Fixture environment — local deterministic data, no Whop calls",
  whop: "Connected — live Whop integration",
  unconfigured:
    "Whop integration not configured — set WHOP_API_KEY + WHOP_WEBHOOK_SECRET + NEXT_PUBLIC_WHOP_APP_ID",
};
