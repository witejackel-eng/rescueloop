"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { charReveal } from "@/design-system/motion";
import { cn } from "@/lib/utils";

interface RevealTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  // If true, splits into words then chars (better for long text)
  byWord?: boolean;
}

export function RevealText({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  byWord = false,
}: RevealTextProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  const units = byWord ? text.split(" ") : text.split("");

  return (
    <Tag className={cn("inline-block", className)} aria-label={text}>
      {byWord
        ? units.map((word, wi) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {word.split("").map((ch, ci) => (
                <motion.span
                  key={`${wi}-${ci}`}
                  custom={wi * 0.1 + ci * 0.01 + delay}
                  variants={charReveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className="inline-block"
                >
                  {ch}
                </motion.span>
              ))}
              {wi < units.length - 1 && <span>&nbsp;</span>}
            </span>
          ))
        : units.map((ch, i) => (
            <motion.span
              key={i}
              custom={i * 0.018 + delay}
              variants={charReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="inline-block"
              style={{ whiteSpace: ch === " " ? "pre" : "normal" }}
            >
              {ch}
            </motion.span>
          ))}
    </Tag>
  );
}
