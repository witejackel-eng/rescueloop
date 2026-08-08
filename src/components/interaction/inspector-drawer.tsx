"use client";

/**
 * InspectorDrawer — desktop inspector drawer / mobile bottom sheet
 * with focus management, per spec 04_DRAWERS_DIALOGS_AND_FOCUS.md.
 *
 * Desktop:
 *   - Opens from a stable row, keeps source visible
 *   - Preserves selected identity across re-renders
 *   - Closes with Escape, restores focus to trigger
 *   - Supports next/previous navigation within the list
 *   - Encodes selected item in URL when safe
 *
 * Mobile:
 *   - Safe-area-aware bottom sheet (Vaul Drawer)
 *   - Reachable primary action
 *   - No nested-scroll trap
 *   - Restore focus on close
 */

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useFocusRestore,
  useEscapeKey,
} from "@/hooks/use-focus-restore";

// ─── Types ───

export interface InspectorItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label (used for aria descriptions) */
  label: string;
}

export interface InspectorDrawerProps {
  /** Whether the inspector is open */
  open: boolean;
  /** Called when the inspector should open/close */
  onOpenChange: (open: boolean) => void;
  /** The currently selected item */
  selectedItem: InspectorItem | null;
  /** All items in the list (for next/prev navigation) */
  items: InspectorItem[];
  /** Called when the selected item changes (next/prev) */
  onSelectItem: (item: InspectorItem) => void;
  /** Inspector content — receives the selected item */
  children: (item: InspectorItem) => React.ReactNode;
  /** Title for the inspector panel */
  title?: string;
  /** URL query param name for encoding the selected item */
  urlParam?: string;
  /** Ref to the trigger element (for focus restoration) */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Desktop panel width */
  desktopWidth?: string;
  /** Whether to show next/prev navigation */
  showNavigation?: boolean;
  /** Called when the user requests to close (Escape, X button, overlay click) */
  onClose?: () => void;
}

// ─── Component ───

export function InspectorDrawer({
  open,
  onOpenChange,
  selectedItem,
  items,
  onSelectItem,
  children,
  title = "Details",
  urlParam,
  triggerRef,
  desktopWidth = "max-w-lg",
  showNavigation = true,
  onClose,
}: InspectorDrawerProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const internalTriggerRef = useFocusRestore(open);
  const effectiveTriggerRef = triggerRef ?? internalTriggerRef;

  // ─── Current index for next/prev ───
  const currentIndex = selectedItem
    ? items.findIndex((item) => item.id === selectedItem.id)
    : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  // ─── Navigation handlers ───
  const goToPrev = useCallback(() => {
    if (hasPrev) {
      onSelectItem(items[currentIndex - 1]);
    }
  }, [hasPrev, items, currentIndex, onSelectItem]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      onSelectItem(items[currentIndex + 1]);
    }
  }, [hasNext, items, currentIndex, onSelectItem]);

  // ─── Keyboard: Escape closes, ArrowUp/ArrowLeft = prev, ArrowDown/ArrowRight = next ───
  const handleClose = useCallback(() => {
    onOpenChange(false);
    onClose?.();
  }, [onOpenChange, onClose]);

  useEscapeKey(handleClose, open);

  // Arrow key navigation when inspector is open
  useEffect(() => {
    if (!open) return;

    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          onSelectItem(items[currentIndex - 1]);
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          onSelectItem(items[currentIndex + 1]);
        }
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, currentIndex, items, onSelectItem]);

  // ─── Sync selected item to URL param ───
  useEffect(() => {
    if (!urlParam || !open) return;

    const params = new URLSearchParams(searchParams.toString());
    if (selectedItem) {
      params.set(urlParam, selectedItem.id);
    } else {
      params.delete(urlParam);
    }

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();

    if (newSearch !== currentSearch) {
      router.replace(`${window.location.pathname}?${newSearch}`, {
        scroll: false,
      });
    }
  }, [urlParam, open, selectedItem, searchParams, router]);

  // Clean URL param when inspector closes
  useEffect(() => {
    if (!urlParam || open) return;
    if (!searchParams.has(urlParam)) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete(urlParam);
    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [urlParam, open, searchParams, router]);

  // ─── Focus restoration on close ───
  useEffect(() => {
    if (!open) {
      // Focus restore is handled by useFocusRestore hook via triggerRef
      // This effect is a no-op placeholder for any additional cleanup
    }
  }, [open]);

  // ─── Navigation bar (shared between desktop and mobile) ───
  const navigationBar = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!hasPrev}
        onClick={goToPrev}
        aria-label={`Previous: ${hasPrev ? items[currentIndex - 1].label : "none"}`}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[4rem] text-center text-xs text-[var(--ink-muted)]">
        {currentIndex >= 0 ? `${currentIndex + 1} / ${items.length}` : ""}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!hasNext}
        onClick={goToNext}
        aria-label={`Next: ${hasNext ? items[currentIndex + 1].label : "none"}`}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );

  // ─── No item selected ───
  if (!selectedItem) {
    return null;
  }

  // ─── Mobile: bottom sheet (Vaul Drawer) ───
  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(isOpen) => {
          onOpenChange(isOpen);
          if (!isOpen) onClose?.();
        }}
        direction="bottom"
        shouldScaleBackground={false}
      >
        <DrawerContent
          className="max-h-[85svh] border-t border-[var(--hairline)] bg-[var(--canvas-elevated)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <DrawerHeader className="flex flex-row items-center justify-between border-b border-[var(--hairline)] px-4 py-3">
            <div className="flex items-center gap-3">
              <DrawerTitle className="text-sm font-semibold text-[var(--ink-primary)]">
                {title}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {selectedItem.label}
              </DrawerDescription>
            </div>
            <div className="flex items-center gap-2">
              {showNavigation && navigationBar}
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Close inspector"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-4">
            {children(selectedItem)}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ─── Desktop: side dialog ───
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) onClose?.();
      }}
    >
      <DialogContent
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-l border-[var(--hairline)] bg-[var(--canvas-elevated)] p-0 shadow-2xl sm:max-w-none",
          desktopWidth
        )}
        showCloseButton={false}
        onPointerDownOutside={(e) => {
          // Allow clicking outside to close
          e.preventDefault();
          onOpenChange(false);
          onClose?.();
        }}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-sm font-semibold text-[var(--ink-primary)]">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedItem.label}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {showNavigation && navigationBar}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                onOpenChange(false);
                onClose?.();
              }}
              aria-label="Close inspector"
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {children(selectedItem)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── InspectorTrigger — convenience wrapper that wires up trigger ref ───

interface InspectorTriggerProps {
  /** Ref to forward to the trigger element */
  triggerRef: RefObject<HTMLElement | null>;
  /** Called when the trigger is activated */
  onOpen: () => void;
  /** The trigger element */
  children: React.ReactNode;
}

/**
 * <InspectorTrigger> — wraps a trigger element and wires up
 * click/Enter to open the inspector, plus focus restoration.
 */
export function InspectorTrigger({
  triggerRef,
  onOpen,
  children,
}: InspectorTriggerProps) {
  return (
    <div
      ref={triggerRef as React.RefObject<HTMLDivElement>}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--recovery-green)] focus-visible:ring-offset-2"
    >
      {children}
    </div>
  );
}
