"use client";

import { useCallback, useRef, useState } from "react";
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { MutationState } from "@/components/interaction/mutation-feedback";

// ── Optimistic mutation hook ───────────────────────────────────
// Wraps TanStack Query's useMutation with optimistic update + rollback.
// Provides mutate, rollback, canUndo.
// Undo automatically rolls back optimistic data.
// After server response, clears undo window.

const UNDO_WINDOW_MS = 5000;

export interface UseOptimisticMutationOptions<
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "onMutate" | "onError" | "onSuccess"
  > {
  /** Query key to update optimistically. */
  queryKey: readonly unknown[];
  /** Produce optimistic data from the current cached data and mutation variables. */
  optimisticUpdater: (current: TData | undefined, variables: TVariables) => TData;
  /** Whether this mutation is reversible (undo available). Default true. */
  reversible?: boolean;
  /** Called on successful server response. */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called on mutation error. Rollback happens automatically. */
  onError?: (error: TError, variables: TVariables) => void;
}

export interface UseOptimisticMutationResult<
  TData,
  TError = Error,
  TVariables = void,
> {
  /** Trigger the mutation with optimistic update. */
  mutate: (variables: TVariables) => void;
  /** Whether the mutation is in flight. */
  isPending: boolean;
  /** Manually roll back to pre-mutation state. Only works within undo window. */
  rollback: () => void;
  /** Whether undo is currently available. */
  canUndo: boolean;
  /** Current mutation state for feedback display. */
  mutationState: MutationState;
  /** The mutation result from TanStack Query. */
  data: TData | undefined;
  /** The error, if any. */
  error: TError | null;
  /** Reset to idle state. */
  reset: () => void;
}

export function useOptimisticMutation<
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseOptimisticMutationOptions<TData, TError, TVariables, TContext>
): UseOptimisticMutationResult<TData, TError, TVariables> {
  const {
    queryKey,
    optimisticUpdater,
    reversible = true,
    onSuccess,
    onError,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();
  const [mutationState, setMutationState] = useState<MutationState>("idle");
  const [canUndo, setCanUndo] = useState(false);

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<TData | undefined>(undefined);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current !== null) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);
      previousDataRef.current = previousData;

      // Optimistically update to the new value
      const optimisticData = optimisticUpdater(previousData, variables);
      queryClient.setQueryData(queryKey, optimisticData);

      setMutationState("pending");
      setCanUndo(false);
      clearUndoTimer();

      // Return context with the snapshot for rollback
      return { previousData } as TContext;
    },
    onError: (error, variables, context) => {
      // Rollback to the previous value on error
      if (context && typeof context === "object" && "previousData" in context) {
        queryClient.setQueryData(queryKey, (context as { previousData: TData }).previousData);
      }
      setMutationState("failure");
      setCanUndo(false);
      clearUndoTimer();
      onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      setMutationState("success");

      // Open undo window for reversible actions
      if (reversible) {
        setCanUndo(true);
        undoTimerRef.current = setTimeout(() => {
          setCanUndo(false);
          undoTimerRef.current = null;
          // After undo window expires, keep success state
        }, UNDO_WINDOW_MS);
      }

      onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server-truth
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const rollback = useCallback(() => {
    if (!canUndo) return;

    clearUndoTimer();

    // Roll back to the pre-mutation data
    if (previousDataRef.current !== undefined) {
      queryClient.setQueryData(queryKey, previousDataRef.current);
    }

    setMutationState("idle");
    setCanUndo(false);
  }, [canUndo, clearUndoTimer, queryClient, queryKey]);

  const reset = useCallback(() => {
    clearUndoTimer();
    mutation.reset();
    setMutationState("idle");
    setCanUndo(false);
  }, [clearUndoTimer, mutation]);

  return {
    mutate: (variables) => mutation.mutate(variables),
    isPending: mutation.isPending,
    rollback,
    canUndo,
    mutationState,
    data: mutation.data,
    error: mutation.error ?? null,
    reset,
  };
}
