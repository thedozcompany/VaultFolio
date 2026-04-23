import { ParsedNote } from "./parser";

export interface SiteFile {
  path: string;
  content: string;
}

export interface BuildResult {
  files: SiteFile[];
  pageCount: number;
}

export function buildSite(notes: ParsedNote[], siteTitle: string): BuildResult {
  const pages = notes.map((note) => buildPage(note, siteTitle));
  const index = buildIndex(notes, siteTitle);

  return {
    files: [index, ...pages],
    pageCount: pages.length,
  };
}

// ── Shared head markup ────────────────────────────────────────────────────────

function sharedHead(title: string): string {
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <style>body { font-family: 'Inter', sans-serif; }</style>`;
}

// ── Index page ────────────────────────────────────────────────────────────────

function buildIndex(notes: ParsedNote[], siteTitle: string): SiteFile {
  const cards = notes
    .map((n) => {
      const title = (n.frontmatter.title as string | undefined) ?? n.slug;
      const rawDesc = n.body.replace(/<[^>]*>/g, "").trim();
      const desc = rawDesc.slice(0, 150) + (rawDesc.length > 150 ? "…" : "");
      const tags = Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [];
      const tagChips = tags
        .map(
          (t) =>
            `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">${escapeHtml(
              String(t)
            )}</span>`
        )
        .join(" ");

      return `    <a href="pages/${n.slug}.html" class="block p-6 rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all no-underline group">
      <h2 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">${escapeHtml(title)}</h2>
      ${desc ? `<p class="text-gray-500 text-sm mb-4 leading-relaxed">${escapeHtml(desc)}</p>` : ""}
      ${tags.length > 0 ? `<div class="flex flex-wrap gap-2">${tagChips}</div>` : ""}
    </a>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead(escapeHtml(siteTitle))}
</head>
<body class="bg-white text-gray-900 min-h-screen">
  <div class="max-w-3xl mx-auto px-6 py-16">
    <header class="mb-12">
      <h1 class="text-4xl font-bold text-gray-900">${escapeHtml(siteTitle)}</h1>
      <p class="text-gray-400 mt-2 text-sm">Published projects &amp; writing</p>
    </header>
    <main>
      <div class="space-y-4">
${cards}
      </div>
    </main>
  </div>
</body>
</html>`;

  return { path: "index.html", content: html };
}

// ── Project page ──────────────────────────────────────────────────────────────

function buildPage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = (note.frontmatter.title as string | undefined) ?? note.slug;
  const description = (note.frontmatter.description as string | undefined) ?? "";
  const date = note.frontmatter.date as string | undefined;
  const tags = Array.isArray(note.frontmatter.tags) ? (note.frontmatter.tags as string[]) : [];

  const tagChips = tags
    .map(
      (t) =>
        `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">${escapeHtml(
          String(t)
        )}</span>`
    )
    .join(" ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead(`${escapeHtml(title)} — ${escapeHtml(siteTitle)}`)}
  <meta name="description" content="${escapeHtml(description)}" />
  <style>
    .prose h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #111827; }
    .prose h2 { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #111827; }
    .prose h3 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #111827; }
    .prose h4,.prose h5,.prose h6 { font-size: 1.05rem; font-weight: 600; margin: 1rem 0 0.5rem; color: #111827; }
    .prose p { margin: 0.875rem 0; line-height: 1.8; color: #374151; }
    .prose a { color: #7c3aed; text-decoration: underline; }
    .prose a:hover { color: #5b21b6; }
    .prose strong { font-weight: 600; }
    .prose em { font-style: italic; }
    .prose ul { list-style: disc; padding-left: 1.5rem; margin: 0.875rem 0; }
    .prose ol { list-style: decimal; padding-left: 1.5rem; margin: 0.875rem 0; }
    .prose li { margin: 0.3rem 0; line-height: 1.8; color: #374151; }
    .prose code { background: #f3f4f6; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; color: #111827; }
    .prose pre { background: #1f2937; color: #f9fafb; padding: 1.25rem; border-radius: 0.5rem; overflow-x: auto; margin: 1.25rem 0; }
    .prose pre code { background: none; padding: 0; color: inherit; }
    .prose blockquote { border-left: 3px solid #7c3aed; padding-left: 1rem; color: #6b7280; font-style: italic; margin: 1rem 0; }
    .prose hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
    .prose img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
  </style>
</head>
<body class="bg-white text-gray-900 min-h-screen">
  <div class="max-w-3xl mx-auto px-6 py-16">
    <nav class="mb-10">
      <a href="../index.html" class="text-violet-600 hover:text-violet-800 text-sm font-medium transition-colors">
        ← Back to portfolio
      </a>
    </nav>
    <article>
      <header class="mb-10 pb-8 border-b border-gray-100">
        <h1 class="text-4xl font-bold text-gray-900 mb-3">${escapeHtml(title)}</h1>
        ${date ? `<p class="text-gray-400 text-sm mb-4">${escapeHtml(String(date))}</p>` : ""}
        ${tags.length > 0 ? `<div class="flex flex-wrap gap-2">${tagChips}</div>` : ""}
      </header>
      <div class="prose">${markdownToHtml(note.body)}</div>
    </article>
  </div>
</body>
</html>`;

  return { path: `pages/${note.slug}.html`, content: html };
}

// ── Markdown → HTML ───────────────────────────────────────────────────────────

function markdownToHtml(md: string): string {
  return md
    .replace(/^#{6}\s+(.+)$/gm, "<h6>$1</h6>")
    .replace(/^#{5}\s+(.+)$/gm, "<h5>$1</h5>")
    .replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#{1}\s+(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gm, "<hr>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[h1-6polbui])(.+)$/gm, "<p>$1</p>")
    .trim();
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
