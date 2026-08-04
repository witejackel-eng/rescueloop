import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — RescueLoop",
  description: "How RescueLoop handles personal data during the private pilot.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-serif text-3xl tracking-tight text-[var(--ink-primary)]">Privacy Policy</h1>
      <p className="mt-2 font-mono text-[12px] text-[var(--ink-muted)]">Last updated: August 2026 · Private pilot version</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
        <p>
          RescueLoop is currently in a private pilot. This policy describes how we handle personal data
          during this phase. It will be updated before general availability.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Data we process</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Creator account information (name, email, organisation name).</li>
          <li>Connected platform data (Whop memberships, products, courses) when the creator authorises the integration.</li>
          <li>Student course progress and membership status, received from the creator&apos;s connected platform.</li>
          <li>Intervention messages and student responses.</li>
          <li>Usage data (pages visited, actions taken) to improve the product.</li>
        </ul>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">How we use data</h2>
        <p>
          We use personal data solely to provide the RescueLoop service: detecting students who may need
          support, coordinating creator-approved interventions, and attributing outcomes. We do not sell
          personal data or use it for unrelated advertising.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Data retention</h2>
        <p>
          During the private pilot, data is retained for the duration of the pilot plus 90 days, unless the
          creator requests earlier deletion. Student response data is retained for attribution evidence.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Student rights</h2>
        <p>
          Students can stop reminders at any time through the student-facing interface. Creators can request
          export or deletion of all data associated with their organisation.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Contact</h2>
        <p>
          For privacy questions or data requests, contact the pilot team. A formal legal entity will be
          designated before general availability:
          <span className="block mt-1 font-mono text-[13px] text-[var(--ink-muted)]">[Legal entity to be confirmed — private pilot]</span>
        </p>

        <div className="mt-8 border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-4">
          <p className="text-[13px] text-[var(--ink-secondary)]">
            <strong className="text-[var(--ink-primary)]">Note:</strong> RescueLoop does not currently hold
            SOC 2, ISO 27001, or GDPR certifications. This page describes actual current practices, not
            aspirational compliance.
          </p>
        </div>
      </section>
    </>
  );
}
