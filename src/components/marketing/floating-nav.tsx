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

// Primary navigation links — always shown in desktop center nav
const PRIMARY_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#process" },
  { label: "Student experience", href: "#student-experience" },
  { label: "Pricing", href: "#pricing" },
];

// Secondary links — moved to Resources dropdown + footer (NOT in center nav)
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
      <motion.div
        initial={false}
        animate={{
          width: scrolled ? "min(calc(100% - 32px), 1180px)" : "100%",
          marginTop: scrolled ? 16 : 0,
          marginLeft: scrolled ? "auto" : 0,
          marginRight: scrolled ? "auto" : 0,
          borderRadius: scrolled ? 14 : 0,
        }}
        transition={reduced ? { duration: 0.15 } : springLayout}
        className={cn(
          "fixed inset-x-0 top-0 z-50",
          scrolled
            ? "border border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(17,17,15,0.06)]"
            : "border-b border-[var(--hairline-subtle)] bg-[var(--canvas)]/60 backdrop-blur-sm",
        )}
        style={{ ["--site-header-height" as string]: scrolled ? "52px" : "64px" }}
      >
        {/* Grid: brand | nav | CTA — three predictable regions */}
        <div
          className="grid items-center px-4 sm:px-6"
          style={{
            height: scrolled ? 52 : 64,
            gridTemplateColumns: "max-content minmax(0, 1fr) max-content",
            gap: "1rem",
          }}
        >
          {/* ── Brand (never shrinks) ── */}
          <motion.div animate={{ scale: scrolled ? 0.92 : 1 }} transition={springLayout} className="shrink-0">
            <Link href="/" aria-label="RescueLoop home">
              <RescueLoopLogo context="marketing" compact={scrolled} />
            </Link>
          </motion.div>

          {/* ── Desktop navigation: 4 primary links + Resources dropdown ── */}
          <nav
            className="hidden items-center justify-center compact:flex"
            aria-label="Marketing navigation"
            style={{ gap: "clamp(1rem, 2vw, 1.75rem)" }}
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
                  className="group flex items-center gap-0.5 whitespace-nowrap text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)] focus-visible:outline-none"
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

          {/* ── CTA region (never shrinks) ── */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/overview"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[var(--ink-primary)] px-3.5 py-2 text-[13px] font-medium text-white transition-transform press compact:inline-flex"
            >
              Explore demo
              <ArrowRight className="size-3.5" />
            </Link>

            {/* Mobile menu trigger — below compact (1180px) */}
            <button
              ref={mobileTriggerRef}
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-[8px] border border-[var(--hairline)] text-[var(--ink-primary)] compact:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </motion.div>

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
                className="flex size-9 items-center justify-center rounded-[8px] border border-[var(--hairline)]"
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
                  className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[var(--ink-primary)] px-4 py-3 text-[15px] font-medium text-white"
                >
                  Explore interactive demo
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
