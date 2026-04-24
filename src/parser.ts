import { App, TFile } from "obsidian";

export interface NoteFrontmatter {
  title?: string;
  date?: string;
  tags?: string[];
  description?: string;
  slug?: string;
  published?: boolean;
  [key: string]: unknown;
}

export interface ParsedNote {
  frontmatter: NoteFrontmatter;
  body: string;
  slug: string;
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
  constructor(private app: App, private settings: { portfolioFolder: string }) {}

  async getPublishedNotes(): Promise<PublishedNote[]> {
    const folder = this.settings.portfolioFolder.replace(/\/+$/, "");

    const markdownFiles = this.app.vault.getMarkdownFiles().filter((f: TFile) =>
      f.path === `${folder}/${f.name}` || f.path.startsWith(`${folder}/`)
    );

    const published: PublishedNote[] = [];

    for (const file of markdownFiles) {
      const cache = this.app.metadataCache.getFileCache(file);
      const frontmatter = (cache?.frontmatter ?? {}) as NoteFrontmatter;

      if (frontmatter.published !== true) continue;

      const content = await this.app.vault.read(file);
      const title =
        typeof frontmatter.title === "string" && frontmatter.title.trim()
          ? frontmatter.title.trim()
          : file.basename;

      published.push({ path: file.path, title, frontmatter, content, imageRefs: extractImageRefs(content) });
    }

    return published;
  }
}

/** Standalone helper kept for backwards compatibility with builder pipeline. */
export async function getPublishedNotes(
  app: App,
  portfolioFolder: string
): Promise<PublishedNote[]> {
  return new Parser(app, { portfolioFolder }).getPublishedNotes();
}

// ── Low-level parsing helpers (used by builder) ───────────────────────────────

/**
 * Splits raw markdown into frontmatter block and body.
 * Returns empty frontmatter if no YAML block is present.
 */
export function parseNote(rawContent: string, fallbackSlug: string): ParsedNote {
  const frontmatter = extractFrontmatter(rawContent);
  const body = stripFrontmatter(rawContent);
  const slug = frontmatter.slug ?? slugify(frontmatter.title ?? fallbackSlug);

  return { frontmatter, body, slug };
}

function extractFrontmatter(content: string): NoteFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = parseYamlSimple(match[1]);
  if (Array.isArray(fm.tags)) {
    fm.tags = fm.tags.map((t) => String(t).toLowerCase());
  }
  return fm;
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

/**
 * Minimal YAML parser for flat key-value pairs and simple arrays.
 * Handles common frontmatter patterns without a full YAML lib.
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
        result[currentKey] = [];
        inArray = true;
      } else if (value.startsWith("[")) {
        result[currentKey] = value
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        inArray = false;
      } else {
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
