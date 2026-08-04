import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Today's priorities — ranked list of max 5 actions.
 *
 * Static server component (no hooks). Renders rows separated by 1px
 * hairlines, no card border. Each row shows: rank, label, detail, urgency
 * pill, and a right-aligned "Review" link.
 */

type Priority = {
  rank: number;
  label: string;
  detail: string;
  urgency: "Today" | "This week";
  href: string;
};

const PRIORITIES: Priority[] = [
  {
    rank: 1,
    label: "Student expected something different",
    detail: "4 students · across 3 lessons",
    urgency: "Today",
    href: "/rescue-queue",
  },
  {
    rank: 2,
    label: "Cancellation needs review",
    detail: "Olivia Brown · renews Feb 8",
    urgency: "Today",
    href: "/rescue-queue",
  },
  {
    rank: 3,
    label: "Technical blocker reported",
    detail: "3 students · Lesson 7 setup",
    urgency: "This week",
    href: "/insights",
  },
  {
    rank: 4,
    label: "High-value renewal risk",
    detail: "Maya Chen · $79/mo · 23 days inactive",
    urgency: "Today",
    href: "/rescue-queue",
  },
  {
    rank: 5,
    label: "Campaign paused",
    detail: "Mid-Course Rescue · 0 interventions queued",
    urgency: "This week",
    href: "/campaigns",
  },
];

export function PriorityList() {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">
          Today&apos;s priorities
        </h3>
        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
          {PRIORITIES.length} ranked
        </span>
      </div>

      <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
        {PRIORITIES.map((p) => (
          <div
            key={p.rank}
            className="group flex items-center gap-3 px-1 py-3 transition-colors hover:bg-[var(--canvas-elevated)] sm:gap-4"
          >
            <span className="w-5 shrink-0 font-mono text-[12px] tabular-nums text-[var(--ink-muted)]">
              {String(p.rank).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] text-[var(--ink-primary)]">
                {p.label}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[var(--ink-muted)]">
                {p.detail}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-[2px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${
                p.urgency === "Today"
                  ? "border-[var(--critical)]/30 bg-[var(--critical-light)] text-[var(--critical)]"
                  : "border-[var(--hairline)] bg-[var(--canvas-elevated)] text-[var(--ink-secondary)]"
              }`}
            >
              {p.urgency}
            </span>

            <Link
              href={p.href}
              className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--ink-secondary)] transition-colors hover:text-[var(--recovery-green)]"
            >
              <span className="hidden sm:inline">Review</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
