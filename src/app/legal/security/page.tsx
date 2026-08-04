import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security — RescueLoop",
  description: "Current architecture, data handling, and security practices for the RescueLoop private pilot.",
};

export default function SecurityPage() {
  return (
    <>
      <h1 className="font-serif text-3xl tracking-tight text-[var(--ink-primary)]">Security</h1>
      <p className="mt-2 font-mono text-[12px] text-[var(--ink-muted)]">Last updated: August 2026 · Private pilot version</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
        <p>
          This page describes the actual security practices in place during the RescueLoop private pilot.
          We do not claim certifications we do not hold.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Current architecture</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Next.js application deployed on Vercel (edge network with global CDN).</li>
          <li>PostgreSQL database for pilot organisations (managed by the hosting provider).</li>
          <li>Server-side API routes for all data mutations — no direct client database access.</li>
          <li>Webhook endpoints for Whop platform events.</li>
        </ul>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Data categories processed</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Creator account data (name, email, organisation).</li>
          <li>Whop membership and product data (via authorised integration).</li>
          <li>Student course progress and enrolment status.</li>
          <li>Intervention messages and student responses.</li>
        </ul>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Authentication</h2>
        <p>
          Creator authentication uses OAuth through the Whop platform. Session tokens are stored in secure,
          HTTP-only cookies. Student response links use signed, time-limited, single-purpose tokens that do
          not expose internal IDs.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Encryption</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>In transit:</strong> All traffic uses TLS (HTTPS).</li>
          <li><strong>At rest:</strong> Database encryption is managed by the hosting provider.</li>
          <li><strong>Webhooks:</strong> Whop webhook signatures are verified before processing.</li>
        </ul>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Tenant separation</h2>
        <p>
          All database queries are scoped to the authenticated creator&apos;s organisation. No cross-organisation
          access is possible through the application layer. User-provided organisation IDs are never trusted
          without authorisation checks.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Logging and monitoring</h2>
        <p>
          Structured server logs record request IDs, webhook event IDs, and job IDs. Logs redact
          authentication tokens, webhook secrets, API keys, signed student tokens, session cookies, and
          sensitive student information.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Incident contact</h2>
        <p>
          To report a security issue, contact the pilot team directly. A formal security contact and incident
          response process will be documented before general availability.
        </p>

        <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">Current limitations</h2>
        <div className="border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-4">
          <ul className="list-disc space-y-1 pl-6 text-[13px]">
            <li>No SOC 2, ISO 27001, or GDPR certification.</li>
            <li>No formal penetration testing has been completed.</li>
            <li>Backup and disaster recovery procedures are basic during the pilot.</li>
            <li>Rate limiting is applied at the application layer but not exhaustively tuned.</li>
            <li>The Whop integration is in active development — not all webhook types are fully processed.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
