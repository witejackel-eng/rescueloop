"use client";

import Link from "next/link";
import {
  ArrowRight,
  Command as CommandIcon,
  DollarSign,
  ListChecks,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { useDemoStore } from "@/features/demo-engine/demo-store";

type Action =
  | {
      kind: "link";
      label: string;
      href: string;
      icon: LucideIcon;
      badge?: number;
    }
  | {
      kind: "button";
      label: string;
      icon: LucideIcon;
      kbd?: string;
      onClick: () => void;
    };

export function QuickActions() {
  const awaitingCount = useDemoStore(
    (s) =>
      s.queueItems.filter(
        (q) => q.interventionState === "awaiting_approval" && !q.excluded,
      ).length,
  );
  const setCommandPaletteOpen = useDemoStore((s) => s.setCommandPaletteOpen);

  const actions: Action[] = [
    {
      kind: "link",
      label: "Review rescue queue",
      href: "/rescue-queue",
      icon: ListChecks,
      badge: awaitingCount,
    },
    {
      kind: "button",
      label: "Open command palette",
      icon: CommandIcon,
      kbd: "⌘K",
      onClick: () => setCommandPaletteOpen(true),
    },
    {
      kind: "link",
      label: "View value ledger",
      href: "/value",
      icon: DollarSign,
    },
    {
      kind: "link",
      label: "Adjust campaigns",
      href: "/campaigns",
      icon: Megaphone,
    },
  ];

  return (
    <section className="border border-[var(--hairline)] bg-[var(--surface)]">
      <header className="border-b border-[var(--hairline)] px-4 py-3">
        <h3 className="font-serif text-[16px] text-[var(--ink-primary)]">
          Quick actions
        </h3>
      </header>

      <div className="divide-y divide-[var(--hairline)]">
        {actions.map((a) => {
          const Icon = a.icon;
          const content = (
            <>
              <Icon className="size-4 shrink-0 text-[var(--ink-secondary)]" strokeWidth={2} />
              <span className="text-[13px] text-[var(--ink-primary)]">
                {a.label}
              </span>
              {a.kind === "link" && a.badge !== undefined && a.badge > 0 && (
                <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--critical)] px-1.5 font-mono text-[10px] tabular-nums text-white">
                  {a.badge}
                </span>
              )}
              {a.kind === "button" && a.kbd && (
                <kbd className="ml-auto flex items-center gap-0.5 rounded border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1 py-px font-mono text-[10px] text-[var(--ink-muted)]">
                  {a.kbd}
                </kbd>
              )}
              {a.kind === "link" &&
                (a.badge === undefined || a.badge === 0) && (
                  <ArrowRight
                    className="ml-auto size-3.5 shrink-0 text-[var(--ink-muted)]"
                    strokeWidth={2}
                  />
                )}
            </>
          );

          const rowClass =
            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--canvas-elevated)]";

          if (a.kind === "link") {
            return (
              <Link key={a.label} href={a.href} className={rowClass}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={rowClass}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
