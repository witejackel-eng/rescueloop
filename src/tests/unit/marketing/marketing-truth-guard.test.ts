// Marketing truth regression guard.
//
// Scans marketing/public source files for forbidden phrases that must
// never appear in shipped copy. If any are found the test FAILS,
// blocking the release. This complements the existing
// marketing-truth.test.ts (which checks manifest-level claims) by
// performing a broader file-level scan with additional forbidden
// patterns added for the final release candidate.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";

// ── Directories to scan ──────────────────────────────────────

const SCAN_DIRS = [
  resolve(__dirname, "../../../components/marketing"),
  resolve(__dirname, "../../../app"),
];

// ── Forbidden patterns ───────────────────────────────────────
//
// Each entry is [pattern, description, exemptionCheck?].
// The exemption check receives the full file content and returns
// true if the match should be ignored (e.g. test fixtures, labelled
// illustrative/simulated data).

type ExemptionFn = (fullContent: string) => boolean;

interface ForbiddenRule {
  pattern: RegExp;
  description: string;
  exempt?: ExemptionFn;
}

const FORBIDDEN: ForbiddenRule[] = [
  {
    pattern: /students rescued/i,
    description: '"students rescued" — unverified claim of student rescue outcome',
    exempt: (content) =>
      // Allow if the file is a test file or comments mark it as a forbidden example
      content.includes("forbidden") || content.includes("FORBIDDEN"),
  },
  {
    pattern: /revenue recovered/i,
    description: '"revenue recovered" — must be labelled illustrative/simulated',
    exempt: (content) =>
      content.includes("illustrative") ||
      content.includes("simulated") ||
      content.includes("Illustrative") ||
      content.includes("Simulated"),
  },
  {
    pattern: /as reported by creators/i,
    description: '"as reported by creators" — unverifiable third-party endorsement',
  },
  {
    pattern: /Live demo/i,
    description: '"Live demo" — use "interactive demo" instead',
    exempt: (content) =>
      // Allow in test code itself
      content.includes("vitest") ||
      content.includes("test(") ||
      content.includes("it("),
  },
  {
    pattern: /Total defended value/i,
    description: '"Total defended value" — combining confirmed+estimated is prohibited',
  },
  {
    pattern: /Payment received after a documented intervention sequence/i,
    description:
      '"Payment received after a documented intervention sequence" — calls ordinary payment "confirmed recovery"',
  },
  {
    pattern: /\$237 confirmed/i,
    description: '"$237 confirmed" — specific dollar claim not substantiated',
  },
  {
    pattern: /confirmed recovered value \$237/i,
    description: '"confirmed recovered value $237" — specific dollar claim not substantiated',
  },
  {
    pattern: /8\.2[×x] confirmed/i,
    description: '"8.2× confirmed" — specific multiplier claim not substantiated',
  },
];

// ── File gathering (recursive) ───────────────────────────────

function gatherFiles(dir: string): string[] {
  const out: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        out.push(...gatherFiles(full));
      } else if (st.isFile()) {
        const ext = extname(full);
        if (ext === ".ts" || ext === ".tsx") {
          out.push(full);
        }
      }
    }
  } catch {
    // Directory may not exist in all worktrees; skip silently.
  }
  return out;
}

function allFiles(): string[] {
  return SCAN_DIRS.flatMap(gatherFiles);
}

// ── Scan logic ───────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  rule: string;
  matched: string;
}

function scan(): Violation[] {
  const violations: Violation[] = [];
  for (const filePath of allFiles()) {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (const rule of FORBIDDEN) {
      // Check exemption at file level first
      if (rule.exempt && rule.exempt(content)) continue;
      for (let i = 0; i < lines.length; i++) {
        const match = rule.pattern.exec(lines[i]);
        if (match) {
          // Even with file-level exemption, check per-line context
          // for the "revenue recovered" case — if the line itself
          // says illustrative/simulated, skip.
          if (rule.exempt && rule.exempt(lines[i])) continue;
          violations.push({
            file: filePath,
            line: i + 1,
            rule: rule.description,
            matched: match[0],
          });
        }
      }
    }
  }
  return violations;
}

// ── Tests ────────────────────────────────────────────────────

describe("marketing truth regression guard", () => {
  it("scan directories contain source files", () => {
    const files = allFiles();
    expect(files.length, "No .ts/.tsx files found in scan directories").toBeGreaterThan(0);
  });

  it("no forbidden phrases appear in marketing or app source", () => {
    const violations = scan();
    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line} → ${v.matched}  (${v.rule})`)
        .join("\n");
      expect.fail(
        `Found ${violations.length} forbidden phrase(s):\n${report}`,
      );
    }
    expect(violations).toHaveLength(0);
  });

  // Per-rule individual tests for clearer failure messages
  for (const rule of FORBIDDEN) {
    it(`no file contains: ${rule.description}`, () => {
      const violations: string[] = [];
      for (const filePath of allFiles()) {
        const content = readFileSync(filePath, "utf-8");
        if (rule.exempt && rule.exempt(content)) continue;
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (rule.pattern.test(lines[i])) {
            if (rule.exempt && rule.exempt(lines[i])) continue;
            violations.push(`${filePath}:${i + 1}`);
          }
        }
      }
      expect(violations, `Rule "${rule.description}" violated in: ${violations.join(", ")}`).toHaveLength(0);
    });
  }
});
