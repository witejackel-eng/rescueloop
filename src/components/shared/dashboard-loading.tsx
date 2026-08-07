import { CardSkeleton, MetricSkeleton } from "@/components/shared/card-skeleton";

interface DashboardLoadingProps {
  /** Page title placeholder (rendered as a shimmer bar, not real text). */
  title: string;
}

/**
 * Route-level loading skeleton shared by all dashboard `loading.tsx` files.
 *
 * Renders a premium-feeling placeholder that mirrors the real page layout:
 *   1. Animated page header (title shimmer + subtitle + action buttons)
 *   2. Four metric card skeletons in a responsive grid
 *   3. Two content card skeletons side-by-side
 *   4. One wide content card skeleton below
 *
 * Server component — no client hooks. The imported skeletons are client
 * components and become client boundaries automatically.
 *
 * The `title` prop is used for the `aria-label` so screen readers announce
 * "Loading Overview" etc., but the visible title is a shimmer bar (so the
 * placeholder never flashes the wrong text size if the real heading differs).
 */
export function DashboardLoading({ title }: DashboardLoadingProps) {
  return (
    <div
      className="dot-grid space-y-8"
      aria-busy="true"
      aria-label={`Loading ${title}`}
      role="status"
    >
      {/* ── Page header skeleton ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {/* Title — uses gradient shimmer for a premium feel */}
          <div className="skeleton-shimmer h-7 w-56 rounded-[4px]" />
          {/* Subtitle */}
          <div className="h-3 w-72 animate-pulse rounded-[2px] bg-[var(--hairline)]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 animate-pulse rounded-[6px] bg-[var(--hairline)]" />
          <div className="h-7 w-24 animate-pulse rounded-[6px] bg-[var(--hairline)]" />
          <div className="hidden h-7 w-28 animate-pulse rounded-[6px] bg-[var(--hairline)] sm:block" />
        </div>
      </div>

      {/* ── Metric cards (4 in a responsive grid) ───────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricSkeleton key={`metric-${i}`} />
        ))}
      </div>

      {/* ── Content cards — 2 side-by-side ──────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardSkeleton rows={5} />
        <CardSkeleton rows={5} />
      </div>

      {/* ── Wide content card ───────────────────────────────────── */}
      <CardSkeleton rows={3} />

      {/* Screen-reader notice */}
      <span className="sr-only">
        Loading {title}. Please wait while we fetch the latest data.
      </span>
    </div>
  );
}
