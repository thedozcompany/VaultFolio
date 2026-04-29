import { ParsedNote } from "./parser";
import { VaultFolioSettings } from "./settings";

export interface SiteFile {
  path: string;
  content: string;
}

export interface BuildResult {
  files: SiteFile[];
  pageCount: number;
  imageMap: Map<string, string>; // deployPath ("images/x.png") → vault path
}

// ── Card palette ──────────────────────────────────────────────────────────────

const CARD_COLORS = ["#1A1A2E", "#16213E", "#1B1B2F", "#0F3460", "#1C1C1E", "#2D1B69"];
const APPLE_PLACEHOLDER_COLORS = ["#F3EBFF", "#EBF3FF", "#EBFFF3", "#FFF3EB", "#FFEBF3", "#EBEBFF"];
const SIMPLE_PLACEHOLDER_COLORS = ["#f8f8f8", "#f0f4f8", "#f8f4f0", "#f0f8f4"];

// ── Per-project gradient generation ──────────────────────────────────────────

function generateGradient(title: string, dark = false): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  const hue1 = Math.abs(hash) % 360;
  const sat1  = 60 + (Math.abs(hash >> 8)  % 20);
  const lit1  = dark ? 35 + (Math.abs(hash >> 16) % 20) : 65 + (Math.abs(hash >> 16) % 15);

  const hue2 = (hue1 + 40 + (Math.abs(hash >> 4) % 60)) % 360;
  const sat2  = 55 + (Math.abs(hash >> 12) % 25);
  const lit2  = dark ? 30 + (Math.abs(hash >> 20) % 25) : 60 + (Math.abs(hash >> 20) % 20);

  const angle = Math.abs(hash >> 2) % 360;

  return `linear-gradient(${angle}deg,hsl(${hue1},${sat1}%,${lit1}%),hsl(${hue2},${sat2}%,${lit2}%))`;
}

// ── Callout support (shared across all themes) ────────────────────────────────

const CALLOUT_ICONS: Record<string, string> = {
  note: "📝", info: "ℹ️", tip: "💡", warning: "⚠️", danger: "🔴",
  question: "❓", success: "✅", failure: "❌", bug: "🐛",
  example: "📋", quote: "💬", abstract: "📄",
};

const CALLOUT_CSS = `
.callout { border-radius: 6px; padding: 12px 16px; margin: 16px 0; border-left: 4px solid; }
.callout-title { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 8px; font-size: 14px; }
.callout-icon { font-size: 16px; line-height: 1; }
.callout-content { font-size: 14px; line-height: 1.6; }
.callout-note     { background: #f0f4ff; border-color: #3b82f6; color: #1e3a8a; }
.callout-info     { background: #f0f9ff; border-color: #0ea5e9; color: #0c4a6e; }
.callout-tip      { background: #f0fdf4; border-color: #22c55e; color: #14532d; }
.callout-warning  { background: #fffbeb; border-color: #f59e0b; color: #78350f; }
.callout-danger   { background: #fff1f2; border-color: #ef4444; color: #7f1d1d; }
.callout-question { background: #faf5ff; border-color: #a855f7; color: #4a1d96; }
.callout-success  { background: #f0fdf4; border-color: #22c55e; color: #14532d; }
.callout-failure  { background: #fff1f2; border-color: #ef4444; color: #7f1d1d; }
.callout-bug      { background: #fff1f2; border-color: #ef4444; color: #7f1d1d; }
.callout-example  { background: #f8fafc; border-color: #64748b; color: #1e293b; }
.callout-quote    { background: #f8fafc; border-color: #64748b; color: #1e293b; }
.callout-abstract { background: #f0f9ff; border-color: #0ea5e9; color: #0c4a6e; }
`.trim();

// ── Base CSS ──────────────────────────────────────────────────────────────────

const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: #000000;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }

/* ── Navigation ── */
.vf-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 48px;
  background: #000000;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.vf-nav-logo {
  font-size: 15px; font-weight: 700; letter-spacing: -0.3px;
  color: #FFFFFF; white-space: nowrap; flex-shrink: 0;
}
.vf-nav-center {
  display: flex; align-items: center;
}
.vf-nav-center-link {
  color: rgba(255,255,255,0.6); font-size: 14px;
  padding: 4px 14px; transition: color 0.15s ease;
}
.vf-nav-center-link:hover { color: #FFFFFF; }
.vf-nav-sep {
  color: rgba(255,255,255,0.2); font-size: 14px;
  user-select: none; pointer-events: none;
}
.vf-nav-cta {
  background: #6B5CE7; color: #FFFFFF;
  border-radius: 100px; padding: 8px 20px;
  font-size: 13px; font-weight: 500; border: none;
  cursor: pointer; display: inline-block; flex-shrink: 0;
  transition: background 0.15s ease;
}
.vf-nav-cta:hover { background: #5B4ED4; color: #FFFFFF; }

/* ── Hero ── */
.vf-hero {
  padding: 160px 48px 80px;
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: 60% 40%; gap: 40px;
  align-items: center;
}
.vf-hero-title {
  font-size: clamp(52px, 7vw, 96px);
  font-weight: 800; line-height: 1.0;
  color: #FFFFFF; letter-spacing: -3px;
}
.vf-hero-subtitle {
  font-size: 16px; color: rgba(255,255,255,0.5);
  max-width: 380px; line-height: 1.7; margin-top: 20px;
}
.vf-hero-right {
  display: flex; flex-direction: column;
  align-items: flex-end; justify-content: center; gap: 24px;
}
.vf-hero-slash {
  font-size: 80px; color: rgba(255,255,255,0.1);
  font-weight: 300; line-height: 1;
}
.vf-hero-work-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; border: 1px solid rgba(255,255,255,0.2);
  border-radius: 100px; padding: 10px 24px;
  color: #FFFFFF; font-size: 14px; cursor: pointer;
  transition: border-color 0.2s ease; font-family: inherit;
}
.vf-hero-work-btn:hover { border-color: rgba(255,255,255,0.5); color: #FFFFFF; }

/* ── Filter bar ── */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
.vf-filter-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px; padding: 6px 16px;
  font-size: 12px; color: rgba(255,255,255,0.5);
  cursor: pointer; font-family: inherit; transition: all 0.15s ease;
}
.vf-filter-btn.active, .vf-filter-btn:hover {
  background: #6B5CE7; border-color: #6B5CE7; color: #FFFFFF;
}

/* ── Projects section ── */
.vf-projects-section {
  padding: 80px 48px; max-width: 1200px; margin: 0 auto;
}
.vf-section-header {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 16px 0; margin-bottom: 40px;
}
.vf-section-label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.15em;
  text-transform: uppercase; color: rgba(255,255,255,0.3);
}
.view-toggle-container { display: flex; gap: 6px; align-items: center; }
.view-toggle-btn {
  width: 32px; height: 32px; display: flex; align-items: center;
  justify-content: center; border-radius: 4px; cursor: pointer;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); transition: all 0.15s ease;
}
.view-toggle-btn svg { fill: rgba(255,255,255,0.4); display: block; }
.view-toggle-btn.active { background: #6B5CE7; border-color: #6B5CE7; }
.view-toggle-btn.active svg { fill: #fff; }
.vf-no-projects { color: rgba(255,255,255,0.3); font-size: 15px; padding: 40px 0; }

/* ── Project cards (grid) ── */
#projects-container.view-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
}
.vf-card {
  background: #0A0A0A; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; overflow: hidden;
  transition: all 0.3s ease; display: flex; flex-direction: column;
  color: #FFFFFF;
}
.vf-card:hover {
  border-color: rgba(107,92,231,0.4);
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.vf-card-cover { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
.vf-card-cover-placeholder {
  width: 100%; aspect-ratio: 16/9;
  background: linear-gradient(135deg, #0D0D1A, #1a1a2e);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.vf-card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
.vf-card-title { font-size: 18px; font-weight: 600; color: #FFFFFF; }
.vf-card-desc {
  font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.vf-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.vf-card-tag {
  background: rgba(107,92,231,0.15); border: 1px solid rgba(107,92,231,0.3);
  border-radius: 100px; padding: 3px 10px;
  font-size: 11px; color: rgba(255,255,255,0.6);
}
.vf-card-link {
  color: #6B5CE7; font-size: 13px; margin-top: auto;
  display: inline-block; transition: color 0.15s ease;
}
.vf-card:hover .vf-card-link { color: #FFFFFF; }

/* ── Project cards (list) ── */
#projects-container.view-list { display: flex; flex-direction: column; }
#projects-container.view-list .vf-card {
  flex-direction: row; border-radius: 0; border: none;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 20px 0; background: transparent; gap: 20px;
  transform: none !important; box-shadow: none !important;
}
#projects-container.view-list .vf-card:hover { background: rgba(255,255,255,0.02); }
#projects-container.view-list .vf-card-cover {
  width: 160px; min-width: 160px; height: 100px; aspect-ratio: unset;
  border-radius: 8px; flex-shrink: 0;
}
#projects-container.view-list .vf-card-cover-placeholder {
  width: 160px; min-width: 160px; height: 100px; aspect-ratio: unset;
  border-radius: 8px; flex-shrink: 0;
}
#projects-container.view-list .vf-card-body { padding: 0; }

/* ── About ── */
.vf-about {
  padding: 80px 48px; max-width: 1200px; margin: 0 auto;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.vf-about-text {
  font-size: 32px; font-weight: 700; color: #FFFFFF;
  line-height: 1.3; max-width: 500px;
}

/* ── Quote ── */
.vf-quote {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 60px 48px; max-width: 1200px; margin: 0 auto;
}
.vf-quote-text {
  font-size: 18px; color: rgba(255,255,255,0.6);
  max-width: 600px; line-height: 1.7; font-style: italic;
}

/* ── Footer ── */
footer { border-top: 1px solid rgba(255,255,255,0.08); }
.vf-footer {
  padding: 32px 48px; max-width: 1200px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
}
.vf-footer-copy { color: rgba(255,255,255,0.3); font-size: 13px; }
.vf-footer-brand { color: rgba(255,255,255,0.3); font-size: 13px; }
.vf-footer-links { display: flex; gap: 20px; }
.vf-footer-link { color: rgba(255,255,255,0.3); font-size: 12px; transition: color 0.15s ease; }
.vf-footer-link:hover { color: rgba(255,255,255,0.6); }

/* ── Back button ── */
.vf-back-wrap { padding: 100px 48px 0; max-width: 1200px; margin: 0 auto; }
.vf-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 100px; padding: 8px 16px;
  color: rgba(255,255,255,0.6); font-size: 13px;
  transition: all 0.15s ease;
}
.vf-back-btn:hover { color: #FFFFFF; border-color: rgba(255,255,255,0.4); }

/* ── Project page ── */
body.vf-project-page { background: #000000; }
.vf-project-header { padding: 40px 48px; max-width: 1200px; margin: 0 auto; }
.vf-project-hero-title {
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 800; color: #FFFFFF;
  letter-spacing: -2px; line-height: 1.0; margin-bottom: 20px;
}
.vf-project-date-line { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
.vf-project-tags-line { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.vf-project-page-tag {
  background: rgba(107,92,231,0.15); border: 1px solid rgba(107,92,231,0.3);
  border-radius: 100px; padding: 4px 12px;
  font-size: 12px; color: rgba(255,255,255,0.6);
}
.vf-project-description {
  font-size: 18px; color: rgba(255,255,255,0.5);
  max-width: 680px; line-height: 1.7; margin-bottom: 32px;
}
.vf-project-content { padding: 0 48px 80px; max-width: 1200px; margin: 0 auto; }

/* ── Prose ── */
.vf-prose {
  background: #0A0A0A; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 48px;
  color: rgba(255,255,255,0.8); font-size: 16px;
  line-height: 1.9; max-width: 760px; margin: 0 auto;
}
.vf-prose h1 { font-size: 28px; font-weight: 700; color: #fff; margin: 2rem 0 0.8rem; }
.vf-prose h2 { font-size: 24px; font-weight: 700; color: #fff; margin: 2rem 0 0.8rem; }
.vf-prose h3 { font-size: 20px; font-weight: 600; color: #fff; margin: 1.5rem 0 0.6rem; }
.vf-prose h4, .vf-prose h5, .vf-prose h6 { font-size: 17px; font-weight: 600; color: #fff; margin: 1.2rem 0 0.5rem; }
.vf-prose p { font-size: 16px; line-height: 1.9; color: rgba(255,255,255,0.8); margin: 1rem 0; }
.vf-prose a { color: #6B5CE7; text-decoration: underline; }
.vf-prose strong { font-weight: 600; color: #fff; }
.vf-prose em { font-style: italic; }
.vf-prose ul { list-style: disc; padding-left: 1.5rem; margin: 0.8rem 0; }
.vf-prose ol { list-style: decimal; padding-left: 1.5rem; margin: 0.8rem 0; }
.vf-prose li { font-size: 16px; line-height: 1.9; color: rgba(255,255,255,0.8); margin: 0.3rem 0; }
.vf-prose code { background: rgba(255,255,255,0.08); padding: 2px 6px; font-size: 0.875em; border-radius: 4px; font-family: 'SF Mono', Consolas, monospace; }
.vf-prose pre { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 24px; overflow-x: auto; margin: 1.5rem 0; border-radius: 8px; }
.vf-prose pre code { background: none; padding: 0; }
.vf-prose blockquote { border-left: 2px solid #6B5CE7; padding-left: 20px; color: rgba(255,255,255,0.5); font-style: italic; margin: 1.5rem 0; }
.vf-prose hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 2rem 0; }
.vf-prose img { width: 100%; margin: 1.5rem 0; border-radius: 8px; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .vf-nav { padding: 14px 20px; }
  .vf-nav-center { display: none; }
  .vf-hero { grid-template-columns: 1fr; padding: 120px 24px 60px; gap: 24px; }
  .vf-hero-right { align-items: flex-start; }
  .vf-hero-slash { display: none; }
  .vf-projects-section { padding: 60px 24px; }
  .vf-about { padding: 60px 24px; }
  .vf-about-text { font-size: 24px; }
  .vf-quote { padding: 48px 24px; }
  .vf-footer { flex-direction: column; gap: 12px; text-align: center; }
  .vf-back-wrap { padding: 80px 24px 0; }
  .vf-project-header { padding: 32px 24px; }
  .vf-project-content { padding: 0 24px 60px; }
  .vf-prose { padding: 32px 24px; }
  .view-toggle-container { display: none; }
  #projects-container.view-grid { grid-template-columns: 1fr; }
  #projects-container.view-list .vf-card { flex-direction: column; }
  #projects-container.view-list .vf-card-cover,
  #projects-container.view-list .vf-card-cover-placeholder { width: 100%; min-width: unset; height: 180px; }
}
${CALLOUT_CSS}

/* ── Public Properties (Dark) ── */
.vf-properties {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; padding: 24px 0;
  border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08);
  margin: 20px 0 32px;
}
.vf-property-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.35); display: block; margin-bottom: 4px;
}
.vf-property-value { font-size: 15px; color: rgba(255,255,255,0.85); }
.vf-property-link { font-size: 15px; color: #6B5CE7; text-decoration: none; }
.vf-property-link:hover { color: #fff; }
`.trim();

// ── Shared fragments ──────────────────────────────────────────────────────────

function htmlHead(pageTitle: string): string {
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <style>${BASE_CSS}</style>`;
}

function normalizeNavHref(href: string): string {
  if (!href) return href;
  // Anchor links, absolute paths, relative paths stay as-is
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) return href;
  // Already has protocol
  if (/^https?:\/\//.test(href) || /^mailto:/.test(href)) return href;
  // Bare domain like www.example.com — add https://
  return "https://" + href;
}

function renderNav(siteName: string, root = "", navLinks = "Work: #work, About: #about"): string {
  const linkItems = navLinks.split(",").map(entry => {
    const parts = entry.trim().split(":");
    const label = parts[0].trim();
    const rawHref = parts.slice(1).join(":").trim();
    if (!label || !rawHref) return "";
    const fullHref = normalizeNavHref(rawHref);
    const isExternal = /^https?:\/\//.test(fullHref);
    const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${escapeHtml(fullHref)}" class="vf-nav-link"${targetAttr}>${escapeHtml(label)}</a>`;
  }).filter(Boolean).join("\n    ");
  return `<nav class="vf-nav" id="vf-nav">
  <a href="${root}index.html" class="vf-nav-logo">${escapeHtml(siteName)}</a>
  <div class="vf-nav-links">
    ${linkItems}
  </div>
</nav>
<script>
(function(){
  var nav = document.getElementById('vf-nav');
  window.addEventListener('scroll', function(){
    if(window.scrollY > 40){ nav.classList.add('scrolled'); }
    else { nav.classList.remove('scrolled'); }
  }, { passive: true });
})();
</script>`;
}

function renderFooter(siteName: string): string {
  return `<footer class="vf-footer">
  <span class="vf-footer-left">${escapeHtml(siteName)}</span>
  <span class="vf-footer-right">Built with <a href="#">VaultFolio</a></span>
</footer>`;
}

// ── Scripts ───────────────────────────────────────────────────────────────────

function renderTagFilterScript(): string {
  return `<script>
document.addEventListener("DOMContentLoaded", () => {
  const filters = document.querySelectorAll(".vf-filter-btn");
  const cards = document.querySelectorAll(".vf-filter-card");
  
  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      filters.forEach(f => f.classList.remove("active"));
      btn.classList.add("active");
      
      const tag = btn.getAttribute("data-filter");
      
      cards.forEach(card => {
        if (tag === "all") {
          card.style.display = "";
        } else {
          const cardTags = card.getAttribute("data-tags") || "";
          const tList = cardTags.split(" ");
          if (tList.includes(tag)) {
            card.style.display = "";
          } else {
            card.style.display = "none";
          }
        }
      });
    });
  });
});
</script>`;
}

// ── Cover image helpers ───────────────────────────────────────────────────────

function resolveCoverFilename(cover: unknown): string | null {
  if (typeof cover !== "string" || !cover.trim()) return null;
  const raw = cover.trim();
  const wikiMatch = raw.match(/^!\[\[([^\]|]+)/);
  const name = wikiMatch
    ? wikiMatch[1].trim().split("/").pop() ?? null
    : raw.split("/").pop() ?? null;
  return name ?? null;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s*\[!\w+\][^\n]*/gm, "")  // callout header lines: > [!type] Title
    .replace(/^>\s*/gm, "")                 // remaining blockquote markers
    .replace(/\*+([^*]+)\*+/g, "$1")        // bold and italic
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCardDescription(note: ParsedNote): string {
  const fm = note.frontmatter.description;
  if (typeof fm === "string" && fm.trim()) return fm.trim();
  const stripped = stripMarkdown(note.body);
  return stripped.length > 150 ? stripped.slice(0, 147).trimEnd() + "…" : stripped;
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function buildSite(notes: ParsedNote[], settings: VaultFolioSettings): BuildResult {
  const siteTitle = settings.siteName;
  const theme = settings.theme ?? "apple";
  let pages, index;
  if (theme === "apple") {
    pages = notes.map((note) => buildApplePage(note, siteTitle));
    index = buildAppleIndex(notes, settings);
  } else if (theme === "simple") {
    pages = notes.map((note) => buildSimplePage(note, siteTitle));
    index = buildSimpleIndex(notes, settings);
  } else if (theme === "glass") {
    pages = notes.map((note) => buildGlassPage(note, siteTitle));
    index = buildGlassIndex(notes, settings);
  } else {
    pages = notes.map((note) => buildPage(note, siteTitle));
    index = buildIndex(notes, settings);
  }
  return { files: [index, ...pages], pageCount: pages.length, imageMap: new Map() };
}

// ── View-toggle helpers ────────────────────────────────────────────────────────

const VT_GRID_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="8" height="8" rx="1"/><rect x="10" y="0" width="8" height="8" rx="1"/><rect x="0" y="10" width="8" height="8" rx="1"/><rect x="10" y="10" width="8" height="8" rx="1"/></svg>`;
const VT_LIST_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="18" height="3" rx="1"/><rect x="0" y="7" width="18" height="3" rx="1"/><rect x="0" y="14" width="18" height="3" rx="1"/></svg>`;

function renderViewToggle(): string {
  return `<div class="view-toggle-container">
  <button id="btn-grid" class="view-toggle-btn active" data-view="grid" title="Grid view" aria-label="Grid view">${VT_GRID_ICON}</button>
  <button id="btn-list" class="view-toggle-btn" data-view="list" title="List view" aria-label="List view">${VT_LIST_ICON}</button>
</div>`;
}

function renderViewToggleScript(): string {
  return `<script>
(function(){
  var KEY='vaultfolio-view-preference';
  var c=document.getElementById('projects-container');
  var bg=document.getElementById('btn-grid');
  var bl=document.getElementById('btn-list');
  if(!c||!bg||!bl)return;
  function apply(v){
    if(v==='list'){c.classList.remove('view-grid');c.classList.add('view-list');bg.classList.remove('active');bl.classList.add('active');}
    else{c.classList.remove('view-list');c.classList.add('view-grid');bg.classList.add('active');bl.classList.remove('active');}
  }
  apply(localStorage.getItem(KEY)==='list'?'list':'grid');
  bg.addEventListener('click',function(){apply('grid');localStorage.setItem(KEY,'grid');});
  bl.addEventListener('click',function(){apply('list');localStorage.setItem(KEY,'list');});
})();
</script>`;
}

// ── Gallery helpers ────────────────────────────────────────────────────────────

interface GalleryImage { src: string; alt: string; caption: string; }

function extractGalleryImages(md: string): GalleryImage[] {
  const images: GalleryImage[] = [];
  const seen = new Set<string>();
  const wikiRe = /!\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = wikiRe.exec(md)) !== null) {
    const ref = m[1].split("|")[0].trim();
    const filename = ref.split("/").pop() ?? ref;
    if (!seen.has(filename)) {
      seen.add(filename);
      images.push({ src: `../images/${encodeURIComponent(filename)}`, alt: filename, caption: filename.replace(/\.[^.]+$/, "") });
    }
  }
  const mdRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((m = mdRe.exec(md)) !== null) {
    const rawPath = m[2].trim().replace(/\s+["'][^"']*["']\s*$/, "");
    if (/^https?:\/\//.test(rawPath)) continue;
    const filename = rawPath.split("/").pop() ?? rawPath;
    if (!seen.has(filename)) {
      seen.add(filename);
      images.push({ src: `../images/${encodeURIComponent(filename)}`, alt: m[1] || filename, caption: filename.replace(/\.[^.]+$/, "") });
    }
  }
  return images;
}

function stripImages(md: string): string {
  return md.replace(/!\[\[[^\]]*\]\]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "");
}

function splitContentAroundImages(md: string): { before: string; after: string } {
  const allRe = /!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g;
  let firstIdx = -1, lastEnd = -1;
  let m: RegExpExecArray | null;
  while ((m = allRe.exec(md)) !== null) {
    if (firstIdx === -1) firstIdx = m.index;
    lastEnd = m.index + m[0].length;
  }
  if (firstIdx === -1) return { before: md, after: "" };
  return {
    before: stripImages(md.slice(0, firstIdx)).trim(),
    after: stripImages(md.slice(lastEnd)).trim(),
  };
}

function renderGallerySection(images: GalleryImage[]): string {
  const items = images.map(img =>
    `    <div class="vf-gallery-item">
      <img src="${img.src}" alt="${escapeHtml(img.alt)}" loading="lazy"/>
    </div>`
  ).join("\n");
  return `<section class="vf-gallery-section">
  <div class="vf-gallery-header">
    <div class="vf-gallery-toggle">
      <button id="vf-btn-grid" data-view="grid" class="vf-view-btn active" title="Grid view" aria-label="Grid view">${VT_GRID_ICON}</button>
      <button id="vf-btn-list" data-view="list" class="vf-view-btn" title="List view" aria-label="List view">${VT_LIST_ICON}</button>
    </div>
  </div>
  <div id="vf-gallery-container" class="vf-gallery-grid">
${items}
  </div>
</section>`;
}

function renderLightboxHtml(): string {
  return `<div id="vf-lightbox" class="vf-lightbox hidden">
  <button class="vf-lb-close" aria-label="Close">&#x2715;</button>
  <button class="vf-lb-prev" aria-label="Previous">&#x2039;</button>
  <button class="vf-lb-next" aria-label="Next">&#x203A;</button>
  <div class="vf-lb-counter"></div>
  <img id="vf-lb-img" src="" alt=""/>
</div>`;
}

function renderGalleryScript(): string {
  return `<script>
(function(){
  var GKEY='vaultfolio-gallery-view';
  var gc=document.getElementById('vf-gallery-container');
  var gbtn=document.getElementById('vf-btn-grid');
  var lbtn=document.getElementById('vf-btn-list');
  if(!gc)return;
  function setView(v){
    if(v==='list'){gc.className='vf-gallery-list';if(gbtn)gbtn.classList.remove('active');if(lbtn)lbtn.classList.add('active');}
    else{gc.className='vf-gallery-grid';if(gbtn)gbtn.classList.add('active');if(lbtn)lbtn.classList.remove('active');}
    localStorage.setItem(GKEY,v);
  }
  setView(localStorage.getItem(GKEY)==='list'?'list':'grid');
  if(gbtn)gbtn.addEventListener('click',function(){setView('grid');});
  if(lbtn)lbtn.addEventListener('click',function(){setView('list');});
  var lb=document.getElementById('vf-lightbox');
  var lbImg=document.getElementById('vf-lb-img');
  var lbCtr=document.querySelector('.vf-lb-counter');
  var imgs=Array.from(document.querySelectorAll('#vf-gallery-container img'));
  var cur=0;
  function openLb(i){cur=i;if(lbImg)lbImg.src=imgs[i].src;if(lbCtr)lbCtr.textContent=(i+1)+' / '+imgs.length;if(lb)lb.classList.remove('hidden');document.body.style.overflow='hidden';}
  function closeLb(){if(lb)lb.classList.add('hidden');document.body.style.overflow='';}
  function prev(){cur=(cur-1+imgs.length)%imgs.length;if(lbImg)lbImg.src=imgs[cur].src;if(lbCtr)lbCtr.textContent=(cur+1)+' / '+imgs.length;}
  function next(){cur=(cur+1)%imgs.length;if(lbImg)lbImg.src=imgs[cur].src;if(lbCtr)lbCtr.textContent=(cur+1)+' / '+imgs.length;}
  imgs.forEach(function(img,i){img.style.cursor='zoom-in';img.addEventListener('click',function(){openLb(i);});});
  var closeBtn=document.querySelector('.vf-lb-close');
  var prevBtn=document.querySelector('.vf-lb-prev');
  var nextBtn=document.querySelector('.vf-lb-next');
  if(closeBtn)closeBtn.addEventListener('click',closeLb);
  if(prevBtn)prevBtn.addEventListener('click',prev);
  if(nextBtn)nextBtn.addEventListener('click',next);
  if(lb)lb.addEventListener('click',function(e){if(e.target===lb)closeLb();});
  document.addEventListener('keydown',function(e){if(!lb||lb.classList.contains('hidden'))return;if(e.key==='Escape')closeLb();if(e.key==='ArrowLeft')prev();if(e.key==='ArrowRight')next();});
})();
</script>`;
}

function renderGalleryCSS(theme: string): string {
  const cfgMap: Record<string, {lc:string;bc:string;bg:string;ac:string;ic:string;ib:string}> = {
    default:   { lc:'rgba(255,255,255,0.4)',  bc:'rgba(255,255,255,0.08)', bg:'#111111', ac:'#FF4D00', ic:'rgba(255,255,255,0.3)', ib:'rgba(255,255,255,0.2)' },
    apple:     { lc:'#6E6E73', bc:'#D2D2D7', bg:'#F5F5F7', ac:'#7C3AED', ic:'#6E6E73', ib:'#D2D2D7' },
    simple:    { lc:'#999',  bc:'#eee',    bg:'#f9f9f9', ac:'#0A0A0A', ic:'#999', ib:'#ddd' },
    glass:     { lc:'rgba(255,255,255,0.4)', bc:'rgba(255,255,255,0.08)', bg:'#0D0D1A', ac:'rgba(124,58,237,0.6)', ic:'rgba(255,255,255,0.5)', ib:'rgba(255,255,255,0.1)' },
  };
  const c = cfgMap[theme] ?? cfgMap.simple;
  return `
/* ── Project Gallery ── */
.vf-gallery-section{margin:2.5rem 0;}
.vf-gallery-header{display:flex;justify-content:flex-end;align-items:center;margin-bottom:16px;}
.vf-gallery-label{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${c.lc};}
.vf-gallery-toggle{display:flex;gap:6px;align-items:center;}
.vf-view-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;background:transparent;border:1px solid ${c.ib};transition:all 0.15s ease;}
.vf-view-btn svg{fill:${c.ic};display:block;}
.vf-view-btn.active{background:${c.ac};border-color:${c.ac};}
.vf-view-btn.active svg{fill:#fff;}
.vf-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;}
.vf-gallery-grid .vf-gallery-item{border-radius:8px;overflow:hidden;aspect-ratio:4/3;background:${c.bg};}
.vf-gallery-grid .vf-gallery-item img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s ease;}
.vf-gallery-grid .vf-gallery-item:hover img{transform:scale(1.03);}
.vf-gallery-grid .vf-img-caption{display:none;}
.vf-gallery-list{display:flex;flex-direction:column;gap:12px;}
.vf-gallery-list .vf-gallery-item{aspect-ratio:unset;border-radius:0;overflow:visible;}
.vf-gallery-list .vf-gallery-item img{width:100%;max-height:500px;object-fit:contain;border-radius:8px;background:${c.bg};display:block;}
.vf-lightbox{position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out;}
.vf-lightbox.hidden{display:none;}
#vf-lb-img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;cursor:default;}
.vf-lb-close{position:absolute;top:20px;right:24px;background:transparent;border:none;color:white;font-size:28px;cursor:pointer;opacity:0.7;transition:opacity 0.15s;}
.vf-lb-close:hover{opacity:1;}
.vf-lb-prev,.vf-lb-next{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;font-size:32px;width:48px;height:48px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;}
.vf-lb-prev:hover,.vf-lb-next:hover{background:rgba(255,255,255,0.2);}
.vf-lb-prev{left:20px;}
.vf-lb-next{right:20px;}
.vf-lb-counter{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.6);font-size:13px;pointer-events:none;}
@media(max-width:640px){
  .vf-gallery-toggle{display:none;}
  .vf-gallery-grid{grid-template-columns:1fr;}
  .vf-gallery-list .vf-gallery-item img{max-height:300px;}
  .vf-lb-prev{width:36px;height:36px;font-size:24px;left:10px;}
  .vf-lb-next{width:36px;height:36px;font-size:24px;right:10px;}
}`;
}

function buildProseWithGallery(note: ParsedNote, proseClass: string): string {
  const galleryFm = (note.frontmatter as Record<string, unknown>).gallery;
  const images = extractGalleryImages(note.body);
  const useGallery = galleryFm === false ? false
    : galleryFm === true ? images.length >= 1
    : images.length >= 2;

  if (!useGallery || images.length === 0) {
    return `<div class="${proseClass}">${markdownToHtml(note.body)}</div>`;
  }

  const { before, after } = splitContentAroundImages(note.body);
  const parts: string[] = [];
  if (before) parts.push(`<div class="${proseClass}">${markdownToHtml(before)}</div>`);
  parts.push(renderGallerySection(images));
  if (after) parts.push(`<div class="${proseClass}">${markdownToHtml(after)}</div>`);
  return parts.join("\n");
}

// ── Index page ────────────────────────────────────────────────────────────────

function buildIndex(notes: ParsedNote[], settings: VaultFolioSettings): SiteFile {
  const siteTitle = settings.siteName;

  // Cards
  const cards = notes.map((n) => {
    const title = n.displayTitle;
    const desc = getCardDescription(n);
    const tags = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
      .map((t) => String(t).toLowerCase());
    const tagHtml = tags.slice(0, 3).map(t => `<span class="vf-card-tag">${escapeHtml(t)}</span>`).join("");
    const coverFilename = resolveCoverFilename(n.frontmatter.cover);
    const gradient = generateGradient(title, true);
    const coverHtml = coverFilename
      ? `<img class="vf-card-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
      : `<div class="vf-card-cover-placeholder" style="background:${gradient};display:flex;align-items:center;justify-content:center;overflow:hidden"><span style="font-size:48px;font-weight:800;color:rgba(255,255,255,0.15);user-select:none;line-height:1;font-family:-apple-system,sans-serif">${escapeHtml(title.charAt(0).toUpperCase())}</span></div>`;
    return `<a href="pages/${n.slug}.html" class="vf-card vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">
  ${coverHtml}
  <div class="vf-card-body">
    <div class="vf-card-title">${escapeHtml(title)}</div>
    ${desc ? `<div class="vf-card-desc">${escapeHtml(desc)}</div>` : ""}
    ${tags.length > 0 ? `<div class="vf-card-tags">${tagHtml}</div>` : ""}
    <span class="vf-card-link">Learn more →</span>
  </div>
</a>`;
  }).join("\n");

  // Tags / filter
  const allTags = Array.from(new Set(
    notes.flatMap(n => Array.isArray(n.frontmatter.tags)
      ? (n.frontmatter.tags as string[]).map(t => String(t).toLowerCase()) : [])
  )).sort();
  const filterHtml = allTags.length > 0 ? `
<div class="vf-filter-bar">
  <button class="vf-filter-btn active" data-filter="all">All</button>
  ${allTags.map(t => `<button class="vf-filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
</div>` : "";

  // Nav links: all-but-last → centre, last → CTA pill
  interface NavEntry { label: string; href: string; isExternal: boolean; }
  const navEntries: NavEntry[] = settings.navLinks
    ? settings.navLinks.split(",").map(entry => {
        const parts = entry.trim().split(":");
        const label = parts[0].trim();
        const rawHref = parts.slice(1).join(":").trim();
        if (!label || !rawHref) return null;
        const href = normalizeNavHref(rawHref);
        return { label, href, isExternal: /^https?:\/\//.test(href) };
      }).filter((e): e is NavEntry => e !== null)
    : [];

  const centerEntries = navEntries.length > 1 ? navEntries.slice(0, -1) : [];
  const ctaEntry = navEntries.length > 0 ? navEntries[navEntries.length - 1] : null;

  const navCenterHtml = centerEntries.map((e, idx) => {
    const target = e.isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    const sep = idx < centerEntries.length - 1 ? `<span class="vf-nav-sep">·</span>` : "";
    return `<a href="${escapeHtml(e.href)}" class="vf-nav-center-link"${target}>${escapeHtml(e.label)}</a>${sep}`;
  }).join("");

  const navCtaHtml = ctaEntry
    ? `<a href="${escapeHtml(ctaEntry.href)}" class="vf-nav-cta"${ctaEntry.isExternal ? ` target="_blank" rel="noopener noreferrer"` : ""}>${escapeHtml(ctaEntry.label)}</a>`
    : `<a href="#work" class="vf-nav-cta">View Work</a>`;

  // Footer nav links
  const footerNavHtml = navEntries.map(e => {
    const target = e.isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${escapeHtml(e.href)}" class="vf-footer-link"${target}>${escapeHtml(e.label)}</a>`;
  }).join("");

  const heroTitleText = settings.heroTitle || siteTitle;
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)}</title>
  <style>${BASE_CSS}</style>
</head>
<body>

<nav class="vf-nav">
  <div class="vf-nav-logo">${escapeHtml(siteTitle)}</div>
  <div class="vf-nav-center">${navCenterHtml}</div>
  ${navCtaHtml}
</nav>

<div class="vf-hero">
  <div class="vf-hero-left">
    <h1 class="vf-hero-title">${escapeHtml(heroTitleText)}</h1>
    ${settings.heroSubtitle ? `<p class="vf-hero-subtitle">${escapeHtml(settings.heroSubtitle)}</p>` : ""}
  </div>
  <div class="vf-hero-right">
    <span class="vf-hero-slash">/</span>
    <a href="#work" class="vf-hero-work-btn">View Work →</a>
  </div>
</div>

<section id="work">
  <div class="vf-projects-section">
    <div class="vf-section-header">
      <span class="vf-section-label">Selected Work</span>
      ${renderViewToggle()}
    </div>
    ${filterHtml}
    <div id="projects-container" class="projects-grid view-grid">
      ${notes.length > 0 ? cards : `<p class="vf-no-projects">No published projects yet.</p>`}
    </div>
  </div>
</section>

${settings.aboutText ? `<section class="vf-about" id="about">
  <p class="vf-about-text">${settings.aboutText}</p>
</section>` : ""}

${settings.quoteText ? `<section class="vf-quote">
  <p class="vf-quote-text">${escapeHtml(settings.quoteText)}</p>
</section>` : ""}

<footer>
  <div class="vf-footer">
    <span class="vf-footer-copy">&copy; ${year} ${escapeHtml(siteTitle)}</span>
    <span class="vf-footer-brand">Built with VaultFolio</span>
    <div class="vf-footer-links">${footerNavHtml}</div>
  </div>
</footer>

${allTags.length > 0 ? renderTagFilterScript() : ""}
${renderViewToggleScript()}
</body>
</html>`;

  return { path: "index.html", content: html };
}

// ── Public properties helpers ─────────────────────────────────────────────────

function labelFromKey(key: string): string {
  return key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("www.");
}

function renderPropertyValue(raw: string | string[]): string {
  // Normalise to flat parts; split string values by comma when any chunk is a URL
  const parts: string[] = Array.isArray(raw)
    ? raw.map((v) => String(v).trim()).filter(Boolean)
    : [raw];

  const expanded: string[] = parts.flatMap((p) => {
    const chunks = p.split(",").map((s) => s.trim()).filter(Boolean);
    return chunks.length > 1 && chunks.some(isUrl) ? chunks : [p];
  });

  const allText = expanded.every((p) => !isUrl(p));

  if (allText) {
    const joined = expanded.join(", ");
    const safe = joined.length > 200 ? joined.slice(0, 200) + "…" : joined;
    return `<span class="vf-property-value">${escapeHtml(safe)}</span>`;
  }

  return expanded
    .map((part) => {
      const safe = part.length > 200 ? part.slice(0, 200) + "…" : part;
      if (isUrl(safe)) {
        return `<a href="${escapeHtml(safe)}" class="vf-property-link" target="_blank" rel="noopener">View Project</a>`;
      }
      return `<span class="vf-property-value">${escapeHtml(safe)}</span>`;
    })
    .join(" ");
}

function renderPublicProperties(note: ParsedNote): string {
  const props = note.publicProperties;
  if (!props || Object.keys(props).length === 0) return "";

  const items = Object.entries(props)
    .map(
      ([key, value]) =>
        `<div class="vf-property">\n    <span class="vf-property-label">${escapeHtml(labelFromKey(key))}</span>\n    ${renderPropertyValue(value)}\n  </div>`
    )
    .join("\n  ");

  return `<div class="vf-properties">\n  ${items}\n</div>`;
}

// ── Project page ──────────────────────────────────────────────────────────────

function buildPage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = note.displayTitle;
  const description = (note.frontmatter.description as string | undefined) ?? "";
  const date = note.frontmatter.date as string | undefined;
  const tags = (Array.isArray(note.frontmatter.tags) ? (note.frontmatter.tags as string[]) : [])
    .map((t) => String(t).toLowerCase());

  const tagChips = tags
    .map((t) => `<span class="vf-project-page-tag">${escapeHtml(String(t))}</span>`)
    .join("");

  const descHtml = description && !("description" in note.publicProperties)
    ? `<p class="vf-project-description">${escapeHtml(description)}</p>`
    : "";

  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteTitle)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}" />` : ""}
  <style>${BASE_CSS}${renderGalleryCSS('default')}</style>
</head>
<body class="vf-project-page">

<nav class="vf-nav">
  <div class="vf-nav-logo">${escapeHtml(siteTitle)}</div>
  <div class="vf-nav-center"></div>
  <a href="../index.html" class="vf-nav-cta">← Back</a>
</nav>

<div class="vf-back-wrap">
  <a href="../index.html" class="vf-back-btn">← Back to work</a>
</div>

<div class="vf-project-header">
  <h1 class="vf-project-hero-title">${escapeHtml(title)}</h1>
  ${date ? `<p class="vf-project-date-line">${escapeHtml(String(date))}</p>` : ""}
  ${tags.length > 0 ? `<div class="vf-project-tags-line">${tagChips}</div>` : ""}
  ${descHtml}
  ${renderPublicProperties(note)}
</div>

<div class="vf-project-content">
  ${buildProseWithGallery(note, 'vf-prose')}
</div>

<footer>
  <div class="vf-footer">
    <span class="vf-footer-copy">&copy; ${year} ${escapeHtml(siteTitle)}</span>
    <span class="vf-footer-brand">Built with VaultFolio</span>
    <div class="vf-footer-links"></div>
  </div>
</footer>

${renderLightboxHtml()}
${renderGalleryScript()}
</body>
</html>`;

  return { path: `pages/${note.slug}.html`, content: html };
}

// ── Markdown → HTML ───────────────────────────────────────────────────────────

function markdownToHtml(md: string): string {
  // Defensive strip: remove any frontmatter that wasn't caught upstream
  // (e.g. BOM-prefixed files or non-standard line endings).
  // Also scrub individual YAML key lines that may slip through in edge cases.
  const body = md
    .replace(/^﻿/, "")                                                  // UTF-8 BOM
    .replace(/^---[\s\S]*?---\r?\n?/, "")                               // frontmatter block
    .replace(/^(title|published|tags|cover|date):[ \t].*$/gm, "")       // stray YAML lines
    .trim();

  let html = parseCallouts(body)
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

  // Post-processing: Cluster consecutive images into galleries
  html = html.replace(/((?:<img[^>]+>\s*)+)/g, (match) => {
    const count = (match.match(/<img/g) || []).length;
    if (count > 1) {
      const colClass = (count % 4 === 0) ? 'cols-4' : 'cols-2';
      return `<div class="vf-gallery ${colClass}">\n${match.trim()}\n</div>\n`;
    } else if (count === 1) {
      return `<div class="vf-image-single">\n${match.trim()}\n</div>\n`;
    }
    return match;
  });

  return html;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function collectTags(notes: ParsedNote[]): string[] {
  const seen = new Set<string>();
  for (const n of notes) {
    const t = n.frontmatter.tags;
    if (Array.isArray(t)) t.forEach((tag) => seen.add(String(tag).toLowerCase()));
  }
  return [...seen].sort();
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

function applyInlineMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function parseCallouts(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(/^>\s*\[!([\w]+)\]\s*(.*)/);
    if (match) {
      const type = match[1].toLowerCase();
      const title = match[2].trim() || type.charAt(0).toUpperCase() + type.slice(1);

      const contentLines: string[] = [];
      i++;
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        contentLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }

      const icon = CALLOUT_ICONS[type] ?? "📝";
      const contentHtml = contentLines.map(applyInlineMd).join("<br>");

      out.push(
        `<div class="callout callout-${escapeHtml(type)}">` +
        `<div class="callout-title">` +
        `<span class="callout-icon">${icon}</span>` +
        `<span class="callout-title-text">${escapeHtml(title)}</span>` +
        `</div>` +
        `<div class="callout-content">${contentHtml}</div>` +
        `</div>`
      );
    } else {
      out.push(lines[i]);
      i++;
    }
  }

  return out.join("\n");
}


// ── APPLE THEME ──────────────────────────────────────────────────────────────

const APPLE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body.vf-apple {
  background: #f5f5f7;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.vf-apple a { color: inherit; text-decoration: none; }
.vf-apple img { max-width: 100%; height: auto; display: block; border-radius: 12px; }

/* Navigation */
.vf-nav-ap {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 40px; height: 52px;
}
.vf-nav-ap-logo {
  font-weight: 600; font-size: 17px; letter-spacing: -0.01em; color: #1d1d1f;
}

/* Hero */
.vf-hero-ap {
  text-align: center; padding: 120px 40px 80px; max-width: 980px; margin: 0 auto;
}
.vf-hero-ap-title {
  font-size: clamp(48px, 8vw, 80px); font-weight: 700; letter-spacing: -0.015em; line-height: 1.05; color: #1d1d1f; margin-bottom: 24px;
}
.vf-hero-ap-subtitle {
  font-size: 24px; font-weight: 400; color: #86868b; line-height: 1.33337; letter-spacing: .009em; max-width: 680px; margin: 0 auto;
}

/* Projects */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 32px; }
.vf-filter-btn { background: rgba(0,0,0,0.05); color: #1d1d1f; border: none; padding: 8px 16px; border-radius: 100px; font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit; font-weight: 400; }
.vf-filter-btn:hover { background: rgba(0,0,0,0.1); }
.vf-filter-btn.active { background: #1d1d1f; color: #fff; font-weight: 500; }

.vf-projects-ap {
  padding: 40px; max-width: 1200px; margin: 0 auto;
}
.vf-projects-ap-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;
}
.vf-card-ap {
  background: #ffffff; border-radius: 18px; padding: 0; display: flex; flex-direction: column;
  transition: transform 0.2s cubic-bezier(0,0,0.5,1), box-shadow 0.2s cubic-bezier(0,0,0.5,1);
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  overflow: hidden;
}
.vf-card-ap:hover {
  transform: scale(1.02); box-shadow: 0 12px 48px rgba(0,0,0,0.08);
}
.vf-card-ap-cover {
  width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block;
}
.vf-card-ap-cover-placeholder {
  width: 100%; height: 200px;
  background: linear-gradient(135deg, #EDE9FE, #C4B5FD);
}
.vf-card-ap-body {
  padding: 32px; flex: 1; display: flex; flex-direction: column; min-height: 160px;
}
.vf-card-ap-title {
  font-size: 28px; font-weight: 600; letter-spacing: .004em; color: #1d1d1f; margin-bottom: 12px;
}
.vf-card-ap-desc {
  font-size: 17px; font-weight: 400; color: #86868b; margin-bottom: 24px; line-height: 1.47;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.vf-card-ap-tags {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;
}
.vf-tag-ap {
  background: #f5f5f7; color: #1d1d1f; font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 100px;
}
.vf-card-ap-link {
  margin-top: auto; color: #7C3AED; font-size: 17px; font-weight: 400;
}
.vf-card-ap-link:hover { text-decoration: underline; }

/* Quote & Footer */
.vf-quote-ap {
  text-align: center; padding: 120px 40px; max-width: 800px; margin: 0 auto;
}
.vf-quote-ap p {
  font-size: 32px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: .004em;
}
.vf-footer-ap {
  border-top: 1px solid #d2d2d7; padding: 32px 40px; text-align: center; font-size: 12px; color: #86868b;
  max-width: 980px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.vf-footer-ap-links { display: flex; gap: 20px; }
.vf-footer-ap-link { color: #86868b; font-size: 12px; text-decoration: none; }
.vf-footer-ap-link:hover { color: #1d1d1f; }

/* Project Page */
.vf-page-ap-header {
  text-align: center; padding: 100px 40px 60px; max-width: 800px; margin: 0 auto;
}
.vf-page-ap-title {
  font-size: 64px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.015em; line-height: 1.05; margin-bottom: 16px;
}
.vf-page-ap-meta {
  font-size: 17px; color: #86868b; font-weight: 400;
}
.vf-project-description { font-size: 19px; color: #6E6E73; line-height: 1.6; max-width: 680px; margin: 16px auto 24px; text-align: center; }
.vf-page-ap-content {
  background: #ffffff; padding: 80px 40px; border-radius: 32px 32px 0 0; box-shadow: 0 -4px 24px rgba(0,0,0,0.04);
}
.vf-prose-ap {
  max-width: 680px; margin: 0 auto;
}
.vf-prose-ap p {
  font-size: 19px; line-height: 1.6; color: #1d1d1f; margin-bottom: 1.5rem; font-weight: 400;
}
.vf-prose-ap h2, .vf-prose-ap h3 {
  font-weight: 600; color: #1d1d1f; letter-spacing: .004em; margin-top: 2.5rem; margin-bottom: 1rem;
}
.vf-prose-ap h2 { font-size: 32px; }
.vf-prose-ap h3 { font-size: 24px; }
.vf-prose-ap a { color: #7C3AED; text-decoration: none; }
.vf-prose-ap a:hover { text-decoration: underline; }
.vf-prose-ap pre, .vf-prose-ap code {
  background: #f5f5f7; color: #1d1d1f; border-radius: 8px; font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
}
.vf-prose-ap pre { padding: 20px; overflow-x: auto; font-size: 14px; margin: 2rem 0; }
.vf-prose-ap code { padding: 3px 6px; font-size: 0.9em; }
.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin: 60px 0; }
.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }
.vf-gallery img { margin: 0; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); width: 100%; height: 100%; object-fit: cover; }
.vf-image-single { display: flex; justify-content: center; margin: 60px 0; }
.vf-prose-ap blockquote {
  border-left: 4px solid #d2d2d7; padding-left: 1.5rem; color: #86868b; margin: 2rem 0; font-size: 24px; font-style: italic;
}
.vf-prose-ap hr { border: none; border-top: 1px solid #d2d2d7; margin: 3rem 0; }

.vf-back-ap {
  position: absolute; top: 16px; left: 40px; color: #7C3AED; font-size: 14px; font-weight: 400; z-index: 200; display: flex; align-items: center;
}
.vf-back-ap:hover { text-decoration: underline; }

/* ── View toggle (apple) ── */
.vf-section-header-ap { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.view-toggle-container { display: flex; gap: 6px; align-items: center; }
.view-toggle-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer; background: transparent; border: 1px solid #D2D2D7; transition: all 0.15s ease; }
.view-toggle-btn svg { fill: #6E6E73; display: block; }
.view-toggle-btn:hover:not(.active) { background: #f0f0f0; border-color: #adadad; }
.view-toggle-btn.active { background: #1d1d1f; border-color: #1d1d1f; }
.view-toggle-btn.active svg { fill: #ffffff; }
.projects-grid { transition: all 0.2s ease; }
/* Grid view */
#projects-container.view-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
/* List view */
#projects-container.view-list { display: flex; flex-direction: column; gap: 0; }
#projects-container.view-list .vf-card-ap { flex-direction: row; border-radius: 12px; border-bottom: 1px solid #f0f0f0; padding: 16px 0; background: transparent; box-shadow: none; transition: background 0.15s ease, padding-left 0.2s ease; }
#projects-container.view-list .vf-card-ap:hover { background: #f9f9fb; padding-left: 8px; transform: none; box-shadow: none; }
#projects-container.view-list .vf-card-ap-cover { width: 140px; height: 90px; aspect-ratio: unset; flex-shrink: 0; object-fit: cover; border-radius: 8px; }
#projects-container.view-list .vf-card-ap-cover-placeholder { width: 140px; height: 90px; flex-shrink: 0; border-radius: 8px; }
#projects-container.view-list .vf-card-ap-body { padding: 0 0 0 20px; min-height: unset; }
#projects-container.view-list .vf-card-ap-title { font-size: 18px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#projects-container.view-list .vf-card-ap-desc { font-size: 13px; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 600px; }
#projects-container.view-list .vf-card-ap-link { display: none; }
@media (max-width: 640px) {
  .view-toggle-container { display: none; }
  #projects-container.view-grid { grid-template-columns: 1fr; }
  #projects-container.view-list .vf-card-ap { flex-direction: column; }
  #projects-container.view-list .vf-card-ap-cover, #projects-container.view-list .vf-card-ap-cover-placeholder { width: 100%; height: 180px; }
  #projects-container.view-list .vf-card-ap-body { padding: 12px 0 0; }
}
${CALLOUT_CSS}

/* ── Public Properties (Apple) ── */
.vf-properties {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; padding: 24px 0;
  border-top: 0.5px solid #D2D2D7; border-bottom: 0.5px solid #D2D2D7;
  margin: 20px auto 32px; max-width: 680px;
}
.vf-property-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
  color: #6E6E73; display: block; margin-bottom: 4px;
}
.vf-property-value { font-size: 15px; color: #1D1D1F; display: block; }
.vf-property-link { font-size: 15px; color: #7C3AED; text-decoration: none; }
.vf-property-link:hover { text-decoration: underline; }

/* About (Apple) */
.vf-about-ap {
  max-width: 680px; margin: 0 auto; padding: 100px 40px;
  border-top: 0.5px solid #d2d2d7;
}
.vf-about-ap-text {
  font-size: 17px; color: #1d1d1f; line-height: 1.7;
}
`;

function buildAppleIndex(notes: ParsedNote[], settings: VaultFolioSettings): SiteFile {
  const siteTitle = settings.siteName;
  const rows = notes.map((n, i) => {
    const title = n.displayTitle;
    const desc = getCardDescription(n);
    const tags = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
      .map((t) => String(t).toLowerCase());

    const tagHtml = tags.slice(0, 3).map(t => `<span class="vf-tag-ap">${escapeHtml(t)}</span>`).join("");

    const coverFilename = resolveCoverFilename(n.frontmatter.cover);
    const gradient = generateGradient(title, false);
    const coverHtml = coverFilename
      ? `<img class="vf-card-ap-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
      : `<div class="vf-card-ap-cover-placeholder" style="background:${gradient};display:flex;align-items:center;justify-content:center;overflow:hidden"><span style="font-size:64px;font-weight:800;color:rgba(255,255,255,0.25);user-select:none;line-height:1;font-family:-apple-system,sans-serif">${escapeHtml(title.charAt(0).toUpperCase())}</span></div>`;

    return `
<a href="pages/${n.slug}.html" class="vf-card-ap vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">
  ${coverHtml}
  <div class="vf-card-ap-body">
    <div class="vf-card-ap-title">${escapeHtml(title)}</div>
    ${desc ? `<div class="vf-card-ap-desc">${escapeHtml(desc)}</div>` : ""}
    ${tagHtml ? `<div class="vf-card-ap-tags">${tagHtml}</div>` : ""}
    <div class="vf-card-ap-link">Learn more &gt;</div>
  </div>
</a>`;
  }).join("\n");

  const allTags = Array.from(new Set(notes.flatMap(n => Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]).map(t => String(t).toLowerCase()) : []))).sort();
  const filterHtml = allTags.length > 0 ? `
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all">All</button>
      ${allTags.map((t: string) => `<button class="vf-filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
    </div>
  ` : "";

  const year = new Date().getFullYear();
  const footerNavHtml = settings.navLinks
    ? settings.navLinks.split(",").map(entry => {
        const parts = entry.trim().split(":");
        const label = parts[0].trim();
        const rawHref = parts.slice(1).join(":").trim();
        if (!label || !rawHref) return "";
        const fullHref = normalizeNavHref(rawHref);
        const isExternal = /^https?:\/\//.test(fullHref);
        const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
        return `<a href="${escapeHtml(fullHref)}" class="vf-footer-ap-link"${targetAttr}>${escapeHtml(label)}</a>`;
      }).filter(Boolean).join("")
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)}</title>
  <style>${APPLE_CSS}</style>
</head>
<body class="vf-apple">

<nav class="vf-nav-ap">
  <div class="vf-nav-ap-logo">${escapeHtml(siteTitle)}</div>
  <div style="display:flex;gap:24px;align-items:center;">
    ${settings.navLinks.split(",").map(entry => { const parts = entry.trim().split(":"); const label = parts[0].trim(); const rawHref = parts.slice(1).join(":").trim(); if (!label || !rawHref) return ""; const fullHref = normalizeNavHref(rawHref); const isExternal = /^https?:\/\//.test(fullHref); const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : ""; return `<a href="${escapeHtml(fullHref)}" style="color:#7C3AED; font-size:14px; font-weight:400;"${targetAttr}>${escapeHtml(label)}</a>`; }).filter(Boolean).join("\n    ")}
  </div>
</nav>

<header class="vf-hero-ap">
  <h1 class="vf-hero-ap-title">${escapeHtml(settings.heroTitle || siteTitle)}</h1>
  ${settings.heroSubtitle ? `<p class="vf-hero-ap-subtitle">${escapeHtml(settings.heroSubtitle)}</p>` : ""}
</header>

<section id="work" class="vf-projects-ap">
  <div class="vf-section-header-ap">
    ${renderViewToggle()}
  </div>
  ${filterHtml}
  <div id="projects-container" class="projects-grid view-grid">
    ${rows}
  </div>
</section>

${settings.aboutText ? `<section class="vf-about-ap">
  <p class="vf-about-ap-text">${settings.aboutText}</p>
</section>` : ""}

${settings.quoteText ? `<section class="vf-quote-ap">
  <p>${escapeHtml(settings.quoteText)}</p>
</section>` : ""}

<footer class="vf-footer-ap">
  <span>&copy; ${year} ${escapeHtml(siteTitle)} — Built with VaultFolio</span>
  ${footerNavHtml ? `<div class="vf-footer-ap-links">${footerNavHtml}</div>` : ""}
</footer>

${allTags.length > 0 ? renderTagFilterScript() : ""}
${renderViewToggleScript()}
</body>
</html>`;

  return { path: "index.html", content: html };
}

function buildApplePage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = note.displayTitle;
  const date = note.frontmatter.date as string | undefined;
  const description = (note.frontmatter.description as string | undefined) ?? "";
  const descHtml = description && !("description" in note.publicProperties)
    ? `<p class="vf-project-description">${escapeHtml(description)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - ${escapeHtml(siteTitle)}</title>
  <style>${APPLE_CSS}${renderGalleryCSS('apple')}</style>
</head>
<body class="vf-apple">

<nav class="vf-nav-ap" style="justify-content: center; position: relative;">
  <a href="../index.html" class="vf-back-ap">&lt; Back</a>
  <div class="vf-nav-ap-logo">${escapeHtml(title)}</div>
</nav>

<header class="vf-page-ap-header">
  <h1 class="vf-page-ap-title">${escapeHtml(title)}</h1>
  ${date ? `<p class="vf-page-ap-meta">${escapeHtml(date)}</p>` : ""}
  ${descHtml}
</header>

<main class="vf-page-ap-content">
  ${renderPublicProperties(note)}
  ${buildProseWithGallery(note, 'vf-prose-ap')}
</main>

<footer class="vf-footer-ap" style="border-top: none; padding-top: 80px;">
  &copy; ${new Date().getFullYear()} ${escapeHtml(siteTitle)} — Built with VaultFolio
</footer>

${renderLightboxHtml()}
${renderGalleryScript()}
</body>
</html>`;
  return { path: `pages/${note.slug}.html`, content: html };
}

// ════════════════════════════════════════════════════════════════════════════
// THEME: SIMPLE
// ════════════════════════════════════════════════════════════════════════════

const SIMPLE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #ffffff;
  color: #1a1a1a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
a { color: #1a1a1a; text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }

/* Nav */
.sp-nav {
  padding: 20px 40px;
  border-bottom: 1px solid #eee;
}
.sp-nav-logo { font-size: 16px; font-weight: 600; }

/* Hero */
.sp-hero {
  padding: 60px 40px 48px;
  max-width: 800px;
  margin: 0 auto;
}
.sp-hero h1 { font-size: 32px; font-weight: 700; margin-bottom: 12px; }
.sp-hero p { font-size: 16px; color: #555; }

/* Projects */
.sp-section { max-width: 800px; margin: 0 auto; padding: 0 40px 80px; }
.sp-section-heading {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: #999; margin-bottom: 24px;
}
.sp-cards { display: flex; flex-direction: column; gap: 16px; }
.sp-card {
  display: block;
  border: 1px solid #eee;
  padding: 0;
  color: #1a1a1a;
  overflow: hidden;
}
.sp-card-cover {
  width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block;
  border-bottom: 1px solid #eee;
}
.sp-card-cover-placeholder {
  width: 100%; height: 200px;
  background: linear-gradient(135deg, #EDE9FE, #C4B5FD);
  border-bottom: 1px solid #eee;
}
.sp-card-body { padding: 24px; min-height: 120px; display: flex; flex-direction: column; gap: 8px; }
.sp-card-title { font-size: 18px; font-weight: 600; }
.sp-card-link { font-size: 13px; color: #555; margin-top: auto; display: inline-block; }
.sp-card-desc { font-size: 14px; color: #555; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.sp-card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.sp-tag {
  font-size: 12px; color: #777;
  padding: 2px 8px;
  border: 1px solid #ddd;
}
.sp-empty { font-size: 15px; color: #999; padding: 24px 0; }

/* Footer */
.sp-footer {
  border-top: 1px solid #eee;
  padding: 32px 40px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

/* Project page */
.sp-back {
  display: inline-block;
  padding: 24px 40px 0;
  font-size: 14px;
  color: #555;
}
.sp-page-header { max-width: 800px; margin: 0 auto; padding: 32px 40px 24px; }
.sp-page-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
.sp-page-date { font-size: 13px; color: #999; margin-bottom: 12px; }
.sp-page-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 0; }
.vf-project-description { font-size: 16px; color: #555; line-height: 1.7; margin: 12px 0 20px; }
.sp-page-tag {
  font-size: 12px; color: #777;
  padding: 2px 8px;
  border: 1px solid #ddd;
}
.sp-page-content { max-width: 800px; margin: 0 auto; padding: 32px 40px 80px; }

/* Prose */
.sp-prose h1 { font-size: 26px; font-weight: 700; margin: 2rem 0 0.8rem; }
.sp-prose h2 { font-size: 22px; font-weight: 700; margin: 2rem 0 0.8rem; }
.sp-prose h3 { font-size: 18px; font-weight: 600; margin: 1.5rem 0 0.6rem; }
.sp-prose h4, .sp-prose h5, .sp-prose h6 { font-size: 16px; font-weight: 600; margin: 1.2rem 0 0.5rem; }
.sp-prose p { font-size: 16px; line-height: 1.8; color: #333; margin: 1rem 0; }
.sp-prose a { color: #1a1a1a; text-decoration: underline; }
.sp-prose strong { font-weight: 600; }
.sp-prose em { font-style: italic; }
.sp-prose ul { list-style: disc; padding-left: 1.5rem; margin: 0.8rem 0; }
.sp-prose ol { list-style: decimal; padding-left: 1.5rem; margin: 0.8rem 0; }
.sp-prose li { font-size: 16px; line-height: 1.8; color: #333; margin: 0.3rem 0; }
.sp-prose code { background: #f5f5f5; padding: 1px 5px; font-size: 0.875em; font-family: 'SF Mono', Consolas, monospace; }
.sp-prose pre { background: #f5f5f5; padding: 20px; overflow-x: auto; margin: 1.5rem 0; }
.sp-prose pre code { background: none; padding: 0; }
.sp-prose blockquote { border-left: 3px solid #ddd; padding-left: 16px; color: #666; font-style: italic; margin: 1.5rem 0; }
.sp-prose hr { border: none; border-top: 1px solid #eee; margin: 2rem 0; }
.sp-prose img { width: 100%; margin: 1.5rem 0; }

/* View toggle */
.sp-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.sp-section-header .sp-section-heading { margin-bottom: 0; }
.view-toggle-container { display: flex; gap: 6px; align-items: center; }
.view-toggle-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; background: transparent; border: 1px solid #ddd; transition: all 0.15s ease; }
.view-toggle-btn svg { fill: #aaa; display: block; }
.view-toggle-btn.active { background: #1a1a1a; border-color: #1a1a1a; }
.view-toggle-btn.active svg { fill: #fff; }

/* Grid view */
#projects-container.view-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
#projects-container.view-grid .sp-card { display: flex; flex-direction: column; }
#projects-container.view-grid .sp-card-cover { aspect-ratio: 16/9; width: 100%; }
#projects-container.view-grid .sp-card-cover-placeholder { height: 160px; width: 100%; }

/* List view */
#projects-container.view-list { display: flex; flex-direction: column; gap: 0; }
#projects-container.view-list .sp-card { display: flex; flex-direction: row; align-items: stretch; border-bottom: none; border-top: none; border-left: none; border-right: none; border-bottom: 1px solid #eee; padding: 0; }
#projects-container.view-list .sp-card:first-child { border-top: 1px solid #eee; }
#projects-container.view-list .sp-card-cover { width: 140px; min-width: 140px; height: 100px; aspect-ratio: unset; flex-shrink: 0; border-bottom: none; border-right: 1px solid #eee; }
#projects-container.view-list .sp-card-cover-placeholder { width: 140px; min-width: 140px; height: 100px; flex-shrink: 0; border-bottom: none; border-right: 1px solid #eee; }
#projects-container.view-list .sp-card-body { padding: 16px 20px; display: flex; flex-direction: column; justify-content: center; }
#projects-container.view-list .sp-card-desc { -webkit-line-clamp: 2; }

@media (max-width: 640px) {
  .sp-nav { padding: 16px 20px; }
  .sp-hero { padding: 40px 20px 32px; }
  .sp-section { padding: 0 20px 60px; }
  .sp-card { padding: 18px; }
  .sp-back { padding: 16px 20px 0; }
  .sp-page-header { padding: 20px 20px 16px; }
  .sp-page-content { padding: 20px 20px 60px; }
  .view-toggle-container { display: none; }
  #projects-container.view-grid { grid-template-columns: 1fr; }
  #projects-container.view-list .sp-card { flex-direction: column; }
  #projects-container.view-list .sp-card-cover,
  #projects-container.view-list .sp-card-cover-placeholder { width: 100%; min-width: unset; height: 160px; border-right: none; border-bottom: 1px solid #eee; }
}
${CALLOUT_CSS}

/* ── Public Properties (Simple) ── */
.vf-properties {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px; padding: 20px 40px;
  border-top: 1px solid #eee; border-bottom: 1px solid #eee;
  max-width: 800px; margin: 0 auto 28px;
}
.vf-property-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  color: #999; display: block; margin-bottom: 4px;
}
.vf-property-value { font-size: 14px; color: #1a1a1a; }
.vf-property-link { font-size: 14px; color: #0A0A0A; text-decoration: underline; }

/* Nav links */
.sp-nav { display: flex; justify-content: space-between; align-items: center; }
.sp-nav-links { display: flex; gap: 20px; align-items: center; }
.sp-nav-link { font-size: 14px; color: #555; }
.sp-nav-link:hover { color: #1a1a1a; }

/* Tag filter */
.sp-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.sp-filter-btn { font-size: 12px; padding: 4px 12px; border: 1px solid #ddd; background: none; cursor: pointer; color: #555; font-family: inherit; }
.sp-filter-btn.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }

/* About */
.sp-about { max-width: 800px; margin: 0 auto; padding: 60px 40px; border-top: 1px solid #eee; }
.sp-about-text { font-size: 15px; line-height: 1.8; color: #444; }

/* Quote */
.sp-quote { max-width: 800px; margin: 0 auto; padding: 48px 40px; border-top: 1px solid #eee; }
.sp-quote-text { font-size: 18px; font-style: italic; color: #777; line-height: 1.7; }

@media (max-width: 640px) {
  .sp-nav-links { gap: 12px; }
  .sp-about { padding: 40px 20px; }
  .sp-quote { padding: 32px 20px; }
}
`.trim();

function buildSimpleIndex(notes: ParsedNote[], settings: VaultFolioSettings): SiteFile {
  const siteTitle = settings.siteName;
  const cards = notes
    .map((n) => {
      const title = n.displayTitle;
      const desc  = getCardDescription(n);
      const tags  = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
        .map((t) => String(t).toLowerCase());
      const tagHtml = tags
        .map((t) => `<span class="sp-tag">${escapeHtml(t)}</span>`)
        .join("");
      const coverFilename = resolveCoverFilename(n.frontmatter.cover);
      const gradient = generateGradient(title, false);
      const coverHtml = coverFilename
        ? `<img class="sp-card-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
        : `<div class="sp-card-cover-placeholder" style="background:${gradient};display:flex;align-items:center;justify-content:center;overflow:hidden"><span style="font-size:64px;font-weight:800;color:rgba(255,255,255,0.25);user-select:none;line-height:1;font-family:-apple-system,sans-serif">${escapeHtml(title.charAt(0).toUpperCase())}</span></div>`;
      return `<a href="pages/${n.slug}.html" class="sp-card vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">
  ${coverHtml}
  <div class="sp-card-body">
    <div class="sp-card-title">${escapeHtml(title)}</div>
    ${desc ? `<div class="sp-card-desc">${escapeHtml(desc)}</div>` : ""}
    ${tags.length > 0 ? `<div class="sp-card-tags">${tagHtml}</div>` : ""}
    <span class="sp-card-link">Learn more →</span>
  </div>
</a>`;
    })
    .join("\n");

  const allTags = Array.from(new Set(
    notes.flatMap(n => Array.isArray(n.frontmatter.tags)
      ? (n.frontmatter.tags as string[]).map(t => String(t).toLowerCase())
      : [])
  )).sort();

  const filterHtml = allTags.length > 0 ? `
<div class="sp-filter-bar">
  <button class="sp-filter-btn active" data-filter="all">All</button>
  ${allTags.map((t: string) => `<button class="sp-filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
</div>` : "";

  const navLinkItems = settings.navLinks
    ? settings.navLinks.split(",").map(entry => {
        const parts = entry.trim().split(":");
        const label = parts[0].trim();
        const rawHref = parts.slice(1).join(":").trim();
        if (!label || !rawHref) return "";
        const fullHref = normalizeNavHref(rawHref);
        const isExternal = /^https?:\/\//.test(fullHref);
        const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
        return `<a href="${escapeHtml(fullHref)}" class="sp-nav-link"${targetAttr}>${escapeHtml(label)}</a>`;
      }).filter(Boolean).join("\n    ")
    : "";

  const heroTitle = settings.heroTitle || siteTitle;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)}</title>
  <style>${SIMPLE_CSS}</style>
</head>
<body>

<nav class="sp-nav">
  <a href="index.html" class="sp-nav-logo">${escapeHtml(siteTitle)}</a>
  ${navLinkItems ? `<div class="sp-nav-links">${navLinkItems}</div>` : ""}
</nav>

<section class="sp-hero">
  <h1>${escapeHtml(heroTitle)}</h1>
  ${settings.heroSubtitle ? `<p>${escapeHtml(settings.heroSubtitle)}</p>` : ""}
</section>

<section class="sp-section">
  <div class="sp-section-header">
    <div class="sp-section-heading">Work</div>
    ${renderViewToggle()}
  </div>
  ${filterHtml}
  ${notes.length > 0
    ? `<div id="projects-container" class="sp-cards view-grid">${cards}</div>`
    : `<p class="sp-empty">No published projects yet.</p>`}
</section>

${settings.aboutText ? `<section class="sp-about" id="about">
  <p class="sp-about-text">${settings.aboutText}</p>
</section>` : ""}

${settings.quoteText ? `<section class="sp-quote">
  <p class="sp-quote-text">${escapeHtml(settings.quoteText)}</p>
</section>` : ""}

<footer class="sp-footer">
  &copy; ${new Date().getFullYear()} ${escapeHtml(siteTitle)} &mdash; Built with VaultFolio
</footer>

${allTags.length > 0 ? renderTagFilterScript().replace(/vf-filter-btn\b/g, "sp-filter-btn") : ""}
${renderViewToggleScript()}
</body>
</html>`;

  return { path: "index.html", content: html };
}

function buildSimplePage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = note.displayTitle;
  const date  = note.frontmatter.date as string | undefined;
  const tags  = (Array.isArray(note.frontmatter.tags) ? (note.frontmatter.tags as string[]) : [])
    .map((t) => String(t).toLowerCase());
  const description = (note.frontmatter.description as string | undefined) ?? "";
  const descHtml = description && !("description" in note.publicProperties)
    ? `<p class="vf-project-description">${escapeHtml(description)}</p>`
    : "";

  const tagHtml = tags
    .map((t) => `<span class="sp-page-tag">${escapeHtml(String(t))}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteTitle)}</title>
  <style>${SIMPLE_CSS}${renderGalleryCSS('simple')}</style>
</head>
<body>

<a href="../index.html" class="sp-back">&larr; Back</a>

<div class="sp-page-header">
  <h1>${escapeHtml(title)}</h1>
  ${date ? `<div class="sp-page-date">${escapeHtml(String(date))}</div>` : ""}
  ${tags.length > 0 ? `<div class="sp-page-tags">${tagHtml}</div>` : ""}
  ${descHtml}
</div>

${renderPublicProperties(note)}

<div class="sp-page-content">
  ${buildProseWithGallery(note, 'sp-prose')}
</div>

<footer class="sp-footer">
  ${escapeHtml(siteTitle)} &mdash; Built with VaultFolio
</footer>

${renderLightboxHtml()}
${renderGalleryScript()}
</body>
</html>`;

  return { path: `pages/${note.slug}.html`, content: html };
}

// ── GLASSMORPHISM THEME ───────────────────────────────────────────────────────

const GLASS_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body.vf-glass {
  background-color: #0D0D1A;
  background-image:
    radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.1) 0%, transparent 70%);
  background-attachment: fixed;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.vf-glass a { color: inherit; text-decoration: none; }
.vf-glass img { max-width: 100%; height: auto; display: block; }

/* ── Navigation ── */
.vf-nav-gl {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  width: calc(100% - 48px); max-width: 1100px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 12px 24px;
  display: flex; justify-content: space-between; align-items: center;
  z-index: 100;
}
.vf-nav-gl-logo { font-weight: 700; font-size: 16px; color: #fff; }
.vf-nav-gl-logo span { color: #FF4D00; }
.vf-nav-gl-links { display: flex; gap: 28px; align-items: center; }
.vf-nav-gl-link { color: rgba(255,255,255,0.7); font-size: 13px; transition: color 0.2s; }
.vf-nav-gl-link:hover { color: #fff; }
.vf-nav-gl-cta {
  background: rgba(124,58,237,0.6);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(124,58,237,0.4); border-radius: 8px; padding: 7px 18px;
  color: white; font-size: 13px; font-family: inherit; cursor: pointer; transition: background 0.2s;
}
.vf-nav-gl-cta:hover { background: rgba(124,58,237,0.8); }

/* ── Hero ── */
.vf-hero-gl { padding: 160px 40px 80px; text-align: center; max-width: 800px; margin: 0 auto; }
.vf-hero-gl-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4);
  border-radius: 100px; padding: 4px 14px 4px 8px;
  font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 24px;
}
.vf-hero-gl-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #7C3AED; box-shadow: 0 0 8px #7C3AED; flex-shrink: 0;
}
.vf-hero-gl-title {
  font-size: clamp(40px, 7vw, 72px); font-weight: 700;
  letter-spacing: -2px; line-height: 1.05;
  background: linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 20px;
}
.vf-hero-gl-subtitle {
  font-size: 17px; color: rgba(255,255,255,0.5);
  max-width: 500px; margin: 0 auto 36px; line-height: 1.7;
}
.vf-hero-gl-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.vf-hero-gl-btn-primary {
  background: linear-gradient(135deg, #7C3AED, #5B21B6);
  border: none; border-radius: 12px; padding: 12px 28px;
  color: white; font-size: 15px; font-weight: 500; font-family: inherit; cursor: pointer;
  box-shadow: 0 0 30px rgba(124,58,237,0.4); transition: box-shadow 0.3s ease;
}
.vf-hero-gl-btn-primary:hover { box-shadow: 0 0 40px rgba(124,58,237,0.6); }
.vf-hero-gl-btn-secondary {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px; padding: 12px 28px; color: rgba(255,255,255,0.8);
  font-size: 15px; font-family: inherit; cursor: pointer;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: background 0.2s;
}
.vf-hero-gl-btn-secondary:hover { background: rgba(255,255,255,0.1); }

/* ── Stats ── */
.vf-stats-gl {
  display: flex; justify-content: center; gap: 48px; flex-wrap: wrap; padding: 40px;
  border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 60px;
}
.vf-stat-gl { text-align: center; }
.vf-stat-gl-num { font-size: 32px; font-weight: 700; color: #fff; display: block; }
.vf-stat-gl-lbl { font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }

/* ── Projects section ── */
.vf-projects-gl { max-width: 1200px; margin: 0 auto; padding: 0 40px 80px; }
.vf-section-header-gl {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.vf-section-label-gl {
  font-size: 11px; font-weight: 600; letter-spacing: 0.15em;
  text-transform: uppercase; color: rgba(255,255,255,0.4);
}

/* ── View toggle ── */
.view-toggle-container { display: flex; gap: 6px; align-items: center; }
.view-toggle-btn {
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; cursor: pointer;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); transition: all 0.15s ease;
}
.view-toggle-btn svg { fill: rgba(255,255,255,0.5); display: block; }
.view-toggle-btn.active { background: rgba(124,58,237,0.6); border-color: rgba(124,58,237,0.4); }
.view-toggle-btn.active svg { fill: #fff; }

/* ── Glass cards ── */
.glass-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden;
  transition: all 0.3s ease; cursor: pointer; display: flex; flex-direction: column;
  text-decoration: none; color: inherit;
}
.glass-card:hover {
  background: rgba(255,255,255,0.07); border-color: rgba(124,58,237,0.3);
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,58,237,0.1);
}
.glass-card-cover { aspect-ratio: 16/9; overflow: hidden; }
.glass-card-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.glass-card-cover-placeholder {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2));
  display: flex; align-items: center; justify-content: center;
}
.glass-card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.glass-card-title { font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 8px; }
.glass-card-desc {
  font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 14px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.glass-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
.glass-tag {
  background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3);
  border-radius: 100px; padding: 3px 10px; font-size: 11px; color: rgba(255,255,255,0.7);
}
.glass-card-link {
  color: #A78BFA; font-size: 13px; text-decoration: none;
  display: inline-flex; align-items: center; gap: 4px; margin-top: auto; padding-top: 14px;
  transition: color 0.2s;
}
.glass-card-link:hover { color: #fff; }

/* ── Grid / list layout ── */
#projects-container.view-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
}
#projects-container.view-list { display: flex; flex-direction: column; gap: 8px; }
#projects-container.view-list .glass-card {
  flex-direction: row; border-radius: 12px; padding: 16px;
  background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06);
}
#projects-container.view-list .glass-card:hover {
  background: rgba(255,255,255,0.06); border-color: rgba(124,58,237,0.2);
  transform: none; box-shadow: none;
}
#projects-container.view-list .glass-card-cover,
#projects-container.view-list .glass-card-cover-placeholder {
  width: 120px; height: 80px; aspect-ratio: unset; flex-shrink: 0; border-radius: 8px; overflow: hidden;
}
#projects-container.view-list .glass-card-body { padding: 0 0 0 16px; }
#projects-container.view-list .glass-card-title { font-size: 15px; }
#projects-container.view-list .glass-card-link { display: none; }

/* ── Tag filter ── */
.vf-filter-bar-gl { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.vf-filter-btn-gl {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px; padding: 6px 16px; font-size: 13px; color: rgba(255,255,255,0.6);
  font-family: inherit; cursor: pointer; transition: all 0.2s;
}
.vf-filter-btn-gl:hover { background: rgba(255,255,255,0.1); color: #fff; }
.vf-filter-btn-gl.active { background: rgba(124,58,237,0.4); border-color: rgba(124,58,237,0.5); color: #fff; }

/* ── About ── */
.vf-about-gl {
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 24px; padding: 60px 40px; margin: 0 40px 60px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
}
.vf-about-gl-heading { font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 16px; letter-spacing: -1px; }
.vf-about-gl-text { color: rgba(255,255,255,0.5); line-height: 1.8; font-size: 15px; }
.vf-skills-gl { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
.vf-skill-gl {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; padding: 6px 14px; color: rgba(255,255,255,0.7); font-size: 13px;
}

/* ── Footer ── */
.vf-footer-gl {
  border-top: 1px solid rgba(255,255,255,0.06); padding: 32px 40px;
  display: flex; justify-content: space-between; align-items: center;
  color: rgba(255,255,255,0.4); font-size: 13px; max-width: 1200px; margin: 0 auto;
}
.vf-footer-gl-accent { color: #FF4D00; }

/* ── Project page ── */
.vf-page-gl { max-width: 800px; margin: 0 auto; padding: 120px 40px 80px; }
.vf-back-gl {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px; padding: 8px 16px; color: rgba(255,255,255,0.7);
  font-size: 14px; margin-bottom: 40px; transition: background 0.2s;
}
.vf-back-gl:hover { background: rgba(255,255,255,0.1); color: #fff; }
.vf-page-gl-title {
  font-size: clamp(36px, 6vw, 64px); font-weight: 700; color: #fff;
  letter-spacing: -1.5px; margin-bottom: 16px; line-height: 1.05;
}
.vf-page-gl-meta { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
.vf-page-gl-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 32px; }
.vf-project-description { font-size: 17px; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 680px; margin: 16px auto 24px; text-align: center; }
.vf-page-gl-content {
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px; padding: 40px; margin-top: 32px;
  color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.9;
}
.vf-prose-gl p { margin-bottom: 1.5rem; }
.vf-prose-gl h2, .vf-prose-gl h3 {
  color: #fff; font-weight: 600; letter-spacing: -0.5px; margin-top: 2.5rem; margin-bottom: 1rem;
}
.vf-prose-gl h2 { font-size: 28px; }
.vf-prose-gl h3 { font-size: 22px; }
.vf-prose-gl a { color: #A78BFA; }
.vf-prose-gl a:hover { color: #fff; }
.vf-prose-gl pre, .vf-prose-gl code {
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9);
  border-radius: 8px; font-family: ui-monospace, Menlo, Monaco, monospace;
}
.vf-prose-gl pre { padding: 20px; overflow-x: auto; font-size: 14px; margin: 2rem 0; }
.vf-prose-gl code { padding: 3px 6px; font-size: 0.9em; }
.vf-prose-gl blockquote {
  border-left: 3px solid rgba(124,58,237,0.8); padding-left: 1.5rem;
  color: rgba(255,255,255,0.5); margin: 2rem 0; font-style: italic;
}
.vf-prose-gl hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 3rem 0; }
.vf-prose-gl .callout {
  background: rgba(255,255,255,0.04) !important; border: 1px solid rgba(255,255,255,0.1) !important;
  border-left: 3px solid rgba(124,58,237,0.8) !important; border-radius: 0 8px 8px 0 !important;
  padding: 12px 16px !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}

/* ── Gallery overrides ── */
.vf-gallery img { border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
.vf-image-single { display: flex; justify-content: center; margin: 2rem 0; }

@media (max-width: 768px) {
  .vf-nav-gl { backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  .glass-card { backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  .vf-about-gl { grid-template-columns: 1fr; margin: 0 16px 40px; }
  .vf-projects-gl { padding: 0 16px 60px; }
  .vf-hero-gl { padding: 120px 24px 60px; }
  #projects-container.view-list .glass-card-cover,
  #projects-container.view-list .glass-card-cover-placeholder { display: none; }
}
@media (max-width: 640px) {
  .view-toggle-container { display: none; }
  #projects-container.view-grid { grid-template-columns: 1fr; }
}
${CALLOUT_CSS}

/* ── Public Properties (Glass) ── */
.vf-properties {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; padding: 24px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; margin: 20px 0 32px;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.vf-property-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.35); display: block; margin-bottom: 4px;
}
.vf-property-value { font-size: 15px; color: rgba(255,255,255,0.85); }
.vf-property-link { font-size: 15px; color: #A78BFA; text-decoration: none; }
.vf-property-link:hover { color: #fff; }

/* Quote (Glass) */
.vf-quote-gl {
  max-width: 760px; margin: 0 auto 60px; padding: 48px 32px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 24px;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.vf-quote-gl-text {
  font-size: 20px; font-style: italic; font-weight: 300;
  color: rgba(255,255,255,0.45); line-height: 1.7;
}
`;

function buildGlassIndex(notes: ParsedNote[], settings: VaultFolioSettings): SiteFile {
  const siteTitle = settings.siteName;

  const cards = notes.map((n) => {
    const title = n.displayTitle;
    const desc = getCardDescription(n);
    const tags = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
      .map((t) => String(t).toLowerCase());
    const tagHtml = tags.map(t => `<span class="glass-tag">${escapeHtml(t)}</span>`).join("");
    const coverFilename = resolveCoverFilename(n.frontmatter.cover);
    const gradient = generateGradient(title, true);
    const coverHtml = coverFilename
      ? `<div class="glass-card-cover"><img src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" /></div>`
      : `<div class="glass-card-cover-placeholder" style="background:${gradient};overflow:hidden"><span style="font-size:64px;font-weight:800;color:rgba(255,255,255,0.25);user-select:none;line-height:1;font-family:-apple-system,sans-serif">${escapeHtml(title.charAt(0).toUpperCase())}</span></div>`;
    return `
<a href="pages/${n.slug}.html" class="glass-card vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">
  ${coverHtml}
  <div class="glass-card-body">
    <div class="glass-card-title">${escapeHtml(title)}</div>
    ${desc ? `<div class="glass-card-desc">${escapeHtml(desc)}</div>` : ""}
    ${tagHtml ? `<div class="glass-card-tags">${tagHtml}</div>` : ""}
    <span class="glass-card-link">Learn more →</span>
  </div>
</a>`;
  }).join("\n");

  const allTags = Array.from(new Set(
    notes.flatMap(n => Array.isArray(n.frontmatter.tags)
      ? (n.frontmatter.tags as string[]).map(t => String(t).toLowerCase())
      : [])
  )).sort();

  const filterHtml = allTags.length > 0 ? `
<div class="vf-filter-bar-gl">
  <button class="vf-filter-btn-gl active" data-filter="all">All</button>
  ${allTags.map((t: string) => `<button class="vf-filter-btn-gl" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
</div>` : "";

  const navLinks = settings.navLinks.split(",").map(entry => {
    const parts = entry.trim().split(":");
    const label = parts[0].trim();
    const rawHref = parts.slice(1).join(":").trim();
    if (!label || !rawHref) return "";
    const fullHref = normalizeNavHref(rawHref);
    const isExternal = /^https?:\/\//.test(fullHref);
    const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${escapeHtml(fullHref)}" class="vf-nav-gl-link"${targetAttr}>${escapeHtml(label)}</a>`;
  }).filter(Boolean).join("\n    ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)}</title>
  <style>${GLASS_CSS}</style>
</head>
<body class="vf-glass">

<nav class="vf-nav-gl">
  <div class="vf-nav-gl-logo">${escapeHtml(siteTitle)}</div>
  <div class="vf-nav-gl-links">
    ${navLinks}
  </div>
</nav>

<header class="vf-hero-gl">
  <div class="vf-hero-gl-badge">
    <span class="vf-hero-gl-badge-dot"></span>
    Portfolio — ${new Date().getFullYear()}
  </div>
  <h1 class="vf-hero-gl-title">${escapeHtml(settings.heroTitle || siteTitle)}</h1>
  ${settings.heroSubtitle ? `<p class="vf-hero-gl-subtitle">${escapeHtml(settings.heroSubtitle)}</p>` : ""}
  <div class="vf-hero-gl-cta-row">
    <button class="vf-hero-gl-btn-primary" onclick="document.getElementById('work').scrollIntoView({behavior:'smooth'})">View Work</button>
    ${settings.aboutText ? `<button class="vf-hero-gl-btn-secondary" onclick="document.getElementById('about').scrollIntoView({behavior:'smooth'})">About Me</button>` : ""}
  </div>
</header>

<section id="work" class="vf-projects-gl">
  <div class="vf-section-header-gl">
    <span class="vf-section-label-gl">Selected Work</span>
    ${renderViewToggle()}
  </div>
  ${filterHtml}
  <div id="projects-container" class="view-grid">
    ${cards}
  </div>
</section>

${settings.aboutText ? `<section id="about" class="vf-about-gl">
  <div>
    <div class="vf-about-gl-heading">About</div>
    <div class="vf-about-gl-text">${escapeHtml(settings.aboutText)}</div>
  </div>
</section>` : ""}

${settings.quoteText ? `<div class="vf-quote-gl">
  <p class="vf-quote-gl-text">${escapeHtml(settings.quoteText)}</p>
</div>` : ""}

<footer class="vf-footer-gl">
  <span>© ${new Date().getFullYear()} ${escapeHtml(siteTitle)}</span>
  <span>Built with Vault<span class="vf-footer-gl-accent">Folio</span></span>
  <span>${escapeHtml(siteTitle)}</span>
</footer>

${allTags.length > 0 ? renderTagFilterScript().replace(/vf-filter-btn\b/g, "vf-filter-btn-gl") : ""}
${renderViewToggleScript()}
</body>
</html>`;

  return { path: "index.html", content: html };
}

function buildGlassPage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = note.displayTitle;
  const date = note.frontmatter.date as string | undefined;
  const tags = (Array.isArray(note.frontmatter.tags) ? (note.frontmatter.tags as string[]) : [])
    .map((t) => String(t).toLowerCase());
  const description = (note.frontmatter.description as string | undefined) ?? "";
  const descHtml = description && !("description" in note.publicProperties)
    ? `<p class="vf-project-description">${escapeHtml(description)}</p>`
    : "";
  const tagHtml = tags.map(t => `<span class="glass-tag">${escapeHtml(t)}</span>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteTitle)}</title>
  <style>${GLASS_CSS}${renderGalleryCSS('glass')}</style>
</head>
<body class="vf-glass">

<div class="vf-page-gl">
  <a href="../index.html" class="vf-back-gl">← Back</a>

  <h1 class="vf-page-gl-title">${escapeHtml(title)}</h1>
  ${date ? `<div class="vf-page-gl-meta">${escapeHtml(String(date))}</div>` : ""}
  ${tags.length > 0 ? `<div class="vf-page-gl-tags">${tagHtml}</div>` : ""}
  ${descHtml}
  ${renderPublicProperties(note)}

  <div class="vf-page-gl-content">
    ${buildProseWithGallery(note, 'vf-prose-gl')}
  </div>
</div>

${renderLightboxHtml()}
${renderGalleryScript()}
</body>
</html>`;

  return { path: `pages/${note.slug}.html`, content: html };
}

