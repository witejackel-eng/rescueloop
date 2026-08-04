"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, easeOut } from "@/design-system/motion";

const WORDS = ["start", "continue", "finish", "stay"];

// KineticRecoveryWord — animates the final word of the headline.
// Characters rise from below with a blur that resolves smoothly.
// Cycles through start → continue → finish → stay.
// ~2.8s per word. Pauses when tab hidden. Respects reduced motion.

export function KineticRecoveryWord() {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1) % WORDS.length);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let interval: ReturnType<typeof setInterval>;

    function start() {
      interval = setInterval(advance, motionTokens.wordCycle);
    }
    function onVisibility() {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        start();
      }
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [advance, reduced]);

  const word = WORDS[index];

  if (reduced) {
    // Static — just show the first word with a subtle indicator
    return (
      <span className="relative inline-block italic text-[var(--recovery-green)]">
        {word}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-baseline" style={{ minWidth: "4ch" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={word}
          className="inline-flex italic text-[var(--recovery-green)]"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {word.split("").map((char, i) => (
            <motion.span
              key={`${word}-${i}`}
              custom={i}
              variants={{
                hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
                visible: (ci: number) => ({
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: {
                    delay: ci * 0.035,
                    duration: 0.45,
                    ease: easeOut,
                  },
                }),
                exit: {
                  opacity: 0,
                  y: -10,
                  filter: "blur(8px)",
                  transition: { duration: 0.22, ease: easeOut },
                },
              }}
              className="inline-block"
              style={{ whiteSpace: "pre" }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
