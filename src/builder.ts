import { ParsedNote } from "./parser";

export interface SiteFile {
  path: string;
  content: string;
}

export interface BuildResult {
  files: SiteFile[];
  pageCount: number;
  imageMap: Map<string, string>; // deployPath ("images/x.png") → vault path
}

// ── Card palette (Apple product colors) ──────────────────────────────────────

const CARD_COLORS = ["#0071E3", "#1D1D1F", "#34C759", "#FF9F0A", "#5E5CE6", "#FF375F"];

// ── Base CSS ──────────────────────────────────────────────────────────────────

const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #FFFFFF;
  color: #1D1D1F;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  padding-top: 52px;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }

/* ── Navigation ── */
.vf-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  height: 52px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 40px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 0.5px solid #E0E0E0;
}
.vf-nav-logo { font-size: 17px; font-weight: 600; letter-spacing: -0.3px; color: #1D1D1F; }
.vf-nav-links { display: flex; gap: 28px; }
.vf-nav-link { font-size: 14px; color: #1D1D1F; opacity: 0.8; transition: opacity 0.2s; }
.vf-nav-link:hover { opacity: 1; }

/* ── Hero ── */
.vf-hero { padding: 120px 40px 100px; text-align: center; }
.vf-hero-inner { max-width: 800px; margin: 0 auto; }
.vf-hero-label {
  display: block; margin-bottom: 16px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: #0071E3;
}
.vf-hero-title {
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 700;
  letter-spacing: -3px;
  line-height: 1;
  color: #1D1D1F;
  margin-bottom: 20px;
}
.vf-hero-subtitle {
  font-size: 21px;
  color: #6E6E73;
  line-height: 1.48;
  max-width: 600px;
  margin: 0 auto 40px;
  font-weight: 400;
}
.vf-hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.vf-btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 28px;
  background: #0071E3; color: #fff;
  border: none; border-radius: 980px;
  font-size: 15px; font-weight: 400; font-family: inherit;
  transition: background 0.2s ease; cursor: pointer;
}
.vf-btn-primary:hover { background: #0077ED; color: #fff; }
.vf-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 28px;
  background: transparent; color: #0071E3;
  border: 1px solid #0071E3; border-radius: 980px;
  font-size: 15px; font-weight: 400; font-family: inherit;
  transition: all 0.2s ease; cursor: pointer;
}
.vf-btn-secondary:hover { background: #0071E3; color: #fff; }

/* ── Section ── */
.vf-section { padding: 100px 40px; max-width: 1200px; margin: 0 auto; }
.vf-section-label {
  display: block; margin-bottom: 32px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: #6E6E73;
}

/* ── Card grid ── */
.vf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.vf-card { display: block; text-decoration: none; color: #1D1D1F; }
.vf-card-image {
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  overflow: hidden;
  transition: transform 0.4s ease;
  display: flex; align-items: center; justify-content: center;
}
.vf-card:hover .vf-card-image { transform: scale(1.02); }
.vf-card-info { padding: 16px 4px 0; }
.vf-card-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.vf-card-name { font-size: 19px; font-weight: 600; letter-spacing: -0.3px; color: #1D1D1F; }
.vf-card-year { font-size: 14px; color: #6E6E73; flex-shrink: 0; padding-top: 3px; }
.vf-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.vf-card-tag { font-size: 12px; color: #6E6E73; padding: 4px 10px; background: #F5F5F7; border-radius: 980px; }

/* ── About strip ── */
.vf-about { background: #1D1D1F; padding: 100px 40px; }
.vf-about-inner { max-width: 1200px; margin: 0 auto; }
.vf-about-label {
  display: block; margin-bottom: 32px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: #6E6E73;
}
.vf-about-text {
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 700;
  color: #F5F5F7;
  line-height: 1.2;
  letter-spacing: -1px;
  max-width: 820px;
  margin-bottom: 48px;
}
.vf-skills { display: flex; flex-wrap: wrap; gap: 10px; }
.vf-skill {
  font-size: 14px; color: #8E8E93;
  padding: 8px 18px;
  border: 0.5px solid #3A3A3C;
  border-radius: 980px;
}

/* ── Footer ── */
.vf-footer {
  background: #F5F5F7;
  border-top: 0.5px solid #D2D2D7;
  padding: 40px;
  text-align: center;
}
.vf-footer-text { font-size: 12px; color: #6E6E73; line-height: 1.6; }
.vf-footer-text a { color: #0071E3; }
.vf-footer-name { font-weight: 600; color: #1D1D1F; }

/* ── Back button ── */
.vf-back-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 40px 0; }
.vf-back-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 15px; color: #0071E3;
  padding: 8px 16px 8px 10px;
  border-radius: 980px;
  background: rgba(0,113,227,0.08);
  transition: background 0.2s ease;
  font-weight: 400;
}
.vf-back-btn:hover { background: rgba(0,113,227,0.15); color: #0071E3; }

/* ── Project hero ── */
.vf-project-hero-wrap { max-width: 1200px; margin: 28px auto 0; padding: 0 40px; }
.vf-project-hero {
  border-radius: 18px; overflow: hidden;
  aspect-ratio: 21 / 9;
  display: flex; align-items: center; justify-content: center;
}
.vf-project-hero-title {
  font-size: clamp(32px, 5vw, 64px);
  font-weight: 700; color: #fff;
  letter-spacing: -2px; line-height: 1.1;
  text-align: center; padding: 2rem;
}

/* ── Project meta ── */
.vf-project-meta { max-width: 680px; margin: 0 auto; padding: 48px 40px 0; }
.vf-project-title {
  font-size: 48px; font-weight: 700;
  letter-spacing: -1.5px; line-height: 1.1;
  color: #1D1D1F; margin-bottom: 12px;
}
.vf-project-date { font-size: 14px; color: #6E6E73; margin-top: 12px; }
.vf-project-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.vf-project-tag {
  font-size: 13px; color: #fff;
  background: #0071E3;
  padding: 5px 14px; border-radius: 980px;
}

/* ── Prose ── */
.vf-prose { max-width: 680px; margin: 0 auto; padding: 60px 40px 100px; }
.vf-prose h1 { font-size: 34px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; margin: 2.5rem 0 1rem; }
.vf-prose h2 { font-size: 28px; font-weight: 700; letter-spacing: -0.3px; line-height: 1.2; margin: 2.5rem 0 1rem; }
.vf-prose h3 { font-size: 22px; font-weight: 600; line-height: 1.3; margin: 2rem 0 0.8rem; }
.vf-prose h4, .vf-prose h5, .vf-prose h6 { font-size: 17px; font-weight: 600; margin: 1.5rem 0 0.6rem; }
.vf-prose p { font-size: 17px; line-height: 1.8; color: #3A3A3C; margin: 1.2rem 0; }
.vf-prose a { color: #0071E3; }
.vf-prose a:hover { text-decoration: underline; }
.vf-prose strong { font-weight: 600; color: #1D1D1F; }
.vf-prose em { font-style: italic; }
.vf-prose ul { list-style: disc; padding-left: 1.5rem; margin: 1rem 0; }
.vf-prose ol { list-style: decimal; padding-left: 1.5rem; margin: 1rem 0; }
.vf-prose li { font-size: 17px; line-height: 1.8; color: #3A3A3C; margin: 0.4rem 0; }
.vf-prose code { background: #F5F5F7; color: #1D1D1F; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', monospace; }
.vf-prose pre { background: #1D1D1F; color: #F5F5F7; padding: 24px; border-radius: 12px; overflow-x: auto; margin: 2rem 0; }
.vf-prose pre code { background: none; padding: 0; color: inherit; }
.vf-prose blockquote { border-left: 2px solid #0071E3; padding: 4px 0 4px 20px; color: #6E6E73; font-style: italic; margin: 1.5rem 0; }
.vf-prose hr { border: none; border-top: 0.5px solid #D2D2D7; margin: 3rem 0; }
.vf-prose img { border-radius: 12px; margin: 2rem 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .vf-nav { padding: 0 20px; }
  .vf-nav-links { display: none; }
  .vf-hero { padding: 80px 20px 60px; }
  .vf-hero-title { letter-spacing: -1.5px; }
  .vf-hero-subtitle { font-size: 17px; }
  .vf-section { padding: 60px 20px; }
  .vf-grid { grid-template-columns: 1fr; }
  .vf-about { padding: 60px 20px; }
  .vf-footer { padding: 32px 20px; }
  .vf-back-wrap { padding: 20px 20px 0; }
  .vf-project-hero-wrap { padding: 0 20px; }
  .vf-project-meta { padding: 32px 20px 0; }
  .vf-project-title { font-size: 32px; letter-spacing: -1px; }
  .vf-prose { padding: 40px 20px 60px; }
}
`.trim();

// ── Shared fragments ──────────────────────────────────────────────────────────

function htmlHead(pageTitle: string): string {
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <style>${BASE_CSS}</style>`;
}

function renderNav(siteName: string, root = ""): string {
  return `<nav class="vf-nav">
  <a href="${root}index.html" class="vf-nav-logo">${escapeHtml(siteName)}</a>
  <div class="vf-nav-links">
    <a href="${root}index.html#work" class="vf-nav-link">Work</a>
    <a href="${root}index.html#about" class="vf-nav-link">About</a>
    <a href="mailto:" class="vf-nav-link">Contact</a>
  </div>
</nav>`;
}

function renderFooter(siteName: string): string {
  return `<footer class="vf-footer">
  <p class="vf-footer-text">
    <span class="vf-footer-name">${escapeHtml(siteName)}</span>
    &nbsp;·&nbsp; Built with <a href="#">VaultFolio</a>
  </p>
</footer>`;
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function buildSite(notes: ParsedNote[], siteTitle: string): BuildResult {
  const pages = notes.map((note) => buildPage(note, siteTitle));
  const index = buildIndex(notes, siteTitle);
  return { files: [index, ...pages], pageCount: pages.length, imageMap: new Map() };
}

// ── Index page ────────────────────────────────────────────────────────────────

function buildIndex(notes: ParsedNote[], siteTitle: string): SiteFile {
  // Project cards
  const cards = notes
    .map((n, i) => {
      const bg    = CARD_COLORS[i % CARD_COLORS.length];
      const title = (n.frontmatter.title as string | undefined) ?? n.slug;
      const tags  = Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [];
      const year  = extractYear(n.frontmatter.date as string | undefined);
      const tagChips = tags
        .map((t) => `<span class="vf-card-tag">${escapeHtml(t)}</span>`)
        .join("");

      return `<a href="pages/${n.slug}.html" class="vf-card">
  <div class="vf-card-image" style="background:${bg}"></div>
  <div class="vf-card-info">
    <div class="vf-card-row">
      <span class="vf-card-name">${escapeHtml(title)}</span>
      <span class="vf-card-year">${escapeHtml(year)}</span>
    </div>
    ${tags.length > 0 ? `<div class="vf-card-tags">${tagChips}</div>` : ""}
  </div>
</a>`;
    })
    .join("\n");

  // About strip skills (collected from all tags)
  const allTags = collectTags(notes);
  const defaultSkills = ["Design", "Development", "Strategy", "UX", "React", "TypeScript"];
  const skills = allTags.length > 0 ? allTags : defaultSkills;
  const skillChips = skills
    .map((s) => `<span class="vf-skill">${escapeHtml(s)}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${htmlHead(escapeHtml(siteTitle))}
</head>
<body>

${renderNav(siteTitle)}

<!-- Hero -->
<section class="vf-hero">
  <div class="vf-hero-inner">
    <span class="vf-hero-label">Available for work</span>
    <h1 class="vf-hero-title">${escapeHtml(siteTitle)}</h1>
    <p class="vf-hero-subtitle">Crafting digital experiences with precision and care.</p>
    <div class="vf-hero-actions">
      <a href="#work" class="vf-btn-primary">View Work</a>
      <a href="mailto:" class="vf-btn-secondary">Get in Touch</a>
    </div>
  </div>
</section>

<!-- Projects -->
<section class="vf-section" id="work">
  <span class="vf-section-label">Selected Work</span>
  ${notes.length > 0
    ? `<div class="vf-grid">\n${cards}\n</div>`
    : `<p style="font-size:17px;color:#6E6E73">No published projects yet.</p>`}
</section>

<!-- About -->
<section class="vf-about" id="about">
  <div class="vf-about-inner">
    <span class="vf-about-label">About</span>
    <p class="vf-about-text">Building thoughtful digital products with attention to detail and a focus on what matters.</p>
    <div class="vf-skills">${skillChips}</div>
  </div>
</section>

${renderFooter(siteTitle)}

</body>
</html>`;

  return { path: "index.html", content: html };
}

// ── Project page ──────────────────────────────────────────────────────────────

function buildPage(note: ParsedNote, siteTitle: string): SiteFile {
  const title       = (note.frontmatter.title as string | undefined) ?? note.slug;
  const description = (note.frontmatter.description as string | undefined) ?? "";
  const date        = note.frontmatter.date as string | undefined;
  const tags        = Array.isArray(note.frontmatter.tags) ? (note.frontmatter.tags as string[]) : [];
  const idx         = Math.abs(hashString(note.slug)) % CARD_COLORS.length;
  const heroBg      = CARD_COLORS[idx];

  const tagChips = tags
    .map((t) => `<span class="vf-project-tag">${escapeHtml(String(t))}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${htmlHead(`${escapeHtml(title)} — ${escapeHtml(siteTitle)}`)}
  <meta name="description" content="${escapeHtml(description)}" />
</head>
<body>

${renderNav(siteTitle, "../")}

<div class="vf-back-wrap">
  <a href="../index.html" class="vf-back-btn">&#8249; Back</a>
</div>

<div class="vf-project-hero-wrap">
  <div class="vf-project-hero" style="background:${heroBg}">
    <h1 class="vf-project-hero-title">${escapeHtml(title)}</h1>
  </div>
</div>

<div class="vf-project-meta">
  <h2 class="vf-project-title">${escapeHtml(title)}</h2>
  ${date ? `<p class="vf-project-date">${escapeHtml(String(date))}</p>` : ""}
  ${tags.length > 0 ? `<div class="vf-project-tags">${tagChips}</div>` : ""}
</div>

<div class="vf-prose">
  ${markdownToHtml(note.body)}
</div>

${renderFooter(siteTitle)}

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
    // Wikilink images — must precede link regex
    .replace(/!\[\[([^\]]+)\]\]/g, (_, ref) => {
      const name = ref.split("|")[0].trim().split("/").pop() ?? ref;
      return `<img src="../images/${encodeURIComponent(name)}" alt="${escapeHtml(name)}" />`;
    })
    // Markdown images — must precede link regex
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, rawSrc) => {
      const src = rawSrc.trim().replace(/\s+["'][^"']*["']\s*$/, "");
      if (/^https?:\/\//.test(src)) {
        return `<img src="${src}" alt="${escapeHtml(alt)}" />`;
      }
      const name = src.split("/").pop() ?? src;
      return `<img src="../images/${encodeURIComponent(name)}" alt="${escapeHtml(alt)}" />`;
    })
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gm, "<hr>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[h1-6polbui])(.+)$/gm, "<p>$1</p>")
    .trim();
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function collectTags(notes: ParsedNote[]): string[] {
  const seen = new Set<string>();
  for (const n of notes) {
    const t = n.frontmatter.tags;
    if (Array.isArray(t)) t.forEach((tag) => seen.add(String(tag)));
  }
  return [...seen];
}

function extractYear(date: string | undefined): string {
  if (!date) return "";
  const m = date.match(/\d{4}/);
  return m ? m[0] : "";
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
