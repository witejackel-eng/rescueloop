"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";
import { formatCurrency } from "@/lib/format";

interface Plan {
  id: "rescue" | "growth" | "scale";
  name: string;
  price: number;
  tagline: string;
  whoFor: string;
  problemItHandles: string;
  economicValue: string;
  includes: string[];
  excludes: string[];
  valueLogic: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "rescue",
    name: "Rescue",
    price: 29,
    tagline: "Single course, focused detection.",
    whoFor: "Solo creators running one course up to 250 members.",
    problemItHandles: "Catch at-risk members before the renewal window closes.",
    economicValue: "One retained $79/month member covers the plan for three months.",
    includes: [
      "One course, up to 250 members",
      "Activation + progress rescue",
      "Manual approval queue",
      "3 active campaigns",
      "Blocker collection",
      "Basic friction insights",
      "Weekly value report",
    ],
    excludes: ["Renewal rescue", "Cancellation rescue", "Multi-team"],
    valueLogic: "One $49/month member retained for three months represents $147 in subscription value.",
  },
  {
    id: "growth",
    name: "Growth",
    price: 59,
    tagline: "Multiple courses, smarter rescue.",
    whoFor: "Growing creators with multiple courses up to ~1,000 members.",
    problemItHandles: "Coordinate recovery across courses with comparable segmentation.",
    economicValue: "Two retained members cover the plan; expanded ledger protects every dollar.",
    includes: [
      "Multiple courses, up to ~1,000 members",
      "Renewal rescue",
      "More campaigns + advanced segmentation",
      "Campaign comparison",
      "Friction analysis",
      "Team action queue",
      "Expanded Value Ledger",
    ],
    excludes: ["Cancellation rescue", "Confirmed payment attribution", "Control groups"],
    valueLogic: "Two $79/month members retained for three months represent $474 in subscription value.",
    featured: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 119,
    tagline: "Established communities, full attribution.",
    whoFor: "Established communities up to ~2,500 members and a small team.",
    problemItHandles: "Defensible revenue recovery with cancellation rescue and confirmed attribution.",
    economicValue: "A single high-value retention saves more than the annual plan cost.",
    includes: [
      "Up to ~2,500 members",
      "Cancellation rescue",
      "Confirmed payment attribution",
      "Multiple team users",
      "Advanced simulation + control groups",
      "Data export",
      "Priority onboarding + monthly retention review",
    ],
    excludes: ["Custom integrations", "Dedicated success manager"],
    valueLogic: "One $199/month member retained for three months represents $597 in subscription value.",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...standard, delay: plan.featured ? 0.05 : 0 }}
      className={cn(
        "relative flex flex-col border bg-[var(--surface)]",
        plan.featured
          ? "border-[var(--ink-primary)] shadow-[0_2px_0_var(--ink-primary)]"
          : "border-[var(--hairline)]",
      )}
    >
      {plan.featured && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-[var(--ink-primary)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
          Most popular
        </div>
      )}

      <div className="border-b border-[var(--hairline)] px-6 py-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-[var(--ink-primary)]">
            {plan.name}
          </h3>
          <div className="text-right">
            <div className="font-mono text-[24px] tabular-nums text-[var(--ink-primary)]">
              ${plan.price}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              /month
            </div>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-[var(--ink-secondary)]">{plan.tagline}</p>
      </div>

      {/* Who / problem / value */}
      <div className="border-b border-[var(--hairline)]">
        <DetailRow label="Who it's for" value={plan.whoFor} />
        <DetailRow label="What it handles" value={plan.problemItHandles} />
        <DetailRow label="Economic value" value={plan.economicValue} />
      </div>

      {/* Includes */}
      <div className="border-b border-[var(--hairline)] px-6 py-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          What's included
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {plan.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--ink-primary)]">
              <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--recovery-green)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Excludes */}
      <div className="border-b border-[var(--hairline)] px-6 py-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          Deliberately excluded
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {plan.excludes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-[13px] text-[var(--ink-muted)]"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--ink-muted)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Value logic */}
      <div className="border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-6 py-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          Value logic
        </div>
        <p className="mt-2 font-serif text-[15px] leading-snug text-[var(--ink-primary)]">
          {plan.valueLogic}
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 py-5">
        <Link
          href="/onboarding"
          className={cn(
            "press inline-flex w-full items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-[14px] font-medium transition-colors",
            plan.featured
              ? "bg-[var(--ink-primary)] text-white"
              : "border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-primary)] hover:border-[var(--ink-primary)]",
          )}
        >
          Start with {plan.name}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--hairline)] px-6 py-4 last:border-b-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </div>
      <div className="mt-1.5 text-[13px] leading-snug text-[var(--ink-primary)]">
        {value}
      </div>
    </div>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[var(--canvas)]">
      <div className="mx-auto max-w-[1400px] px-4 py-20 lg:px-8 lg:py-32">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          Pricing
        </div>
        <h2 className="mt-8 max-w-[22ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          Pay for the operating problem you actually have.
        </h2>
        <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Each plan is built around a real risk surface — activation, renewal, or
          cancellation. Move up only when the next problem is actually on your
          plate.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-px lg:bg-[var(--hairline)]">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-10 grid grid-cols-1 gap-6 border border-[var(--hairline)] bg-[var(--surface)] p-6 lg:grid-cols-3 lg:gap-10 lg:p-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Billing
            </div>
            <p className="mt-2 text-[13px] leading-snug text-[var(--ink-secondary)]">
              Monthly. Cancel anytime. No setup fees. Plans include the safety
              system, the value ledger, and audit logging.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Migration
            </div>
            <p className="mt-2 text-[13px] leading-snug text-[var(--ink-secondary)]">
              Move between plans without losing interventions, evidence, or
              attribution history. Downgrades take effect at the next cycle.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Reference point
            </div>
            <p className="mt-2 text-[13px] leading-snug text-[var(--ink-secondary)]">
              In the live demo workspace, {formatCurrency(237)} confirmed and{" "}
              {formatCurrency(711)} estimated value were recovered against a{" "}
              {formatCurrency(29)}/month plan — an 8.2× confirmed value-to-cost ratio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
