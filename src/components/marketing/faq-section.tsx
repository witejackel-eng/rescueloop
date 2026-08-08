"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QA {
  q: string;
  a: string;
}

const ITEMS: QA[] = [
  {
    q: "Does RescueLoop guarantee retained revenue?",
    a: "No. RescueLoop surfaces at-risk members and coordinates interventions, but retention depends on the student and the course. We tag every observed outcome with the strongest evidence we can defend — confirmed, strongly associated, or estimated — and never merge them into a single inflated number.",
  },
  {
    q: "How is observed value attributed?",
    a: "Confirmed recovered value remains $0 unless a defensible auditable monetary recovery rule is satisfied — ordinary subscription payments after an intervention are NOT classified as confirmed recovery. Strongly associated value reflects a notification accepted by Whop followed by a return within the attribution window; no monetary value is claimed for this tier. Estimated value is a modelled projection of opportunity, not recovered money, and is excluded from ROI totals.",
  },
  {
    q: "Will it message students automatically?",
    a: "Only if you put a campaign in automatic mode. The default is manual approval, which routes every intervention to your queue first. Cancellation rescue always requires manual review, regardless of campaign mode.",
  },
  {
    q: "Can students be over-messaged?",
    a: "Hard limits prevent it. Every campaign enforces a per-member monthly ceiling, a cooldown window, and quiet hours. A response or resumed progress automatically removes the student from the active queue.",
  },
  {
    q: "Does it work with one-time courses?",
    a: "Yes, with adjusted attribution. There is no recurring revenue to recover, so the value ledger tracks activations, completion lifts, and refunds avoided instead of retained subscription dollars. ROI is calculated against course price and refund rate.",
  },
  {
    q: "What happens when a student responds?",
    a: "Automation stops for that member immediately. The thread routes to your responded queue for human review. If they report a blocker, it is logged against the lesson and surfaced in Course Intelligence.",
  },
  {
    q: "How does RescueLoop use Whop data?",
    a: "RescueLoop reads membership status, renewal dates, and progress signals from your connected Whop products. It writes back intervention logs, attribution events, and value ledger entries. Nothing is shared with third parties. You can export or delete all data at any time.",
  },
  {
    q: "Can I pause all automation instantly?",
    a: "Yes. The Pause control in Settings stops every queued, scheduled, and pending intervention in one click. Existing conversations stay open for human reply, but no new sends occur until you resume.",
  },
  {
    q: "What is confirmed versus estimated value?",
    a: "Confirmed recovered value is $0 by policy unless an auditable monetary recovery rule is satisfied. Estimated value is a modelled projection of opportunity based on cohort behaviour — it is NOT recovered money. The two are always shown separately and never summed into a single total.",
  },
  {
    q: "Which plan fits my course?",
    a: "Rescue fits a single course under 250 members where activation is the main problem. Growth fits creators with multiple courses and renewal exposure up to ~1,000 members. Scale fits established communities that need cancellation rescue and evidence-tiered attribution. Move up only when the next risk surface is actually on your plate.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-[var(--section-secondary)]">
      <div className="mx-auto max-w-[1100px] px-4 py-20 lg:px-8 lg:py-32">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--recovery-green)]" />
          Honest answers
        </div>
        <h2 className="mt-8 max-w-[20ch] font-serif text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink-primary)]">
          The questions worth asking.
        </h2>
        <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
          Specific objections, specific answers. If a question is missing, write
          to us and we will add it — including the answer you may not want to
          hear.
        </p>

        <div className="mt-12 border-t border-[var(--hairline)]">
          <Accordion type="single" collapsible className="w-full">
            {ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-[var(--hairline)]"
              >
                <AccordionTrigger className="py-6 text-left text-[16px] font-medium text-[var(--ink-primary)] hover:no-underline">
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[12px] tabular-nums text-[var(--ink-muted)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{item.q}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-10 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
