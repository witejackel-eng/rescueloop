"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * WhopFrameHarness — Development/debugging tool that simulates Whop's
 * embedded context by rendering the app in a local iframe.
 *
 * Checks for common embedded-context issues:
 * - Double scrollbars (iframe + inner page both scroll)
 * - Sticky-header collision (iframe header overlaps Whop header)
 * - Focus trapping (keyboard focus unable to escape the iframe)
 *
 * Real Whop verification remains tracked debt.
 */

// Common Whop embed widths based on their standard dashboard layout
const WHOP_EMBED_WIDTHS = [380, 480, 600, 768, 960] as const;
const DEFAULT_WHOP_WIDTH = 600;
const DEFAULT_WHOP_HEIGHT = 800;

interface WhopDiagnostic {
  /** Whether the iframe document has its own scrollbar (potential double-scroll) */
  hasInnerScrollbar: boolean;
  /** Whether a sticky header is detected inside the iframe */
  hasStickyHeader: boolean;
  /** Current iframe content height in px */
  contentHeight: number;
  /** Whether focus appears trapped (activeElement stays inside iframe) */
  focusTrapped: boolean;
  /** Inner document scroll position */
  scrollPosition: { scrollTop: number; scrollLeft: number };
}

interface WhopFrameHarnessProps {
  /** URL to embed inside the simulated Whop frame */
  src: string;
  /** Width of the Whop frame in px (default: 600 — common Whop embed width) */
  width?: number;
  /** Height of the Whop frame in px (default: 800) */
  height?: number;
  /** Show the diagnostic panel alongside the frame */
  showDiagnostics?: boolean;
  /** Additional CSS class for the outer wrapper */
  className?: string;
}

export function WhopFrameHarness({
  src,
  width = DEFAULT_WHOP_WIDTH,
  height = DEFAULT_WHOP_HEIGHT,
  showDiagnostics = true,
  className,
}: WhopFrameHarnessProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [diagnostic, setDiagnostic] = useState<WhopDiagnostic>({
    hasInnerScrollbar: false,
    hasStickyHeader: false,
    contentHeight: 0,
    focusTrapped: false,
    scrollPosition: { scrollTop: 0, scrollLeft: 0 },
  });
  const [selectedWidth, setSelectedWidth] = useState(width);

  const runDiagnostics = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.defaultView) return;

      const win = doc.defaultView;
      const body = doc.body;
      const html = doc.documentElement;

      // Double scrollbar detection: inner document is scrollable
      const hasInnerScrollbar =
        html.scrollHeight > iframe.clientHeight ||
        html.scrollWidth > iframe.clientWidth;

      // Sticky header collision: look for position:sticky/fixed in computed styles
      const allElements = doc.querySelectorAll("*");
      let hasStickyHeader = false;
      for (let i = 0; i < Math.min(allElements.length, 100); i++) {
        const el = allElements[i] as HTMLElement;
        const computed = win.getComputedStyle(el);
        if (
          computed.position === "sticky" ||
          computed.position === "fixed"
        ) {
          const rect = el.getBoundingClientRect();
          // If a sticky/fixed element is at the very top, it may collide with
          // Whop's own header bar
          if (rect.top <= 10 && rect.height < 100) {
            hasStickyHeader = true;
            break;
          }
        }
      }

      // Focus trapping: active element is inside the iframe
      const focusTrapped = doc.activeElement !== null && doc.activeElement !== body;

      setDiagnostic({
        hasInnerScrollbar,
        hasStickyHeader,
        contentHeight: Math.max(body.scrollHeight, html.scrollHeight),
        focusTrapped,
        scrollPosition: {
          scrollTop: html.scrollTop || body.scrollTop,
          scrollLeft: html.scrollLeft || body.scrollLeft,
        },
      });
    } catch {
      // Cross-origin iframe — can't inspect content. This is expected when
      // the src is a different origin. Diagnostics will be limited.
    }
  }, []);

  // Poll diagnostics every 2s while the frame is mounted
  useEffect(() => {
    const interval = setInterval(runDiagnostics, 2000);
    // Also run once after the iframe likely has loaded
    const timeout = setTimeout(runDiagnostics, 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [runDiagnostics, src, selectedWidth]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Width selector — simulate common Whop embed widths */}
      <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
        <span className="font-medium">Embed width:</span>
        {WHOP_EMBED_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setSelectedWidth(w)}
            className={cn(
              "touch-target rounded px-2 py-1 text-xs transition-colors",
              selectedWidth === w
                ? "bg-[var(--recovery-green)] text-white"
                : "bg-[var(--canvas-elevated)] hover:bg-[var(--surface-hover)]",
            )}
          >
            {w}px
          </button>
        ))}
      </div>

      {/* Simulated Whop chrome (header bar) */}
      <div className="flex items-center gap-2 border-b border-[var(--hairline)] bg-[var(--canvas-elevated)] px-3 py-2">
        <div className="h-3 w-3 rounded-full bg-[var(--ink-muted)]" />
        <span className="text-xs font-medium text-[var(--ink-secondary)]">
          Whop Dashboard — Embedded App
        </span>
      </div>

      {/* The iframe simulating Whop's embedded context */}
      <div
        className="relative overflow-hidden border border-[var(--hairline)] rounded-lg bg-white"
        style={{ width: selectedWidth, height }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          title="Whop embedded app preview"
          className="h-full w-full border-0"
          // sandbox restricts to same-origin + scripts; mirrors Whop's
          // actual iframe sandbox policy
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Diagnostic panel */}
      {showDiagnostics && (
        <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-3 text-xs">
          <h3 className="mb-2 font-semibold text-[var(--ink-primary)]">
            Embed Diagnostics
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-[var(--ink-secondary)]">Frame size:</span>
            <span>
              {selectedWidth} × {height}px
            </span>

            <span className="text-[var(--ink-secondary)]">
              Double scrollbar:
            </span>
            <span
              className={cn(
                diagnostic.hasInnerScrollbar
                  ? "text-[var(--critical)] font-medium"
                  : "text-[var(--recovery-green)]",
              )}
            >
              {diagnostic.hasInnerScrollbar ? "DETECTED ⚠" : "None"}
            </span>

            <span className="text-[var(--ink-secondary)]">
              Sticky header collision:
            </span>
            <span
              className={cn(
                diagnostic.hasStickyHeader
                  ? "text-[var(--critical)] font-medium"
                  : "text-[var(--recovery-green)]",
              )}
            >
              {diagnostic.hasStickyHeader ? "DETECTED ⚠" : "None"}
            </span>

            <span className="text-[var(--ink-secondary)]">
              Focus inside frame:
            </span>
            <span>{diagnostic.focusTrapped ? "Yes" : "No"}</span>

            <span className="text-[var(--ink-secondary)]">
              Content height:
            </span>
            <span>{diagnostic.contentHeight}px</span>

            <span className="text-[var(--ink-secondary)]">Scroll:</span>
            <span>
              top={diagnostic.scrollPosition.scrollTop}, left=
              {diagnostic.scrollPosition.scrollLeft}
            </span>
          </div>

          <p className="mt-2 text-[var(--ink-muted)]">
            Real Whop verification is tracked debt — this harness only simulates
            the embedded frame locally.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Whop embed width presets for use in stories / tests
 */
export { WHOP_EMBED_WIDTHS, DEFAULT_WHOP_WIDTH, DEFAULT_WHOP_HEIGHT };
