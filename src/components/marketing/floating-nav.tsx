"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RescueLoopLogo } from "@/components/brand/logo";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { springLayout } from "@/design-system/motion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Primary navigation links — always shown in desktop center nav at >=960px.
const PRIMARY_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#process" },
  { label: "Student experience", href: "#student-experience" },
  { label: "Pricing", href: "#pricing" },
];

// Secondary links — moved to Resources dropdown + footer (NOT in center nav).
const SECONDARY_LINKS = [
  { label: "Safety", href: "#safety" },
  { label: "FAQ", href: "#faq" },
];

const ALL_LINKS = [...PRIMARY_LINKS, ...SECONDARY_LINKS];

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduced = useReducedMotion();
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Escape key closes mobile menu + restores focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          height: scrolled ? 56 : 64,
        }}
        transition={reduced ? { duration: 0.15 } : springLayout}
        className={cn(
          "fixed inset-x-0 top-0 z-50",
          scrolled
            ? "border-b border-[var(--hairline)] bg-[var(--canvas)]/85 backdrop-blur-xl shadow-[0_1px_0_rgba(17,17,15,0.04),0_4px_16px_rgba(17,17,15,0.05)]"
            : "border-b border-[var(--hairline-subtle)] bg-[var(--canvas)]/70 backdrop-blur-sm",
        )}
        style={{ ["--site-header-height" as string]: scrolled ? "56px" : "64px" }}
        data-scrolled={scrolled ? "true" : "false"}
        data-header-region="root"
      >
        {/*
          Robust 3-region header.

          We deliberately use `flex justify-between` instead of CSS Grid.
          When the desktop <nav> is `display:none` below 960px, the flex
          container sees only two children (brand on the left, CTA region
          on the right) and `justify-between` keeps both pinned to the
          far edges — the mobile menu trigger is always anchored at the
          FAR RIGHT and there is never a "huge empty gap" between the
          logo and the trigger.

          The center <nav> is `hidden compact:flex` so at >=960px it
          appears between brand and CTAs and `flex-1 justify-center`
          centers it inside the available space.

          The CTA region is `shrink-0` so it never collapses; the
          desktop CTAs (Private pilot + Explore demo) are
          `hidden compact:inline-flex` and the mobile trigger is
          `compact:hidden`, guaranteeing exactly one right-side
          control at every viewport width.
        */}
        <div
          className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
          data-header-region="bar"
        >
          {/* ── LEFT: Brand (never shrinks) ── */}
          <motion.div
            animate={{ scale: scrolled ? 0.92 : 1 }}
            transition={springLayout}
            className="shrink-0"
            data-header-region="brand"
          >
            <Link href="/" aria-label="RescueLoop home">
              <RescueLoopLogo context="marketing" compact={scrolled} />
            </Link>
          </motion.div>

          {/* ── CENTER: Desktop navigation (4 primary links + Resources dropdown) ── */}
          <nav
            className="hidden flex-1 items-center justify-center compact:flex"
            aria-label="Marketing navigation"
            style={{ gap: "clamp(0.875rem, 1.6vw, 1.5rem)" }}
            data-header-region="primary-nav"
          >
            {PRIMARY_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative whitespace-nowrap text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--ink-primary)] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}

            {/* Resources dropdown — Safety & FAQ at all desktop breakpoints */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center gap-0.5 whitespace-nowrap text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
                  aria-label="Resources"
                >
                  Resources
                  <ChevronDown className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {SECONDARY_LINKS.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <a
                      href={link.href}
                      className="text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    >
                      {link.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* ── RIGHT: CTA region (never shrinks; exactly one right-side control at every width) ── */}
          <div
            className="flex shrink-0 items-center gap-2"
            data-header-region="cta"
          >
            {/* Private pilot — desktop only */}
            <Link
              href="/private-pilot"
              className="hidden items-center whitespace-nowrap rounded-[8px] border border-[var(--hairline)] px-3.5 py-2 text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--hairline-strong)] hover:text-[var(--ink-primary)] compact:inline-flex"
            >
              Private pilot
            </Link>

            {/* Explore demo — primary dark CTA, desktop only */}
            <Link
              href="/overview"
              data-testid="header-explore-demo"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[var(--ink-primary)] px-3.5 py-2 text-[13px] font-medium text-white transition-transform press compact:inline-flex"
            >
              Explore demo
              <ArrowRight className="size-3.5" />
            </Link>

            {/* Mobile menu trigger — below compact (960px). Always far-right. */}
            <button
              ref={mobileTriggerRef}
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-[8px] border border-[var(--hairline)] text-[var(--ink-primary)] transition-colors hover:border-[var(--hairline-strong)] compact:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-[var(--canvas)] compact:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <RescueLoopLogo />
              <button
                onClick={closeMobile}
                className="flex size-9 items-center justify-center rounded-[8px] border border-[var(--hairline)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-4 py-6" aria-label="Mobile menu">
              {ALL_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                  className="border-b border-[var(--hairline-subtle)] py-4 font-serif text-2xl text-[var(--ink-primary)]"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="mt-6 flex flex-col gap-3"
              >
                <Link
                  href="/overview"
                  onClick={closeMobile}
                  data-testid="mobile-explore-demo"
                  className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[var(--ink-primary)] px-4 py-3 text-[15px] font-medium text-white"
                >
                  Explore demo
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/private-pilot"
                  onClick={closeMobile}
                  className="flex items-center justify-center rounded-[10px] border border-[var(--hairline)] px-4 py-3 text-[15px] font-medium text-[var(--ink-secondary)]"
                >
                  Private pilot
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
