"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { easeOut } from "@/design-system/motion";

export function FinalCta() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[var(--hairline)] bg-[var(--dark-section)] py-20 lg:py-32"
    >
      {/* Subtle diagonal pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[900px] px-6 text-center lg:px-12">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: easeOut }}
        >
          <h2 className="font-serif text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.98] tracking-[-0.02em] text-white">
            Help the right{" "}
            <span className="italic text-[var(--dark-secondary)]">students continue.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-[520px] text-[16px] leading-relaxed text-[var(--dark-secondary)] lg:text-[17px]">
            See RescueLoop work through a real simulated rescue case.
            From the first signal to the observed outcome.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/overview"
              data-testid="final-cta-explore-demo"
              className="press group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--recovery-green)] px-7 py-4 text-[15px] font-medium text-white transition-shadow hover:shadow-[0_2px_12px_rgba(20,125,104,0.3)]"
            >
              Explore the interactive demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/private-pilot"
              className="press inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--dark-hairline)] px-6 py-4 text-[14px] font-medium text-[var(--dark-secondary)] transition-colors hover:border-[var(--dark-secondary)] hover:text-white"
            >
              Apply for done-for-you implementation
            </Link>
          </div>

          <p className="mt-8 font-mono text-[11px] text-[var(--dark-secondary)] opacity-70">
            Nothing sends without your approval.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
