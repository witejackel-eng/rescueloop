"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Accessible live region components for async updates.
 *
 * Per 09_PERFORMANCE_AND_ACCESSIBILITY.md:
 * - Async live regions for mutation feedback, queue updates, etc.
 * - Polite and assertive variants
 * - Auto-clears after announcement to avoid stale content
 */

type AriaLive = "polite" | "assertive";

interface LiveRegionProps {
  /** The message to announce to assistive technology */
  message: string;
  /** Polite waits for idle, assertive interrupts immediately */
  politeness?: AriaLive;
  /** Time in ms after which the region auto-clears (default: 5000) */
  clearAfter?: number;
  /** Whether the region is currently active (has content) */
  active?: boolean;
  className?: string;
}

/**
 * LiveRegion — announces a message to screen readers via aria-live.
 *
 * - `polite`: screen reader announces when idle (for non-urgent updates)
 * - `assertive`: screen reader interrupts immediately (for urgent alerts)
 *
 * Auto-clears after `clearAfter` ms to prevent stale announcements.
 *
 * @example
 * ```tsx
 * // Queue update feedback
 * <LiveRegion message="3 students added to queue" politeness="polite" />
 *
 * // Urgent error
 * <LiveRegion message="Action failed — please retry" politeness="assertive" />
 * ```
 */
export function LiveRegion({
  message,
  politeness = "polite",
  clearAfter = 5000,
  active = true,
  className,
}: LiveRegionProps) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-clear after the specified duration when message changes
  useEffect(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
    }

    // Auto-clear after the specified duration
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, clearAfter);

    return () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message, clearAfter]);

  if (!active || !visible || !message) return null;

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
}

// ── LiveRegionProvider ───────────────────────────────────────────────────

interface LiveRegionEntry {
  id: string;
  message: string;
  politeness: AriaLive;
}

interface LiveRegionProviderProps {
  children: ReactNode;
}

// ── Context ──────────────────────────────────────────────────────────────

interface LiveRegionContextValue {
  announce: (message: string, politeness?: AriaLive) => void;
  clear: (id: string) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

/**
 * LiveRegionProvider — manages multiple live region announcements.
 * Useful for apps that need to stack multiple async messages (e.g.,
 * queue mutations, approval confirmations, error alerts).
 *
 * @example
 * ```tsx
 * <LiveRegionProvider>
 *   <App />
 * </LiveRegionProvider>
 *
 * // Somewhere in the app:
 * const { announce } = useLiveRegion();
 * announce("Student approved", "polite");
 * ```
 */
export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [entries, setEntries] = useState<LiveRegionEntry[]>([]);

  function announce(message: string, politeness: AriaLive = "polite") {
    const id = `lr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setEntries((prev) => [...prev, { id, message, politeness }]);

    // Auto-remove after 5s
    setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }, 5000);
  }

  function clear(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <LiveRegionContext.Provider value={{ announce, clear }}>
      {children}
      {/* Render all active live regions */}
      {entries.map((entry) => (
        <LiveRegion
          key={entry.id}
          message={entry.message}
          politeness={entry.politeness}
          clearAfter={5000}
        />
      ))}
    </LiveRegionContext.Provider>
  );
}

/**
 * Hook to access the live region announcer.
 * Must be used within a LiveRegionProvider.
 */
export function useLiveRegion(): LiveRegionContextValue {
  const ctx = useContext(LiveRegionContext);
  if (!ctx) {
    throw new Error("useLiveRegion must be used within a LiveRegionProvider");
  }
  return ctx;
}
