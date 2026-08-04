import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal — RescueLoop",
  description: "Privacy, terms, security, and data processing for the RescueLoop private pilot.",
};

const PAGES = [
  { href: "/privacy", title: "Privacy Policy", description: "How RescueLoop handles personal data." },
  { href: "/terms", title: "Terms of Service", description: "The terms governing use of RescueLoop during the private pilot." },
  { href: "/security", title: "Security", description: "Current architecture, data handling, and security practices." },
  { href: "/data-processing", title: "Data Processing", description: "Controller/processor responsibilities, retention, and subprocessors." },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <header className="border-b border-[var(--hairline)] bg-[var(--surface)]">
        <div className="mx-auto flex h-14 max-w-[860px] items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5 text-[13px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]">
            <ArrowLeft className="size-4" />
            RescueLoop
          </Link>
          <span className="text-[var(--ink-muted)]">/</span>
          <span className="font-mono text-[12px] text-[var(--ink-muted)]">Legal</span>
        </div>
      </header>
      <div className="mx-auto max-w-[860px] px-4 py-10">
        <nav className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} className="border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--ink-primary)]">
              <p className="text-[14px] font-medium text-[var(--ink-primary)]">{p.title}</p>
              <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">{p.description}</p>
            </Link>
          ))}
        </nav>
        <article className="prose prose-sm max-w-none">{children}</article>
      </div>
    </div>
  );
}
