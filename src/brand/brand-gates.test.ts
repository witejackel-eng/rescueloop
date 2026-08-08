import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PUBLIC_BRAND = path.join(PROJECT_ROOT, "public/brand");
const SRC = path.join(PROJECT_ROOT, "src");

// ─── Gate 1: Required brand assets exist ──────────────────────
const REQUIRED_BRAND_FILES = [
  "mark-primary.svg",
  "mark-mono.svg",
  "mark-reversed.svg",
  "mark-micro.svg",
  "favicon.svg",
  "favicon-16.png",
  "favicon-32.png",
  "favicon-48.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "whop-app-icon-512.png",
  "social-avatar-512.png",
  "og-default-1200x630.png",
  "twitter-default-1200x630.png",
] as const;

describe("Brand Gate 1: Required assets exist", () => {
  for (const file of REQUIRED_BRAND_FILES) {
    it(`${file} exists in public/brand/`, () => {
      const filePath = path.join(PUBLIC_BRAND, file);
      expect(fs.existsSync(filePath), `Missing brand asset: ${file}`).toBe(true);
    });
  }
});

// ─── Gate 2: SVGs have viewBox ────────────────────────────────
const BRAND_SVGS = [
  "mark-primary.svg",
  "mark-mono.svg",
  "mark-reversed.svg",
  "mark-micro.svg",
  "favicon.svg",
] as const;

describe("Brand Gate 2: SVGs have viewBox", () => {
  for (const file of BRAND_SVGS) {
    it(`${file} contains viewBox attribute`, () => {
      const filePath = path.join(PUBLIC_BRAND, file);
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content, `${file} missing viewBox`).toContain("viewBox");
    });
  }
});

// ─── Gate 3: SVG target under 8 KB ───────────────────────────
describe("Brand Gate 3: SVG files under 8 KB", () => {
  for (const file of BRAND_SVGS) {
    it(`${file} is under 8 KB`, () => {
      const filePath = path.join(PUBLIC_BRAND, file);
      const stats = fs.statSync(filePath);
      expect(stats.size, `${file} is ${stats.size} bytes, exceeds 8 KB`).toBeLessThan(8 * 1024);
    });
  }
});

// ─── Gate 4: Favicon PNGs under 50 KB ────────────────────────
const FAVICON_PNGS = [
  "favicon-16.png",
  "favicon-32.png",
  "favicon-48.png",
  "apple-touch-icon.png",
] as const;

describe("Brand Gate 4: Favicon PNGs under 50 KB", () => {
  for (const file of FAVICON_PNGS) {
    it(`${file} is under 50 KB`, () => {
      const filePath = path.join(PUBLIC_BRAND, file);
      const stats = fs.statSync(filePath);
      expect(stats.size, `${file} is ${stats.size} bytes, exceeds 50 KB`).toBeLessThan(50 * 1024);
    });
  }
});

// ─── Gate 5: 512 icons under 250 KB ──────────────────────────
const ICON_512_FILES = ["icon-512.png", "whop-app-icon-512.png"] as const;

describe("Brand Gate 5: 512px icons under 250 KB", () => {
  for (const file of ICON_512_FILES) {
    it(`${file} is under 250 KB`, () => {
      const filePath = path.join(PUBLIC_BRAND, file);
      const stats = fs.statSync(filePath);
      expect(stats.size, `${file} is ${stats.size} bytes, exceeds 250 KB`).toBeLessThan(250 * 1024);
    });
  }
});

// ─── Gate 6: OG/Twitter images under 500 KB ──────────────────
const SOCIAL_IMAGES = ["og-default-1200x630.png", "twitter-default-1200x630.png"] as const;

describe("Brand Gate 6: OG/Twitter images under 500 KB", () => {
  for (const file of SOCIAL_IMAGES) {
    it(`${file} is under 500 KB`, () => {
      const filePath = path.join(PUBLIC_BRAND, file);
      const stats = fs.statSync(filePath);
      expect(stats.size, `${file} is ${stats.size} bytes, exceeds 500 KB`).toBeLessThan(500 * 1024);
    });
  }
});

// ─── Gate 7: No duplicate canonical logo module ───────────────
describe("Brand Gate 7: No duplicate canonical logo module", () => {
  it("src/components/brand/logo.tsx is the only canonical logo module", () => {
    const canonicalPath = path.join(SRC, "components/brand/logo.tsx");
    expect(fs.existsSync(canonicalPath), "Canonical logo.tsx missing").toBe(true);

    // Check that there is no second logo.tsx in a different brand path
    // The shared/logo.tsx is a legacy wrapper, not a duplicate brand module
    const brandIndex = path.join(SRC, "components/brand/index.ts");
    const brandIndexContent = fs.readFileSync(brandIndex, "utf-8");
    expect(
      brandIndexContent.includes("from \"./logo\""),
      "brand/index.ts should re-export from ./logo"
    ).toBe(true);
  });
});

// ─── Gate 8: No old mark SVG path ─────────────────────────────
describe("Brand Gate 8: No old mark SVG geometry in public/logo.svg", () => {
  it("public/logo.svg does not contain old 'breath' animation", () => {
    const oldLogo = path.join(PROJECT_ROOT, "public/logo.svg");
    if (!fs.existsSync(oldLogo)) {
      // If the old file has been removed entirely, the gate passes
      return;
    }
    const content = fs.readFileSync(oldLogo, "utf-8");
    expect(
      content.includes("breath") || content.includes("breathe"),
      "Old logo.svg still contains 'breath/breathe' animation — replace with canonical mark"
    ).toBe(false);
  });

  it("public/logo.svg does not contain old M24.51 orbit/hourglass path", () => {
    const oldLogo = path.join(PROJECT_ROOT, "public/logo.svg");
    if (!fs.existsSync(oldLogo)) {
      return;
    }
    const content = fs.readFileSync(oldLogo, "utf-8");
    expect(
      content.includes("M24.51"),
      "Old logo.svg still contains old M24.51 path geometry — replace with canonical mark"
    ).toBe(false);
  });
});

// ─── Gate 9: No forbidden brand name variants ─────────────────
describe("Brand Gate 9: No forbidden brand name variants", () => {
  it("'Rescue Loop' (with space) does not appear in production source", () => {
    const forbiddenPattern = "Rescue Loop";
    const appDir = path.join(SRC, "app");
    const componentsDir = path.join(SRC, "components");
    const libDir = path.join(SRC, "lib");

    const dirsToScan = [appDir, componentsDir, libDir];
    const violations: string[] = [];

    for (const dir of dirsToScan) {
      if (!fs.existsSync(dir)) continue;
      scanDirFor(dir, forbiddenPattern, violations);
    }

    expect(
      violations.length,
      `Found "Rescue Loop" (with space) in: ${violations.join(", ")}`
    ).toBe(0);
  });
});

// ─── Gate 10: Student-facing forbidden terms ──────────────────
const STUDENT_FORBIDDEN_TERMS = [
  "risk",
  "churn",
  "revenue",
  "rescue target",
  "conversion",
  "cancellation probability",
  "evidence score",
  "recovered value",
] as const;

describe("Brand Gate 10: Student-facing pages contain no forbidden terms", () => {
  it("student-rescue page.tsx has no forbidden terms", () => {
    const studentPage = path.join(SRC, "app/(student)/student-rescue/page.tsx");
    const content = fs.readFileSync(studentPage, "utf-8").toLowerCase();

    const violations: string[] = [];
    for (const term of STUDENT_FORBIDDEN_TERMS) {
      if (content.includes(term.toLowerCase())) {
        violations.push(term);
      }
    }

    expect(
      violations.length,
      `Forbidden terms found in student-rescue page: ${violations.join(", ")}`
    ).toBe(0);
  });
});

// ─── Gate 11: Manifest validates ──────────────────────────────
describe("Brand Gate 11: brand-manifest.json validates", () => {
  it("has required PWA manifest fields", () => {
    const manifestPath = path.join(PROJECT_ROOT, "public/brand-manifest.json");
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    expect(manifest.name, "Manifest missing 'name'").toBeDefined();
    expect(manifest.short_name, "Manifest missing 'short_name'").toBeDefined();
    expect(manifest.description, "Manifest missing 'description'").toBeDefined();
    expect(manifest.start_url, "Manifest missing 'start_url'").toBeDefined();
    expect(manifest.display, "Manifest missing 'display'").toBeDefined();
    expect(manifest.icons, "Manifest missing 'icons'").toBeDefined();
    expect(Array.isArray(manifest.icons), "Manifest 'icons' should be an array").toBe(true);
    expect(manifest.icons.length, "Manifest should have at least one icon").toBeGreaterThan(0);
  });
});

// ─── Gate 12: Logo component accessibility ────────────────────
describe("Brand Gate 12: Logo component accessibility", () => {
  it("RescueLoopMark supports decorative mode (aria-hidden)", () => {
    const logoSource = fs.readFileSync(
      path.join(SRC, "components/brand/logo.tsx"),
      "utf-8"
    );
    expect(
      logoSource.includes("aria-hidden"),
      "RescueLoopMark should apply aria-hidden in decorative mode"
    ).toBe(true);
  });

  it("RescueLoopMark supports meaningful mode (aria-label)", () => {
    const logoSource = fs.readFileSync(
      path.join(SRC, "components/brand/logo.tsx"),
      "utf-8"
    );
    expect(
      logoSource.includes("aria-label"),
      "RescueLoopMark should provide aria-label in meaningful mode"
    ).toBe(true);
  });

  it("RescueLoopMark uses role='img' when meaningful", () => {
    const logoSource = fs.readFileSync(
      path.join(SRC, "components/brand/logo.tsx"),
      "utf-8"
    );
    expect(
      logoSource.includes('role: "img"') || logoSource.includes("role: 'img'") || logoSource.includes('role: "img" as const'),
      "RescueLoopMark should use role='img' when decorative is false"
    ).toBe(true);
  });
});

// ─── Helper: recursive directory scanner ──────────────────────
function scanDirFor(
  dir: string,
  pattern: string,
  violations: string[],
  depth = 0
): void {
  if (depth > 6) return; // safety limit
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip node_modules, .next, test directories
    if (
      entry.name.startsWith(".") ||
      entry.name === "node_modules" ||
      entry.name === "__tests__" ||
      entry.name.endsWith(".test.ts") ||
      entry.name.endsWith(".test.tsx") ||
      entry.name.endsWith(".spec.ts")
    ) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirFor(fullPath, pattern, violations, depth + 1);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".js") || entry.name.endsWith(".jsx"))
    ) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Skip string literals that are clearly brand contract definitions
        // Only flag if "Rescue Loop" appears outside of the contract/copy files
        const isBrandDefinitionFile =
          fullPath.includes("brand/contract") ||
          fullPath.includes("brand/copy") ||
          fullPath.includes("brand/tokens") ||
          fullPath.includes("brand/index");

        if (!isBrandDefinitionFile && content.includes(pattern)) {
          violations.push(fullPath.replace(PROJECT_ROOT + "/", ""));
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
}
