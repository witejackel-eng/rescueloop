"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/interaction/animated-counter";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { standard } from "@/design-system/motion";
import { formatCurrency } from "@/lib/format";

interface InputDef {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  description: string;
}

const INPUTS: InputDef[] = [
  {
    id: "members",
    label: "Active paying members",
    min: 50,
    max: 5000,
    step: 10,
    description: "Members currently on a recurring plan.",
  },
  {
    id: "price",
    label: "Monthly membership price",
    min: 9,
    max: 500,
    step: 1,
    prefix: "$",
    description: "Average price per active member per month.",
  },
  {
    id: "cancellations",
    label: "Current monthly cancellations",
    min: 0,
    max: 200,
    step: 1,
    description: "Cancellations in the last 30 days.",
  },
  {
    id: "inactive",
    label: "Estimated inactive students",
    min: 0,
    max: 2000,
    step: 5,
    description: "Members who paid but haven't progressed recently.",
  },
  {
    id: "recoveryRate",
    label: "Scenario re-engagement assumption",
    min: 5,
    max: 60,
    step: 1,
    suffix: "%",
    description: "Share of exposed revenue opportunity you assume might re-engage. This is an illustrative scenario assumption, not a forecast.",
  },
];

const PLANS = [
  { name: "Rescue", cost: 29 },
  { name: "Growth", cost: 59 },
  { name: "Scale", cost: 119 },
];

function SliderRow({
  def,
  value,
  onChange,
}: {
  def: InputDef;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border-b border-[var(--hairline)] px-5 py-5 lg:px-6 lg:py-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <label
            htmlFor={def.id}
            className="text-[14px] font-medium text-[var(--ink-primary)]"
          >
            {def.label}
          </label>
          <div className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
            {def.description}
          </div>
        </div>
        <div className="font-mono text-[20px] tabular-nums text-[var(--ink-primary)]">
          {def.prefix}
          {value.toLocaleString("en-US")}
          {def.suffix}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <input
          id={def.id}
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[var(--recovery-green)]"
          aria-label={def.label}
        />
        <input
          type="number"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 rounded-[4px] border border-[var(--hairline)] bg-[var(--surface)] px-2 py-1 text-right font-mono text-[13px] tabular-nums text-[var(--ink-primary)] focus:outline-none focus:border-[var(--recovery-green)]"
          aria-label={`${def.label} number input`}
        />
      </div>
    </div>
  );
}

export function RoiCalculator() {
  const reduced = useReducedMotion();
  const [members, setMembers] = useState(742);
  const [price, setPrice] = useState(79);
  const [cancellations, setCancellations] = useState(12);
  const [inactive, setInactive] = useState(118);
  const [recoveryRate, setRecoveryRate] = useState(25);

  const inputs = [
    { def: INPUTS[0], value: members, onChange: setMembers },
    { def: INPUTS[1], value: price, onChange: setPrice },
    { def: INPUTS[2], value: cancellations, onChange: setCancellations },
    { def: INPUTS[3], value: inactive, onChange: setInactive },
    { def: INPUTS[4], value: recoveryRate, onChange: setRecoveryRate },
  ];

  // Calculations
  const monthlyExposed = (inactive + cancellations) * price;
  const recoveredMembers = Math.round((inactive + cancellations) * (recoveryRate / 100));
  const threeMonthRetained = monthlyExposed * (recoveryRate / 100) * 3;

  return (
    <section className="bg-[var(--section-neutral)]">
      <div className="mx-auto max-w-[1400px] px-4 py-20 lg:px-8 lg:py-32">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          The math
        </div>
        <h2 className="mt-8 max-w-[22ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          What is your exposed revenue opportunity?
        </h2>
        <p className="mt-6 max-w-[60ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Drag the inputs. Outputs update live. Nothing is sent, nothing is
          saved — this is for you to think with.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-px bg-[var(--hairline)] lg:grid-cols-2">
          {/* Inputs panel */}
          <div className="bg-[var(--surface)]">
            <div className="border-b border-[var(--hairline)] px-5 py-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Your inputs
              </span>
            </div>
            {inputs.map(({ def, value, onChange }) => (
              <SliderRow
                key={def.id}
                def={def}
                value={value}
                onChange={onChange}
              />
            ))}
          </div>

          {/* Outputs panel */}
          <div className="bg-[var(--canvas)]">
            <div className="border-b border-[var(--hairline)] px-5 py-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Computed outcomes
              </span>
            </div>

            {/* Hero stat: monthly exposed */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={standard}
              className="border-b border-[var(--hairline)] px-5 py-7 lg:px-6"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Monthly revenue currently exposed
              </div>
              <div className="mt-2 font-serif text-[clamp(2.5rem,5vw,3.5rem)] leading-none tracking-[-0.02em] text-[var(--ink-primary)]">
                <AnimatedCounter
                  value={monthlyExposed}
                  prefix="$"
                  className="!font-serif !tabular-nums"
                />
              </div>
              <div className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
                {inactive.toLocaleString()} inactive × {formatCurrency(price)} + {cancellations.toLocaleString()} cancellations × {formatCurrency(price)}
              </div>
            </motion.div>

            {/* 3-month retained */}
            <div className="border-b border-[var(--hairline)] px-5 py-6 lg:px-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Scenario recovery assumption
              </div>
              <div className="mt-2 font-serif text-[32px] leading-none tracking-[-0.02em] text-[var(--recovery-green)]">
                <AnimatedCounter
                  value={threeMonthRetained}
                  prefix="$"
                  className="!font-serif !tabular-nums"
                />
              </div>
              <div className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
                exposed × {recoveryRate}% re-engagement × 3 months · ≈ {recoveredMembers} re-engagements
              </div>
            </div>

            {/* Breakeven per plan */}
            <div className="border-b border-[var(--hairline)] px-5 py-6 lg:px-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Recoveries to cover each plan
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {PLANS.map((plan) => {
                  const needed = Math.max(1, Math.ceil(plan.cost / price));
                  const ratio = threeMonthRetained / plan.cost;
                  return (
                    <div
                      key={plan.name}
                      className="border border-[var(--hairline)] bg-[var(--surface)] p-3"
                    >
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                        {plan.name}
                      </div>
                      <div className="mt-1 font-mono text-[18px] tabular-nums text-[var(--ink-primary)]">
                        {needed}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--ink-muted)]">recoveries / mo</div>
                      <div className="mt-2 border-t border-[var(--hairline)] pt-2">
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                          Illustrative value-to-plan-cost
                        </div>
                        <div className="mt-0.5 font-mono text-[14px] tabular-nums text-[var(--recovery-green)]">
                          {ratio.toFixed(1)}×
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assumptions */}
            <div className="px-5 py-5 lg:px-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Assumptions
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-[var(--ink-muted)]">
                This calculator is illustrative and is not a forecast or guarantee. Scenario assumptions. Not a guarantee of revenue. Recoveries
                assume the plan’s safety rules and your approval queue remain
                active.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
