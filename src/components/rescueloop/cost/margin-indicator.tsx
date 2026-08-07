"use client";

// ─────────────────────────────────────────────────────────────
// PX05 — Margin Indicator
// Green (>60%), Amber (30–60%), Red (<30%)
// ─────────────────────────────────────────────────────────────

import type { FC } from "react";

interface MarginIndicatorProps {
  marginPercent: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getColor(margin: number): { bg: string; text: string; dot: string } {
  if (margin >= 60) {
    return {
      bg: "bg-[var(--recovery-light)]",
      text: "text-[var(--recovery-green)]",
      dot: "bg-[var(--recovery-green)]",
    };
  }
  if (margin >= 30) {
    return {
      bg: "bg-[var(--warning-light)]",
      text: "text-[var(--warning)]",
      dot: "bg-[var(--warning)]",
    };
  }
  return {
    bg: "bg-[var(--critical-light)]",
    text: "text-[var(--critical)]",
    dot: "bg-[var(--critical)]",
  };
}

const sizeMap = {
  sm: { wrapper: "h-5 px-1.5 text-[10px]", dot: "h-1.5 w-1.5" },
  md: { wrapper: "h-6 px-2 text-[11px]", dot: "h-2 w-2" },
  lg: { wrapper: "h-7 px-2.5 text-xs", dot: "h-2.5 w-2.5" },
};

export const MarginIndicator: FC<MarginIndicatorProps> = ({
  marginPercent,
  size = "md",
  showLabel = true,
}) => {
  const color = getColor(marginPercent);
  const s = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] font-mono font-medium tabular-nums ${color.bg} ${color.text} ${s.wrapper}`}
    >
      <span className={`rounded-full ${color.dot} ${s.dot}`} />
      {showLabel && (
        <span>
          {marginPercent.toFixed(1)}%
        </span>
      )}
    </span>
  );
};
