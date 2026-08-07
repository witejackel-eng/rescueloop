"use client";

import { useCallback, useRef } from "react";
import type {
  Operation,
  OperationStage,
  ProviderState,
  CandidatePreview,
} from "@/lib/types/operations";
import { useOperationStore } from "./operation-store";

// ── Simulated totals (realistic Whop course creator data) ────
const SIM_TOTALS = {
  connecting: 1,
  members: 247,
  courses: 12,
  evaluating: 247, // one evaluation per member
};

// ── Timing configuration (ms) ───────────────────────────────
const TIMING = {
  connectingDelay: 1200,
  memberBatchSize: 15, // members per tick
  memberTickInterval: 300,
  courseBatchSize: 1,
  courseTickInterval: 500,
  evalBatchSize: 20, // evaluations per tick
  evalTickInterval: 200,
  persistAfterMs: 2000,
};

// ── Hook ────────────────────────────────────────────────────
/** Provides a `startDemoSync` function that simulates a Whop sync
 *  operation with realistic timing and real counts. The simulation
 *  updates the Zustand store directly, so components subscribed
 *  to the store will re-render as progress changes. */
export function useDemoSyncSimulation() {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const upsertOperation = useOperationStore((s) => s.upsertOperation);
  const updateOperation = useOperationStore((s) => s.updateOperation);
  const updateStageProgress = useOperationStore((s) => s.updateStageProgress);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) {
      clearTimeout(t);
    }
    timersRef.current = [];
  }, []);

  const startDemoSync = useCallback(() => {
    clearTimers();

    const id = `op_sync_${Date.now()}`;
    const now = new Date().toISOString();

    // Create the initial operation
    const operation: Operation = {
      id,
      type: "whop_sync",
      status: "running",
      stages: [
        { id: "connecting", label: "Connecting", status: "active", processed: 0, total: SIM_TOTALS.connecting },
        { id: "fetching_members", label: "Fetching members", status: "pending", processed: 0, total: SIM_TOTALS.members },
        { id: "fetching_courses", label: "Fetching courses", status: "pending", processed: 0, total: SIM_TOTALS.courses },
        { id: "evaluating", label: "Evaluating", status: "pending", processed: 0, total: SIM_TOTALS.evaluating },
        { id: "complete", label: "Complete", status: "pending", processed: 0, total: 1 },
      ],
      currentStageIndex: 0,
      persistenceState: "not_persisted",
      providerState: { type: "healthy" },
      createdAt: now,
      updatedAt: now,
    };

    upsertOperation(operation);

    // Also persist to API in background (fire-and-forget)
    persistToApi(operation);

    // ── Stage 0: Connecting ───────────────────────────────
    const t1 = setTimeout(() => {
      updateStageProgress(id, "connecting", 1, undefined, "complete");
      updateOperation(id, {
        currentStageIndex: 1,
        persistenceState: "persisting",
      });

      // Mark as persisted after a brief delay
      const tPersist = setTimeout(() => {
        updateOperation(id, { persistenceState: "persisted" });
      }, 800);
      timersRef.current.push(tPersist);

      // ── Stage 1: Fetching members ──────────────────────
      let membersFetched = 0;
      const memberTick = () => {
        membersFetched = Math.min(
          membersFetched + TIMING.memberBatchSize,
          SIM_TOTALS.members,
        );
        const done = membersFetched >= SIM_TOTALS.members;
        updateStageProgress(
          id,
          "fetching_members",
          membersFetched,
          undefined,
          done ? "complete" : "active",
        );

        // Show first candidate preview partway through
        if (membersFetched === TIMING.memberBatchSize * 3) {
          updateOperation(id, {
            candidatePreview: {
              id: "stu_preview_1",
              name: "Maya Chen",
              riskSegment: "early_stall",
              monthlyValue: 79,
              recommendedAction: "Send progress nudge — stalled at lesson 4 of 18",
            },
          });
        }

        // Simulate a brief provider delay partway through
        if (membersFetched === TIMING.memberBatchSize * 6) {
          updateOperation(id, {
            providerState: {
              type: "delayed",
              since: new Date().toISOString(),
              reason: "Whop API rate limit",
            },
          });
          // Clear delay after 2s
          const tDelay = setTimeout(() => {
            updateOperation(id, {
              providerState: { type: "healthy" },
            });
          }, 2000);
          timersRef.current.push(tDelay);
        }

        if (!done) {
          const t = setTimeout(memberTick, TIMING.memberTickInterval);
          timersRef.current.push(t);
        } else {
          // Move to next stage
          updateOperation(id, { currentStageIndex: 2 });
          startCourseFetch();
        }
      };
      const t2 = setTimeout(memberTick, TIMING.memberTickInterval);
      timersRef.current.push(t2);
    }, TIMING.connectingDelay);
    timersRef.current.push(t1);

    // ── Stage 2: Fetching courses ─────────────────────────
    const startCourseFetch = () => {
      let coursesFetched = 0;
      const courseTick = () => {
        coursesFetched = Math.min(
          coursesFetched + TIMING.courseBatchSize,
          SIM_TOTALS.courses,
        );
        const done = coursesFetched >= SIM_TOTALS.courses;
        updateStageProgress(
          id,
          "fetching_courses",
          coursesFetched,
          undefined,
          done ? "complete" : "active",
        );

        if (!done) {
          const t = setTimeout(courseTick, TIMING.courseTickInterval);
          timersRef.current.push(t);
        } else {
          updateOperation(id, { currentStageIndex: 3 });
          startEvaluating();
        }
      };
      const t = setTimeout(courseTick, TIMING.courseTickInterval);
      timersRef.current.push(t);
    };

    // ── Stage 3: Evaluating ───────────────────────────────
    const startEvaluating = () => {
      let evaluated = 0;
      const evalTick = () => {
        evaluated = Math.min(
          evaluated + TIMING.evalBatchSize,
          SIM_TOTALS.evaluating,
        );
        const done = evaluated >= SIM_TOTALS.evaluating;
        updateStageProgress(
          id,
          "evaluating",
          evaluated,
          undefined,
          done ? "complete" : "active",
        );

        if (!done) {
          const t = setTimeout(evalTick, TIMING.evalTickInterval);
          timersRef.current.push(t);
        } else {
          // Complete
          updateOperation(id, { currentStageIndex: 4 });
          updateStageProgress(id, "complete", 1, undefined, "complete");
          updateOperation(id, {
            status: "complete",
            completedAt: new Date().toISOString(),
          });
          // Final persist to API
          persistCompletionToApi(id);
        }
      };
      const t = setTimeout(evalTick, TIMING.evalTickInterval);
      timersRef.current.push(t);
    };

    return id;
  }, [clearTimers, upsertOperation, updateOperation, updateStageProgress]);

  return { startDemoSync, clearTimers };
}

// ── API persistence helpers (fire-and-forget) ──────────────
async function persistToApi(operation: Operation) {
  try {
    await fetch("/api/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: operation.type,
        meta: { simulatedId: operation.id },
      }),
    });
  } catch {
    // Silently fail — the store is the source of truth for the UI
  }
}

async function persistCompletionToApi(id: string) {
  try {
    // Find the server-side operation by meta.simulatedId
    const res = await fetch("/api/operations");
    if (!res.ok) return;
    const data = await res.json();
    const serverOp = data.operations?.find(
      (op: Operation) => op.meta?.simulatedId === id,
    );
    if (serverOp) {
      await fetch(`/api/operations/${serverOp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "complete",
          completedAt: new Date().toISOString(),
        }),
      });
    }
  } catch {
    // Silently fail
  }
}

// ── Bulk evaluate simulation ────────────────────────────────
export function useDemoBulkEvaluateSimulation() {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const upsertOperation = useOperationStore((s) => s.upsertOperation);
  const updateOperation = useOperationStore((s) => s.updateOperation);
  const updateStageProgress = useOperationStore((s) => s.updateStageProgress);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) {
      clearTimeout(t);
    }
    timersRef.current = [];
  }, []);

  const startDemoBulkEvaluate = useCallback(() => {
    clearTimers();

    const id = `op_eval_${Date.now()}`;
    const now = new Date().toISOString();

    const totalStudents = 183;

    const operation: Operation = {
      id,
      type: "bulk_evaluate",
      status: "running",
      stages: [
        { id: "loading", label: "Loading students", status: "active", processed: 0, total: totalStudents },
        { id: "evaluating", label: "Evaluating risk", status: "pending", processed: 0, total: totalStudents },
        { id: "complete", label: "Complete", status: "pending", processed: 0, total: 1 },
      ],
      currentStageIndex: 0,
      persistenceState: "not_persisted",
      providerState: { type: "healthy" },
      createdAt: now,
      updatedAt: now,
    };

    upsertOperation(operation);

    // Stage 0: Loading
    let loaded = 0;
    const loadTick = () => {
      loaded = Math.min(loaded + 25, totalStudents);
      const done = loaded >= totalStudents;
      updateStageProgress(id, "loading", loaded, undefined, done ? "complete" : "active");

      if (done) {
        const tp = setTimeout(() => {
          updateOperation(id, {
            currentStageIndex: 1,
            persistenceState: "persisted",
            candidatePreview: {
              id: "stu_eval_preview",
              name: "Jordan Rivera",
              riskSegment: "near_completion",
              monthlyValue: 129,
              recommendedAction: "Near completion nudge — 92% done, 1 lesson remaining",
            },
          });
        }, 500);
        timersRef.current.push(tp);

        // Stage 1: Evaluating
        let evaluated = 0;
        const evalTick = () => {
          evaluated = Math.min(evaluated + 18, totalStudents);
          const done2 = evaluated >= totalStudents;
          updateStageProgress(id, "evaluating", evaluated, undefined, done2 ? "complete" : "active");

          if (done2) {
            updateOperation(id, { currentStageIndex: 2 });
            updateStageProgress(id, "complete", 1, undefined, "complete");
            updateOperation(id, {
              status: "complete",
              completedAt: new Date().toISOString(),
            });
          } else {
            const t = setTimeout(evalTick, 180);
            timersRef.current.push(t);
          }
        };
        const t = setTimeout(evalTick, 200);
        timersRef.current.push(t);
      } else {
        const t = setTimeout(loadTick, 250);
        timersRef.current.push(t);
      }
    };
    const t = setTimeout(loadTick, 300);
    timersRef.current.push(t);

    return id;
  }, [clearTimers, upsertOperation, updateOperation, updateStageProgress]);

  return { startDemoBulkEvaluate, clearTimers };
}
