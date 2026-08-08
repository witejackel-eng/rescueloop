"use client";

import { useState, useCallback, useRef } from "react";
import { MutationFeedback, type MutationState } from "./mutation-feedback";

// ── Optimistic update with deterministic rollback ──────────────
// Returns [data, mutate, isPending, rollback, canUndo]
// Undo window (5s) after which undo disappears.

const UNDO_WINDOW_MS = 5000;

export interface OptimisticUpdateOptions<T> {
  /** The async mutation function. */
  mutationFn: () => Promise<T>;
  /** The optimistic data to show immediately. */
  optimisticData: T;
  /** The data to roll back to on undo or failure. */
  rollbackData: T;
  /** Called on successful server response. */
  onSuccess?: (data: T) => void;
  /** Called on mutation error. Rollback happens automatically. */
  onError?: (error: Error) => void;
  /** Whether this mutation is reversible (undo available). Default true. */
  reversible?: boolean;
}

export interface OptimisticUpdateResult<T> {
  /** Current data (optimistic or confirmed). */
  data: T;
  /** Trigger the mutation. Shows optimistic data immediately. */
  mutate: () => void;
  /** Whether the mutation is in flight. */
  isPending: boolean;
  /** Manually roll back to previous data. Only works within undo window. */
  rollback: () => void;
  /** Whether undo is currently available. */
  canUndo: boolean;
  /** Current mutation state for feedback display. */
  mutationState: MutationState;
  /** Reset to idle state. */
  reset: () => void;
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T>
): OptimisticUpdateResult<T> {
  const {
    mutationFn,
    optimisticData,
    rollbackData,
    onSuccess,
    onError,
    reversible = true,
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [mutationState, setMutationState] = useState<MutationState>("idle");
  const [canUndo, setCanUndo] = useState(false);

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<T>(initialData);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current !== null) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const mutate = useCallback(() => {
    // Save current data for rollback
    previousDataRef.current = data;

    // Show optimistic data immediately
    setData(optimisticData);
    setMutationState("pending");
    setCanUndo(false);
    clearUndoTimer();

    mutationFn()
      .then((result) => {
        setMutationState("success");
        setData(result);

        // Open undo window for reversible actions
        if (reversible) {
          setCanUndo(true);
          undoTimerRef.current = setTimeout(() => {
            setCanUndo(false);
            undoTimerRef.current = null;
          }, UNDO_WINDOW_MS);
        }

        onSuccess?.(result);
      })
      .catch((err: unknown) => {
        // Deterministic rollback on failure
        setData(rollbackData);
        setMutationState("failure");
        setCanUndo(false);
        clearUndoTimer();

        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
      });
  }, [data, optimisticData, rollbackData, mutationFn, onSuccess, onError, reversible, clearUndoTimer]);

  const rollback = useCallback(() => {
    if (!canUndo) return;

    clearUndoTimer();
    setData(previousDataRef.current);
    setMutationState("idle");
    setCanUndo(false);
  }, [canUndo, clearUndoTimer]);

  const reset = useCallback(() => {
    clearUndoTimer();
    setData(initialData);
    setMutationState("idle");
    setCanUndo(false);
  }, [initialData, clearUndoTimer]);

  return {
    data,
    mutate,
    isPending: mutationState === "pending",
    rollback,
    canUndo,
    mutationState,
    reset,
  };
}

// ── Optimistic update wrapper component ────────────────────────
// Combines useOptimisticUpdate with MutationFeedback for convenience.

export interface OptimisticUpdateProps<T> {
  /** Initial/confirmed data. */
  initialData: T;
  /** Mutation options. */
  options: OptimisticUpdateOptions<T>;
  /** Render children with the current data and mutation controls. */
  children: (result: OptimisticUpdateResult<T>) => React.ReactNode;
  /** Label for the mutation feedback. */
  label?: string;
}

export function OptimisticUpdate<T>({
  initialData,
  options,
  children,
  label,
}: OptimisticUpdateProps<T>) {
  const result = useOptimisticUpdate(initialData, options);

  return (
    <>
      {children(result)}
      <MutationFeedback
        state={result.mutationState}
        label={label}
        onUndo={result.rollback}
        undoAvailable={result.canUndo}
      />
    </>
  );
}
