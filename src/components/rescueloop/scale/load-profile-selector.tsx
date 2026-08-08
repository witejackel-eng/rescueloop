"use client";

// ─────────────────────────────────────────────────────────────
// PX06 — Load Profile Selector
// Select scale tier load profile: 250 / 1,000 / 2,500 members.
// ─────────────────────────────────────────────────────────────

import { type FC } from "react";
import type { LoadProfileSize, LoadProfile } from "@/lib/types/scale";
import { LOAD_PROFILES, SCALE_CAPACITY_POLICY } from "@/lib/types/scale";
import { Users, BarChart3, Activity } from "lucide-react";

interface LoadProfileSelectorProps {
  selected: LoadProfileSize;
  onSelect: (size: LoadProfileSize) => void;
}

const PROFILE_ICONS: Record<LoadProfileSize, React.ComponentType<{ className?: string }>> = {
  small: Users,
  medium: BarChart3,
  max: Activity,
};

export const LoadProfileSelector: FC<LoadProfileSelectorProps> = ({
  selected,
  onSelect,
}) => {
  const sizes: LoadProfileSize[] = ["small", "medium", "max"];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
          Load Profile
        </h3>
        <span className="font-mono text-[10px] text-[var(--ink-muted)]">
          Cap: {SCALE_CAPACITY_POLICY.maxMonitoredMembers.toLocaleString()} members
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {sizes.map((size) => {
          const profile: LoadProfile = LOAD_PROFILES[size];
          const Icon = PROFILE_ICONS[size];
          const isActive = selected === size;
          const utilization = (profile.memberCount / SCALE_CAPACITY_POLICY.maxMonitoredMembers) * 100;
          const isAtCap = profile.memberCount >= SCALE_CAPACITY_POLICY.maxMonitoredMembers;

          return (
            <button
              key={size}
              type="button"
              onClick={() => onSelect(size)}
              className={`relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-all ${
                isActive
                  ? "border-[var(--recovery-green)] bg-[var(--recovery-light)] shadow-sm"
                  : "border-[var(--hairline)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--hairline-strong)]"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--recovery-green)]" />
              )}

              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isActive ? "text-[var(--recovery-green)]" : "text-[var(--ink-muted)]"}`} />
                <span className={`text-[12px] font-medium ${isActive ? "text-[#147D68]" : "text-[var(--ink-secondary)]"}`}>
                  {profile.label}
                </span>
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">Events</span>
                  <span className="font-mono tabular-nums text-[var(--ink-secondary)]">
                    {profile.eventCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">Jobs</span>
                  <span className="font-mono tabular-nums text-[var(--ink-secondary)]">
                    {profile.jobCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">Courses</span>
                  <span className="font-mono tabular-nums text-[var(--ink-secondary)]">
                    {profile.courseCount}
                  </span>
                </div>
              </div>

              {/* Utilization bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-[var(--ink-muted)]">Cap utilization</span>
                  <span className={`font-mono text-[9px] tabular-nums ${
                    isAtCap ? "text-[var(--warning)]" : "text-[var(--ink-muted)]"
                  }`}>
                    {utilization.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--canvas-elevated)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isAtCap
                        ? "bg-[var(--warning)]"
                        : utilization > 50
                          ? "bg-[var(--recovery-green)]"
                          : "bg-[var(--ink-muted)]"
                    }`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
