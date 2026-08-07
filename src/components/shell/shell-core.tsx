"use client";

/**
 * Shell Core — shared interaction primitives and utilities for both
 * WorkspaceShell (demo) and ConnectedShell (real company).
 *
 * This module consolidates the formerly competing shell architectures into
 * one shared core. Both shells consume these utilities for:
 *   - Navigation registry
 *   - Regional skeleton patterns (no full-screen flash)
 *   - Content-region error display
 *   - Live region provider for accessible announcements
 *   - Skip-to-content link
 *   - Reduced-motion-aware animation utilities
 */

import { type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveRegionProvider } from "@/components/interaction/live-region";

// ─── Demo workspace navigation registry ───
// Shared between WorkspaceShell, CommandPalette, and keyboard handlers.

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/rescue-queue", label: "Rescue Queue" },
  { href: "/students", label: "Students" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/insights", label: "Insights" },
  { href: "/value", label: "Value" },
  { href: "/settings", label: "Settings" },
] as const;

export type NavRoute = (typeof NAV_ITEMS)[number];

/**
 * Get the current active nav key from a pathname.
 * Shared between WorkspaceShell, CommandPalette, and keyboard handlers.
 */
export function getActiveNavKey(pathname: string): string | null {
  for (const item of NAV_ITEMS) {
    if (pathname.startsWith(item.href)) return item.href;
  }
  return null;
}

// ─── Regional skeleton patterns ───
// Per spec: use regional skeletons instead of full-screen flashes.
// Each region loads independently so the shell never flashes.

export interface RegionSkeletonProps {
  /** Number of skeleton rows */
  rows?: number;
  /** Variant controls the skeleton shape */
  variant?: "table" | "cards" | "list" | "chart";
  className?: string;
}

export function RegionSkeleton({
  rows = 4,
  variant = "table",
  className,
}: RegionSkeletonProps) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2 w-2/3" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Default: table
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-4 rounded-lg bg-[var(--canvas-elevated)] px-3 py-2">
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
        <Skeleton className="h-3 w-1/5" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg px-3 py-2">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Content-region error boundary ───

interface ContentErrorProps {
  error: Error;
  resetErrorBoundary?: () => void;
  className?: string;
}

/**
 * ContentRegionError — renders an error inside the content region.
 * Per spec: errors render inside the content region, not as full-page overlays.
 */
export function ContentRegionError({
  error,
  resetErrorBoundary,
  className,
}: ContentErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--critical-light)] bg-[var(--critical-light)]/20 px-6 py-12 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--critical)]/10">
        <AlertTriangle className="size-6 text-[var(--critical)]" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-[var(--ink-primary)]">Something went wrong</h3>
        <p className="text-sm text-[var(--ink-secondary)]">
          {error.message || "An unexpected error occurred in this section."}
        </p>
      </div>
      {resetErrorBoundary && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetErrorBoundary}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── Shell interaction wrapper ───
// Provides LiveRegionProvider + skip-to-content for any shell.

export interface ShellInteractionWrapperProps {
  children: ReactNode;
}

/**
 * ShellInteractionWrapper — wraps shell children with shared
 * interaction infrastructure:
 *   - LiveRegionProvider for accessible announcements
 *   - Skip-to-content link for keyboard users
 */
export function ShellInteractionWrapper({ children }: ShellInteractionWrapperProps) {
  return (
    <LiveRegionProvider>
      {/* Skip to content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--recovery-green)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      {children}
    </LiveRegionProvider>
  );
}
