"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  Keyboard,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Ban,
  RotateCcw,
  HelpCircle,
  Escalator,
  Command,
  Moon,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface Shortcut {
  keys: string[];
  description: string;
  icon: LucideIcon;
}

interface ShortcutCategory {
  title: string;
  shortcuts: Shortcut[];
}

// ── Shortcut definitions ───────────────────────────────────────

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["J"], description: "Move to next item", icon: ArrowDown },
      { keys: ["K"], description: "Move to previous item", icon: ArrowUp },
      { keys: ["⌘", "K"], description: "Open command palette", icon: Command },
      { keys: ["⌘", "1"], description: "Go to Rescue Queue", icon: Search },
      { keys: ["⌘", "2"], description: "Go to Members", icon: ArrowDown },
      { keys: ["⌘", "3"], description: "Go to Insights", icon: ArrowUp },
      { keys: ["⌘", ","], description: "Go to Settings", icon: Moon },
    ],
  },
  {
    title: "Queue Actions",
    shortcuts: [
      { keys: ["A"], description: "Approve intervention", icon: CheckCircle2 },
      { keys: ["S"], description: "Schedule follow-up", icon: CalendarClock },
      { keys: ["D"], description: "Dismiss item", icon: XCircle },
      { keys: ["X"], description: "Exclude from queue", icon: Ban },
      { keys: ["U"], description: "Undo last action", icon: RotateCcw },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["?"], description: "Show keyboard shortcuts", icon: HelpCircle },
      { keys: ["Esc"], description: "Close dialog / overlay", icon: Escalator },
      { keys: ["⌘", "D"], description: "Toggle dark mode", icon: Moon },
      { keys: ["⌘", "R"], description: "Refresh data", icon: RotateCcw },
    ],
  },
];

// ── Animation variants ─────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// ── Global open state (so any component can trigger it) ────────

let globalOpen = false;
const globalListeners: Array<(open: boolean) => void> = [];

function setGlobalOpen(open: boolean) {
  globalOpen = open;
  globalListeners.forEach((l) => l(open));
}

export function openKeyboardShortcuts() {
  setGlobalOpen(true);
}

export function closeKeyboardShortcuts() {
  setGlobalOpen(false);
}

// ── Component ──────────────────────────────────────────────────

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  // Sync with global state
  useEffect(() => {
    const listener = (val: boolean) => setOpen(val);
    globalListeners.push(listener);
    return () => {
      const idx = globalListeners.indexOf(listener);
      if (idx > -1) globalListeners.splice(idx, 1);
    };
  }, []);

  // Global keyboard listener: ? or Ctrl+/
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setGlobalOpen(!open);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setGlobalOpen(!open);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setGlobalOpen(false);
      }
    },
    [open],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            variants={reduced ? undefined : overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={() => setGlobalOpen(false)}
          />

          {/* Content */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
            variants={reduced ? undefined : contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="pointer-events-auto w-full max-w-lg rounded-xl border border-[var(--hairline)] bg-[var(--surface)] shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-6 py-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--recovery-green)]/10 text-[var(--recovery-green)]">
                  <Keyboard className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Use these shortcuts to navigate faster
                  </p>
                </div>
                <button
                  onClick={() => setGlobalOpen(false)}
                  className="ml-auto rounded-md p-1.5 text-[var(--ink-muted)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)] transition-colors"
                  aria-label="Close"
                >
                  <XCircle className="size-4" />
                </button>
              </div>

              {/* Shortcuts list */}
              <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-6">
                {SHORTCUT_CATEGORIES.map((category) => (
                  <div key={category.title}>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-3">
                      {category.title}
                    </h3>
                    <div className="space-y-1">
                      {category.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.description}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--canvas-elevated)] transition-colors"
                        >
                          <shortcut.icon className="size-3.5 text-[var(--ink-secondary)] shrink-0" />
                          <span className="flex-1 text-sm text-[var(--ink-primary)]">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && (
                                  <span className="text-[10px] text-[var(--ink-muted)]">
                                    +
                                  </span>
                                )}
                                <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 text-[11px] font-mono font-medium text-[var(--ink-secondary)] shadow-[0_1px_0_0_var(--hairline)]">
                                  {key}
                                </kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--hairline)] px-6 py-3 flex items-center justify-between">
                <span className="text-[11px] text-[var(--ink-muted)]">
                  Press <kbd className="inline-flex h-5 items-center rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1 text-[10px] font-mono mx-0.5">?</kbd> or <kbd className="inline-flex h-5 items-center rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1 text-[10px] font-mono mx-0.5">Ctrl+/</kbd> to toggle
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  <kbd className="inline-flex h-5 items-center rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1 text-[10px] font-mono mx-0.5">Esc</kbd> to close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
