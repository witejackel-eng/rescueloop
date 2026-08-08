// Attribution guard — regression tests that protect the evidence-based
// attribution policy. These guards ensure:
//
//   1. No file sums confirmed + estimated into a "total defended value"
//   2. Mock/fixture data keeps confirmedRecoveredRevenue = 0
//      (no fake confirmed revenue in demo/fixture data)
//   3. No presentation combines evidence tiers into a single figure

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const ROOT = resolve(__dirname, "../../../..");

// ── File gathering ───────────────────────────────────────────

function gatherFiles(dir: string): string[] {
  const out: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        // Skip node_modules and .next
        if (entry === "node_modules" || entry === ".next") continue;
        out.push(...gatherFiles(full));
      } else if (st.isFile()) {
        const ext = extname(full);
        if (ext === ".ts" || ext === ".tsx") {
          out.push(full);
        }
      }
    }
  } catch {
    // Directory may not exist
  }
  return out;
}

function read(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

// ── 1. No "total defended value" summation ───────────────────
//
// The attribution policy requires that confirmed and estimated values
// never be summed into a single "total defended value" figure.

describe("attribution guard — no total defended value summation", () => {
  it("no source file sums confirmed + estimated into 'total defended value'", () => {
    const dirs = [
      resolve(ROOT, "src/components"),
      resolve(ROOT, "src/lib"),
      resolve(ROOT, "src/app"),
    ];
    const files = dirs.flatMap(gatherFiles);

    // Patterns that indicate a summation of confirmed + estimated
    const summationPatterns: RegExp[] = [
      /total\s+defended\s+value/i,
      /totalDefendedValue/i,
      /total_defended_value/i,
      // confirmed + estimated being assigned to a total
      /confirmed.*\+.*estimated/i,
      /confirmedRecoveredRevenue\s*\+\s*estimated/i,
    ];

    const violations: string[] = [];
    for (const filePath of files) {
      // Skip this test file itself
      if (filePath.includes("attribution-guard")) continue;
      // Skip test fixture files that test the prohibition itself
      if (filePath.includes("marketing-truth-guard")) continue;

      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comment-only lines and import lines
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;
        if (trimmed.startsWith("import ")) continue;

        for (const pattern of summationPatterns) {
          if (pattern.test(line)) {
            // Exemption: the attribution-illustration explicitly shows
            // "NEVER COMBINED INTO ONE TOTAL" — this is a label, not
            // a computation.
            if (line.includes("NEVER COMBINED")) continue;
            // Exemption: policy documentation and forbidden-claims lists
            if (line.includes("prohibited") || line.includes("never")) continue;
            // Exemption: string literals inside forbiddenClaims arrays
            // (e.g. manifest.ts listing "Total defended value" as forbidden)
            if (/^\s*"/.test(trimmed) && (content.includes("forbiddenClaims") || content.includes("forbidden"))) continue;

            violations.push(`${filePath}:${i + 1}: ${trimmed}`);
          }
        }
      }
    }

    expect(
      violations,
      `Files contain confirmed+estimated summation or "total defended value":\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});

// ── 2. Mock/fixture data has confirmedRecoveredRevenue = 0 ───

describe("attribution guard — mock data zero confirmed revenue", () => {
  it("src/lib/mock-data.ts has confirmedRecoveredRevenue = 0", () => {
    const content = read("src/lib/mock-data.ts");
    // Check the KPIS object explicitly
    const match = /confirmedRecoveredRevenue\s*:\s*(\d+)/.exec(content);
    expect(match, "confirmedRecoveredRevenue not found in mock-data.ts").not.toBeNull();
    const value = parseInt(match![1], 10);
    expect(
      value,
      `confirmedRecoveredRevenue is ${value} — must be 0 in mock/fixture data`,
    ).toBe(0);
  });

  it("src/providers/fixtures/fixtures-data.ts does not set a non-zero confirmedRecoveredRevenue", () => {
    const content = read("src/providers/fixtures/fixtures-data.ts");
    const match = /confirmedRecoveredRevenue\s*:\s*(\d+)/.exec(content);
    // If the field doesn't exist in fixtures, that's fine (defaults to 0)
    if (match) {
      const value = parseInt(match[1], 10);
      expect(
        value,
        `confirmedRecoveredRevenue is ${value} in fixture data — must be 0`,
      ).toBe(0);
    }
    // Pass if the field is not present or is 0
    expect(true).toBe(true);
  });
});

// ── 3. No presentation combines evidence tiers ───────────────
//
// The attribution illustration and value pages must keep confirmed,
// associated, and estimated tiers visually and numerically separate.
// Specifically, no component should display a single summed figure
// that combines multiple evidence tiers.

describe("attribution guard — evidence tiers never combined in presentation", () => {
  it("no presentation component sums evidence tiers into a single figure", () => {
    const dirsToScan = [
      resolve(ROOT, "src/components/rescueloop/value"),
      resolve(ROOT, "src/components/rescueloop/overview"),
      resolve(ROOT, "src/components/marketing"),
    ];

    // Patterns indicating tier combination in presentation.
    // We look for confirmed + estimated being summed (not planCost + confirmed
    // which is a layout calculation for ratio bars).
    const combinePatterns: RegExp[] = [
      // confirmedRecoveredRevenue + estimated...
      /confirmedRecoveredRevenue\s*\+\s*estimated/i,
      // confirmedValue + estimatedValue (same evidence tier sum)
      /confirmedValue\s*\+\s*estimatedValue/i,
      // A variable named totalDefendedValue or total_defended_value
      /totalDefendedValue/i,
      /total_defended_value/i,
    ];

    const violations: string[] = [];
    for (const dir of dirsToScan) {
      const files = gatherFiles(dir);
      for (const filePath of files) {
        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip comments
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

          for (const pattern of combinePatterns) {
            if (pattern.test(line)) {
              violations.push(`${filePath}:${i + 1}: ${trimmed}`);
            }
          }
        }
      }
    }

    expect(
      violations,
      `Presentation components combine evidence tiers:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("attribution-illustration shows tiers separately with 'NEVER COMBINED' label", () => {
    const content = readFileSync(
      resolve(ROOT, "src/components/marketing/illustrations/attribution-illustration.tsx"),
      "utf-8",
    );
    expect(content).toContain("NEVER COMBINED");
    // Should show three separate tiers
    expect(content).toContain("CONFIRMED");
    expect(content).toContain("ASSOCIATED");
    expect(content).toContain("ESTIMATED");
  });
});
