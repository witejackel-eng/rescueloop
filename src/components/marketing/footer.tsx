import Link from "next/link";
import { RescueLoopLogo } from "@/components/brand/logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/overview" },
      { label: "Rescue queue", href: "/overview" },
      { label: "Insights", href: "/overview" },
      { label: "Outcomes", href: "/overview" },
      { label: "Student view", href: "/student-rescue" },
    ],
  },
  {
    title: "Demo",
    links: [
      { label: "Interactive demo", href: "/overview" },
      { label: "Rescue Queue demo", href: "/overview" },
      { label: "Members demo", href: "/overview" },
      { label: "Playbooks demo", href: "/overview" },
      { label: "System Health demo", href: "/overview" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Data processing", href: "/legal/data-processing" },
      { label: "Security", href: "/legal/security" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t-[1.5px] border-[var(--hairline-strong)] bg-[var(--canvas)]">
      <div className="mx-auto max-w-[1400px] px-4 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <RescueLoopLogo />
            <p className="max-w-[34ch] text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              A student-success and recovery operating system for Whop
              course creators. Detect, intervene, attribute.
            </p>
            <div className="inline-flex w-fit items-center gap-2 rounded-[4px] border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
              Private preview
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                {col.title}
              </div>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-[var(--hairline)] pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">
            © {new Date().getFullYear()} RescueLoop. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">
            Built for Whop course creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
