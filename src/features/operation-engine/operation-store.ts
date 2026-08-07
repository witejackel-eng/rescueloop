"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Operation,
  OperationStage,
  OperationStatus,
  PersistenceState,
  ProviderState,
  CandidatePreview,
} from "@/lib/types/operations";

// ── Store shape ─────────────────────────────────────────────
interface OperationStoreState {
  /** All known operations, keyed by id */
  operations: Record<string, Operation>;

  // ── Actions ──
  /** Add or replace an operation */
  upsertOperation: (op: Operation) => void;

  /** Update a specific operation's fields */
  updateOperation: (
    id: string,
    patch: {
      status?: OperationStatus;
      stages?: OperationStage[];
      currentStageIndex?: number;
      persistenceState?: PersistenceState;
      providerState?: ProviderState;
      candidatePreview?: CandidatePreview | null;
      completedAt?: string;
    },
  ) => void;

  /** Update a single stage's processed/total within an operation */
  updateStageProgress: (
    operationId: string,
    stageId: string,
    processed: number,
    total?: number,
    status?: OperationStage["status"],
  ) => void;

  /** Remove an operation */
  removeOperation: (id: string) => void;

  /** Clear all operations */
  clearAll: () => void;
}

// ── Store ───────────────────────────────────────────────────
export const useOperationStore = create<OperationStoreState>()(
  persist(
    (set, get) => ({
      operations: {},

      upsertOperation: (op) =>
        set((state) => ({
          operations: { ...state.operations, [op.id]: op },
        })),

      updateOperation: (id, patch) =>
        set((state) => {
          const existing = state.operations[id];
          if (!existing) return state;
          const updated: Operation = {
            ...existing,
            ...patch,
            updatedAt: new Date().toISOString(),
            candidatePreview:
              patch.candidatePreview === null
                ? undefined
                : patch.candidatePreview ?? existing.candidatePreview,
          };
          return {
            operations: { ...state.operations, [id]: updated },
          };
        }),

      updateStageProgress: (operationId, stageId, processed, total, status) =>
        set((state) => {
          const op = state.operations[operationId];
          if (!op) return state;
          const stages = op.stages.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  processed,
                  ...(total !== undefined ? { total } : {}),
                  ...(status !== undefined ? { status } : {}),
                }
              : s,
          );
          return {
            operations: {
              ...state.operations,
              [operationId]: {
                ...op,
                stages,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      removeOperation: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.operations;
          return { operations: rest };
        }),

      clearAll: () => set({ operations: {} }),
    }),
    {
      name: "rescueloop-operations-v1",
      partialize: (state) => ({
        operations: state.operations,
      }),
    },
  ),
);

// ── Selectors ───────────────────────────────────────────────
export function useOperation(id: string) {
  return useOperationStore((s) => s.operations[id]);
}

export function useAllOperations() {
  return useOperationStore((s) => Object.values(s.operations));
}

export function useRunningOperations() {
  return useOperationStore((s) =>
    Object.values(s.operations).filter((op) => op.status === "running"),
  );
}
