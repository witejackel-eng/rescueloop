"use client";

// ─────────────────────────────────────────────────────────────
// PX02 — Health Action Panel
// Explains non-healthy states: impact, data safety, retry, action.
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type { HealthSignal } from "@/lib/types/health";

interface HealthActionPanelProps {
  signal: HealthSignal;
}

export function HealthActionPanel({ signal }: HealthActionPanelProps) {
  // Only render for non-healthy states
  if (signal.status === "healthy") return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="mt-3 space-y-2 border-t border-[var(--hairline-subtle)] pt-3">
        {/* Impact */}
        {signal.impact && (
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0 text-[var(--warning)]"
              strokeWidth={2}
            />
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Impact
              </span>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-primary)]">
                {signal.impact}
              </p>
            </div>
          </div>
        )}

        {/* Data safety */}
        <div className="flex items-start gap-2">
          {signal.dataSafe ? (
            <ShieldCheck
              className="mt-0.5 size-3.5 shrink-0 text-[var(--recovery-green)]"
              strokeWidth={2}
            />
          ) : (
            <ShieldAlert
              className="mt-0.5 size-3.5 shrink-0 text-[var(--critical)]"
              strokeWidth={2}
            />
          )}
          <p className="text-[12px] leading-snug text-[var(--ink-secondary)]">
            {signal.dataSafe
              ? "Your data is safe — no information is at risk."
              : "Data may be at risk — some information could be incomplete or stale."}
          </p>
        </div>

        {/* Retry status */}
        <div className="flex items-start gap-2">
          <RefreshCw
            className={cn(
              "mt-0.5 size-3.5 shrink-0",
              signal.retrying
                ? "text-[var(--recovery-green)] animate-spin"
                : "text-[var(--ink-muted)]",
            )}
            strokeWidth={2}
          />
          <p className="text-[12px] leading-snug text-[var(--ink-secondary)]">
            {signal.retrying
              ? "RescueLoop is automatically retrying — no action needed for this part."
              : "RescueLoop is not currently retrying this issue."}
          </p>
        </div>

        {/* Action required */}
        {signal.actionRequired && (
          <div className="flex items-start gap-2">
            <ExternalLink
              className="mt-0.5 size-3.5 shrink-0 text-[var(--critical)]"
              strokeWidth={2}
            />
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--critical)]">
                Action required
              </span>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-primary)]">
                You need to take action to resolve this.
              </p>
              {signal.actionLabel && (
                <a
                  href={signal.actionHref ?? "#"}
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--recovery-green)] hover:underline"
                >
                  {signal.actionLabel}
                  <ExternalLink className="size-3" strokeWidth={2} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Minimal cn utility — avoids importing full cn just for conditional class */
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
