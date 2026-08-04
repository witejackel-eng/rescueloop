"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RescueLoopLogo } from "@/components/brand/logo";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { springLayout } from "@/design-system/motion";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#process" },
  { label: "Outcomes", href: "#outcomes" },
  { label: "Safety", href: "#safety" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduced = useReducedMotion();

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

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          width: scrolled ? "min(92%, 860px)" : "100%",
          marginTop: scrolled ? 16 : 0,
          marginLeft: scrolled ? "auto" : 0,
          marginRight: scrolled ? "auto" : 0,
          borderRadius: scrolled ? 14 : 0,
        }}
        transition={reduced ? { duration: 0.15 } : springLayout}
        className={cn(
          "fixed inset-x-0 top-0 z-50",
          scrolled
            ? "border border-[var(--hairline)] bg-[var(--canvas)]/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(17,17,15,0.06)]"
            : "border-b border-[var(--hairline-subtle)] bg-transparent",
        )}
      >
        <div className="flex items-center justify-between px-4 lg:px-6" style={{ height: scrolled ? 52 : 64 }}>
          <motion.div animate={{ scale: scrolled ? 0.92 : 1 }} transition={springLayout}>
            <Link href="/" aria-label="RescueLoop">
              <RescueLoopLogo markSize={scrolled ? 20 : 24} />
            </Link>
          </motion.div>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Marketing navigation">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--ink-primary)] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/overview"
              className="hidden text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)] md:inline"
            >
              Sign in
            </Link>
            <Link
              href="/overview"
              className="hidden items-center gap-1.5 rounded-[8px] bg-[var(--ink-primary)] px-3.5 py-2 text-[13px] font-medium text-white transition-transform press md:inline-flex"
            >
              View live demo
              <ArrowRight className="size-3.5" />
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-[8px] border border-[var(--hairline)] text-[var(--ink-primary)] md:hidden"
              aria-label="Open menu"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-[var(--canvas)] md:hidden"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <RescueLoopLogo />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex size-9 items-center justify-center rounded-[8px] border border-[var(--hairline)]"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-4 py-6" aria-label="Mobile menu">
              {LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
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
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[var(--ink-primary)] px-4 py-3 text-[15px] font-medium text-white"
                >
                  View live demo
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/overview"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-[10px] border border-[var(--hairline)] px-4 py-3 text-[15px] font-medium text-[var(--ink-secondary)]"
                >
                  Sign in
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
