import { cn } from "@/lib/utils";
import {
  attributionMeta,
  automationStateMeta,
  interventionStateMeta,
  membershipStatusMeta,
  momentumMeta,
  priorityMeta,
} from "@/lib/format";
import type {
  AttributionLevel,
  AutomationState,
  InterventionState,
  MembershipStatus,
  Momentum,
  Priority,
} from "@/lib/types";

interface PillProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

export function StatusPill({ children, className, dot, dotColor }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotColor)} />}
      {children}
    </span>
  );
}

export function AutomationStatePill({ state }: { state: AutomationState }) {
  const meta = automationStateMeta[state];
  return (
    <StatusPill className={meta.color} dot dotColor={meta.dot}>
      {meta.label}
    </StatusPill>
  );
}

export function InterventionStatePill({ state }: { state: InterventionState }) {
  const meta = interventionStateMeta[state];
  return (
    <StatusPill className={meta.color} dot dotColor={meta.dot}>
      {meta.label}
    </StatusPill>
  );
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const meta = priorityMeta[priority];
  return <StatusPill className={meta.color}>{meta.label}</StatusPill>;
}

export function MembershipStatusPill({ status }: { status: MembershipStatus }) {
  const meta = membershipStatusMeta[status];
  return <StatusPill className={meta.color}>{meta.label}</StatusPill>;
}

export function AttributionPill({ level }: { level: AttributionLevel }) {
  const meta = attributionMeta[level];
  return <StatusPill className={meta.color}>{meta.label}</StatusPill>;
}

export function MomentumPill({ momentum }: { momentum: Momentum }) {
  const meta = momentumMeta[momentum];
  return (
    <StatusPill className="border-[#E3E5DF] bg-[#F8F8F5] text-[#6A706A]">
      <span className={meta.color}>●</span>
      {meta.label}
    </StatusPill>
  );
}
