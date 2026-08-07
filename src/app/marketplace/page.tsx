// Public marketplace listing page — WP08
//
// This page renders the RescueLoop Whop App Store listing as a public preview.
// The Whop marketplace dashboard will reference the same content.
// Truth language only — no inflated causality or revenue claims.

import { MARKETPLACE_LISTING, PERMISSIONS, APP_VIEWS, LISTING_READINESS_STATIC, assertNoForbiddenClaims } from "@/lib/marketplace/manifest";
import { DATA_LIFECYCLE_ACTIONS, SUPPORT_CHANNELS } from "@/lib/marketplace/data-lifecycle-manifest";

export const metadata = {
  title: "RescueLoop — Whop App Store Listing",
  description: MARKETPLACE_LISTING.shortDescription,
  robots: { index: false, follow: false }, // do not index pre-launch
};

export default function MarketplaceListingPage() {
  // Truth-language guard — fails fast at render time if copy is wrong
  assertNoForbiddenClaims(MARKETPLACE_LISTING.tagline);
  assertNoForbiddenClaims(MARKETPLACE_LISTING.shortDescription);
  assertNoForbiddenClaims(MARKETPLACE_LISTING.trust);
  for (const bullet of MARKETPLACE_LISTING.coreBullets) {
    assertNoForbiddenClaims(bullet);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-12">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Whop App Store — Listing Preview</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{MARKETPLACE_LISTING.name}</h1>
          <p className="mt-2 text-lg text-zinc-700">{MARKETPLACE_LISTING.tagline}</p>
          <p className="mt-4 text-base text-zinc-700">{MARKETPLACE_LISTING.shortDescription}</p>
          <p className="mt-4 inline-block rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
            {MARKETPLACE_LISTING.trust}
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold">What it does</h2>
          <ul className="mt-4 space-y-3">
            {MARKETPLACE_LISTING.coreBullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 text-emerald-600">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold">Permissions requested</h2>
          <p className="mt-2 text-sm text-zinc-600">
            RescueLoop requests the minimum permissions required to deliver the product. Every permission has a documented justification and a fallback behaviour if declined.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-600">
                  <th className="py-2 pr-4 font-medium">Permission</th>
                  <th className="py-2 pr-4 font-medium">Required</th>
                  <th className="py-2 pr-4 font-medium">Used by</th>
                  <th className="py-2 pr-4 font-medium">If declined</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-zinc-900">{p.label}</div>
                      <div className="text-xs text-zinc-500">{p.id}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {p.required ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Required</span>
                      ) : (
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">Optional</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-zinc-700">{p.usedBy}</td>
                    <td className="py-3 pr-4 text-zinc-600">{p.declineFallback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold">App views</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {APP_VIEWS.map((view) => (
              <li key={view.path} className="flex justify-between border-b border-zinc-100 py-2">
                <span className="font-mono text-zinc-700">{view.path}</span>
                <span className="text-zinc-500">{view.label} · {view.surface} · {view.iframeEmbedded ? "iframe" : "standalone"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold">Data lifecycle &amp; uninstall</h2>
          <p className="mt-2 text-sm text-zinc-600">
            RescueLoop never holds creator data hostage. Pause, export, uninstall, and full deletion are all available from inside the app.
          </p>
          <div className="mt-6 space-y-4">
            {DATA_LIFECYCLE_ACTIONS.map((action) => (
              <div key={action.id} className="border border-zinc-200 rounded-md p-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{action.label}</h3>
                  <span className="text-xs text-zinc-500">{action.trigger}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-700"><strong>Immediate:</strong> {action.immediate}</p>
                <p className="mt-1 text-sm text-zinc-700"><strong>Scheduled:</strong> {action.scheduled}</p>
                <p className="mt-1 text-sm text-zinc-700"><strong>Retention:</strong> {action.retention}</p>
                <p className="mt-1 text-sm text-zinc-700"><strong>Reversible:</strong> {action.reversible ? "Yes" : "No"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold">Support &amp; legal</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Support email: <a className="text-emerald-700 underline" href={`mailto:${SUPPORT_CHANNELS.email}`}>{SUPPORT_CHANNELS.email}</a></li>
            <li>Privacy: <a className="text-emerald-700 underline" href={SUPPORT_CHANNELS.privacy}>/legal/privacy</a></li>
            <li>Terms: <a className="text-emerald-700 underline" href={SUPPORT_CHANNELS.terms}>/legal/terms</a></li>
            <li>Data processing: <a className="text-emerald-700 underline" href={SUPPORT_CHANNELS.dataProcessing}>/legal/data-processing</a></li>
            <li>Security overview: <a className="text-emerald-700 underline" href={SUPPORT_CHANNELS.security}>/legal/security</a></li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold">Listing readiness</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LISTING_READINESS_STATIC.map((check) => (
              <li key={check.id} className="flex items-start gap-3">
                <span className={
                  check.status === "ready" ? "mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500"
                  : check.status === "pending" ? "mt-1 inline-block h-2 w-2 rounded-full bg-amber-500"
                  : "mt-1 inline-block h-2 w-2 rounded-full bg-red-500"
                } aria-hidden="true" />
                <span><strong>{check.label}:</strong> {check.rationale}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
