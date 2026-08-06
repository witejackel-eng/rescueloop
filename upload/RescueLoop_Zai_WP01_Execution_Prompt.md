# Zai Execution Prompt — RescueLoop WP-01 Brand Foundation

You are executing **only WP-01 Brand Foundation** for RescueLoop.

Repository:

```text
https://github.com/witejackel-eng/rescueloop
```

Canonical branch:

```text
integration/rescueloop-v1
```

Input archive:

```text
RescueLoop_WP01_Brand_Foundation_v2.zip
```

The observed branch head when this package was prepared was:

```text
1e05bc0422633171504e362e04d6b8db2585c772
```

Re-fetch the branch and use its actual current head. Never reset or overwrite newer work.

## Non-negotiable execution behavior

Do not return a plan-only response. Inspect, implement, test, commit, push, wait for GitHub Actions, and return verifiable evidence.

Do not begin WP-02. Do not redesign product workflows. Do not alter pricing, database behavior, Whop syncing, billing, notification sending, attribution, or interaction/motion architecture except for the smallest compatibility change required to apply the canonical identity.

## Gate before starting

1. Check out `integration/rescueloop-v1`.
2. Pull with fast-forward only.
3. Confirm clean working tree.
4. Confirm the latest strict CI run is green.
5. Confirm the final WP-00 trust patch has addressed:
   - audit parser tests for direct high/critical vulnerabilities;
   - no swallowed Playwright assertions;
   - route-specific student valid/expired/invalid assertions;
   - safe existing-Neon migration baselining documentation.

When these items are absent, finish only those explicitly documented WP-00 blockers first, push them as a separate WP-00 commit, wait for green CI, and then start WP-01. Do not mix hidden WP-00 repairs into the WP-01 commit.

## Read the ZIP

Extract to an untracked temporary directory such as:

```text
.zai/wp01-brand-foundation/
```

Read every Markdown file and every machine-readable contract. Inspect all supplied source assets and exports.

Treat these as the controlling specification:

```text
00_START_HERE.md
01_CURRENT_REPOSITORY_BRAND_AUDIT.md
02_BRAND_NORTH_STAR.md
03_CLOSING_SIGNAL_LOGO_SYSTEM.md
04_CANONICAL_COMPONENT_AND_ASSET_ARCHITECTURE.md
05_COLOR_TYPE_SPACING_AND_TOKEN_MIGRATION.md
06_METADATA_FAVICON_OG_AND_MANIFEST.md
07_ROUTE_GROUP_APPLICATION_MATRIX.md
08_POSITIONING_NAMING_AND_MICROCOPY.md
09_BRAND_QA_ROUTE_AND_AUTOMATED_CHECKS.md
10_ACCESSIBILITY_OPTICAL_AND_PERFORMANCE_QA.md
11_SCREENSHOT_AND_SOCIAL_FRAME_SYSTEM.md
12_IMPLEMENTATION_SEQUENCE.md
13_ACCEPTANCE_GATES.md
14_HANDOFF_EVIDENCE_FORMAT.md
machine/*
assets/brand/*
```

## Repository preflight

Record in `docs/implementation/RESCUELOOP_EXECUTION_LEDGER.md`:

- current branch and full base SHA;
- previous WP-00 CI run ID;
- clean/dirty status;
- current logo files and usages;
- current metadata files;
- current public brand assets;
- current route-group layouts;
- current hard-coded brand hex values;
- current occurrences of RescueLoop name variants;
- student-facing forbidden-term scan;
- baseline screenshots captured.

Do not delete a logo or asset until all imports/usages are proven and replaced.

## Required implementation

### 1. Canonical Closing Signal identity

Use the supplied Closing Signal assets as the production starting point.

Implement exactly one canonical mark geometry and one canonical React logo family. Required variants:

- primary;
- mono;
- reversed;
- micro;
- green tile;
- ink tile;
- horizontal lockup using live text.

The production wordmark must be live text. Do not commit font files. Do not create a separate SVG logo in each header.

The component must support:

- decorative mode with `aria-hidden`;
- meaningful standalone mode with a required accessible label;
- tested size tokens and numeric override;
- context variants for marketing, workspace, student, and internal use;
- no motion in WP-01.

Replace the existing orbit/dashed-circle mark only after every import is inventoried. Remove duplicate geometry after replacement passes tests.

### 2. Canonical asset directory

Create one intentional production directory, preferably:

```text
public/brand/
```

Copy or regenerate from the canonical SVG sources:

```text
mark-primary.svg
mark-mono.svg
mark-reversed.svg
mark-micro.svg
favicon.svg
favicon-16.png
favicon-32.png
favicon-48.png
apple-touch-icon.png
icon-192.png
icon-512.png
whop-app-icon-512.png
social-avatar-512.png
og-default-1200x630.png
twitter-default-1200x630.png
```

Generated raster assets must have reproducible source and a documented export command/script. Do not hand-edit generated PNGs.

Perform optical checks at 16, 20, 24, 32, 48, 64, 128, and 512 px. Correct geometry only in the canonical source.

### 3. Tokens and fonts

Preserve and consolidate the current cream/ink/recovery-green foundation and the existing Instrument Sans, Instrument Serif, and JetBrains Mono setup.

Create typed brand contracts where useful, but do not create a competing CSS token layer.

Enforce semantic color rules:

- green = approval/progress/return/healthy connection;
- amber = attention/stalled;
- red = destructive/denied/failed/data-loss risk;
- color never communicates state alone.

Scan production source for off-system brand hex values. Add a narrow allowlist for legitimate asset-generation/source files only.

### 4. Metadata and operating-system surfaces

Use current official Next.js App Router metadata conventions.

Implement and verify:

- root favicon/icon/apple-icon;
- default Open Graph image and alt text;
- default Twitter image and alt text;
- `manifest.ts` or equivalent typed manifest;
- environment-safe `metadataBase`;
- title template and default title;
- public canonical URLs;
- route-specific metadata for marketing, private pilot, legal/privacy, legal/terms, support/security pages when present;
- deliberate noindex/private metadata for demo, connected workspace, student-token, and internal routes;
- no private company/student/course data in share metadata.

Do not add duplicate manual meta/link tags when file conventions generate them.

### 5. Route-group application

Apply the brand without redesigning workflows:

- Marketing: full lockup, category line, restrained editorial identity.
- Demo: canonical workspace identity plus persistent Demo label.
- Connected creator: compact logo; task hierarchy remains dominant.
- Student: quiet signature and student-safe language.
- Internal operations: canonical logo plus explicit Internal context.
- Legal/support: restrained identity and credibility.
- Error/permission states: recovery instructions dominate decoration.

### 6. Naming and copy contract

Add a source-controlled brand/copy dictionary and use the exact product vocabulary in the ZIP.

Run and enforce scans so student-facing production code contains none of:

```text
risk
churn
revenue
rescue target
conversion
cancellation probability
evidence score
recovered value
```

Context-aware exclusions are allowed only for internal code identifiers not rendered to students; tests must prove rendered student pages are clean.

Do not call provider acceptance “delivered.” Do not add AI hype, fake metrics, fake testimonials, customer logos without permission, or security claims without evidence.

### 7. Protected Brand QA route

Create a development/internal-only Brand QA route using real production components.

It must display:

- all logo variants and micro sizes;
- light/dark/green backgrounds;
- clear-space tests;
- typography hierarchy;
- mono analytical typography;
- semantic colors and state combinations;
- focus states;
- route-group signatures;
- favicon/app/Whop/social/OG previews;
- student-safe copy examples;
- forbidden examples clearly marked;
- current automated brand-check status.

It must be protected and noindex. Avoid shipping it into public customer bundles when the architecture permits.

### 8. Automated brand gates

Add tests/scripts that genuinely fail for:

- missing required assets;
- incorrect raster dimensions;
- SVG without `viewBox`;
- excessive asset file size;
- missing OG/Twitter alt text;
- malformed manifest;
- duplicate canonical logo modules or known old mark geometry;
- forbidden RescueLoop name variants;
- student-facing forbidden terms;
- off-system production brand colors;
- meaningful logo without accessible name;
- decorative logo exposed to assistive technology;
- committed font binaries;
- private/internal/token routes accidentally indexable;
- metadata leaking private record names.

Add targeted Playwright assertions for marketing, demo, creator workspace, student, internal, metadata endpoints, and absence of application errors. Do not swallow assertion failures with `.catch(() => {})`.

### 9. Performance and accessibility

Meet WCAG 2.2 AA minimum.

Required:

- visible focus on cream, green, ink, and surface backgrounds;
- no color-only states;
- readable wordmark at 200% zoom;
- logo alignment at all tested viewport widths;
- no client JavaScript solely for logo rendering;
- no font binaries;
- SVG target under 8 KB;
- favicon files under 50 KB;
- 512 icons target under 250 KB where quality permits;
- OG/Twitter target under 500 KB and below framework hard limits.

### 10. Baselines and screenshots

Capture before/after screenshots for:

- marketing desktop/mobile;
- demo desktop/mobile;
- creator workspace desktop/mobile;
- student valid/expired/invalid states;
- internal operations;
- Brand QA route;
- favicon and OG preview where possible;
- Whop iframe or representative embedded width.

Use visible demo labels. Do not generate fake customer proof.

## Required verification

Inspect `package.json` and use actual repository scripts. At minimum run the real equivalents of:

```text
frozen dependency install
Prisma validate/generate where required
brand-specific unit checks
lint
typecheck
unit tests
provider contract tests
PostgreSQL integration tests
Playwright E2E
production build
security scan
```

All strict GitHub Actions jobs must pass on the pushed WP-01 commit.

Do not weaken tests, remove coverage, add false-green shell patterns, broadly skip tests, hide warnings, or bypass asset/metadata failures.

## Commit boundary

Use one scoped commit after all gates pass locally:

```text
feat(brand): establish RescueLoop Closing Signal identity
```

A small preliminary commit is allowed only for an independently necessary final WP-00 repair. Do not mix unrelated changes.

Push to:

```text
integration/rescueloop-v1
```

Wait for the full GitHub Actions run to finish. Do not begin WP-02.

## Required final response

Return the exact format from `14_HANDOFF_EVIDENCE_FORMAT.md`, including:

- full final SHA;
- GitHub Actions run ID;
- all job conclusions;
- files added/modified/deleted;
- canonical component and asset paths;
- duplicate sources removed;
- asset dimensions and sizes;
- metadata endpoint checks;
- brand-specific test counts;
- existing suite counts;
- build/security results;
- route groups and viewports checked;
- screenshot artifact paths;
- accessibility/performance results;
- known limitations and tracked debt;
- confirmation that WP-02 was not started.

Begin now. Do not respond with another plan.
