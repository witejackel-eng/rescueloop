"use client";

import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";

const FUNNEL = [
  { label: "Detected", value: 23, color: "var(--ink-secondary)" },
  { label: "Reviewed", value: 18, color: "var(--info)" },
  { label: "Approved", value: 12, color: "var(--warning)" },
  { label: "Returned", value: 7, color: "var(--recovery-green)" },
];

const QUEUE = [
  {
    name: "Maya Chen",
    course: "Agency Growth System",
    status: "Needs review",
    tone: "warning" as const,
  },
  {
    name: "Devon Park",
    course: "Creative Sprint",
    status: "Approved",
    tone: "info" as const,
  },
  {
    name: "Sara Reyes",
    course: "Founder Storytelling",
    status: "Returned",
    tone: "success" as const,
  },
];

const STATUS_STYLES: Record<
  "warning" | "info" | "success",
  { color: string; bg: string }
> = {
  warning: { color: "var(--warning)", bg: "rgba(198,138,30,0.10)" },
  info: { color: "var(--info)", bg: "rgba(61,107,140,0.10)" },
  success: { color: "var(--recovery-green)", bg: "rgba(20,125,104,0.10)" },
};

export function HeroPreview() {
  const reduced = useReducedMotion();

  return (
    <section className="relative border-b border-[var(--hairline)] bg-[var(--canvas)] py-16 lg:py-24">
      {/* Soft ambient glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(20,125,104,0.07), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="relative mx-auto max-w-[1100px]"
        >
          {/* Floating "Live demo" badge */}
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5, ease: easeOut }}
            className="absolute -right-2 -top-3 z-20 sm:-right-4 sm:-top-4"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-secondary)] shadow-[0_2px_8px_rgba(17,17,15,0.06)]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--recovery-green)] opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[var(--recovery-green)]" />
              </span>
              Live demo
            </span>
          </motion.div>

          {/* Main preview card */}
          <div
            className="relative overflow-hidden rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_12px_40px_-12px_rgba(17,17,15,0.18),0_2px_8px_-2px_rgba(17,17,15,0.05)]"
          >
            {/* Premium gradient wash */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(20,125,104,0.04) 0%, rgba(252,251,247,0) 35%, rgba(61,107,140,0.03) 100%)",
              }}
              aria-hidden="true"
            />

            {/* Window header */}
            <div className="relative flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[var(--hairline-strong)]" />
                <div className="size-2 rounded-full bg-[var(--hairline-strong)]" />
                <div className="size-2 rounded-full bg-[var(--hairline-strong)]" />
              </div>
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                rescueloop · creator dashboard
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                <Activity className="size-3 text-[var(--recovery-green)]" />
                overview
              </span>
            </div>

            {/* Body: 2-column grid */}
            <div className="relative grid grid-cols-1 gap-4 p-5 lg:grid-cols-3 lg:gap-5">
              {/* Left: Recovery Pulse */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.5, ease: easeOut }}
                className="lg:col-span-2"
              >
                <RecoveryPulseCard />
              </motion.div>

              {/* Right: System Health */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.28, duration: 0.5, ease: easeOut }}
              >
                <SystemHealthCard />
              </motion.div>

              {/* Full-width: Rescue Queue preview */}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5, ease: easeOut }}
                className="lg:col-span-3"
              >
                <RescueQueuePreview />
              </motion.div>
            </div>
          </div>

          {/* Caption */}
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-5 text-center font-mono text-[11px] tracking-wide text-[var(--ink-muted)]"
          >
            Static preview · numbers shown are illustrative sample data
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function CardLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 text-[var(--ink-muted)]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        {children}
      </span>
    </div>
  );
}

function RecoveryPulseCard() {
  const max = FUNNEL[0].value;
  return (
    <div className="rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <CardLabel icon={TrendingUp}>Recovery Pulse</CardLabel>
        <span className="font-mono text-[10px] text-[var(--ink-muted)]">
          last 7d
        </span>
      </div>

      {/* Funnel bars */}
      <div className="space-y-3">
        {FUNNEL.map((step, i) => {
          const widthPct = (step.value / max) * 100;
          return (
            <motion.div
              key={step.label}
              initial={false}
              className="flex items-center gap-3"
            >
              <span className="w-[64px] shrink-0 text-[12px] text-[var(--ink-secondary)]">
                {step.label}
              </span>
              <div className="relative h-7 flex-1 overflow-hidden rounded-[6px] bg-[var(--surface)]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${widthPct}%` }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.2 + i * 0.12,
                    duration: 0.7,
                    ease: easeOut,
                  }}
                  className="h-full rounded-[6px]"
                  style={{ background: step.color, opacity: 0.85 }}
                />
                <span className="absolute inset-y-0 right-2 flex items-center font-mono text-[12px] font-medium text-[var(--ink-primary)]">
                  {step.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footnote */}
      <div className="mt-4 flex items-center gap-2 border-t border-[var(--hairline)] pt-3">
        <CheckCircle2 className="size-3.5 text-[var(--recovery-green)]" />
        <span className="font-mono text-[11px] text-[var(--ink-secondary)]">
          7 of 23 confirmed returned · 30% recovery rate
        </span>
      </div>
    </div>
  );
}

function SystemHealthCard() {
  const domains = [
    { name: "Whop sync", ok: true },
    { name: "Webhook", ok: true },
    { name: "Attribution", ok: true },
    { name: "Notifications", ok: true },
  ];
  return (
    <div className="flex h-full flex-col rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <CardLabel icon={Activity}>System Health</CardLabel>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(20,125,104,0.25)] bg-[rgba(20,125,104,0.08)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--recovery-green)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          Operational
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        {domains.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between border-b border-[var(--hairline-subtle)] pb-2 last:border-b-0 last:pb-0"
          >
            <span className="text-[12px] text-[var(--ink-secondary)]">
              {d.name}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--recovery-green)]">
              <CheckCircle2 className="size-3" />
              healthy
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RescueQueuePreview() {
  return (
    <div className="rounded-[10px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <CardLabel icon={Users}>Rescue Queue</CardLabel>
        <span className="font-mono text-[10px] text-[var(--ink-muted)]">
          3 of 23 awaiting action
        </span>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-[var(--hairline-subtle)]">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--hairline-subtle)] bg-[var(--surface)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          <span>Student</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        {QUEUE.map((row, i) => {
          const style = STATUS_STYLES[row.tone];
          return (
            <motion.div
              key={row.name}
              initial={false}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[var(--hairline-subtle)] px-4 py-2.5 last:border-b-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium text-[var(--ink-secondary)]"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                  }}
                  aria-hidden="true"
                >
                  {row.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--ink-primary)]">
                    {row.name}
                  </div>
                  <div className="truncate text-[11px] text-[var(--ink-muted)]">
                    {row.course}
                  </div>
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ color: style.color, background: style.bg }}
              >
                {row.tone === "warning" && <AlertTriangle className="size-3" />}
                {row.tone === "info" && <CheckCircle2 className="size-3" />}
                {row.tone === "success" && <CheckCircle2 className="size-3" />}
                {row.status}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
