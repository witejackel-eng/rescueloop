import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing — RescueLoop",
  description: "Controller/processor responsibilities, retention, and subprocessors for the RescueLoop private pilot.",
};

export default function DataProcessingPage() {
  return (
    <>
      <h1 className="font-serif text-3xl tracking-tight text-[var(--ink-primary)]">Data Processing</h1>
      <p className="mt-2 font-mono text-[12px] text-[var(--ink-muted)]">Last updated: August 2026 · Private pilot version</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
        <p>
          This page describes how RescueLoop processes data on behalf of creators during the private pilot.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Roles</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Controller:</strong> The course creator (you) controls the purpose and means of processing student data.</li>
          <li><strong>Processor:</strong> RescueLoop processes data on your behalf, following your instructions, to provide the detection, intervention, and attribution service.</li>
        </ul>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Student data categories</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Name and email address (from your connected platform).</li>
          <li>Course enrolment and progress data.</li>
          <li>Membership status and renewal dates.</li>
          <li>Blocker responses submitted through the student-facing interface.</li>
        </ul>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Retention</h2>
        <p>
          Data is retained for the duration of the pilot plus 90 days. Student response data is retained as
          attribution evidence. Creators may request earlier deletion of all organisation data.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Deletion requests</h2>
        <p>
          Creators can request deletion of their organisation&apos;s data at any time. Student opt-out
          requests (stopping reminders) take effect immediately; full data deletion is processed within
          30 days of the request.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Subprocessors</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Vercel:</strong> Application hosting and edge delivery.</li>
          <li><strong>Database provider:</strong> Managed PostgreSQL (to be confirmed before general availability).</li>
          <li><strong>Whop:</strong> Source of membership and course data (via the creator&apos;s authorisation).</li>
          <li><strong>Email delivery provider:</strong> For intervention messages (to be confirmed before general availability).</li>
        </ul>
        <p className="text-[13px] text-[var(--ink-muted)]">
          A complete, updated subprocessor list will be maintained before general availability.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Data export</h2>
        <p>
          Creators can request a full export of their organisation&apos;s data in a structured, machine-readable
          format.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Incident notification</h2>
        <p>
          In the event of a personal data breach, RescueLoop will notify the affected creator without undue
          delay, providing details of the breach, the data affected, and the remediation steps taken.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Contact</h2>
        <p>
          For data processing questions or requests:
          <span className="block mt-1 font-mono text-[13px] text-[var(--ink-muted)]">[Legal entity to be confirmed — private pilot]</span>
        </p>
      </section>
    </>
  );
}
