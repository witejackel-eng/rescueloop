"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Undo2,
  Ban,
  Pause,
  ShieldAlert,
  MinusCircle,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/brand/copy";

// ── Mutation state type ────────────────────────────────────────
// Every mutation supports: idle, pressed, pending, success, failure,
// safe retry, duplicate/idempotent response, permission denied,
// plan limit, and paused/suppressed states.

export type MutationState =
  | "idle"
  | "pressed"
  | "pending"
  | "success"
  | "failure"
  | "retrying"
  | "permission-denied"
  | "plan-limit"
  | "paused"
  | "suppressed";

// ── Truthful label mapping ─────────────────────────────────────
// Never claim delivered without evidence. Use truthful labels:
// saved, scheduled, queued, provider accepted, suppressed, failed, retrying

const STATE_LABELS: Record<MutationState, string> = {
  idle: "",
  pressed: "",
  pending: "Saving…",
  success: copy.states.queued, // default to "queued" — caller overrides via label prop
  failure: copy.states.failed,
  retrying: "Retrying…",
  "permission-denied": "Permission denied",
  "plan-limit": "Plan limit reached",
  paused: copy.states.suppressed,
  suppressed: copy.states.suppressed,
};

const STATE_ICONS: Record<MutationState, LucideIcon | null> = {
  idle: null,
  pressed: null,
  pending: Loader2,
  success: CheckCircle2,
  failure: XCircle,
  retrying: RotateCcw,
  "permission-denied": Ban,
  "plan-limit": ShieldAlert,
  paused: Pause,
  suppressed: MinusCircle,
};

const STATE_BADGE_VARIANT: Record<MutationState, "default" | "secondary" | "destructive" | "outline"> = {
  idle: "secondary",
  pressed: "secondary",
  pending: "outline",
  success: "default",
  failure: "destructive",
  retrying: "outline",
  "permission-denied": "destructive",
  "plan-limit": "destructive",
  paused: "secondary",
  suppressed: "secondary",
};

// ── Props ──────────────────────────────────────────────────────

export interface MutationFeedbackProps {
  /** Current mutation state. */
  state: MutationState;
  /** Truthful label override — use copy.states values. */
  label?: string;
  /** Called when the user clicks retry (only shown in failure / retrying states). */
  onRetry?: () => void;
  /** Called when the user clicks undo (only shown when undoAvailable is true). */
  onUndo?: () => void;
  /** Whether undo is available for this mutation. Only show for reversible actions. */
  undoAvailable?: boolean;
  /** Undo window in milliseconds — after this, the undo button disappears. Default 5000. */
  undoWindowMs?: number;
  /** Additional className for the outer wrapper. */
  className?: string;
  /** Compact mode: only icon, no text label. */
  compact?: boolean;
}

// ── Component ──────────────────────────────────────────────────

export function MutationFeedback({
  state,
  label,
  onRetry,
  onUndo,
  undoAvailable = false,
  undoWindowMs = 5000,
  className,
  compact = false,
}: MutationFeedbackProps) {
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(undoWindowMs);

  // Undo window timer — combined with state tracking
  useEffect(() => {
    if (!undoAvailable || state !== "success") {
      // Not in a success state with undo available — hide undo
      return;
    }

    // Start undo window
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = undoWindowMs - elapsed;
      if (remaining <= 0) {
        setUndoVisible(false);
        clearInterval(interval);
      } else {
        setUndoCountdown(remaining);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [undoAvailable, state, undoWindowMs]);

  const displayLabel = label ?? STATE_LABELS[state];
  const Icon = STATE_ICONS[state];
  const variant = STATE_BADGE_VARIANT[state];
  const isPending = state === "pending" || state === "retrying";
  const isActionable = state === "failure" || state === "retrying";

  if (state === "idle" || state === "pressed") {
    // Nothing visible for idle/pressed (press feedback handled by parent)
    return null;
  }

  return (
    <span
      className={className}
      role="status"
      aria-live={isPending ? "assertive" : "polite"}
      aria-label={displayLabel || undefined}
    >
      <Badge variant={variant} className="gap-1.5">
        {Icon && (
          <Icon
            className={`size-3 ${isPending ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        )}
        {!compact && displayLabel && <span>{displayLabel}</span>}
      </Badge>

      {/* Retry button — only for failure states with a retry handler */}
      {isActionable && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="ml-2 h-6 px-2 text-xs"
          aria-label="Retry"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          {!compact && <span>Retry</span>}
        </Button>
      )}

      {/* Undo button — only for reversible actions within the undo window */}
      {undoVisible && onUndo && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          className="ml-2 h-6 px-2 text-xs"
          aria-label={`Undo (${Math.ceil(undoCountdown / 1000)}s)`}
        >
          <Undo2 className="size-3" aria-hidden="true" />
          {!compact && (
            <span>Undo ({Math.ceil(undoCountdown / 1000)}s)</span>
          )}
        </Button>
      )}
    </span>
  );
}

// ── Truthful label helper ──────────────────────────────────────
// Maps InterventionState to MutationState for use with MutationFeedback

export function interventionToMutationState(
  s:
    | "detected"
    | "awaiting_approval"
    | "approved"
    | "scheduled"
    | "queued"
    | "sent"
    | "opened"
    | "responded"
    | "recovered"
    | "not_recovered"
    | "dismissed"
    | "stopped"
): MutationState {
  switch (s) {
    case "detected":
    case "awaiting_approval":
      return "idle";
    case "approved":
    case "queued":
      return "pending";
    case "scheduled":
      return "pending";
    case "sent":
      return "success"; // provider accepted
    case "opened":
    case "responded":
      return "success";
    case "recovered":
      return "success";
    case "not_recovered":
      return "failure";
    case "dismissed":
      return "suppressed";
    case "stopped":
      return "paused";
  }
}

/** Get the truthful label for an intervention state. */
export function interventionLabel(
  s:
    | "detected"
    | "awaiting_approval"
    | "approved"
    | "scheduled"
    | "queued"
    | "sent"
    | "opened"
    | "responded"
    | "recovered"
    | "not_recovered"
    | "dismissed"
    | "stopped"
): string {
  switch (s) {
    case "approved":
      return copy.states.approved;
    case "scheduled":
      return copy.states.scheduled;
    case "queued":
      return copy.states.queued;
    case "sent":
      return copy.states.providerAccepted;
    case "responded":
      return copy.states.responded;
    case "recovered":
      return copy.states.returned;
    case "not_recovered":
      return copy.states.failed;
    case "dismissed":
      return copy.states.suppressed;
    default:
      return s.replace(/_/g, " ");
  }
}
