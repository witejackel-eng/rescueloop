"use client";

import { useEffect, useCallback } from "react";

// ── Queue keyboard handler ─────────────────────────────────────
// Implements the 07_KEYBOARD_AND_COMMAND_PALETTE.md spec:
//
//   ArrowDown  → next row (active row changes)
//   ArrowUp    → previous row (active row changes)
//   Enter      → open inspector for active row
//   Escape     → close inspector
//   Space      → toggle selection (only on selectable rows)
//   A          → approve selected (action shortcut)
//   S          → open schedule picker (action shortcut)
//   D          → dismiss selected (action shortcut)
//   J          → next row (vim-style alias)
//   K          → previous row (vim-style alias)
//
// Rules:
//   - Action shortcuts NEVER fire in inputs/editors
//   - Active row is programmatically exposed via aria-activedescendant
//   - Space only toggles on selectable rows

interface UseKeyboardQueueOptions {
  /** Current ordered list of row ids visible in the active stage. */
  rows: { id: string; selectable?: boolean }[];
  /** The currently active row id (or null if none). */
  activeId: string | null;
  /** Set the active row by id (used by Arrow / J / K). */
  onActiveId: (id: string | null) => void;
  /** Open the inspector for a row. */
  onOpenInspector: (id: string) => void;
  /** Close the inspector. */
  onCloseInspector: () => void;
  /** Toggle selection for a row (Space key). */
  onToggleSelection?: (id: string) => void;
  /** Approve the currently active row. */
  onApprove: (id: string) => void;
  /** Dismiss the currently active row. */
  onDismiss: (id: string) => void;
  /** Open the schedule picker for the currently active row. */
  onSchedule: (id: string) => void;
  /** Whether the inspector is currently open. */
  inspectorOpen?: boolean;
  /** Master switch — set to false to disable the listener entirely. */
  enabled?: boolean;
  /** The container id for aria-activedescendant. */
  listboxId?: string;
}

/**
 * Check if the event target is a text input / editor where
 * action shortcuts should NOT fire.
 */
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
 * Per spec 07_KEYBOARD_AND_COMMAND_PALETTE.md:
 * - Arrow Up/Down changes active row
 * - Enter opens inspector
 * - Escape closes inspector
 * - Space toggles selection (only on selectable rows)
 * - Action shortcuts (A/S/D) never fire in inputs/editors
 * - Active row is programmatically exposed via aria-activedescendant
 */
export function useKeyboardQueue({
  rows,
  activeId,
  onActiveId,
  onOpenInspector,
  onCloseInspector,
  onToggleSelection,
  onApprove,
  onDismiss,
  onSchedule,
  inspectorOpen = false,
  enabled = true,
  listboxId,
}: UseKeyboardQueueOptions) {
  // ── Expose active row via aria-activedescendant ─────────────
  useEffect(() => {
    if (!enabled || !listboxId) return;

    const container = document.getElementById(listboxId);
    if (!container) return;

    if (activeId) {
      container.setAttribute("aria-activedescendant", activeId);
    } else {
      container.removeAttribute("aria-activedescendant");
    }

    return () => {
      container.removeAttribute("aria-activedescendant");
    };
  }, [activeId, enabled, listboxId]);

  // ── Keyboard event handler ──────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      // Action shortcuts never fire in inputs/editors
      if (isTypingTarget(e.target)) return;
      // Never fire when modifier keys are held (except for the
      // command palette which uses Cmd/Ctrl+K — handled elsewhere)
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (rows.length === 0) return;

      const currentIndex = activeId
        ? rows.findIndex((r) => r.id === activeId)
        : -1;
      const key = e.key;

      switch (key) {
        // ── Arrow navigation: changes active row ────────────
        case "ArrowDown": {
          e.preventDefault();
          const nextIndex =
            currentIndex === -1 ? 0 : Math.min(currentIndex + 1, rows.length - 1);
          onActiveId(rows[nextIndex]?.id ?? null);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prevIndex =
            currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
          onActiveId(rows[prevIndex]?.id ?? null);
          break;
        }

        // ── Vim-style navigation aliases ────────────────────
        case "j": {
          e.preventDefault();
          const nextIndex =
            currentIndex === -1 ? 0 : Math.min(currentIndex + 1, rows.length - 1);
          onActiveId(rows[nextIndex]?.id ?? null);
          break;
        }
        case "k": {
          e.preventDefault();
          const prevIndex =
            currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
          onActiveId(rows[prevIndex]?.id ?? null);
          break;
        }

        // ── Enter: open inspector for active row ────────────
        case "Enter": {
          if (activeId) {
            e.preventDefault();
            onOpenInspector(activeId);
          }
          break;
        }

        // ── Escape: close inspector ─────────────────────────
        case "Escape": {
          if (inspectorOpen) {
            e.preventDefault();
            onCloseInspector();
          }
          break;
        }

        // ── Space: toggle selection on selectable rows ──────
        case " ": {
          if (activeId) {
            const row = rows.find((r) => r.id === activeId);
            // Only toggle if the row is selectable (default true if not specified)
            if (row && (row.selectable === undefined || row.selectable)) {
              e.preventDefault();
              onToggleSelection?.(activeId);
            }
          }
          break;
        }

        // ── Action shortcuts (never fire in inputs/editors) ─
        case "a": {
          if (activeId) {
            e.preventDefault();
            onApprove(activeId);
          }
          break;
        }
        case "d": {
          if (activeId) {
            e.preventDefault();
            onDismiss(activeId);
          }
          break;
        }
        case "s": {
          if (activeId) {
            e.preventDefault();
            onSchedule(activeId);
          }
          break;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    rows,
    activeId,
    onActiveId,
    onOpenInspector,
    onCloseInspector,
    onToggleSelection,
    onApprove,
    onDismiss,
    onSchedule,
    inspectorOpen,
    enabled,
  ]);
}

// ── Re-export for backward compatibility ───────────────────────
// Existing consumers that use the old API (selectedId / onSelectId)
// can continue to work.

interface LegacyUseKeyboardQueueOptions {
  rows: { id: string }[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onSchedule: (id: string) => void;
  enabled?: boolean;
}

/**
 * @deprecated Use useKeyboardQueue with the full API instead.
 * This wrapper provides backward compatibility with the old
 * selectedId/onSelectId interface.
 */
export function useKeyboardQueueLegacy({
  rows,
  selectedId,
  onSelectId,
  onApprove,
  onDismiss,
  onSchedule,
  enabled = true,
}: LegacyUseKeyboardQueueOptions) {
  useKeyboardQueue({
    rows: rows.map((r) => ({ id: r.id, selectable: true })),
    activeId: selectedId,
    onActiveId: onSelectId,
    onOpenInspector: () => {}, // no-op in legacy mode
    onCloseInspector: () => {}, // no-op in legacy mode
    onToggleSelection: () => {}, // no-op in legacy mode
    onApprove,
    onDismiss,
    onSchedule,
    inspectorOpen: false,
    enabled,
  });
}
