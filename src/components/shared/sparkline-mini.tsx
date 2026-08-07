"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion } from "framer-motion";

interface SparklineMiniProps {
  /** 5-12 data points (most recent last). */
  data: number[];
  /** SVG width. */
  width?: number;
  /** SVG height. */
  height?: number;
  /** Color — a CSS var or hex. Defaults to recovery green. */
  color?: string;
  /** Whether to fill under the line. */
  fill?: boolean;
  className?: string;
}

/**
 * Inline SVG sparkline for embedding inside metric cards and list rows.
 * Renders a polyline (optional fill area) with subtle dot on the last point.
 */
export function SparklineMini({
  data,
  width = 48,
  height = 20,
  color = "var(--recovery-green)",
  fill = true,
  className,
}: SparklineMiniProps) {
  const reduced = useReducedMotion();
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 3) - 1.5,
  }));

  const poly = points.map((p) => `${p.x},${p.y}`).join(" ");
  const fillPath = `M0,${height} L${points.map((p) => `${p.x},${p.y}`).join(" L")} L${width},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden
    >
      {fill && (
        <motion.path
          d={fillPath}
          fill={color}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 0.12 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <motion.polyline
        points={poly}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Last-point dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={color}
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, duration: 0.25, type: "spring", stiffness: 400 }}
      />
    </svg>
  );
}
