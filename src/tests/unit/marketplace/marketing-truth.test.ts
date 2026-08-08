// Marketing truth static-copy guard.
//
// Spec reference: docs/implementation/V1_FINAL_GAP_AUDIT.md → GAP-3,
// and section 5 of the v1 final completion brief.
//
// These tests read the marketing component source files directly and
// assert that none of the prohibited attribution / disclosure phrases
// appear in the shipped copy. This is a regression guard: if a future
// commit accidentally re-introduces a prohibited phrase, this test
// fails before the change can ship.
//
// Prohibited phrases (subset of MARKETPLACE_LISTING.forbiddenClaims
// plus explicit marketing-specific prohibitions):
//   - "Total defended value"            (combined attribution total)
//   - "Confirmed recovered value" as a non-zero dollar claim
//   - "live demo"                        (use "interactive demo")
//   - "Payment received after a documented intervention"
//                                        (calls ordinary payment "confirmed recovery")
//   - "recovered revenue"                (already in manifest.forbiddenClaims)
//   - "guaranteed retention"             (already in manifest.forbiddenClaims)
//
// Allowed: the literal string "Confirmed recovered value" IS allowed
// to appear as a LABEL (e.g. "$0 Confirmed recovered value") because
// the policy requires the label to remain visible while the value is
// zero. We therefore check for the phrase only when it is accompanied
// by a non-zero dollar amount.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  MARKETPLACE_LISTING,
  assertNoForbiddenClaims,
} from "@/lib/marketplace/manifest";

const MARKETING_DIR = resolve(
  __dirname,
  "../../../components/marketing",
);

function listMarketingFiles(): string[] {
  const out: string[] = [];
  for (const f of readdirSync(MARKETING_DIR)) {
    if (f.endsWith(".tsx") || f.endsWith(".ts")) {
      out.push(join(MARKETING_DIR, f));
    }
  }
  return out;
}

function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

describe("marketing copy — truth language regression guard", () => {
  it("all marketing source files exist and are non-empty", () => {
    const files = listMarketingFiles();
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(readFile(f).length).toBeGreaterThan(0);
    }
  });

  it("no marketing file contains 'Total defended value'", () => {
    for (const f of listMarketingFiles()) {
      const src = readFile(f);
      expect(src, `${f} contains prohibited phrase "Total defended value"`).not.toContain(
        "Total defended value",
      );
    }
  });

  it("no marketing file contains 'live demo' (use 'interactive demo')", () => {
    for (const f of listMarketingFiles()) {
      const src = readFile(f);
      const lower = src.toLowerCase();
      expect(
        lower,
        `${f} contains prohibited phrase "live demo"`,
      ).not.toContain("live demo");
    }
  });

  it("no marketing file contains 'recovered revenue'", () => {
    for (const f of listMarketingFiles()) {
      const src = readFile(f);
      const lower = src.toLowerCase();
      expect(lower, `${f} contains "recovered revenue"`).not.toContain(
        "recovered revenue",
      );
    }
  });

  it("no marketing file claims 'Payment received after a documented intervention' as confirmed recovery", () => {
    for (const f of listMarketingFiles()) {
      const src = readFile(f);
      expect(
        src,
        `${f} contains prohibited confirmed-recovery-by-payment phrasing`,
      ).not.toContain("Payment received after a documented intervention");
    }
  });

  it("no marketing file claims a non-zero 'Confirmed recovered value' dollar amount", () => {
    // The label "Confirmed recovered value" may appear (e.g. "$0
    // Confirmed recovered value" or "Confirmed recovered value remains
    // $0…"), but it must NOT be paired with a non-zero dollar amount.
    const nonZeroDollar = /\$\s*[1-9]\d*(?:[.,]\d+)?\s*(?:confirmed\s+recovered\s+value|confirmed\s+value)/i;
    const nonZeroDollarReversed = /(confirmed\s+recovered\s+value|confirmed\s+value)[^$]{0,40}\$\s*[1-9]\d*(?:[.,]\d+)?/i;
    for (const f of listMarketingFiles()) {
      const src = readFile(f);
      expect(
        nonZeroDollar.test(src) || nonZeroDollarReversed.test(src),
        `${f} claims a non-zero confirmed recovered dollar amount`,
      ).toBe(false);
    }
  });

  it("MARKETPLACE_LISTING.forbiddenClaims includes the v1-final additions", () => {
    const claims = MARKETPLACE_LISTING.forbiddenClaims;
    expect(claims).toContain("Total defended value");
    expect(claims).toContain("live demo");
    expect(claims).toContain("Payment received after a documented intervention");
  });

  it("assertNoForbiddenClaims rejects each v1-final prohibited phrase", () => {
    expect(() => assertNoForbiddenClaims("Total defended value here")).toThrow();
    expect(() => assertNoForbiddenClaims("this is a live demo")).toThrow();
    expect(() =>
      assertNoForbiddenClaims("Payment received after a documented intervention"),
    ).toThrow();
  });
});
