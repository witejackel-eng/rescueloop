"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Unplug,
} from "lucide-react";
import type { ProviderState } from "@/lib/types/operations";

// ── Props ───────────────────────────────────────────────────
interface ProviderStateDisplayProps {
  state: ProviderState;
}

// ── Component ───────────────────────────────────────────────
export function ProviderStateDisplay({ state }: ProviderStateDisplayProps) {
  // Healthy = nothing to show
  if (state.type === "healthy") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.type}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2"
      >
        {state.type === "delayed" && (
          <DelayedState reason={state.reason} since={state.since} />
        )}
        {state.type === "retrying" && (
          <RetryingState
            attempt={state.attempt}
            maxAttempts={state.maxAttempts}
            nextRetryAt={state.nextRetryAt}
          />
        )}
        {state.type === "permission_required" && (
          <PermissionState
            permission={state.permission}
            actionUrl={state.actionUrl}
          />
        )}
        {state.type === "disconnected" && (
          <DisconnectedState
            reason={state.reason}
            reconnectUrl={state.reconnectUrl}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Delayed ─────────────────────────────────────────────────
function DelayedState({ reason, since }: { reason: string; since: string }) {
  return (
    <div className="flex items-start gap-2">
      <AlertTriangle
        className="size-3.5 mt-0.5 text-[var(--warning)] shrink-0"
        strokeWidth={2.25}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] text-[var(--ink-primary)]">
          Provider delayed
        </span>
        <span className="text-[11px] text-[var(--ink-muted)]">
          {reason} (since {formatTime(since)})
        </span>
        <span className="text-[11px] text-[var(--ink-muted)]">
          Your progress is safe. The operation will continue when the provider
          responds.
        </span>
      </div>
    </div>
  );
}

// ── Retrying ────────────────────────────────────────────────
function RetryingState({
  attempt,
  maxAttempts,
  nextRetryAt,
}: {
  attempt: number;
  maxAttempts: number;
  nextRetryAt: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <RefreshCw
        className="size-3.5 mt-0.5 text-[var(--warning)] shrink-0 animate-spin"
        strokeWidth={2.25}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] text-[var(--ink-primary)]">
          Retrying ({attempt}/{maxAttempts})
        </span>
        <span className="text-[11px] text-[var(--ink-muted)]">
          Next attempt at {formatTime(nextRetryAt)}. No action needed.
        </span>
      </div>
    </div>
  );
}

// ── Permission required ─────────────────────────────────────
function PermissionState({
  permission,
  actionUrl,
}: {
  permission: string;
  actionUrl: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <ShieldAlert
        className="size-3.5 mt-0.5 text-[var(--critical)] shrink-0"
        strokeWidth={2.25}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] text-[var(--ink-primary)]">
          Action required
        </span>
        <span className="text-[11px] text-[var(--ink-muted)]">
          {permission}
        </span>
        <a
          href={actionUrl}
          className="text-[11px] text-[var(--recovery-green)] underline underline-offset-2 hover:text-[var(--ink-primary)] transition-colors"
        >
          Grant permission →
        </a>
      </div>
    </div>
  );
}

// ── Disconnected ────────────────────────────────────────────
function DisconnectedState({
  reason,
  reconnectUrl,
}: {
  reason: string;
  reconnectUrl?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Unplug
        className="size-3.5 mt-0.5 text-[var(--critical)] shrink-0"
        strokeWidth={2.25}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] text-[var(--ink-primary)]">
          Disconnected
        </span>
        <span className="text-[11px] text-[var(--ink-muted)]">{reason}</span>
        {reconnectUrl && (
          <a
            href={reconnectUrl}
            className="text-[11px] text-[var(--recovery-green)] underline underline-offset-2 hover:text-[var(--ink-primary)] transition-colors"
          >
            Reconnect →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}
