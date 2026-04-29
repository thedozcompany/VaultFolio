# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # esbuild watch mode (development)
npm run build        # tsc type-check + esbuild production bundle
npx tsc --noEmit     # type-check only, no output
```

No test framework exists. Type-check is the only automated verification available.

The build output is `main.js` (CJS, ES2018 target) alongside `manifest.json` and `styles.css` — these three files are what Obsidian loads.

## Architecture

### Pipeline

```
Parser.getPublishedNotes()  →  parseNote()  →  buildSite()  →  deploySite()
     (parser.ts)               (parser.ts)     (builder.ts)    (deployer.ts)
```

- **`PublishedNote`** — raw vault data: `path`, `title`, `frontmatter`, `content`, `imageRefs`. Output of parser.
- **`ParsedNote`** — builder input: adds `slug`, `displayTitle`, `publicProperties`. Output of `parseNote()`.
- **`BuildResult`** — `files: SiteFile[]` + `imageMap: Map<string, string>` (deployPath → vaultPath).

### HTTP Layer

All network calls use Obsidian's `requestUrl({ throw: false })` from `"obsidian"` — never `fetch`. This bypasses CORS restrictions inside the Obsidian desktop app.

### Theme System (`src/builder.ts`)

Four themes: `default` (dark SaaS), `apple` (Apple minimalist), `simple`, `glass` (glassmorphism).

Each theme has:
1. A CSS constant (`BASE_CSS`, `APPLE_CSS`, `SIMPLE_CSS`, `GLASS_CSS`) defined near the top of the file
2. A `build[Theme]Index(notes, settings)` function → homepage HTML
3. A `build[Theme]Page(note, settings)` function → individual project page HTML

`CALLOUT_CSS` is a shared constant interpolated into `BASE_CSS` via `${CALLOUT_CSS}`.

`buildSite()` dispatches to the correct builder based on `settings.theme`.

### Tag Filter Script

`renderTagFilterScript()` hardcodes `.vf-filter-btn` class. Non-default themes substitute:
- Glass: `.replace(/vf-filter-btn\b/g, "vf-filter-btn-gl")`
- Simple: `.replace(/vf-filter-btn\b/g, "sp-filter-btn")`

### Cover Image Normalization

The parser always normalizes the configured cover property into `frontmatter.cover` so the builder always reads `frontmatter.cover` uniformly:

```typescript
const coverProp = this.settings.coverProperty || "cover";
const rawCover = (frontmatter as Record<string, unknown>)[coverProp];
if (rawCover != null && typeof rawCover !== "string") {
  // FrontmatterLink object (Obsidian 1.4+)
  frontmatter.cover = String(obj.path ?? obj.link ?? obj.displayText ?? rawCover);
} else if (typeof rawCover === "string" && rawCover !== "") {
  frontmatter.cover = rawCover;
} else {
  frontmatter.cover = undefined; // must clear — spread may have set it from "cover" field
}
```

### GitHub Auth

`src/github-auth.ts` implements GitHub Device Flow OAuth. The settings tab (`src/ui/settingsTab.ts`) orchestrates the three-state UI: not connected → connecting (polling) → connected. Token stored in `settings.githubToken`.

### Settings

All user-configurable values live in `src/settings.ts`. `DEFAULT_SETTINGS` is the source of truth for defaults. The settings interface includes `coverProperty: string` (default: `"cover"`).
