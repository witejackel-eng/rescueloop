"use client";

import { useEffect, useRef, useCallback } from "react";

// Recovery Signal Field — a canvas-based particle visualization.
// Hundreds of student signals orbit a central flow. Stalled members
// drift out; detected members become outlined; rescued members return
// and turn green. Pointer-driven rotation. Pauses outside viewport and
// on reduced motion. Particle count scales with viewport.

interface Signal {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  state: "healthy" | "stalled" | "detected" | "rescued";
  driftPhase: number;
}

interface LiveLabel {
  text: string;
  shownUntil: number;
}

export function RecoverySignalField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const signalsRef = useRef<Signal[]>([]);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const rafRef = useRef<number>(0);
  const labelRef = useRef<LiveLabel>({ text: "", shownUntil: 0 });
  const lastLabelTimeRef = useRef(0);

  const initSignals = useCallback((count: number) => {
    const signals: Signal[] = [];
    // Distribute states: ~70% healthy, ~15% stalled, ~10% detected, ~5% rescued
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const state: Signal["state"] =
        r < 0.7 ? "healthy" : r < 0.85 ? "stalled" : r < 0.95 ? "detected" : "rescued";
      const baseRadius = 60 + Math.random() * 120;
      signals.push({
        angle: Math.random() * Math.PI * 2,
        baseRadius,
        radius: baseRadius,
        speed: (0.0008 + Math.random() * 0.0012) * (Math.random() > 0.5 ? 1 : -1),
        size: state === "detected" ? 2.2 : 1.4,
        state,
        driftPhase: Math.random() * Math.PI * 2,
      });
    }
    signalsRef.current = signals;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx?.scale(dpr, dpr);

      // Scale particle count by viewport
      const area = rect.width * rect.height;
      const count = Math.min(Math.floor(area / 1400), prefersReduced ? 80 : 240);
      initSignals(count);
    }

    resize();
    window.addEventListener("resize", resize);

    // Intersection observer to pause outside viewport
    let isVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    io.observe(container);

    // Pointer rotation
    function onPointerMove(e: PointerEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      pointerRef.current = { x, y: (e.clientY - rect.top) / rect.height, active: true };
      targetRotationRef.current = (x - 0.5) * 0.8;
    }
    function onPointerLeave() {
      pointerRef.current.active = false;
    }
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // Live event labels
    const LABELS = [
      "Student resumed Lesson 12",
      "Cancellation reversed",
      "Blocker reported: unclear setup",
      "Member activated after 39 days",
      "Progress 38% → 42%",
      "Mid-course rescue delivered",
    ];

    function render(now: number) {
      if (!canvas || !ctx || !container) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const rect = container.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      ctx.clearRect(0, 0, rect.width, rect.height);

      if (prefersReduced) {
        targetRotationRef.current = 0;
      } else if (isVisible) {
        rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.04;
      }

      // Update label
      if (now - lastLabelTimeRef.current > 3200 && isVisible && !prefersReduced) {
        labelRef.current = {
          text: LABELS[Math.floor(Math.random() * LABELS.length)],
          shownUntil: now + 2800,
        };
        lastLabelTimeRef.current = now;
      }

      // Draw orbit guide rings (very subtle)
      ctx.strokeStyle = "rgba(17,17,15,0.05)";
      ctx.lineWidth = 1;
      [70, 120, 170].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw signals
      const signals = signalsRef.current;
      for (const s of signals) {
        if (isVisible && !prefersReduced) {
          s.angle += s.speed * 16;
          // Stalled signals drift outward slowly
          if (s.state === "stalled") {
            s.driftPhase += 0.01;
            s.radius = s.baseRadius + Math.sin(s.driftPhase) * 18 + 12;
          } else if (s.state === "detected") {
            s.radius = s.baseRadius + 22;
          } else {
            s.radius = s.baseRadius;
          }
        }

        const a = s.angle + rotationRef.current;
        const x = cx + Math.cos(a) * s.radius;
        const y = cy + Math.sin(a) * s.radius;

        if (s.state === "healthy") {
          ctx.fillStyle = "rgba(95,93,87,0.5)";
          ctx.beginPath();
          ctx.arc(x, y, s.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.state === "stalled") {
          ctx.fillStyle = "rgba(198,138,30,0.7)";
          ctx.beginPath();
          ctx.arc(x, y, s.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.state === "detected") {
          // Outlined
          ctx.strokeStyle = "rgba(17,17,15,0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, s.size + 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(17,17,15,0.15)";
          ctx.beginPath();
          ctx.arc(x, y, s.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.state === "rescued") {
          // Green returning to flow
          ctx.fillStyle = "rgba(20,125,104,0.9)";
          ctx.beginPath();
          ctx.arc(x, y, s.size + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw center core
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
      grad.addColorStop(0, "rgba(20,125,104,0.12)");
      grad.addColorStop(1, "rgba(20,125,104,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(17,17,15,0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw live label
      if (labelRef.current.shownUntil > now) {
        const remaining = (labelRef.current.shownUntil - now) / 2800;
        const alpha = Math.min(1, remaining * 2) * Math.min(1, (1 - remaining) * 4);
        ctx.fillStyle = `rgba(17,17,15,${alpha * 0.85})`;
        ctx.font = "500 12px var(--font-jetbrains-mono), monospace";
        ctx.textAlign = "center";
        ctx.fillText(labelRef.current.text, cx, cy + 60);
      }

      if (isVisible) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        // When not visible, check again in 500ms
        rafRef.current = window.setTimeout(() => requestAnimationFrame(render), 500) as unknown as number;
      }
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      io.disconnect();
    };
  }, [initSignals]);

  return (
    <div ref={containerRef} className={className} aria-label="Recovery Signal Field visualization of student signals">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
