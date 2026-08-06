/**
 * @fileoverview Tests for the Bun audit output parser.
 *
 * These tests verify that the parser correctly handles Bun's ACTUAL output format,
 * where "(direct dependency)" may appear BEFORE severity lines — the exact bug
 * that caused the old shell state machine to miss direct critical/high vulns.
 *
 * Run with: bun vitest run scripts/audit-parser.test.ts
 * Or:       npx vitest run scripts/audit-parser.test.ts
 *
 * @module audit-parser.test
 */

import { describe, it, expect } from "vitest";
import {
  parseAuditOutput,
  parseSection,
  splitSections,
  formatSummary,
  formatAnnotations,
  formatJsonSummary,
  formatErrorAnnotation,
  formatWarningAnnotation,
  type AuditResult,
  type VulnerabilitySection,
  type Classification,
  type Severity,
} from "./audit-parser";

// ---------------------------------------------------------------------------
// Test fixtures — realistic Bun audit output
// ---------------------------------------------------------------------------

/** Direct critical vulnerability — Bun's actual output order */
const DIRECT_CRITICAL = `
vitest@3.1.4
  (direct dependency)
  critical: Vitest CLI allows arbitrary code execution
  https://github.com/advisories/GHSA-xxxx
`.trim();

/** Direct high vulnerability — Bun's actual output order */
const DIRECT_HIGH = `
next@16.2.0
  (direct dependency)
  high: Next.js Server-Side Request Forgery in Server Actions
  https://github.com/advisories/GHSA-yyyy
`.trim();

/** Transitive critical — no "(direct dependency)" marker */
const TRANSITIVE_CRITICAL = `
some-transitive-pkg@1.0.0
  critical: Some transitive issue
  https://github.com/advisories/GHSA-zzzz
`.trim();

/** Direct moderate — should NOT be blocking */
const DIRECT_MODERATE = `
lodash@4.17.21
  (direct dependency)
  moderate: Prototype Pollution
  https://github.com/advisories/GHSA-mmmm
`.trim();

/** Direct dependency with marker AFTER severity (reverse order) */
const DIRECT_CRITICAL_MARKER_AFTER = `
vitest@3.1.4
  critical: Vitest CLI allows arbitrary code execution
  (direct dependency)
  https://github.com/advisories/GHSA-xxxx
`.trim();

/** Multiple severities in one section */
const DIRECT_MULTI_SEVERITY = `
express@4.18.2
  (direct dependency)
  high: Express.js open redirect vulnerability
  moderate: Express.js prototype pollution
  https://github.com/advisories/GHSA-eeee1
  https://github.com/advisories/GHSA-eeee2
`.trim();

/** Section with no severity (just package info) */
const NO_SEVERITY = `
some-pkg@2.0.0
  (direct dependency)
  https://github.com/advisories/GHSA-nnnn
`.trim();

/** Clean output — no vulnerabilities */
const CLEAN_OUTPUT = "";

/** Multiple sections combined (the real-world scenario) */
const MIXED_OUTPUT = [
  DIRECT_CRITICAL,
  "",
  DIRECT_HIGH,
  "",
  TRANSITIVE_CRITICAL,
  "",
  DIRECT_MODERATE,
].join("\n");

// ---------------------------------------------------------------------------
// Tests: splitSections
// ---------------------------------------------------------------------------

describe("splitSections", () => {
  it("splits on blank lines", () => {
    const result = splitSections("a\nb\n\nc\nd");
    expect(result).toEqual(["a\nb", "c\nd"]);
  });

  it("handles multiple blank lines between sections", () => {
    const result = splitSections("a\n\n\nb");
    expect(result).toEqual(["a", "b"]);
  });

  it("trims whitespace from sections", () => {
    const result = splitSections("  a  \n\n  b  ");
    expect(result).toEqual(["a", "b"]);
  });

  it("returns empty array for empty input", () => {
    expect(splitSections("")).toEqual([]);
    expect(splitSections("   ")).toEqual([]);
  });

  it("handles single section with no blank lines", () => {
    const result = splitSections("a\nb\nc");
    expect(result).toEqual(["a\nb\nc"]);
  });
});

// ---------------------------------------------------------------------------
// Tests: parseSection
// ---------------------------------------------------------------------------

describe("parseSection", () => {
  it("parses direct critical vulnerability (Bun's actual order)", () => {
    const result = parseSection(DIRECT_CRITICAL);
    expect(result.package).toBe("vitest@3.1.4");
    expect(result.isDirect).toBe(true);
    expect(result.severities).toContain("critical");
    expect(result.urls).toContain(
      "https://github.com/advisories/GHSA-xxxx"
    );
    expect(result.advisories.critical).toContain(
      "Vitest CLI allows arbitrary code execution"
    );
    expect(result.classification).toBe("BLOCKING");
  });

  it("parses direct high vulnerability", () => {
    const result = parseSection(DIRECT_HIGH);
    expect(result.package).toBe("next@16.2.0");
    expect(result.isDirect).toBe(true);
    expect(result.severities).toContain("high");
    expect(result.advisories.high).toContain(
      "Next.js Server-Side Request Forgery in Server Actions"
    );
    expect(result.classification).toBe("BLOCKING");
  });

  it("parses transitive critical vulnerability", () => {
    const result = parseSection(TRANSITIVE_CRITICAL);
    expect(result.package).toBe("some-transitive-pkg@1.0.0");
    expect(result.isDirect).toBe(false);
    expect(result.severities).toContain("critical");
    expect(result.classification).toBe("REPORTED");
  });

  it("parses direct moderate vulnerability — not blocking", () => {
    const result = parseSection(DIRECT_MODERATE);
    expect(result.package).toBe("lodash@4.17.21");
    expect(result.isDirect).toBe(true);
    expect(result.severities).toContain("moderate");
    expect(result.classification).toBe("PASSING");
  });

  it("correctly handles direct marker BEFORE severity (Bun's actual order)", () => {
    const result = parseSection(DIRECT_CRITICAL);
    expect(result.isDirect).toBe(true);
    expect(result.severities).toContain("critical");
    expect(result.classification).toBe("BLOCKING");
  });

  it("correctly handles direct marker AFTER severity (reverse order)", () => {
    const result = parseSection(DIRECT_CRITICAL_MARKER_AFTER);
    expect(result.isDirect).toBe(true);
    expect(result.severities).toContain("critical");
    expect(result.classification).toBe("BLOCKING");
  });

  it("parses multiple severities in one section", () => {
    const result = parseSection(DIRECT_MULTI_SEVERITY);
    expect(result.package).toBe("express@4.18.2");
    expect(result.isDirect).toBe(true);
    expect(result.severities).toContain("high");
    expect(result.severities).toContain("moderate");
    expect(result.advisories.high).toContain(
      "Express.js open redirect vulnerability"
    );
    expect(result.advisories.moderate).toContain(
      "Express.js prototype pollution"
    );
    expect(result.classification).toBe("BLOCKING"); // high → blocking
  });

  it("handles section with no severity (just package info)", () => {
    const result = parseSection(NO_SEVERITY);
    expect(result.package).toBe("some-pkg@2.0.0");
    expect(result.isDirect).toBe(true);
    expect(result.severities).toEqual([]);
    expect(result.classification).toBe("PASSING");
  });

  it("handles malformed section gracefully", () => {
    const result = parseSection("garbage data\n  more garbage");
    expect(result.package).toBe(""); // no valid header
    expect(result.isDirect).toBe(false);
    expect(result.severities).toEqual([]);
    expect(result.classification).toBe("PASSING");
  });
});

// ---------------------------------------------------------------------------
// Tests: parseAuditOutput — the main integration-level tests
// ---------------------------------------------------------------------------

describe("parseAuditOutput", () => {
  it("direct critical vulnerability → fail (exit 1 / BLOCKING)", () => {
    const result = parseAuditOutput(DIRECT_CRITICAL);
    expect(result.classification).toBe("BLOCKING");
    expect(result.blocking).toHaveLength(1);
    expect(result.blocking[0].package).toBe("vitest@3.1.4");
    expect(result.blocking[0].isDirect).toBe(true);
    expect(result.blocking[0].severities).toContain("critical");
  });

  it("direct high vulnerability → fail (exit 1 / BLOCKING)", () => {
    const result = parseAuditOutput(DIRECT_HIGH);
    expect(result.classification).toBe("BLOCKING");
    expect(result.blocking).toHaveLength(1);
    expect(result.blocking[0].package).toBe("next@16.2.0");
    expect(result.blocking[0].isDirect).toBe(true);
    expect(result.blocking[0].severities).toContain("high");
  });

  it("direct moderate vulnerability → passing (exit 0) with PASSING classification", () => {
    const result = parseAuditOutput(DIRECT_MODERATE);
    expect(result.classification).toBe("PASSING");
    expect(result.blocking).toHaveLength(0);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].isDirect).toBe(true);
    expect(result.sections[0].severities).toContain("moderate");
  });

  it("transitive critical/high vulnerability → passing with REPORTED classification", () => {
    const result = parseAuditOutput(TRANSITIVE_CRITICAL);
    expect(result.classification).toBe("PASSING");
    expect(result.blocking).toHaveLength(0);
    expect(result.reported).toHaveLength(1);
    expect(result.reported[0].package).toBe("some-transitive-pkg@1.0.0");
    expect(result.reported[0].classification).toBe("REPORTED");
  });

  it("no vulnerabilities → passing", () => {
    const result = parseAuditOutput(CLEAN_OUTPUT);
    expect(result.classification).toBe("PASSING");
    expect(result.sections).toHaveLength(0);
    expect(result.blocking).toHaveLength(0);
    expect(result.reported).toHaveLength(0);
  });

  it("multiple package sections → correct classification", () => {
    const result = parseAuditOutput(MIXED_OUTPUT);

    // 4 sections total
    expect(result.sections).toHaveLength(4);

    // 2 blocking: vitest (direct critical) + next (direct high)
    expect(result.blocking).toHaveLength(2);
    expect(result.blocking.map((s) => s.package)).toEqual(
      expect.arrayContaining(["vitest@3.1.4", "next@16.2.0"])
    );

    // 1 reported: some-transitive-pkg (transitive critical)
    expect(result.reported).toHaveLength(1);
    expect(result.reported[0].package).toBe("some-transitive-pkg@1.0.0");

    // Overall classification is BLOCKING
    expect(result.classification).toBe("BLOCKING");

    // Severity counts
    expect(result.severityCounts.critical).toBe(2); // vitest + transitive
    expect(result.severityCounts.high).toBe(1); // next
    expect(result.severityCounts.moderate).toBe(1); // lodash
  });

  it("direct marker before severity → correctly fails (the original bug)", () => {
    // This is the EXACT case that the old shell parser got wrong.
    // Bun puts "(direct dependency)" BEFORE severity, the shell assumed AFTER.
    const result = parseAuditOutput(DIRECT_CRITICAL);
    expect(result.classification).toBe("BLOCKING");
    expect(result.blocking[0].isDirect).toBe(true);
    expect(result.blocking[0].severities).toContain("critical");
  });

  it("handles whitespace-only input", () => {
    const result = parseAuditOutput("   \n\n  \n  ");
    expect(result.classification).toBe("PASSING");
    expect(result.sections).toHaveLength(0);
  });

  it("handles input with only blank-line-separated empty sections", () => {
    const result = parseAuditOutput("\n\n\n");
    expect(result.classification).toBe("PASSING");
  });
});

// ---------------------------------------------------------------------------
// Tests: formatSummary
// ---------------------------------------------------------------------------

describe("formatSummary", () => {
  it("formats clean output summary", () => {
    const result = parseAuditOutput(CLEAN_OUTPUT);
    const summary = formatSummary(result);
    expect(summary).toContain("No vulnerabilities found");
    expect(summary).toContain("PASSING");
  });

  it("formats blocking summary with package details", () => {
    const result = parseAuditOutput(DIRECT_CRITICAL);
    const summary = formatSummary(result);
    expect(summary).toContain("BLOCKING");
    expect(summary).toContain("vitest@3.1.4");
    expect(summary).toContain("critical");
    expect(summary).toContain("Exit code: 1");
  });

  it("formats mixed output summary", () => {
    const result = parseAuditOutput(MIXED_OUTPUT);
    const summary = formatSummary(result);
    expect(summary).toContain("BLOCKING (2)");
    expect(summary).toContain("REPORTED (1)");
    expect(summary).toContain("vitest@3.1.4");
    expect(summary).toContain("next@16.2.0");
    expect(summary).toContain("some-transitive-pkg@1.0.0");
  });
});

// ---------------------------------------------------------------------------
// Tests: formatAnnotations (GitHub Actions)
// ---------------------------------------------------------------------------

describe("formatAnnotations", () => {
  it("emits ::error:: for blocking vulnerabilities", () => {
    const result = parseAuditOutput(DIRECT_CRITICAL);
    const annotations = formatAnnotations(result);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatch(/^::error::/);
    expect(annotations[0]).toContain("vitest@3.1.4");
    expect(annotations[0]).toContain("critical");
    expect(annotations[0]).toContain("direct dependency");
  });

  it("emits ::warning:: for reported vulnerabilities", () => {
    const result = parseAuditOutput(TRANSITIVE_CRITICAL);
    const annotations = formatAnnotations(result);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatch(/^::warning::/);
    expect(annotations[0]).toContain("some-transitive-pkg@1.0.0");
    expect(annotations[0]).toContain("transitive");
  });

  it("emits both ::error:: and ::warning:: for mixed results", () => {
    const result = parseAuditOutput(MIXED_OUTPUT);
    const annotations = formatAnnotations(result);
    // 2 blocking → 2 errors, 1 reported → 1 warning
    const errors = annotations.filter((a) => a.startsWith("::error::"));
    const warnings = annotations.filter((a) => a.startsWith("::warning::"));
    expect(errors).toHaveLength(2);
    expect(warnings).toHaveLength(1);
  });

  it("emits no annotations for clean output", () => {
    const result = parseAuditOutput(CLEAN_OUTPUT);
    const annotations = formatAnnotations(result);
    expect(annotations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: formatErrorAnnotation / formatWarningAnnotation
// ---------------------------------------------------------------------------

describe("formatErrorAnnotation", () => {
  it("formats direct critical annotation", () => {
    const section = parseSection(DIRECT_CRITICAL);
    const ann = formatErrorAnnotation(section);
    expect(ann).toBe(
      "::error::BLOCKING: vitest@3.1.4 [critical] (direct dependency) — Vitest CLI allows arbitrary code execution"
    );
  });
});

describe("formatWarningAnnotation", () => {
  it("formats transitive critical annotation", () => {
    const section = parseSection(TRANSITIVE_CRITICAL);
    const ann = formatWarningAnnotation(section);
    expect(ann).toBe(
      "::warning::REPORTED: some-transitive-pkg@1.0.0 [critical] (transitive) — Some transitive issue"
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: formatJsonSummary
// ---------------------------------------------------------------------------

describe("formatJsonSummary", () => {
  it("produces valid JSON with correct structure", () => {
    const result = parseAuditOutput(MIXED_OUTPUT);
    const jsonStr = formatJsonSummary(result);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.classification).toBe("BLOCKING");
    expect(parsed.exitCode).toBe(1);
    expect(parsed.totalSections).toBe(4);
    expect(parsed.blockingCount).toBe(2);
    expect(parsed.reportedCount).toBe(1);
    expect(parsed.severityCounts.critical).toBe(2);
    expect(parsed.severityCounts.high).toBe(1);
    expect(parsed.severityCounts.moderate).toBe(1);
  });

  it("clean output → passing JSON", () => {
    const result = parseAuditOutput(CLEAN_OUTPUT);
    const jsonStr = formatJsonSummary(result);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.classification).toBe("PASSING");
    expect(parsed.exitCode).toBe(0);
    expect(parsed.totalSections).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edge case: transitive high (not just critical)
// ---------------------------------------------------------------------------

describe("transitive high vulnerability", () => {
  it("classifies transitive high as REPORTED (not BLOCKING)", () => {
    const input = `
some-transitive@5.0.0
  high: Transitive high severity issue
  https://github.com/advisories/GHSA-tttt
`.trim();

    const result = parseAuditOutput(input);
    expect(result.classification).toBe("PASSING");
    expect(result.reported).toHaveLength(1);
    expect(result.reported[0].severities).toContain("high");
    expect(result.reported[0].isDirect).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge case: direct low/info only
// ---------------------------------------------------------------------------

describe("direct low/info vulnerability", () => {
  it("classifies direct low as PASSING", () => {
    const input = `
some-pkg@1.0.0
  (direct dependency)
  low: Minor issue
  https://github.com/advisories/GHSA-llll
`.trim();

    const result = parseAuditOutput(input);
    expect(result.classification).toBe("PASSING");
    expect(result.blocking).toHaveLength(0);
  });

  it("classifies direct info as PASSING", () => {
    const input = `
some-pkg@1.0.0
  (direct dependency)
  info: Informational advisory
  https://github.com/advisories/GHSA-iiii
`.trim();

    const result = parseAuditOutput(input);
    expect(result.classification).toBe("PASSING");
    expect(result.blocking).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge case: real-world Bun output format (exact replica)
// ---------------------------------------------------------------------------

describe("real-world Bun audit output", () => {
  it("correctly parses the exact format from the task description", () => {
    const realWorldOutput = `vitest@3.1.4
  (direct dependency)
  critical: Vitest CLI allows arbitrary code execution
  https://github.com/advisories/GHSA-xxxx

next@16.2.0
  (direct dependency)
  high: Next.js Server-Side Request Forgery in Server Actions
  https://github.com/advisories/GHSA-yyyy

some-transitive-pkg@1.0.0
  critical: Some transitive issue
  https://github.com/advisories/GHSA-zzzz`;

    const result = parseAuditOutput(realWorldOutput);

    // vitest = direct + critical → BLOCKING
    expect(result.blocking).toHaveLength(2);
    expect(result.blocking[0].package).toBe("vitest@3.1.4");
    expect(result.blocking[0].classification).toBe("BLOCKING");

    // next = direct + high → BLOCKING
    expect(result.blocking[1].package).toBe("next@16.2.0");
    expect(result.blocking[1].classification).toBe("BLOCKING");

    // some-transitive-pkg = transitive + critical → REPORTED only
    expect(result.reported).toHaveLength(1);
    expect(result.reported[0].package).toBe("some-transitive-pkg@1.0.0");
    expect(result.reported[0].classification).toBe("REPORTED");

    // Overall: BLOCKING
    expect(result.classification).toBe("BLOCKING");

    // Exit code would be 1
    const exitCode = result.classification === "BLOCKING" ? 1 : 0;
    expect(exitCode).toBe(1);
  });
});
