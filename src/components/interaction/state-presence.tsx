"use client";

/**
 * StatePresence — unified state display component per spec 06_STATE_SYSTEM.md.
 *
 * Every primary screen must support these states:
 *   idle, loading, empty, populated, partial, stale,
 *   permission-error, network-error, server-error, plan-limit, paused
 *
 * Each state answers:
 *   - What happened
 *   - Whether data is incomplete
 *   - What can be done now
 *   - Whether retry is safe
 *   - Whether an action already occurred
 *
 * Usage:
 *   <StatePresence
 *     state={dataState}
 *     data={students}
 *     loading={<StudentListSkeleton />}
 *     empty={<EmptyStudents />}
 *   >
 *     {(students) => <StudentTable data={students} />}
 *   </StatePresence>
 */

import { type ReactNode } from "react";
import { AlertTriangle, WifiOff, Server, Lock, PauseCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── State type ───

export type DataState =
  | "idle"
  | "loading"
  | "empty"
  | "populated"
  | "partial"
  | "stale"
  | "permission-error"
  | "network-error"
  | "server-error"
  | "plan-limit"
  | "paused";

// ─── State metadata ───

/** Each state answers the five required questions from the spec. */
export interface StateMeta {
  /** What happened */
  what: string;
  /** Whether data is incomplete */
  isIncomplete: boolean;
  /** What can be done now (human-readable) */
  action: string;
  /** Whether retry is safe */
  retrySafe: boolean;
  /** Whether an action already occurred */
  actionOccurred: boolean;
}

const STATE_META: Record<DataState, StateMeta> = {
  idle: {
    what: "Waiting to load data",
    isIncomplete: true,
    action: "Data will load automatically",
    retrySafe: true,
    actionOccurred: false,
  },
  loading: {
    what: "Loading data",
    isIncomplete: true,
    action: "Wait for data to load",
    retrySafe: false,
    actionOccurred: false,
  },
  empty: {
    what: "No data available",
    isIncomplete: false,
    action: "Add data or adjust filters",
    retrySafe: true,
    actionOccurred: false,
  },
  populated: {
    what: "Data loaded successfully",
    isIncomplete: false,
    action: "Interact with the data",
    retrySafe: false,
    actionOccurred: false,
  },
  partial: {
    what: "Some data is still loading",
    isIncomplete: true,
    action: "Wait for remaining data, or work with what's available",
    retrySafe: true,
    actionOccurred: false,
  },
  stale: {
    what: "Data may be out of date",
    isIncomplete: false,
    action: "Refresh to get the latest data",
    retrySafe: true,
    actionOccurred: false,
  },
  "permission-error": {
    what: "You don't have permission to view this",
    isIncomplete: true,
    action: "Contact an administrator for access",
    retrySafe: false,
    actionOccurred: false,
  },
  "network-error": {
    what: "Unable to reach the server",
    isIncomplete: true,
    action: "Check your connection and try again",
    retrySafe: true,
    actionOccurred: false,
  },
  "server-error": {
    what: "The server encountered an error",
    isIncomplete: true,
    action: "Try again in a moment",
    retrySafe: true,
    actionOccurred: false,
  },
  "plan-limit": {
    what: "You've reached your plan limit",
    isIncomplete: true,
    action: "Upgrade your plan or reduce usage",
    retrySafe: false,
    actionOccurred: true,
  },
  paused: {
    what: "Processing is paused",
    isIncomplete: true,
    action: "Resume to continue processing",
    retrySafe: true,
    actionOccurred: true,
  },
};

export function getStateMeta(state: DataState): StateMeta {
  return STATE_META[state];
}

// ─── Error states ───

const ERROR_STATES: DataState[] = [
  "permission-error",
  "network-error",
  "server-error",
  "plan-limit",
];

function isErrorState(state: DataState): boolean {
  return ERROR_STATES.includes(state);
}

const ERROR_ICONS: Partial<Record<DataState, typeof AlertTriangle>> = {
  "permission-error": Lock,
  "network-error": WifiOff,
  "server-error": Server,
  "plan-limit": AlertTriangle,
};

const ERROR_TITLES: Partial<Record<DataState, string>> = {
  "permission-error": "Permission denied",
  "network-error": "Connection lost",
  "server-error": "Server error",
  "plan-limit": "Plan limit reached",
};

// ─── Default error fallback ───

interface DefaultErrorFallbackProps {
  state: DataState;
  retry?: () => void;
  className?: string;
}

function DefaultErrorFallback({ state, retry, className }: DefaultErrorFallbackProps) {
  const meta = STATE_META[state];
  const Icon = ERROR_ICONS[state] ?? AlertTriangle;
  const title = ERROR_TITLES[state] ?? "Something went wrong";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-6 py-12 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--critical-light)]/40">
        <Icon className="size-6 text-[var(--critical)]" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-[var(--ink-primary)]">{title}</h3>
        <p className="text-sm text-[var(--ink-secondary)]">{meta.what}</p>
        <p className="text-xs text-[var(--ink-muted)]">{meta.action}</p>
      </div>
      {meta.retrySafe && retry && (
        <Button
          variant="outline"
          size="sm"
          onClick={retry}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── Default loading fallback ───

interface DefaultLoadingFallbackProps {
  className?: string;
  rows?: number;
}

function DefaultLoadingFallback({ className, rows = 3 }: DefaultLoadingFallbackProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-[var(--hairline)]"
        />
      ))}
    </div>
  );
}

// ─── Default empty fallback ───

interface DefaultEmptyFallbackProps {
  className?: string;
  message?: string;
}

function DefaultEmptyFallback({ className, message = "Nothing to show" }: DefaultEmptyFallbackProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-6 py-12 text-center",
        className
      )}
    >
      <p className="text-sm text-[var(--ink-muted)]">{message}</p>
    </div>
  );
}

// ─── Default stale indicator ───

interface StaleIndicatorProps {
  className?: string;
  onRefresh?: () => void;
}

function StaleIndicator({ className, onRefresh }: StaleIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--warning-light)] bg-[var(--warning-light)]/40 px-3 py-2 text-xs font-medium text-[var(--warning)]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Clock className="size-3.5" />
      <span>Data may be stale</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-1 inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:no-underline"
        >
          Refresh
        </button>
      )}
    </div>
  );
}

// ─── Main component ───

export interface StatePresenceProps<T> {
  /** Current data state */
  state: DataState;
  /** Data to pass to children when populated/stale/partial */
  data?: T;
  /** Render function called with data when state is populated/stale/partial */
  children: (data: T) => ReactNode;
  /** Custom loading fallback */
  loading?: ReactNode;
  /** Custom empty fallback */
  empty?: ReactNode;
  /** Custom error fallback (covers all error states) */
  error?: ReactNode;
  /** Custom stale fallback (rendered ABOVE the data, which is still shown) */
  stale?: ReactNode;
  /** Custom plan-limit fallback */
  planLimit?: ReactNode;
  /** Custom paused fallback */
  paused?: ReactNode;
  /** Retry callback (used by default error fallback) */
  onRetry?: () => void;
  /** Refresh callback (used by stale indicator) */
  onRefresh?: () => void;
  /** Number of skeleton rows for default loading */
  skeletonRows?: number;
  /** Class name for the container */
  className?: string;
}

export function StatePresence<T>({
  state,
  data,
  children,
  loading,
  empty,
  error,
  stale,
  planLimit,
  paused,
  onRetry,
  onRefresh,
  skeletonRows,
  className,
}: StatePresenceProps<T>) {
  // ─── Loading states ───
  if (state === "idle" || state === "loading") {
    return (
      <div className={className} data-state={state}>
        {loading ?? <DefaultLoadingFallback rows={skeletonRows} />}
      </div>
    );
  }

  // ─── Empty ───
  if (state === "empty") {
    return (
      <div className={className} data-state={state}>
        {empty ?? <DefaultEmptyFallback />}
      </div>
    );
  }

  // ─── Populated ───
  if (state === "populated" && data !== undefined) {
    return (
      <div className={className} data-state={state}>
        {children(data)}
      </div>
    );
  }

  // ─── Stale: render data with staleness indicator above ───
  if (state === "stale" && data !== undefined) {
    return (
      <div className={cn("flex flex-col gap-3", className)} data-state={state}>
        {stale ?? <StaleIndicator onRefresh={onRefresh} />}
        {children(data)}
      </div>
    );
  }

  // ─── Partial: render data with partial indicator ───
  if (state === "partial" && data !== undefined) {
    return (
      <div className={cn("flex flex-col gap-3", className)} data-state={state}>
        <div
          className="flex items-center gap-2 rounded-lg border border-[var(--warning-light)] bg-[var(--warning-light)]/20 px-3 py-1.5 text-xs text-[var(--warning)]"
          role="status"
        >
          <RefreshCw className="size-3 animate-spin" />
          <span>Loading remaining data…</span>
        </div>
        {children(data)}
      </div>
    );
  }

  // ─── Paused ───
  if (state === "paused") {
    return (
      <div className={cn("flex flex-col gap-3", className)} data-state={state}>
        {paused ?? (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-6 py-12 text-center"
            role="status"
          >
            <PauseCircle className="size-8 text-[var(--ink-muted)]" />
            <p className="text-sm text-[var(--ink-secondary)]">
              Processing is paused. Resume to continue.
            </p>
          </div>
        )}
        {/* If we still have data, render it below the paused indicator */}
        {data !== undefined && children(data)}
      </div>
    );
  }

  // ─── Plan limit ───
  if (state === "plan-limit") {
    return (
      <div className={className} data-state={state}>
        {planLimit ?? error ?? <DefaultErrorFallback state={state} retry={onRetry} />}
      </div>
    );
  }

  // ─── All other error states ───
  if (isErrorState(state)) {
    return (
      <div className={className} data-state={state}>
        {error ?? <DefaultErrorFallback state={state} retry={onRetry} />}
      </div>
    );
  }

  // ─── Fallback: if data is available despite unexpected state, render it ───
  if (data !== undefined) {
    return (
      <div className={className} data-state={state}>
        {children(data)}
      </div>
    );
  }

  // ─── No data, unexpected state → default loading ───
  return (
    <div className={className} data-state={state}>
      {loading ?? <DefaultLoadingFallback />}
    </div>
  );
}
