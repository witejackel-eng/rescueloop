"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveActivityPulseProps {
  /** True when data is being fetched. */
  loading?: boolean;
  /** Seconds between auto-refresh ticks. 0 = disabled. */
  intervalSec?: number;
  /** Called when a refresh tick fires. */
  onRefresh?: () => void;
  className?: string;
}

/**
 * Small "live" indicator with pulsing dot, auto-refresh timer, and
 * last-updated relative timestamp.  Designed for dashboard headers.
 */
export function LiveActivityPulse({
  loading = false,
  intervalSec = 30,
  onRefresh,
  className,
}: LiveActivityPulseProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (intervalSec <= 0) return;
    const id = setInterval(() => {
      onRefresh?.();
      setSecondsAgo(0);
    }, intervalSec * 1000);
    return () => clearInterval(id);
  }, [intervalSec, onRefresh]);

  const label =
    secondsAgo < 5
      ? "just now"
      : secondsAgo < 60
        ? `${secondsAgo}s ago`
        : `${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Pulsing dot */}
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--recovery-green)] opacity-40" />
        <span className="relative inline-flex h-full w-full rounded-full bg-[var(--recovery-green)]" />
      </span>

      {/* Status text */}
      <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--ink-muted)]">
        {loading ? (
          <>
            <Loader2 className="size-2.5 animate-spin" />
            Syncing…
          </>
        ) : (
          <>
            <Radio className="size-2.5" />
            Live · {label}
          </>
        )}
      </span>
    </div>
  );
}
