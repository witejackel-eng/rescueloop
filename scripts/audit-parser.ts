/**
 * @fileoverview Bun audit output parser for CI security scanning.
 *
 * ## Why this exists
 *
 * The previous CI security scan used a shell `while read` loop with a state machine
 * that assumed severity lines appear BEFORE the "(direct dependency)" marker. Bun's
 * actual output is the REVERSE:
 *
 * ```
 * package@version
 *   (direct dependency)
 *   critical: advisory-title
 *   https://github.com/advisories/GHSA-xxxx
 * ```
 *
 * This caused direct critical/high vulnerabilities to pass undetected because the
 * shell parser never correlated the severity with the direct-dependency marker.
 *
 * ## Bun audit output format
 *
 * `bun audit` prints sections separated by blank lines. Each section has:
 *
 * 1. **Header line** — `package@version` (no indent)
 * 2. **Detail lines** — indented with 2 spaces, which may include:
 *    - `(direct dependency)` — marks a direct (non-transitive) dep
 *    - Severity line — `critical:`, `high:`, `moderate:`, `low:`, `info:` followed by advisory title
 *    - URL line — `https://...` linking to the advisory
 *    - Advisory ID line — e.g. `GHSA-xxxx-xxxx-xxxx`
 *
 * The "(direct dependency)" marker may appear BEFORE or AFTER severity lines —
 * this parser handles both orderings correctly.
 *
 * ## Classification
 *
 * - **BLOCKING** — Direct dependency with CRITICAL or HIGH severity → exit 1
 * - **REPORTED** — Transitive-only dependency with CRITICAL or HIGH → warning, exit 0
 * - **PASSING** — No blocking vulnerabilities → exit 0
 *
 * @module audit-parser
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Recognized severity levels from `bun audit` output. */
export type Severity = "critical" | "high" | "moderate" | "low" | "info";

/** Classification result for a single vulnerability section. */
export type Classification = "BLOCKING" | "REPORTED" | "PASSING";

/** A parsed vulnerability section from `bun audit` output. */
export interface VulnerabilitySection {
  /** Package name with version, e.g. "vitest@3.1.4" */
  package: string;
  /** True if "(direct dependency)" appears in this section */
  isDirect: boolean;
  /** Severity levels found in this section */
  severities: Severity[];
  /** Advisory URLs found in this section */
  urls: string[];
  /** Advisory titles keyed by severity */
  advisories: Record<Severity, string[]>;
  /** Classification determined from isDirect + severities */
  classification: Classification;
}

/** Summary result of parsing the full audit output. */
export interface AuditResult {
  /** All parsed sections */
  sections: VulnerabilitySection[];
  /** Sections classified as BLOCKING */
  blocking: VulnerabilitySection[];
  /** Sections classified as REPORTED */
  reported: VulnerabilitySection[];
  /** Overall classification */
  classification: Classification;
  /** Total counts by severity */
  severityCounts: Record<Severity, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Severities that trigger BLOCKING when in a direct dependency. */
const BLOCKING_SEVERITIES: Severity[] = ["critical", "high"];

/** Regex for the severity line: `  critical: title` or `  high: title` etc. */
const SEVERITY_REGEX = /^\s+(critical|high|moderate|low|info):\s+(.+)$/;

/** Regex for a URL line: `  https://...` */
const URL_REGEX = /^\s+(https:\/\/\S+)$/;

/** Regex for the direct dependency marker: `  (direct dependency)` */
const DIRECT_MARKER_REGEX = /^\s+\(direct dependency\)/;

/** Regex for the package header line: `name@version` (no leading whitespace) */
const PACKAGE_HEADER_REGEX = /^(\S+@\S+)$/;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Split raw audit output into sections (separated by blank lines).
 *
 * @param raw - The full text output from `bun audit`
 * @returns Array of non-empty section strings, each containing one or more lines
 */
export function splitSections(raw: string): string[] {
  // Split on blank lines (one or more empty lines)
  const sections = raw.split(/\n\s*\n/);
  return sections
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parse a single vulnerability section into a structured object.
 *
 * A section looks like:
 * ```
 * vitest@3.1.4
 *   (direct dependency)
 *   critical: Vitest CLI allows arbitrary code execution
 *   https://github.com/advisories/GHSA-xxxx
 * ```
 *
 * The "(direct dependency)" line may appear before OR after severity lines.
 *
 * @param sectionText - The text of one section (may contain newlines)
 * @returns Parsed VulnerabilitySection
 */
export function parseSection(sectionText: string): VulnerabilitySection {
  const lines = sectionText.split("\n");
  const severities: Severity[] = [];
  const urls: string[] = [];
  const advisories: Record<Severity, string[]> = {
    critical: [],
    high: [],
    moderate: [],
    low: [],
    info: [],
  };
  let isDirect = false;
  let pkg = "";

  for (const line of lines) {
    // Check for package header (no leading whitespace, contains @)
    const headerMatch = line.match(PACKAGE_HEADER_REGEX);
    if (headerMatch) {
      pkg = headerMatch[1];
      continue;
    }

    // Check for direct dependency marker
    if (DIRECT_MARKER_REGEX.test(line)) {
      isDirect = true;
      continue;
    }

    // Check for severity line
    const severityMatch = line.match(SEVERITY_REGEX);
    if (severityMatch) {
      const sev = severityMatch[1] as Severity;
      const title = severityMatch[2].trim();
      severities.push(sev);
      advisories[sev].push(title);
      continue;
    }

    // Check for URL line
    const urlMatch = line.match(URL_REGEX);
    if (urlMatch) {
      urls.push(urlMatch[1]);
      continue;
    }

    // Other lines (advisory IDs, descriptions, etc.) are ignored
  }

  // Determine classification
  const hasBlockingSeverity = severities.some((s) =>
    BLOCKING_SEVERITIES.includes(s)
  );
  let classification: Classification;
  if (isDirect && hasBlockingSeverity) {
    classification = "BLOCKING";
  } else if (!isDirect && hasBlockingSeverity) {
    classification = "REPORTED";
  } else {
    classification = "PASSING";
  }

  return {
    package: pkg,
    isDirect,
    severities,
    urls,
    advisories,
    classification,
  };
}

/**
 * Parse the complete `bun audit` output into an AuditResult.
 *
 * @param raw - The full text output from `bun audit`
 * @returns Structured audit result with classifications
 */
export function parseAuditOutput(raw: string): AuditResult {
  if (!raw || raw.trim().length === 0) {
    return {
      sections: [],
      blocking: [],
      reported: [],
      classification: "PASSING",
      severityCounts: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
      },
    };
  }

  const sectionTexts = splitSections(raw);
  const sections = sectionTexts.map(parseSection);

  const blocking = sections.filter((s) => s.classification === "BLOCKING");
  const reported = sections.filter((s) => s.classification === "REPORTED");

  // Count severities across all sections
  const severityCounts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
  };
  for (const section of sections) {
    for (const sev of section.severities) {
      severityCounts[sev]++;
    }
  }

  const classification: Classification =
    blocking.length > 0 ? "BLOCKING" : "PASSING";

  return {
    sections,
    blocking,
    reported,
    classification,
    severityCounts,
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format a GitHub Actions error annotation for a blocking vulnerability.
 *
 * @param section - The blocking vulnerability section
 * @returns GitHub Actions `::error::` annotation string
 */
export function formatErrorAnnotation(section: VulnerabilitySection): string {
  const sevStr = section.severities
    .filter((s) => BLOCKING_SEVERITIES.includes(s))
    .join(", ");
  const titles = section.severities
    .filter((s) => BLOCKING_SEVERITIES.includes(s))
    .flatMap((s) => section.advisories[s])
    .join("; ");
  return `::error::BLOCKING: ${section.package} [${sevStr}] (direct dependency) — ${titles}`;
}

/**
 * Format a GitHub Actions warning annotation for a reported vulnerability.
 *
 * @param section - The reported vulnerability section
 * @returns GitHub Actions `::warning::` annotation string
 */
export function formatWarningAnnotation(section: VulnerabilitySection): string {
  const sevStr = section.severities
    .filter((s) => BLOCKING_SEVERITIES.includes(s))
    .join(", ");
  const titles = section.severities
    .filter((s) => BLOCKING_SEVERITIES.includes(s))
    .flatMap((s) => section.advisories[s])
    .join("; ");
  return `::warning::REPORTED: ${section.package} [${sevStr}] (transitive) — ${titles}`;
}

/**
 * Generate the human-readable summary for stdout.
 *
 * @param result - The parsed audit result
 * @returns Formatted summary string
 */
export function formatSummary(result: AuditResult): string {
  const lines: string[] = [];

  lines.push("=== Bun Audit Parser Summary ===");
  lines.push("");

  if (result.sections.length === 0) {
    lines.push("No vulnerabilities found.");
    lines.push("Classification: PASSING");
    return lines.join("\n");
  }

  lines.push(`Total packages with vulnerabilities: ${result.sections.length}`);
  lines.push(
    `  Critical: ${result.severityCounts.critical}  High: ${result.severityCounts.high}  Moderate: ${result.severityCounts.moderate}  Low: ${result.severityCounts.low}  Info: ${result.severityCounts.info}`
  );
  lines.push("");

  if (result.blocking.length > 0) {
    lines.push(`BLOCKING (${result.blocking.length}):`);
    for (const s of result.blocking) {
      const sevs = s.severities.join(", ");
      const titles = s.severities
        .flatMap((sev) => s.advisories[sev])
        .join("; ");
      lines.push(`  - ${s.package} [${sevs}] (direct) — ${titles}`);
    }
    lines.push("");
  }

  if (result.reported.length > 0) {
    lines.push(`REPORTED (${result.reported.length}):`);
    for (const s of result.reported) {
      const sevs = s.severities.join(", ");
      const titles = s.severities
        .flatMap((sev) => s.advisories[sev])
        .join("; ");
      lines.push(`  - ${s.package} [${sevs}] (transitive) — ${titles}`);
    }
    lines.push("");
  }

  const passing = result.sections.filter(
    (s) => s.classification === "PASSING"
  );
  if (passing.length > 0) {
    lines.push(`LOW/INFO ONLY (${passing.length}):`);
    for (const s of passing) {
      const sevs = s.severities.join(", ");
      lines.push(`  - ${s.package} [${sevs}]`);
    }
    lines.push("");
  }

  lines.push(`Classification: ${result.classification}`);
  lines.push(
    `Exit code: ${result.classification === "BLOCKING" ? 1 : 0}`
  );

  return lines.join("\n");
}

/**
 * Generate GitHub Actions annotations for all blocking/reported vulnerabilities.
 *
 * @param result - The parsed audit result
 * @returns Array of annotation strings
 */
export function formatAnnotations(result: AuditResult): string[] {
  const annotations: string[] = [];

  for (const s of result.blocking) {
    annotations.push(formatErrorAnnotation(s));
  }

  for (const s of result.reported) {
    annotations.push(formatWarningAnnotation(s));
  }

  return annotations;
}

/**
 * Generate the JSON summary for stderr (machine-parseable).
 *
 * @param result - The parsed audit result
 * @returns JSON string
 */
export function formatJsonSummary(result: AuditResult): string {
  return JSON.stringify(
    {
      classification: result.classification,
      exitCode: result.classification === "BLOCKING" ? 1 : 0,
      totalSections: result.sections.length,
      blockingCount: result.blocking.length,
      reportedCount: result.reported.length,
      severityCounts: result.severityCounts,
      blocking: result.blocking.map((s) => ({
        package: s.package,
        severities: s.severities,
        advisories: s.advisories,
      })),
      reported: result.reported.map((s) => ({
        package: s.package,
        severities: s.severities,
        advisories: s.advisories,
      })),
    },
    null,
    2
  );
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

/**
 * Run the audit parser as a CLI tool.
 *
 * Usage:
 *   bun audit | bun run scripts/audit-parser.ts
 *   bun run scripts/audit-parser.ts /path/to/audit-output.txt
 *
 * - Reads from file path argument, or stdin if no argument
 * - Prints summary to stdout
 * - Prints GitHub Actions annotations to stdout
 * - Prints JSON summary to stderr
 * - Exits with code 0 (passing) or 1 (blocking)
 */
export async function runCli(): Promise<void> {
  let input: string;

  const filePath = process.argv[2];

  if (filePath) {
    // Read from file
    const fs = await import("node:fs/promises");
    input = await fs.readFile(filePath, "utf-8");
  } else {
    // Read from stdin
    input = await readStdin();
  }

  const result = parseAuditOutput(input);

  // Print summary to stdout
  const summary = formatSummary(result);
  console.log(summary);

  // Print GitHub Actions annotations to stdout
  const annotations = formatAnnotations(result);
  for (const ann of annotations) {
    console.log(ann);
  }

  // Print JSON summary to stderr
  const json = formatJsonSummary(result);
  process.stderr.write(json + "\n");

  // Exit with appropriate code
  const exitCode = result.classification === "BLOCKING" ? 1 : 0;
  process.exit(exitCode);
}

/**
 * Read all data from stdin.
 */
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk: string) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    // Handle case where stdin is not piped (immediate end)
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

// Auto-run CLI when executed directly (not imported as a module)
const isDirectExecution =
  typeof Bun !== "undefined"
    ? (Bun as any).main === import.meta.path
    : process.argv[1]?.endsWith("audit-parser.ts");

if (isDirectExecution) {
  runCli().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(2);
  });
}
