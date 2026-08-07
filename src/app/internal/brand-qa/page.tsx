"use client";

import {
  RescueLoopMark,
  RescueLoopLogo,
  BrandSignature,
} from "@/components/brand/logo";
import { BRAND } from "@/brand/contract";
import { hex } from "@/brand/tokens";

const MICRO_SIZES = [16, 20] as const;
const MARK_SIZES = [16, 20, 24, 32, 48, 64, 128] as const;

const SEMANTIC_COLORS = [
  { name: "Canvas", var: "var(--canvas)", hex: hex.canvas },
  { name: "Surface", var: "var(--surface)", hex: hex.surface },
  { name: "Ink", var: "var(--ink-primary)", hex: hex.inkPrimary },
  { name: "Recovery Green", var: "var(--recovery-green)", hex: hex.recoveryGreen },
  { name: "Signal Amber", var: "var(--warning)", hex: hex.signalAmber },
  { name: "Critical", var: "var(--critical)", hex: hex.critical },
  { name: "Information", var: "var(--info)", hex: hex.information },
] as const;

const STUDENT_FORBIDDEN = BRAND.studentForbiddenTerms;
const STUDENT_SAFE = ["needs attention", "hasn't started yet", "we'll reach out", "feeling stuck", "continue course"];

export default function BrandQAPage() {
  return (
    <div className="space-y-12 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Brand QA</h1>
        <p className="text-sm text-[var(--ink-secondary)]">
          Visual reference for the RescueLoop brand system. Internal-only.
        </p>
      </div>

      {/* Section 1: Logo Variants */}
      <section aria-label="Logo variants">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Logo Variants</h2>

        <h3 className="text-sm font-medium mb-3">Primary mark at all sizes</h3>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          {MARK_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <RescueLoopMark variant="primary" size={size} decorative />
              <span className="text-[10px] font-mono text-[var(--ink-muted)]">{size}px</span>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-medium mb-3">Mono mark</h3>
        <div className="mb-6">
          <RescueLoopMark variant="mono" size={32} decorative />
        </div>

        <h3 className="text-sm font-medium mb-3">Reversed mark (on dark background)</h3>
        <div className="mb-6 flex items-center justify-center p-6 rounded-lg" style={{ backgroundColor: "var(--dark-section)" }}>
          <RescueLoopMark variant="reversed" size={32} decorative />
        </div>

        <h3 className="text-sm font-medium mb-3">Micro mark (16-20px)</h3>
        <div className="flex items-end gap-4 mb-6">
          {MICRO_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <RescueLoopMark variant="micro" size={size} decorative />
              <span className="text-[10px] font-mono text-[var(--ink-muted)]">{size}px</span>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-medium mb-3">Logo contexts</h3>
        <div className="space-y-4 mb-6">
          <div>
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">marketing</span>
            <RescueLoopLogo context="marketing" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">workspace compact</span>
            <RescueLoopLogo context="workspace" compact />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">student</span>
            <RescueLoopLogo context="student" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">brand signature</span>
            <BrandSignature context="student" />
          </div>
        </div>
      </section>

      {/* Section 2: Backgrounds */}
      <section aria-label="Background variants">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Backgrounds</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-6 rounded-lg" style={{ backgroundColor: "var(--canvas)" }}>
            <RescueLoopMark variant="primary" size={48} decorative />
            <span className="text-[10px] font-mono text-[var(--ink-muted)] mt-2">canvas</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-lg" style={{ backgroundColor: "var(--canvas-elevated)" }}>
            <RescueLoopMark variant="primary" size={48} decorative />
            <span className="text-[10px] font-mono text-[var(--ink-muted)] mt-2">canvas-elevated</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-lg" style={{ backgroundColor: "var(--surface)" }}>
            <RescueLoopMark variant="primary" size={48} decorative />
            <span className="text-[10px] font-mono text-[var(--ink-muted)] mt-2">surface</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-lg" style={{ backgroundColor: "var(--dark-section)" }}>
            <RescueLoopMark variant="reversed" size={48} decorative />
            <span className="text-[10px] font-mono text-[var(--ink-muted)] mt-2">dark-section</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-lg" style={{ backgroundColor: "var(--recovery-green)" }}>
            <RescueLoopMark variant="reversed" size={48} decorative />
            <span className="text-[10px] font-mono text-white mt-2">recovery-green</span>
          </div>
        </div>
      </section>

      {/* Section 3: Typography */}
      <section aria-label="Typography hierarchy">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Typography</h2>
        <div className="space-y-3">
          <p className="font-sans text-base">Instrument Sans — interface, body, controls</p>
          <p className="font-serif text-xl">Instrument Serif — editorial statements</p>
          <p className="font-mono text-sm">JetBrains Mono — counts, currency, IDs, timestamps</p>
        </div>
      </section>

      {/* Section 4: Semantic Colors */}
      <section aria-label="Semantic colors">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Semantic Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SEMANTIC_COLORS.map((c) => (
            <div key={c.name} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="size-8 rounded-md shrink-0" style={{ backgroundColor: c.hex }} />
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-[10px] font-mono text-[var(--ink-muted)]">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Student-safe vs Forbidden */}
      <section aria-label="Student copy policy">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Student Copy Policy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2 text-[var(--recovery-green)]">&#x2713; Student-safe</h3>
            <ul className="space-y-1" role="list">
              {STUDENT_SAFE.map((term) => (
                <li key={term} className="text-sm">{term}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-[var(--critical)]">&#x26A0; Do not use</h3>
            <ul className="space-y-1" role="list">
              {STUDENT_FORBIDDEN.map((term) => (
                <li key={term} className="text-sm text-[var(--critical)] line-through">{term}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 6: Route Context Signatures */}
      <section aria-label="Route context signatures">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Route Contexts</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <p className="text-[10px] font-mono text-[var(--ink-muted)] mb-2">marketing</p>
            <RescueLoopLogo context="marketing" />
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-[10px] font-mono text-[var(--ink-muted)] mb-2">workspace</p>
            <RescueLoopLogo context="workspace" compact />
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-[10px] font-mono text-[var(--ink-muted)] mb-2">student</p>
            <BrandSignature context="student" />
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-[10px] font-mono text-[var(--ink-muted)] mb-2">internal</p>
            <div className="flex items-center gap-2">
              <RescueLoopMark size={20} decorative />
              <span className="text-sm font-medium">RescueLoop</span>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-800">Internal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Asset Previews */}
      <section aria-label="Asset previews">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Asset Previews</h2>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-mono text-[var(--ink-muted)] mb-1">favicon.svg</p>
            <img src="/brand/favicon.svg" alt="Favicon preview" width={64} height={64} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[var(--ink-muted)] mb-1">icon-192.png</p>
            <img src="/brand/icon-192.png" alt="App icon preview" width={64} height={64} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[var(--ink-muted)] mb-1">og-default-1200x630.png</p>
            <img src="/brand/og-default-1200x630.png" alt="OG image preview" width={600} height={315} className="border" />
          </div>
        </div>
      </section>
    </div>
  );
}
