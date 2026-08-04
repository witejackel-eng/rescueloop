"use client";

import { useEffect } from "react";

interface UseKeyboardQueueOptions {
  /** Current ordered list of row ids visible in the active stage. */
  rows: { id: string }[];
  /** The currently selected row id (or null if none). */
  selectedId: string | null;
  /** Select a row by id (used by J / K / Arrow keys). */
  onSelectId: (id: string | null) => void;
  /** Approve the currently selected row. */
  onApprove: (id: string) => void;
  /** Dismiss the currently selected row. */
  onDismiss: (id: string) => void;
  /** Open the schedule picker for the currently selected row. */
  onSchedule: (id: string) => void;
  /** Master switch — set to false to disable the listener entirely. */
  enabled?: boolean;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable ||
    el.getAttribute("role") === "combobox" ||
    el.getAttribute("role") === "textbox"
  );
}

/**
 * Listen for keyboard shortcuts that drive the triage queue.
 *
 *   J / ArrowDown  → next student
 *   K / ArrowUp    → previous student
 *   A              → approve selected
 *   S              → open schedule picker for selected
 *   D              → dismiss selected
 *
 * Shortcuts are ignored when the user is typing in an input/textarea/select
 * or has a contentEditable focused, and when modifier keys (cmd/ctrl/alt)
 * are held.
 */
export function useKeyboardQueue({
  rows,
  selectedId,
  onSelectId,
  onApprove,
  onDismiss,
  onSchedule,
  enabled = true,
}: UseKeyboardQueueOptions) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (rows.length === 0) return;

      const currentIndex = selectedId
        ? rows.findIndex((r) => r.id === selectedId)
        : -1;
      const key = e.key.toLowerCase();

      switch (key) {
        case "j":
        case "arrowdown": {
          e.preventDefault();
          const nextIndex =
            currentIndex === -1 ? 0 : Math.min(currentIndex + 1, rows.length - 1);
          onSelectId(rows[nextIndex]?.id ?? null);
          break;
        }
        case "k":
        case "arrowup": {
          e.preventDefault();
          const prevIndex =
            currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
          onSelectId(rows[prevIndex]?.id ?? null);
          break;
        }
        case "a": {
          if (selectedId) {
            e.preventDefault();
            onApprove(selectedId);
          }
          break;
        }
        case "d": {
          if (selectedId) {
            e.preventDefault();
            onDismiss(selectedId);
          }
          break;
        }
        case "s": {
          if (selectedId) {
            e.preventDefault();
            onSchedule(selectedId);
          }
          break;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rows, selectedId, onSelectId, onApprove, onDismiss, onSchedule, enabled]);
}
