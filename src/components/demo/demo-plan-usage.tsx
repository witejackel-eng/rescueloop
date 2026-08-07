"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_PLANS, DEMO_CURRENT_PLAN, DEMO_USAGE } from "@/lib/demo-fixtures";
import { cn } from "@/lib/utils";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";

export function DemoPlanUsageSection() {
  const [checkoutMsg, setCheckoutMsg] = useState(false);

  const membersPct = (DEMO_USAGE.membersUsed / DEMO_USAGE.membersLimit) * 100;
  const interventionsPct = (DEMO_USAGE.interventionsUsed / DEMO_USAGE.interventionsLimit) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Current usage */}
      <Card className="border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
        <header className="border-b border-[var(--hairline)] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-[20px] text-[var(--ink-primary)]">
                {DEMO_CURRENT_PLAN.name} Plan
              </h3>
              <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
                ${DEMO_CURRENT_PLAN.price}/mo · up to {DEMO_CURRENT_PLAN.memberLimit.toLocaleString()} members
              </p>
            </div>
            <Badge className="rounded-[2px] border border-[var(--recovery-green)]/30 bg-[var(--recovery-light)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--recovery-green)]">
              Current plan
            </Badge>
          </div>
        </header>
        <div className="px-5 py-5 flex flex-col gap-5">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[13px] text-[var(--ink-secondary)]">Monitored members</span>
              <span className="font-mono text-[14px] tabular-nums text-[var(--ink-primary)]">
                {DEMO_USAGE.membersUsed.toLocaleString()} / {DEMO_USAGE.membersLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-[5px] w-full bg-[var(--hairline-subtle)]">
              <div className="h-full bg-[var(--ink-primary)]" style={{ width: `${membersPct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              {Math.round(membersPct)}% of limit
            </p>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[13px] text-[var(--ink-secondary)]">Interventions this month</span>
              <span className="font-mono text-[14px] tabular-nums text-[var(--ink-primary)]">
                {DEMO_USAGE.interventionsUsed.toLocaleString()} / {DEMO_USAGE.interventionsLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-[5px] w-full bg-[var(--hairline-subtle)]">
              <div className="h-full bg-[var(--recovery-green)]" style={{ width: `${interventionsPct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              {Math.round(interventionsPct)}% of limit
            </p>
          </div>
        </div>
      </Card>

      {/* Plans comparison */}
      <div>
        <h3 className="font-serif text-[18px] text-[var(--ink-primary)] mb-3">Available Plans</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {DEMO_PLANS.map((plan) => {
            const isCurrent = plan.id === DEMO_CURRENT_PLAN.id;
            return (
              <Card key={plan.id} className={cn(
                "border overflow-hidden",
                isCurrent ? "border-[var(--recovery-green)]/40 bg-[var(--surface)]" : "border-[var(--hairline)] bg-[var(--surface)]",
              )}>
                <header className="border-b border-[var(--hairline)] px-5 py-4">
                  <h4 className="font-serif text-[20px] text-[var(--ink-primary)]">{plan.name}</h4>
                  <p className="mt-1 font-mono tabular-nums text-[28px] text-[var(--ink-primary)]">
                    ${plan.price}<span className="text-[14px] text-[var(--ink-muted)]">/mo</span>
                  </p>
                </header>
                <div className="px-5 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[13px] text-[var(--ink-secondary)]">
                    <Check className="size-3.5 text-[var(--recovery-green)]" />
                    Up to {plan.memberLimit.toLocaleString()} members
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[var(--ink-secondary)]">
                    <Check className="size-3.5 text-[var(--recovery-green)]" />
                    Up to {plan.interventionLimit.toLocaleString()} interventions
                  </div>
                  <div className="mt-3">
                    {isCurrent ? (
                      <Button disabled className="w-full rounded-none bg-[var(--recovery-green)] text-white opacity-60">
                        Current plan
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => { setCheckoutMsg(true); setTimeout(() => setCheckoutMsg(false), 2500); }}
                        className="w-full rounded-none border-[var(--hairline)] text-[var(--ink-primary)] hover:bg-[var(--canvas-elevated)]"
                      >
                        <ShoppingCart className="size-3.5" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {checkoutMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-[4px] bg-[var(--warning-light)] px-3 py-2 text-[12px] text-[var(--warning)]">
            <ShoppingCart className="size-3.5" />
            Checkout disabled in demo
          </div>
        )}
      </div>
    </div>
  );
}
