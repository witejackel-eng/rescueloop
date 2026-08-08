"use client";

/**
 * FocusManager — declarative focus management for drawers, dialogs, and inspectors.
 *
 * Re-exports hooks from @/hooks/use-focus-restore for convenience,
 * and provides a <FocusRestore> component that can wrap any trigger
 * element to automatically restore focus when an overlay closes.
 *
 * Also provides <EscapeHandler> for declarative Escape key handling,
 * and <DestructiveConfirm> for confirmation dialogs that avoid
 * putting destructive actions as the default focus target.
 */

import { type RefObject, useEffect, useRef } from "react";
import {
  useFocusRestore as useFocusRestoreHook,
  useEscapeKey as useEscapeKeyHook,
  useFocusTrap as useFocusTrapHook,
  FocusTrap,
} from "@/hooks/use-focus-restore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

// ─── Re-export hooks for convenience ───

export { useFocusRestoreHook as useFocusRestore };
export { useEscapeKeyHook as useEscapeKey };
export { useFocusTrapHook as useFocusTrap };
export { FocusTrap };

// ─── FocusRestore component ───

interface FocusRestoreProps {
  /** Whether the overlay is currently open */
  isOpen: boolean;
  /** Render prop receives the trigger ref to attach to the trigger element */
  children: (triggerRef: RefObject<HTMLElement | null>) => React.ReactNode;
}

/**
 * <FocusRestore> — wraps a trigger element and restores focus to it
 * when the overlay closes.
 *
 * Usage:
 *   <FocusRestore isOpen={drawerOpen}>
 *     {(triggerRef) => (
 *       <button ref={triggerRef} onClick={() => setDrawerOpen(true)}>
 *         Open drawer
 *       </button>
 *     )}
 *   </FocusRestore>
 */
export function FocusRestore({ isOpen, children }: FocusRestoreProps) {
  const triggerRef = useFocusRestoreHook(isOpen);
  return <>{children(triggerRef)}</>;
}

// ─── EscapeHandler component ───

interface EscapeHandlerProps {
  /** Whether the handler should be active */
  isActive: boolean;
  /** Callback on Escape */
  onEscape: () => void;
  children: React.ReactNode;
}

/**
 * <EscapeHandler> — declarative Escape key handling.
 * Wraps children and calls onEscape when Escape is pressed
 * while isActive is true.
 */
export function EscapeHandler({ isActive, onEscape, children }: EscapeHandlerProps) {
  useEscapeKeyHook(onEscape, isActive);
  return <>{children}</>;
}

// ─── FocusTrapRegion component ───

interface FocusTrapRegionProps {
  /** Whether the trap should be active */
  isActive: boolean;
  children: React.ReactNode;
}

/**
 * <FocusTrapRegion> — wraps children in a div with focus trapping.
 * When isActive is true, Tab/Shift+Tab wrap within the region.
 */
export function FocusTrapRegion({ isActive, children }: FocusTrapRegionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrapHook(containerRef, isActive);

  return (
    <div ref={containerRef} data-focus-trap={isActive ? "active" : "inactive"}>
      {children}
    </div>
  );
}

// ─── DestructiveConfirm component ───

interface DestructiveConfirmProps {
  /** Whether the confirmation dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Title of the action (e.g. "Pause automation") */
  title: string;
  /** Description of consequences (MUST state what happens) */
  consequences: string;
  /** Label for the destructive action button */
  actionLabel: string;
  /** Called when the user confirms the destructive action */
  onConfirm: () => void;
  /** Whether the action is currently in progress */
  loading?: boolean;
}

/**
 * <DestructiveConfirm> — confirmation dialog for destructive actions.
 *
 * Per spec 04_DRAWERS_DIALOGS_AND_FOCUS.md:
 * - Must state consequences
 * - Must NOT put destructive button as default focus
 * - Must require explicit confirmation (can't be dismissed by accident)
 *
 * The cancel button receives initial focus (safe default).
 * The destructive button requires explicit click.
 */
export function DestructiveConfirm({
  open,
  onOpenChange,
  title,
  consequences,
  actionLabel,
  onConfirm,
  loading = false,
}: DestructiveConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-[var(--critical)]" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{consequences}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-[var(--critical)] text-white hover:bg-[var(--critical)]/90 focus:ring-[var(--critical)]"
          >
            {loading ? "Processing…" : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
