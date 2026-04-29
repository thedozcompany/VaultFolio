import { App, TFile } from "obsidian";

export interface NoteFrontmatter {
  title?: string;
  date?: string;
  tags?: string[];
  description?: string;
  slug?: string;
  cover?: string;
  published?: boolean;
  show_properties?: string[];
  [key: string]: unknown;
}

export interface ParsedNote {
  frontmatter: NoteFrontmatter;
  body: string;
  slug: string;
  displayTitle: string;
  publicProperties: Record<string, string | string[]>;
}

export interface ImageRef {
  type: "wikilink" | "markdown";
  path: string;
}

export interface PublishedNote {
  path: string;
  title: string;
  frontmatter: NoteFrontmatter;
  content: string;
  imageRefs: ImageRef[];
}

export class Parser {
  constructor(private app: App, private settings: { portfolioFolder: string; coverProperty: string }) {}

  async getPublishedNotes(): Promise<PublishedNote[]> {
    const folder = this.settings.portfolioFolder.trim().replace(/\/+$/, "");
    if (!folder) return [];

    const markdownFiles = this.app.vault.getMarkdownFiles().filter((f: TFile) =>
      f.path.startsWith(`${folder}/`)
    );

    const published: PublishedNote[] = [];

    for (const file of markdownFiles) {
      try {
        // Read content first so we can fall back to our lenient parser when
        // Obsidian's YAML engine fails (e.g. on unquoted ![[wikilink]] values,
        // which are valid Obsidian syntax but invalid standard YAML).
        const content = await this.app.vault.read(file);

        const cache = this.app.metadataCache.getFileCache(file);
        const cachedFm = cache?.frontmatter;

        // Spread into a plain mutable object so we can safely normalise fields
        // without mutating Obsidian's internal cache object.
        const frontmatter: NoteFrontmatter = {
          ...(cachedFm != null
            ? (cachedFm as NoteFrontmatter)
            : extractFrontmatterFromContent(content)),
        };

        // Normalise tags to lowercase so the entire pipeline is case-insensitive.
        // extractFrontmatterFromContent() already does this, but the metadataCache
        // path does not — apply it unconditionally so both paths are consistent.
        if (Array.isArray(frontmatter.tags)) {
          frontmatter.tags = frontmatter.tags.map((t) => String(t).toLowerCase());
        }

        // Normalise the cover field.  Obsidian 1.4+ stores wikilink embed values
        // (![[image.png]]) as a FrontmatterLink object {path, displayText} rather
        // than a plain string.  Read exclusively from the configured property name
        // and always write the result (or undefined) to frontmatter.cover so the
        // original spread value never leaks through when coverProp !== "cover".
        const coverProp = this.settings.coverProperty || "cover";
        const rawCover = (frontmatter as Record<string, unknown>)[coverProp];
        if (rawCover != null && typeof rawCover !== "string") {
          const obj = rawCover as Record<string, unknown>;
          frontmatter.cover = String(obj.path ?? obj.link ?? obj.displayText ?? rawCover);
        } else if (typeof rawCover === "string" && rawCover !== "") {
          frontmatter.cover = rawCover;
        } else {
          frontmatter.cover = undefined;
        }

        if (frontmatter.published !== true) continue;

        const title =
          typeof frontmatter.title === "string" && frontmatter.title.trim()
            ? frontmatter.title.trim()
            : file.basename;

        published.push({
          path: file.path,
          title,
          frontmatter,
          content,
          imageRefs: extractImageRefs(content),
        });
      } catch (err) {
        console.warn(`VaultFolio: skipping "${file.path}" — ${err}`);
      }
    }

    return published;
  }
}

const RESERVED_PROPERTY_KEYS = new Set([
  "title", "published", "tags", "cover", "date", "show_properties",
]);

function buildPublicProperties(fm: NoteFrontmatter): Record<string, string | string[]> {
  const raw = fm.show_properties;
  if (!Array.isArray(raw) || raw.length === 0) return {};
  const result: Record<string, string | string[]> = {};
  for (const key of raw) {
    if (typeof key !== "string" || RESERVED_PROPERTY_KEYS.has(key)) continue;
    const value = fm[key];
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      result[key] = value.map((v) => String(v));
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = String(value);
    }
  }
  return result;
}

/** Standalone helper kept for backwards compatibility with builder pipeline. */
export async function getPublishedNotes(
  app: App,
  portfolioFolder: string,
  coverProperty = "cover"
): Promise<PublishedNote[]> {
  return new Parser(app, { portfolioFolder, coverProperty }).getPublishedNotes();
}

// ── Low-level parsing helpers (used by builder) ───────────────────────────────

/**
 * Splits raw markdown into frontmatter block and body.
 * Pass `cachedFrontmatter` (from Obsidian's metadataCache) to skip re-parsing
 * the YAML — this handles Obsidian-specific syntax that our parser may not
 * support (e.g. wikilinks as values). Falls back to our lenient parser when
 * no cached frontmatter is provided.
 */
export function parseNote(
  rawContent: string,
  fallbackSlug: string,
  cachedFrontmatter?: NoteFrontmatter
): ParsedNote {
  const frontmatter = cachedFrontmatter ?? extractFrontmatterFromContent(rawContent);
  const body = stripFrontmatter(rawContent);
  const slug = frontmatter.slug ?? slugify(frontmatter.title ?? fallbackSlug);
  const basename = fallbackSlug.split("/").pop()?.replace(/\.md$/i, "") ?? fallbackSlug;
  const displayTitle =
    typeof frontmatter.title === "string" && frontmatter.title.trim()
      ? frontmatter.title.trim()
      : basename;
  const publicProperties = buildPublicProperties(frontmatter);
  return { frontmatter, body, slug, displayTitle, publicProperties };
}

/** Exposed so getPublishedNotes() can use it as a fallback. */
function extractFrontmatterFromContent(content: string): NoteFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = parseYamlSimple(match[1]);
  if (Array.isArray(fm.tags)) {
    fm.tags = fm.tags.map((t) => String(t).toLowerCase());
  }
  return fm;
}

function stripFrontmatter(content: string): string {
  return content
    .replace(/^﻿/, "")                              // strip UTF-8 BOM if present
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")     // strip frontmatter block
    .trim();
}

/**
 * Lenient YAML parser for flat key-value pairs and simple arrays.
 * Deliberately permissive so that Obsidian-specific syntax in frontmatter
 * values (e.g. ![[wikilinks]], paths with spaces, special chars) never
 * silently drops fields or corrupts subsequent lines.
 */
function parseYamlSimple(yaml: string): NoteFrontmatter {
  const result: NoteFrontmatter = {};
  const lines = yaml.split(/\r?\n/);
  let currentKey: string | null = null;
  let inArray = false;

  for (const line of lines) {
    const arrayItem = line.match(/^\s+-\s+(.+)/);
    if (arrayItem && currentKey && inArray) {
      const arr = result[currentKey];
      if (Array.isArray(arr)) arr.push(arrayItem[1].trim());
      continue;
    }

    const kvMatch = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === "") {
        // Start of a block-sequence list (next lines will be "  - item")
        result[currentKey] = [];
        inArray = true;
      } else if (value.startsWith("[") && !value.startsWith("[[")) {
        // Inline YAML array: [a, b, c]
        // Explicitly exclude [[ to avoid treating [[wikilinks]] as arrays.
        result[currentKey] = value
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        inArray = false;
      } else {
        // Plain string — covers all other cases:
        //   ![[wikilink syntax]]  paths with spaces  special chars ( ) [ ] !
        // Strip surrounding quotes when present ("value" or 'value').
        result[currentKey] = value.replace(/^["']|["']$/g, "");
        inArray = false;
      }
    }
  }

  return result;
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg)$/i;

export function extractImageRefs(content: string): ImageRef[] {
  const refs: ImageRef[] = [];
  const seen = new Set<string>();

  // Obsidian wikilink images: ![[image.png]] or ![[path/image.png|alias]]
  const wikiRe = /!\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = wikiRe.exec(content)) !== null) {
    const path = m[1].split("|")[0].trim();
    if (IMAGE_EXT_RE.test(path) && !seen.has(path)) {
      seen.add(path);
      refs.push({ type: "wikilink", path });
    }
  }

  // Standard markdown images: ![alt](./path/image.png) or ![alt](image.png "title")
  const mdRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  while ((m = mdRe.exec(content)) !== null) {
    // Strip optional title ('title' or "title") from end before extracting path
    const path = m[1].trim().replace(/\s+["'][^"']*["']\s*$/, "");
    if (!path.startsWith("http") && IMAGE_EXT_RE.test(path) && !seen.has(path)) {
      seen.add(path);
      refs.push({ type: "markdown", path });
    }
  }

  return refs;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function hasTag(note: ParsedNote, tag: string): boolean {
  return note.frontmatter.tags?.includes(tag) ?? false;
}
