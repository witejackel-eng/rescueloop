"use client";

import { useEffect, useRef } from "react";

// RecoveryLoopCanvas — RescueLoop's signature animated illustration.
// A large rotating ASCII orbit representing students moving through:
// Signal → Review → Support → Return
//
// Nodes travel along a circular loop. Some begin faded/amber (stalled).
// As they complete the recovery path, they brighten and turn green.
// Monochrome characters with selective RescueLoop green highlights.
// Calm, technical, human — not cyberpunk neon.

interface Node {
  angle: number; // position around the loop (0..2π)
  speed: number; // angular speed
  state: "signal" | "review" | "support" | "returned";
  stateProgress: number; // 0..1 progress through recovery states
  char: string;
  baseRadius: number;
  wobble: number;
}

const CHARS = "·∘○◌●░▒│─";

const STATE_COLORS: Record<Node["state"], string> = {
  signal: "rgba(143,140,131,0.45)", // muted graphite
  review: "rgba(17,17,15,0.55)", // darker
  support: "rgba(198,138,30,0.7)", // amber
  returned: "rgba(20,125,104,0.85)", // recovery green
};

interface Props {
  className?: string;
  // Density multiplier — lower for mobile
  density?: number;
}

export function RecoveryLoopCanvas({ className, density = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function createNodes(count: number) {
      const nodes: Node[] = [];
      for (let i = 0; i < count; i++) {
        const stateRoll = Math.random();
        // ~50% signal, ~25% review, ~15% support, ~10% returned
        const state: Node["state"] =
          stateRoll < 0.5 ? "signal" : stateRoll < 0.75 ? "review" : stateRoll < 0.9 ? "support" : "returned";
        nodes.push({
          angle: Math.random() * Math.PI * 2,
          speed: (0.0006 + Math.random() * 0.0008) * (Math.random() > 0.5 ? 1 : 1), // all same direction
          state,
          stateProgress: state === "returned" ? 1 : Math.random() * 0.6,
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
          baseRadius: 0.82 + Math.random() * 0.18, // 0.82..1.0 of radius
          wobble: Math.random() * Math.PI * 2,
        });
      }
      nodesRef.current = nodes;
    }

    function resize() {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale node count by area + density
      const area = rect.width * rect.height;
      const count = Math.min(Math.floor((area / 1600) * density), prefersReduced ? 60 : 180);
      createNodes(count);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Pause when offscreen
    let isVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    // Pause when tab hidden
    let tabVisible = true;
    function onVisibility() {
      tabVisible = !document.hidden;
    }
    document.addEventListener("visibilitychange", onVisibility);

    let lastTime = performance.now();

    function render(now: number) {
      if (!canvas || !ctx || !container) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const rect = container.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const maxRadius = Math.min(rect.width, rect.height) * 0.46;

      ctx.clearRect(0, 0, rect.width, rect.height);

      const dt = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;
      const active = isVisible && tabVisible && !prefersReduced;

      if (active) {
        rotationRef.current += 0.0004 * dt;
      }

      // Draw orbit guide rings (very subtle)
      ctx.strokeStyle = "rgba(17,17,15,0.06)";
      ctx.lineWidth = 1;
      [0.6, 0.82, 1.0].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw the four quadrant labels around the loop
      const labels = [
        { text: "SIGNAL", angle: -Math.PI / 2 },
        { text: "REVIEW", angle: 0 },
        { text: "SUPPORT", angle: Math.PI / 2 },
        { text: "RETURN", angle: Math.PI },
      ];
      ctx.font = "500 10px var(--font-jetbrains-mono), monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      labels.forEach((lbl) => {
        const a = lbl.angle + rotationRef.current;
        const lx = cx + Math.cos(a) * (maxRadius * 1.12);
        const ly = cy + Math.sin(a) * (maxRadius * 1.12);
        ctx.fillStyle = "rgba(17,17,15,0.25)";
        ctx.fillText(lbl.text, lx, ly);
      });

      // Draw connecting flow arcs (dotted)
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(17,17,15,0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * 0.91, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update + draw nodes
      const nodes = nodesRef.current;
      // Sort by stateProgress so returned (green) draw on top
      const sorted = [...nodes].sort((a, b) => a.stateProgress - b.stateProgress);

      for (const n of sorted) {
        if (active) {
          n.angle += n.speed * dt;
          n.wobble += 0.01 * dt;
          // Occasionally advance a node's recovery state
          if (Math.random() < 0.0008 * dt && n.state !== "returned") {
            n.stateProgress += 0.15;
            if (n.stateProgress >= 1) {
              n.state = "returned";
              n.stateProgress = 1;
            } else if (n.stateProgress > 0.66) {
              n.state = "support";
            } else if (n.stateProgress > 0.33) {
              n.state = "review";
            }
          }
        }

        const a = n.angle + rotationRef.current;
        const wobbleR = Math.sin(n.wobble) * 4;
        const r = maxRadius * n.baseRadius + wobbleR;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        // Depth-ish: nodes near "front" (bottom) slightly brighter
        const depth = (Math.sin(a) + 1) / 2;
        const color = STATE_COLORS[n.state];
        ctx.globalAlpha = 0.5 + depth * 0.5;
        ctx.fillStyle = color;
        ctx.font = `${10 + depth * 3}px var(--font-jetbrains-mono), monospace`;
        ctx.fillText(n.char, x, y);
        ctx.globalAlpha = 1;
      }

      // Center mark
      ctx.fillStyle = "rgba(17,17,15,0.08)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(20,125,104,0.5)";
      ctx.beginPath();
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx.fill();

      if (active) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        // Re-check in 400ms when paused
        rafRef.current = window.setTimeout(() => requestAnimationFrame(render), 400) as unknown as number;
      }
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
