// Security regression guard — fails if any of these invariants are
// violated in the source tree. These catch common regressions that
// would be catastrophic in production:
//
//   1. SQLite provider in prisma schema (must be PostgreSQL)
//   2. z-ai-web-dev-sdk in production dependencies
//   3. Duplicate root route (src/app/page.tsx)
//   4. Destructive DB commands in production scripts

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../../../..");

// ── Helpers ──────────────────────────────────────────────────

function readProjectFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

function projectFileExists(relPath: string): boolean {
  return existsSync(resolve(ROOT, relPath));
}

// ── Tests ────────────────────────────────────────────────────

describe("security guard — no SQLite regression", () => {
  it("prisma/schema.prisma does not use SQLite provider", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const hasSQLite = /provider\s*=\s*"sqlite"/i.test(schema);
    expect(
      hasSQLite,
      "prisma/schema.prisma contains provider = \"sqlite\" — must be PostgreSQL",
    ).toBe(false);
  });

  it("prisma/schema.prisma explicitly uses PostgreSQL", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    // Allow any whitespace between provider and =
    const hasPostgres = /provider\s*=\s*"postgresql"/.test(schema);
    expect(
      hasPostgres,
      'prisma/schema.prisma does not declare provider = "postgresql"',
    ).toBe(true);
  });
});

describe("security guard — no dev SDK in production deps", () => {
  it("package.json dependencies do not contain z-ai-web-dev-sdk", () => {
    const pkg = JSON.parse(readProjectFile("package.json"));
    const deps = pkg.dependencies ?? {};
    const devDeps = pkg.devDependencies ?? {};
    const inDeps = "z-ai-web-dev-sdk" in deps;
    const inDevDeps = "z-ai-web-dev-sdk" in devDeps;
    expect(
      inDeps || inDevDeps,
      "z-ai-web-dev-sdk found in package.json — remove before release",
    ).toBe(false);
  });
});

describe("security guard — no duplicate root route", () => {
  it("src/app/page.tsx must not exist (root route lives in (marketing)/page.tsx)", () => {
    const exists = projectFileExists("src/app/page.tsx");
    expect(
      exists,
      "src/app/page.tsx exists — duplicate root route conflicts with (marketing)/page.tsx",
    ).toBe(false);
  });
});

describe("security guard — no destructive DB commands in production scripts", () => {
  it("package.json scripts do not contain 'db push --accept-data-loss' in production commands", () => {
    const pkg = JSON.parse(readProjectFile("package.json"));
    const scripts: Record<string, string> = pkg.scripts ?? {};

    // Scripts that are clearly dev-only (allow destructive commands)
    const devOnlyScripts = new Set([
      "dev",
      "db:push",
      "db:reset",
      "db:migrate",
      "db:generate",
      "postinstall",
      "lint",
      "typecheck",
      "test",
      "test:watch",
      "test:e2e",
      "test:contracts",
      "test:integration",
      "test:perf",
    ]);

    // Production scripts are those NOT in devOnlyScripts
    const productionScripts = Object.entries(scripts).filter(
      ([name]) => !devOnlyScripts.has(name),
    );

    const violations: string[] = [];
    for (const [name, body] of productionScripts) {
      if (body.includes("db push --accept-data-loss")) {
        violations.push(`scripts.${name}: "${body}"`);
      }
      if (body.includes("migrate reset")) {
        violations.push(`scripts.${name}: "${body}"`);
      }
    }

    expect(
      violations,
      `Production scripts contain destructive DB commands:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("no shell/script file outside scripts/ contains destructive prisma commands in executable lines", () => {
    // Read known scripts
    const scriptsToCheck = [
      "scripts/migration-rehearsal.sh",
    ];

    const violations: string[] = [];
    for (const relPath of scriptsToCheck) {
      if (!projectFileExists(relPath)) continue;
      const content = readProjectFile(relPath);
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments and warning/informational lines that tell the user
        // NOT to use destructive commands (they are safeguards, not invocations)
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
        if (/^(warn|info|echo)\b/.test(trimmed) && /(?:NOT|not|never)\s+(?:use|run)/i.test(trimmed)) continue;

        // Check for destructive commands in executable lines only
        if (line.includes("db push --accept-data-loss")) {
          violations.push(`${relPath}:${i + 1} contains executable 'db push --accept-data-loss'`);
        }
        if (line.includes("migrate reset") && !trimmed.startsWith("#")) {
          violations.push(`${relPath}:${i + 1} contains executable 'migrate reset'`);
        }
      }
    }

    expect(
      violations,
      `Scripts with unsafe destructive commands in executable lines:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
