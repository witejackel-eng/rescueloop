// Connected company navigation data.
//
// Single source of truth for the nav items rendered inside ConnectedShell.
// Every href ALWAYS includes companyId so a creator inside
// /dashboard/[companyId]/... is never sent to a demo route.
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
  Activity,
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
  /** Canonical path segment under /dashboard/[companyId]/, e.g. "rescue-queue". */
  segment: string;
  /** One-line description shown in tooltips / mobile sheet. */
  description: string;
  /** When true, the item appears in the mobile bottom tab bar. */
  mobilePrimary: boolean;
}

/**
 * The full set of company-scoped nav items. Order matters — it drives
 * the order of the desktop nav rail and the mobile "More" sheet.
 * Segments map to canonical /dashboard/[companyId]/... routes.
 *
 * Mobile primary tabs (4): Dashboard, Queue, Playbooks, Responses.
 */
export const CONNECTED_NAV_ITEMS: ConnectedNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    segment: "",
    description: "Recovery pulse + system status",
    mobilePrimary: true,
  },
  {
    key: "rescue-queue",
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
    key: "playbooks",
    label: "Playbooks",
    icon: Megaphone,
    segment: "playbooks",
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
    key: "activity",
    label: "Activity",
    icon: Activity,
    segment: "activity",
    description: "Immutable activity log",
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
    key: "usage",
    label: "Usage",
    icon: Gauge,
    segment: "usage",
    description: "Plan limits + consumption",
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
];

/** Items shown in the mobile bottom tab bar. */
export const MOBILE_PRIMARY_ITEMS: ConnectedNavItem[] =
  CONNECTED_NAV_ITEMS.filter((i) => i.mobilePrimary);

/** Items shown in the mobile "More" sheet. */
export const MOBILE_MORE_ITEMS: ConnectedNavItem[] = CONNECTED_NAV_ITEMS.filter(
  (i) => !i.mobilePrimary,
);

/**
 * Build a dashboard-scoped href. Always interpolates companyId so the
 * result is always inside /dashboard/[companyId]/...
 *
 * When segment is "" (the root dashboard), returns /dashboard/[companyId].
 */
export function buildDashboardHref(companyId: string, segment: string): string {
  const base = `/dashboard/${encodeURIComponent(companyId)}`;
  return segment ? `${base}/${segment}` : base;
}

/**
 * @deprecated Use buildDashboardHref instead. Kept for backward compat.
 */
export function buildCompanyHref(companyId: string, segment: string): string {
  return buildDashboardHref(companyId, segment);
}

/**
 * Determine which nav item is active for the given pathname.
 *
 * Matches the path segment under /dashboard/[companyId]/.
 * Returns null when the pathname is outside the dashboard scope.
 */
export function getActiveConnectedNavKey(
  pathname: string,
  companyId: string,
): string | null {
  const prefix = `/dashboard/${encodeURIComponent(companyId)}`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  // Root dashboard (no segment or just a trailing slash)
  if (rest === "" || rest === "/") {
    const item = CONNECTED_NAV_ITEMS.find((i) => i.segment === "");
    return item?.key ?? null;
  }
  const segment = rest.replace(/^\//, "").split("/")[0] ?? "";
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
