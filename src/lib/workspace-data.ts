// ── Workspace demo data ────────────────────────────────────────
// Types and demo workspaces for the WorkspaceSwitcher component.

export type WorkspacePlan = "Starter" | "Growth" | "Enterprise" | "Trial";

export interface Workspace {
  id: string;
  name: string;
  plan: WorkspacePlan;
  memberCount: number;
  connected: boolean;
  /** Two-letter initials for avatar fallback */
  initials: string;
  /** ISO 8601 date string – last time the user accessed this workspace */
  lastAccessed: string;
}

/** Format member count for display: 847 → "847", 1204 → "1,204" */
export function formatMemberCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** Get plan badge styling — matches design system tokens */
export function getPlanBadgeClasses(plan: WorkspacePlan): string {
  switch (plan) {
    case "Growth":
      return "bg-[var(--recovery-light)] text-[var(--recovery-green)] border-[var(--recovery-green)]/20";
    case "Enterprise":
      return "bg-[var(--canvas-elevated)] text-[var(--ink-primary)] border-[var(--hairline-strong)]";
    case "Trial":
      return "bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20";
    case "Starter":
    default:
      return "bg-[var(--canvas-elevated)] text-[var(--ink-muted)] border-[var(--hairline)]";
  }
}

/** Demo workspaces — first one is "current" */
export const DEMO_WORKSPACES: Workspace[] = [
  {
    id: "creator-growth-lab",
    name: "Creator Growth Lab",
    plan: "Growth",
    memberCount: 847,
    connected: true,
    initials: "CG",
    lastAccessed: new Date(Date.now() - 0).toISOString(), // now
  },
  {
    id: "course-mastery-pro",
    name: "Course Mastery Pro",
    plan: "Starter",
    memberCount: 312,
    connected: true,
    initials: "CM",
    lastAccessed: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
  },
  {
    id: "digital-workshop-hub",
    name: "Digital Workshop Hub",
    plan: "Growth",
    memberCount: 1204,
    connected: true,
    initials: "DW",
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
  },
  {
    id: "fitness-academy",
    name: "Fitness Academy",
    plan: "Starter",
    memberCount: 89,
    connected: false,
    initials: "FA",
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
  },
  {
    id: "art-studio-online",
    name: "Art Studio Online",
    plan: "Trial",
    memberCount: 23,
    connected: true,
    initials: "AS",
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3d ago
  },
  {
    id: "trading-community",
    name: "Trading Community",
    plan: "Growth",
    memberCount: 567,
    connected: true,
    initials: "TC",
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5d ago
  },
];

/** The "current" workspace id for demo purposes */
export const CURRENT_WORKSPACE_ID = "creator-growth-lab";

/** Industry options for the Create Workspace dialog */
export const INDUSTRY_OPTIONS = [
  "Education",
  "Fitness",
  "Trading",
  "Art",
  "Business",
  "Other",
] as const;

export type Industry = (typeof INDUSTRY_OPTIONS)[number];
