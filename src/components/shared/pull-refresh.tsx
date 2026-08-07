"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 60; // px to trigger refresh
const MAX_PULL = 100; // max pull distance
const IS_MOBILE = typeof window !== "undefined" ? window.innerWidth < 1024 : false;

interface PullRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export function PullRefresh({ children, onRefresh, className }: PullRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);

  // Only activate on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || refreshing) return;
      // Only activate when scrolled to the very top
      const el = containerRef.current?.parentElement;
      if (el && el.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [isMobile, refreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || !isMobile || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        // Apply rubber-band resistance
        const clamped = Math.min(diff, MAX_PULL);
        const rubberBand = clamped * (1 - clamped / (MAX_PULL * 2.5));
        setPullDistance(rubberBand);
        setCanRefresh(rubberBand >= PULL_THRESHOLD * 0.7);
      } else {
        setPullDistance(0);
        setCanRefresh(false);
        pulling.current = false;
      }
    },
    [isMobile, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (canRefresh && pullDistance > 10) {
      setRefreshing(true);
      setPullDistance(30); // Show compact indicator during refresh
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [canRefresh, pullDistance, onRefresh]);

  // Don't render pull mechanics on desktop
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-[11px] font-medium transition-opacity duration-150",
            canRefresh
              ? "text-[var(--recovery-green)] opacity-100"
              : "text-[var(--ink-muted)] opacity-60"
          )}
        >
          <RefreshCw
            className={cn(
              "size-3.5 transition-transform duration-300",
              refreshing && "animate-spin",
              canRefresh && !refreshing && "rotate-180"
            )}
          />
          <span>
            {refreshing
              ? "Refreshing…"
              : canRefresh
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
