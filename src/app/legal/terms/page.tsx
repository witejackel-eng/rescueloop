import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — RescueLoop",
  description: "Terms governing use of RescueLoop during the private pilot.",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="font-serif text-3xl tracking-tight text-[var(--ink-primary)]">Terms of Service</h1>
      <p className="mt-2 font-mono text-[12px] text-[var(--ink-muted)]">Last updated: August 2026 · Private pilot version</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
        <p>
          These terms govern your use of RescueLoop during the private pilot. By participating, you agree to
          these terms. They will be updated before general availability.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Private pilot status</h2>
        <p>
          RescueLoop is in an early private pilot. The service may change, have downtime, or be discontinued
          without notice. We are actively developing the Whop integration, webhook processing, and
          attribution features. Do not rely on the service for critical business operations during this phase.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Your responsibilities</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>You must have the right to connect your Whop account and process student data.</li>
          <li>You are responsible for the content of intervention messages you approve.</li>
          <li>You must comply with applicable privacy laws when contacting students.</li>
          <li>You must not use RescueLoop to send unsolicited commercial messages.</li>
        </ul>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Acceptable use</h2>
        <p>
          You may not use RescueLoop to harass students, send threatening messages, or circumvent platform
          policies. Student opt-out requests must be honoured immediately.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Service availability</h2>
        <p>
          The service is provided &quot;as is&quot; without warranties. We do not guarantee uninterrupted
          availability, specific re-engagement rates, or revenue outcomes. All metrics shown in the demo workspace
          are simulated for demonstration.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Termination</h2>
        <p>
          Either party may terminate pilot participation at any time. Upon termination, your data will be
          retained for 90 days then deleted, unless you request immediate deletion.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Contact</h2>
        <p>
          For questions about these terms:
          <span className="block mt-1 font-mono text-[13px] text-[var(--ink-muted)]">[Legal entity to be confirmed — private pilot]</span>
        </p>
      </section>
    </>
  );
}
