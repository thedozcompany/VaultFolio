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
const SWISS_PLACEHOLDER_COLORS = ["#f0f0f0", "#e8e8e8", "#f5f5f5", "#e0e0e0"];
const SIMPLE_PLACEHOLDER_COLORS = ["#f8f8f8", "#f0f4f8", "#f8f4f0", "#f0f8f4"];

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
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: #0A0A0A;
  color: #FFFFFF;
  font-family: 'DM Sans', sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }

/* ── Navigation ── */
.vf-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 60px;
  background: transparent;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
  border-bottom: 1px solid transparent;
  transition: background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease;
}
.vf-nav.scrolled {
  background: rgba(0,0,0,0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom-color: rgba(255,255,255,0.1);
}
.vf-nav-logo {
  font-family: 'Syne', sans-serif;
  font-size: 16px; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
  color: #FFFFFF;
}
.vf-nav-links { display: flex; gap: 36px; }
.vf-nav-link {
  font-size: 13px; font-weight: 400; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.7);
  transition: color 0.2s ease;
}
.vf-nav-link:hover { color: #FFFFFF; }

/* ── Hero ── */
.vf-hero {
  height: 100vh;
  min-height: 600px;
  background: #0A0A0A;
  display: flex; align-items: center; justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.vf-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,77,0,0.07) 0%, transparent 70%);
  pointer-events: none;
}
.vf-hero-inner { position: relative; z-index: 1; padding: 0 40px; max-width: 1100px; }
.vf-hero-label {
  display: block; margin-bottom: 32px;
  font-size: 11px; font-weight: 400;
  letter-spacing: 0.3em; text-transform: uppercase;
  color: rgba(255,255,255,0.4);
}
.vf-hero-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(60px, 12vw, 140px);
  font-weight: 800;
  letter-spacing: -4px;
  line-height: 0.9;
  color: #FFFFFF;
  margin-bottom: 32px;
}
.vf-hero-title em {
  font-style: italic;
  color: #FF4D00;
}
.vf-hero-subtitle {
  font-size: 16px; font-weight: 300;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  max-width: 480px;
  margin: 0 auto 60px;
}
.vf-scroll-indicator {
  position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  color: rgba(255,255,255,0.3);
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
}
.vf-scroll-line {
  width: 1px; height: 60px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
  animation: vf-scroll-pulse 2s ease-in-out infinite;
}
@keyframes vf-scroll-pulse {
  0%, 100% { opacity: 0.3; transform: scaleY(1); }
  50% { opacity: 0.8; transform: scaleY(0.6); }
}

/* ── Projects strip section ── */
.vf-projects-section {
  background: #0A0A0A;
  padding: 120px 60px;
  max-width: 1400px;
  margin: 0 auto;
}
.vf-section-label {
  display: block; margin-bottom: 60px;
  font-size: 11px; font-weight: 400;
  letter-spacing: 0.3em; text-transform: uppercase;
  color: rgba(255,255,255,0.3);
}

/* ── Project row ── */
.vf-project-row {
  display: grid;
  grid-template-columns: 60px 80px 1fr auto;
  align-items: center;
  gap: 40px;
  padding: 40px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  text-decoration: none; color: #FFFFFF;
  transition: background 0.3s ease;
  cursor: pointer;
  border-radius: 4px;
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
}
.vf-project-row:hover { background: rgba(255,255,255,0.03); }
.vf-project-row:last-child { border-bottom: 1px solid rgba(255,255,255,0.1); }
.vf-project-num {
  font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 400;
  color: rgba(255,255,255,0.2);
  letter-spacing: 0.1em;
}
.vf-project-name {
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 4vw, 56px);
  font-weight: 700;
  letter-spacing: -1.5px;
  line-height: 1;
  color: #FFFFFF;
  transition: color 0.3s ease;
}
.vf-project-row:hover .vf-project-name { color: #FF4D00; }
.vf-project-meta-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
  flex-shrink: 0;
}
.vf-project-year {
  font-size: 12px; color: rgba(255,255,255,0.3);
  letter-spacing: 0.08em;
}
.vf-project-tags-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
.vf-project-tag-pill {
  font-size: 11px; font-weight: 400;
  color: rgba(255,255,255,0.6);
  padding: 4px 12px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 100px;
  white-space: nowrap;
}
.vf-no-projects {
  font-size: 16px; color: rgba(255,255,255,0.3);
  padding: 60px 0;
}

/* ── Row cover thumbnail ── */
.vf-project-row-cover {
  width: 80px; height: 45px;
  border-radius: 4px; object-fit: cover; display: block;
  flex-shrink: 0; align-self: center;
}
.vf-project-row-cover-placeholder {
  width: 80px; height: 45px; border-radius: 4px;
  background: linear-gradient(135deg, #EDE9FE, #C4B5FD);
  flex-shrink: 0; align-self: center;
}

/* ── Filters ── */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; margin-bottom: 32px; }
.vf-filter-btn {
  background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.6);
  padding: 6px 16px; border-radius: 100px; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.vf-filter-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
.vf-filter-btn.active { background: #fff; color: #000; border-color: #fff; font-weight: 500; }

/* ── About ── */
.vf-about { background: #111111; padding: 120px 60px; }
.vf-about-inner {
  max-width: 1400px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start;
}
.vf-about-left {}
.vf-about-heading {
  font-family: 'Syne', sans-serif;
  font-size: clamp(36px, 4vw, 52px);
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin-bottom: 24px;
}
.vf-about-body {
  font-size: 16px; font-weight: 300;
  color: rgba(255,255,255,0.5);
  line-height: 1.8;
  max-width: 480px;
}
.vf-about-right {}
.vf-about-detail {
  display: flex; flex-direction: column; gap: 28px;
  padding-top: 8px;
}
.vf-about-detail-item {}
.vf-about-detail-label {
  font-size: 10px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  margin-bottom: 8px;
}
.vf-about-detail-value {
  font-size: 15px; color: rgba(255,255,255,0.7);
  font-weight: 300;
}
.vf-skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.vf-skill {
  font-size: 12px; color: rgba(255,255,255,0.5);
  padding: 6px 14px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 100px;
  font-weight: 400;
  transition: border-color 0.2s, color 0.2s;
}
.vf-skill:hover { border-color: rgba(255,77,0,0.5); color: #FF4D00; }

/* ── Footer ── */
.vf-footer {
  background: #0A0A0A;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding: 48px 60px;
  display: flex; align-items: center; justify-content: space-between;
}
.vf-footer-left {
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
  color: #FFFFFF;
}
.vf-footer-right {
  font-size: 12px; color: rgba(255,255,255,0.3);
}
.vf-footer-right a { color: #FF4D00; transition: opacity 0.2s; }
.vf-footer-right a:hover { opacity: 0.7; }

/* ── Back button ── */
.vf-back-wrap {
  position: absolute; top: 80px; left: 60px; z-index: 10;
}
.vf-back-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 400; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.7);
  transition: color 0.2s ease;
}
.vf-back-btn::before {
  content: '←';
  font-size: 16px;
}
.vf-back-btn:hover { color: #FFFFFF; }

/* ── Project page ── */
.vf-project-page { background: #0A0A0A; min-height: 100vh; position: relative; }

.vf-project-hero-block {
  width: 100%;
  height: 50vh; min-height: 400px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  overflow: hidden;
}
.vf-project-hero-block::after {
  content: '';
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.35);
}
.vf-project-hero-title {
  position: relative; z-index: 1;
  font-family: 'Syne', sans-serif;
  font-size: clamp(36px, 5vw, 72px);
  font-weight: 800;
  letter-spacing: -2px;
  line-height: 1;
  color: #FFFFFF;
  text-align: center;
  padding: 0 40px;
}

.vf-project-content {
  max-width: 720px; margin: 0 auto;
  padding: 80px 40px 120px;
}
.vf-project-content-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 700;
  letter-spacing: -1px;
  color: #FFFFFF;
  margin-bottom: 12px;
}
.vf-project-date-line {
  font-size: 13px; color: rgba(255,255,255,0.3);
  letter-spacing: 0.08em;
  margin-bottom: 20px;
}
.vf-project-tags-line { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 48px; }
.vf-project-page-tag {
  font-size: 12px; font-weight: 500;
  color: #FF4D00;
  background: rgba(255,77,0,0.1);
  border: 1px solid rgba(255,77,0,0.3);
  padding: 5px 14px; border-radius: 100px;
}

/* ── Prose ── */
.vf-prose { }
.vf-prose h1 {
  font-family: 'Syne', sans-serif;
  font-size: 32px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;
  color: #FFFFFF; margin: 2.5rem 0 1rem;
}
.vf-prose h2 {
  font-family: 'Syne', sans-serif;
  font-size: 26px; font-weight: 700; letter-spacing: -0.3px; line-height: 1.2;
  color: #FFFFFF; margin: 2.5rem 0 1rem;
}
.vf-prose h3 {
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 600; line-height: 1.3;
  color: #FFFFFF; margin: 2rem 0 0.8rem;
}
.vf-prose h4, .vf-prose h5, .vf-prose h6 {
  font-size: 17px; font-weight: 600;
  color: #FFFFFF; margin: 1.5rem 0 0.6rem;
}
.vf-prose p {
  font-size: 18px; line-height: 1.9; font-weight: 300;
  color: rgba(255,255,255,0.75); margin: 1.4rem 0;
}
.vf-prose a { color: #FF4D00; }
.vf-prose a:hover { text-decoration: underline; }
.vf-prose strong { font-weight: 600; color: #FFFFFF; }
.vf-prose em { font-style: italic; color: rgba(255,255,255,0.9); }
.vf-prose ul { list-style: disc; padding-left: 1.5rem; margin: 1rem 0; }
.vf-prose ol { list-style: decimal; padding-left: 1.5rem; margin: 1rem 0; }
.vf-prose li { font-size: 18px; line-height: 1.9; font-weight: 300; color: rgba(255,255,255,0.75); margin: 0.4rem 0; }
.vf-prose code {
  background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9);
  padding: 2px 7px; border-radius: 4px;
  font-size: 0.875em; font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', monospace;
}
.vf-prose pre {
  background: #111111; color: rgba(255,255,255,0.85);
  padding: 28px; border-radius: 8px; overflow-x: auto;
  margin: 2rem 0; border: 1px solid rgba(255,255,255,0.08);
}
.vf-prose pre code { background: none; padding: 0; color: inherit; }
.vf-prose blockquote {
  border-left: 2px solid #FF4D00;
  padding: 4px 0 4px 24px;
  color: rgba(255,255,255,0.45);
  font-style: italic; margin: 1.5rem 0;
}
.vf-prose hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0; }
.vf-prose img { border-radius: 8px; margin: 0; }
.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 3rem 0; }
.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }
.vf-gallery img { margin: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.vf-image-single { display: flex; justify-content: center; margin: 3rem 0; }

/* ── Nav scroll JS ── */
/* (handled inline via script) */

/* ── Responsive ── */
@media (max-width: 768px) {
  .vf-nav { padding: 0 24px; }
  .vf-nav-links { display: none; }

  .vf-hero-title { letter-spacing: -2px; }
  .vf-hero-subtitle { font-size: 15px; }

  .vf-projects-section { padding: 80px 24px; }
  .vf-project-row {
    grid-template-columns: 40px 1fr;
    gap: 16px;
    margin: 0 -12px;
    padding-left: 12px;
    padding-right: 12px;
  }
  .vf-project-meta-right { display: none; }
  .vf-project-row-cover, .vf-project-row-cover-placeholder { display: none; }
  .vf-project-name { font-size: clamp(22px, 6vw, 36px); letter-spacing: -1px; }

  .vf-about { padding: 80px 24px; }
  .vf-about-inner { grid-template-columns: 1fr; gap: 48px; }
  .vf-about-heading { font-size: 32px; }

  .vf-footer { flex-direction: column; gap: 12px; text-align: center; padding: 40px 24px; }

  .vf-back-wrap { left: 24px; top: 72px; }

  .vf-project-content { padding: 60px 24px 80px; }
  .vf-prose p, .vf-prose li { font-size: 16px; }
}

/* ── View toggle (dark cinematic) ── */
.vf-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 60px; }
.vf-section-header .vf-section-label { margin-bottom: 0; display: inline; }
.view-toggle-container { display: flex; gap: 6px; align-items: center; }
.view-toggle-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; background: transparent; border: 1px solid rgba(255,255,255,0.2); transition: all 0.15s ease; }
.view-toggle-btn svg { fill: rgba(255,255,255,0.4); display: block; }
.view-toggle-btn.active { background: #FF4D00; border-color: #FF4D00; }
.view-toggle-btn.active svg { fill: #fff; }
.projects-grid { transition: all 0.2s ease; }
/* Grid view */
#projects-container.view-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
#projects-container.view-grid .vf-project-row { display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin: 0; padding: 0; overflow: hidden; background: #111; }
#projects-container.view-grid .vf-project-row:first-child { border-top: 1px solid rgba(255,255,255,0.1); }
#projects-container.view-grid .vf-project-row-cover { width: 100%; aspect-ratio: 16/9; height: auto; border-radius: 0; flex-shrink: unset; align-self: unset; }
#projects-container.view-grid .vf-project-row-cover-placeholder { width: 100%; height: 160px; border-radius: 0; flex-shrink: unset; align-self: unset; }
#projects-container.view-grid .vf-project-num { display: none; }
#projects-container.view-grid .vf-project-name { font-size: 20px; padding: 16px 16px 8px; letter-spacing: -0.5px; }
#projects-container.view-grid .vf-project-meta-right { flex-direction: row; justify-content: flex-start; padding: 0 16px 16px; }
#projects-container.view-grid .vf-project-year { display: none; }
/* List view */
#projects-container.view-list { display: flex; flex-direction: column; gap: 0; }
#projects-container.view-list .vf-project-row { flex-direction: row; align-items: center; gap: 20px; padding: 20px 0; border-top: none; border-bottom: 1px solid rgba(255,255,255,0.08); margin: 0; background: transparent; overflow: visible; }
#projects-container.view-list .vf-project-row:hover { background: rgba(255,255,255,0.03); padding-left: 8px; }
#projects-container.view-list .vf-project-row-cover { width: 140px; height: 90px; flex-shrink: 0; border-radius: 8px; object-fit: cover; aspect-ratio: unset; align-self: auto; }
#projects-container.view-list .vf-project-row-cover-placeholder { width: 140px; height: 90px; flex-shrink: 0; border-radius: 8px; background: linear-gradient(135deg, #1a1a1a, #333); }
#projects-container.view-list .vf-project-num { display: none; }
#projects-container.view-list .vf-project-name { font-size: 18px; font-weight: 600; padding: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#projects-container.view-list .vf-project-meta-right { flex-direction: column; align-items: flex-start; gap: 6px; padding: 0; flex: 1; }
#projects-container.view-list .vf-project-year { display: none; }
@media (max-width: 640px) {
  .view-toggle-container { display: none; }
  #projects-container.view-grid { grid-template-columns: 1fr; }
  #projects-container.view-list .vf-project-row { flex-direction: column; }
  #projects-container.view-list .vf-project-row-cover, #projects-container.view-list .vf-project-row-cover-placeholder { width: 100%; height: 180px; }
}
${CALLOUT_CSS}
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
  if (theme === "editorial") {
    pages = notes.map((note) => buildEditorialPage(note, siteTitle));
    index = buildEditorialIndex(notes, settings);
  } else if (theme === "apple") {
    pages = notes.map((note) => buildApplePage(note, siteTitle));
    index = buildAppleIndex(notes, settings);
  } else if (theme === "swiss") {
    pages = notes.map((note) => buildSwissPage(note, siteTitle));
    index = buildSwissIndex(notes, settings);
  } else if (theme === "simple") {
    pages = notes.map((note) => buildSimplePage(note, siteTitle));
    index = buildSimpleIndex(notes, siteTitle);
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
      <span class="vf-img-caption">${escapeHtml(img.caption)}</span>
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
    editorial: { lc:'#555',  bc:'#D0D0D0', bg:'#F8F8F8', ac:'#0A0A0A', ic:'#999', ib:'#ccc' },
    apple:     { lc:'#6E6E73', bc:'#D2D2D7', bg:'#F5F5F7', ac:'#7C3AED', ic:'#6E6E73', ib:'#D2D2D7' },
    swiss:     { lc:'#999',  bc:'#E0E0E0', bg:'#F5F5F5', ac:'#0A0A0A', ic:'#999', ib:'#ddd' },
    simple:    { lc:'#999',  bc:'#eee',    bg:'#f9f9f9', ac:'#0A0A0A', ic:'#999', ib:'#ddd' },
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
.vf-gallery-list{display:flex;flex-direction:column;gap:16px;}
.vf-gallery-list .vf-gallery-item{display:flex;flex-direction:column;gap:8px;padding-bottom:16px;border-bottom:1px solid ${c.bc};aspect-ratio:unset;border-radius:0;overflow:visible;}
.vf-gallery-list .vf-gallery-item img{width:100%;max-height:500px;object-fit:contain;border-radius:8px;background:${c.bg};}
.vf-gallery-list .vf-img-caption{font-size:12px;color:${c.lc};text-align:center;font-style:italic;display:block;}
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
  // Project rows
  const rows = notes
    .map((n, i) => {
      const num = String(i + 1).padStart(2, "0");
      const title = n.displayTitle;
      const tags = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
        .map((t) => String(t).toLowerCase());
      const year = extractYear(n.frontmatter.date as string | undefined);

      const tagPills = tags
        .slice(0, 3)
        .map((t) => `<span class="vf-project-tag-pill">${escapeHtml(t)}</span>`)
        .join("");

      const coverFilename = resolveCoverFilename(n.frontmatter.cover);
      const coverHtml = coverFilename
        ? `<img class="vf-project-row-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
        : `<div class="vf-project-row-cover-placeholder"></div>`;

      return `<a href="pages/${n.slug}.html" class="vf-project-row vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">
  <span class="vf-project-num">${num}</span>
  ${coverHtml}
  <span class="vf-project-name">${escapeHtml(title)}</span>
  <div class="vf-project-meta-right">
    ${year ? `<span class="vf-project-year">${escapeHtml(year)}</span>` : ""}
    ${tags.length > 0 ? `<div class="vf-project-tags-row">${tagPills}</div>` : ""}
  </div>
</a>`;
    })
    .join("\n");

  // About skills
  const allTags = collectTags(notes);
  const defaultSkills = ["Design", "Development", "Strategy", "UX", "React", "TypeScript"];
  const skills = allTags.length > 0 ? allTags : defaultSkills;
  const skillChips = skills
    .map((s) => `<span class="vf-skill">${escapeHtml(s)}</span>`)
    .join("");

  // Filter Bar
  const allTagsSorted = Array.from(allTags).sort();
  const filterHtml = allTagsSorted.length > 0 ? `
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all">All</button>
      ${allTagsSorted.map((t: string) => `<button class="vf-filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
    </div>
  ` : "";

  // Hero title — make last word italic + accent
  const titleWords = escapeHtml(siteTitle).split(" ");
  const heroTitle =
    titleWords.length > 1
      ? titleWords.slice(0, -1).join(" ") + " <em>" + titleWords[titleWords.length - 1] + "</em>"
      : "<em>" + titleWords[0] + "</em>";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${htmlHead(escapeHtml(siteTitle))}
</head>
<body>

${renderNav(siteTitle, "", settings.navLinks)}

<!-- Hero -->
<section class="vf-hero">
  <div class="vf-hero-inner">
    <span class="vf-hero-label">Portfolio &mdash; 2026</span>
    <h1 class="vf-hero-title">${heroTitle}</h1>
    <p class="vf-hero-subtitle">${escapeHtml(settings.heroSubtitle)}</p>
  </div>
  <div class="vf-scroll-indicator">
    <span>Scroll</span>
    <div class="vf-scroll-line"></div>
  </div>
</section>

<!-- Projects -->
<section id="work">
  <div class="vf-projects-section">
    <div class="vf-section-header">
      <span class="vf-section-label">Selected Work</span>
      ${renderViewToggle()}
    </div>
    ${filterHtml}
    <div id="projects-container" class="projects-grid view-grid">
      ${notes.length > 0 ? rows : `<p class="vf-no-projects">No published projects yet.</p>`}
    </div>
  </div>
</section>

<!-- About -->
<section class="vf-about" id="about">
  <div class="vf-about-inner">
    <div class="vf-about-left">
      <h2 class="vf-about-heading">Building things that matter.</h2>
      <p class="vf-about-body">${settings.aboutText}</p>
    </div>
    <div class="vf-about-right">
      <div class="vf-about-detail">
        <div class="vf-about-detail-item">
          <div class="vf-about-detail-label">Skills</div>
          <div class="vf-skills">${skillChips}</div>
        </div>
        <div class="vf-about-detail-item">
          <div class="vf-about-detail-label">Available</div>
          <div class="vf-about-detail-value">Open to new opportunities</div>
        </div>
        <div class="vf-about-detail-item">
          <div class="vf-about-detail-label">Contact</div>
          <div class="vf-about-detail-value"><a href="mailto:" style="color:#FF4D00">Get in touch &rarr;</a></div>
        </div>
      </div>
    </div>
  </div>
</section>

${renderFooter(siteTitle)}

${renderViewToggleScript()}
</body>
</html>`;

  return { path: "index.html", content: html };
}

// ── Project page ──────────────────────────────────────────────────────────────

function buildPage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = note.displayTitle;
  const description = (note.frontmatter.description as string | undefined) ?? "";
  const date = note.frontmatter.date as string | undefined;
  const tags = (Array.isArray(note.frontmatter.tags) ? (note.frontmatter.tags as string[]) : [])
    .map((t) => String(t).toLowerCase());
  const idx = Math.abs(hashString(note.slug)) % CARD_COLORS.length;
  const heroBg = CARD_COLORS[idx];

  const tagChips = tags
    .map((t) => `<span class="vf-project-page-tag">${escapeHtml(String(t))}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${htmlHead(`${escapeHtml(title)} — ${escapeHtml(siteTitle)}`)}
  <meta name="description" content="${escapeHtml(description)}" />
  <style>${renderGalleryCSS('default')}</style>
</head>
<body class="vf-project-page">

${renderNav(siteTitle, "../")}

<div class="vf-back-wrap">
  <a href="../index.html" class="vf-back-btn">Back</a>
</div>

<div class="vf-project-hero-block" style="background:${heroBg}">
  <h1 class="vf-project-hero-title">${escapeHtml(title)}</h1>
</div>

<div class="vf-project-content">
  <h2 class="vf-project-content-title">${escapeHtml(title)}</h2>
  ${date ? `<p class="vf-project-date-line">${escapeHtml(String(date))}</p>` : ""}
  ${tags.length > 0 ? `<div class="vf-project-tags-line">${tagChips}</div>` : ""}
  ${buildProseWithGallery(note, 'vf-prose')}
</div>

${renderFooter(siteTitle)}

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

// ── EDITORIAL THEME ──────────────────────────────────────────────────────────

const EDITORIAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body.vf-editorial {
  background: #FFFFFF;
  color: #0A0A0A;
  font-family: 'DM Sans', sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.vf-editorial a { color: inherit; text-decoration: none; }
.vf-editorial img { max-width: 100%; height: auto; display: block; margin: 0; }
.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin: 40px 0; }
.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }
.vf-gallery img { margin: 0; aspect-ratio: 3/4; object-fit: cover; border-radius: 0; }
.vf-image-single { display: flex; justify-content: center; margin: 40px 0; }

/* Navigation */
.vf-nav-ed {
  background: #FFFFFF;
  border-top: 4px solid #0A0A0A;
  border-bottom: 1px solid #0A0A0A;
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.vf-nav-ed-logo {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: #0A0A0A;
}
.vf-nav-ed-left, .vf-nav-ed-right {
  font-size: 14px;
  font-variant: small-caps;
}

/* Hero */
.vf-hero-ed {
  background: #FFFFFF;
  padding: 80px 40px 40px;
}
.vf-hero-ed-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(48px, 10vw, 120px);
  font-weight: 900;
  letter-spacing: -3px;
  line-height: 0.9;
  color: #0A0A0A;
  text-align: left;
}
.vf-hero-ed-divider {
  border-bottom: 3px solid #0A0A0A;
  margin: 40px 0;
}
.vf-hero-ed-cols {
  display: flex; gap: 40px;
  justify-content: space-between;
}
.vf-hero-ed-bio {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 24px;
  max-width: 600px;
}
.vf-hero-ed-stats {
  display: flex; gap: 40px;
}
.vf-hero-ed-stat {
  display: flex; flex-direction: column;
}
.vf-hero-ed-stat-val {
  font-family: 'Playfair Display', serif;
  font-size: 32px; font-weight: 700;
}
.vf-hero-ed-stat-lbl {
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;
}

/* Projects */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px; }
.vf-filter-btn { background: transparent; border: 1px solid #0A0A0A; padding: 4px 16px; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s; }
.vf-filter-btn:hover { background: rgba(0,0,0,0.05); }
.vf-filter-btn.active { background: #0A0A0A; color: #FFFFFF; }

.vf-projects-ed {
  padding: 80px 40px;
  max-width: 1200px;
  margin: 0 auto;
}
.vf-projects-ed-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #0A0A0A;
  border: 1px solid #0A0A0A;
}
.vf-card-ed {
  background: #FFFFFF;
  display: flex; flex-direction: column;
  position: relative;
  text-decoration: none;
  color: #0A0A0A;
}
.vf-card-ed.full { grid-column: 1 / -1; }
.vf-card-ed-header {
  padding: 40px;
  min-height: 300px;
  display: flex; flex-direction: column;
  border-radius: 0;
}
.vf-card-ed-num {
  font-size: 14px;
  margin-bottom: auto;
}
.vf-card-ed-title {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 32px;
  margin-bottom: 16px;
}
.vf-card-ed-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  margin-bottom: 24px;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.vf-card-ed-tags {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 12px;
  margin-bottom: 24px;
}
.vf-card-ed-link {
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  padding-bottom: 2px;
  align-self: flex-start;
}

/* ── Card cover ── */
.vf-card-ed-cover {
  width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block;
  border-bottom: 1px solid #0A0A0A;
}
.vf-card-ed-cover-placeholder {
  width: 100%; height: 200px;
  background: linear-gradient(135deg, #EDE9FE, #C4B5FD);
  border-bottom: 1px solid #0A0A0A;
}

/* Quote */
.vf-quote-ed {
  background: #0A0A0A;
  padding: 80px 40px;
  text-align: center;
}
.vf-quote-ed-text {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4vw, 56px);
  font-style: italic;
  color: #FFFFFF;
}

/* Footer */
.vf-footer-ed {
  border-top: 4px solid #0A0A0A;
  background: #FFFFFF;
  padding: 80px 40px 40px;
}
.vf-footer-ed-cols {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px;
  margin-bottom: 80px;
  font-family: 'Playfair Display', serif;
  font-size: 14px; color: #555;
  max-width: 1200px; margin: 0 auto;
}
.vf-footer-ed-bottom {
  text-align: center; font-size: 11px; color: #999;
  font-family: 'DM Sans', sans-serif;
}

/* Project Page */
.vf-page-ed-header {
  text-align: center;
  padding: 80px 40px 40px;
  border-bottom: 1px solid #0A0A0A;
  max-width: 1200px; margin: 0 auto;
}
.vf-page-ed-issue {
  font-variant: small-caps; margin-bottom: 24px; color: #555;
}
.vf-page-ed-title {
  font-family: 'Playfair Display', serif; font-size: 72px; font-weight: 900; line-height: 1.1; margin-bottom: 24px;
}
.vf-page-ed-meta { font-size: 18px; font-family: 'DM Sans', sans-serif; }

.vf-page-ed-content {
  max-width: 680px; margin: 0 auto; padding: 80px 40px;
}
.vf-prose-ed p {
  font-size: 18px; line-height: 1.9; margin: 1.5rem 0;
}
.vf-prose-ed p:first-of-type::first-letter {
  float: left; font-family: 'Playfair Display', serif; font-size: 72px; line-height: 60px;
  padding-right: 8px; font-weight: 900;
}
.vf-prose-ed a {
  color: #0A0A0A; text-decoration: underline;
}
.vf-prose-ed strong {
  font-weight: 700;
}
.vf-prose-ed pre, .vf-prose-ed code {
  background: #F5F4EF;
  color: #0A0A0A;
  border-radius: 4px;
}
.vf-prose-ed pre { padding: 16px; overflow-x: auto; font-size: 14px; }
.vf-prose-ed code { padding: 2px 4px; }

.vf-page-ed-tags { display: flex; gap: 8px; margin-top: 60px; }
.vf-page-ed-tag { font-variant: small-caps; border: 1px solid #0A0A0A; padding: 4px 12px; font-size: 12px; }

.vf-page-ed-back {
  position: absolute; top: 40px; left: 40px; font-size: 14px; color: #555; text-decoration: none;
}
.vf-page-ed-back:hover { color: #0A0A0A; }

@media (max-width: 768px) {
  .vf-hero-ed-cols { flex-direction: column; }
  .vf-projects-ed-grid { grid-template-columns: 1fr; }
  .vf-footer-ed-cols { grid-template-columns: 1fr; }
  .vf-page-ed-title { font-size: 48px; }
  .vf-nav-ed-left, .vf-nav-ed-right { display: none; }
}

/* ── View toggle (editorial) ── */
.vf-section-header-ed { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.view-toggle-container { display: flex; gap: 6px; align-items: center; }
.view-toggle-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; background: transparent; border: 1px solid #ccc; transition: all 0.15s ease; }
.view-toggle-btn svg { fill: #999; display: block; }
.view-toggle-btn.active { background: #0A0A0A; border-color: #0A0A0A; }
.view-toggle-btn.active svg { fill: #fff; }
.projects-grid { transition: all 0.2s ease; }
/* Grid view */
#projects-container.view-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #0A0A0A; border: 1px solid #0A0A0A; }
#projects-container.view-grid .vf-card-ed.full { grid-column: 1 / -1; }
/* List view */
#projects-container.view-list { display: flex; flex-direction: column; gap: 0; background: transparent; border: none; }
#projects-container.view-list .vf-card-ed { flex-direction: row; align-items: center; border-bottom: 1px solid #0A0A0A; transition: background 0.15s ease, padding-left 0.2s ease; }
#projects-container.view-list .vf-card-ed:hover { background: #f5f5f5; padding-left: 8px; }
#projects-container.view-list .vf-card-ed.full { grid-column: unset; }
#projects-container.view-list .vf-card-ed-cover { width: 140px; height: 90px; flex-shrink: 0; aspect-ratio: unset; border-bottom: none; border-right: 1px solid #0A0A0A; object-fit: cover; }
#projects-container.view-list .vf-card-ed-cover-placeholder { width: 140px; height: 90px; flex-shrink: 0; border-bottom: none; border-right: 1px solid #0A0A0A; }
#projects-container.view-list .vf-card-ed-header { min-height: unset; padding: 16px 20px; flex: 1; justify-content: center; gap: 6px; }
#projects-container.view-list .vf-card-ed-num { margin-bottom: 0; }
#projects-container.view-list .vf-card-ed-title { font-size: 18px; margin-bottom: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#projects-container.view-list .vf-card-ed-desc { font-size: 13px; margin-bottom: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#projects-container.view-list .vf-card-ed-link { display: none; }
@media (max-width: 640px) {
  .view-toggle-container { display: none; }
  #projects-container.view-grid { grid-template-columns: 1fr; }
  #projects-container.view-list .vf-card-ed { flex-direction: column; }
  #projects-container.view-list .vf-card-ed-cover, #projects-container.view-list .vf-card-ed-cover-placeholder { width: 100%; height: 180px; border-right: none; border-bottom: 1px solid #0A0A0A; }
}
${CALLOUT_CSS}
`;

const ED_COLORS = ["#F5F4EF", "#E8E4DC", "#1A1A1A", "#F0EBE0"];

function buildEditorialIndex(notes: ParsedNote[], settings: VaultFolioSettings): SiteFile {
  const siteTitle = settings.siteName;
  const rows = notes.map((n, i) => {
    const num = String(i + 1).padStart(2, "0");
    const title = n.displayTitle;
    const desc = getCardDescription(n);
    const tags = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
      .map((t) => String(t).toLowerCase());

    // Pattern: 0(full), 1(half), 2(half), 3(full) ...
    const isFull = i % 3 === 0;
    const fullClass = isFull ? " full" : "";

    const bgColor = ED_COLORS[i % ED_COLORS.length];
    const textColor = bgColor === "#1A1A1A" ? "#FFFFFF" : "#0A0A0A";

    const tagsStr = tags.slice(0, 3).join(" • ");

    const coverFilename = resolveCoverFilename(n.frontmatter.cover);
    const coverHtml = coverFilename
      ? `<img class="vf-card-ed-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
      : `<div class="vf-card-ed-cover-placeholder"></div>`;

    return `
<a href="pages/${n.slug}.html" class="vf-card-ed${fullClass} vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">
  ${coverHtml}
  <div class="vf-card-ed-header" style="background: ${bgColor}; color: ${textColor};">
    <div class="vf-card-ed-num">NO. ${num}</div>
    <div class="vf-card-ed-title">${escapeHtml(title)}</div>
    ${desc ? `<div class="vf-card-ed-desc">${escapeHtml(desc)}</div>` : ""}
    ${tagsStr ? `<div class="vf-card-ed-tags">${escapeHtml(tagsStr)}</div>` : ""}
    <div class="vf-card-ed-link" style="border-bottom-color: ${textColor}">Read more &rarr;</div>
  </div>
</a>`;
  }).join("n");

  const allTags = Array.from(new Set(notes.flatMap(n => Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]).map(t => String(t).toLowerCase()) : []))).sort();
  const filterHtml = allTags.length > 0 ? `
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all">All</button>
      ${allTags.map((t: string) => `<button class="vf-filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
    </div>
  ` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)} — Editorial</title>
  <style>${EDITORIAL_CSS}</style>
</head>
<body class="vf-editorial">

<nav class="vf-nav-ed">
  <div class="vf-nav-ed-left">April 2026</div>
  <div class="vf-nav-ed-logo">${escapeHtml(siteTitle)}</div>
  <div class="vf-nav-ed-right">Vol. 1</div>
</nav>

<section class="vf-hero-ed">
  <h1 class="vf-hero-ed-title">${escapeHtml(siteTitle)}</h1>
  <div class="vf-hero-ed-divider"></div>
  <div class="vf-hero-ed-cols">
    <div class="vf-hero-ed-bio">${escapeHtml(settings.heroSubtitle)}</div>
    <div class="vf-hero-ed-stats">
      <div class="vf-hero-ed-stat">
        <span class="vf-hero-ed-stat-val">${notes.length}</span>
        <span class="vf-hero-ed-stat-lbl">Projects</span>
      </div>
      <div class="vf-hero-ed-stat">
        <span class="vf-hero-ed-stat-val">10+</span>
        <span class="vf-hero-ed-stat-lbl">Years</span>
      </div>
    </div>
  </div>
</section>

<section class="vf-projects-ed">
  <div class="vf-section-header-ed">
    ${filterHtml}
    ${renderViewToggle()}
  </div>
  <div id="projects-container" class="projects-grid view-grid">
    ${rows}
  </div>
</section>

<section class="vf-quote-ed">
  <p class="vf-quote-ed-text">${escapeHtml(settings.quoteText)}</p>
</section>

<footer class="vf-footer-ed">
  <div class="vf-footer-ed-cols">
    <div><strong>About</strong><br>Crafting digital experiences with precision, intention, and a relentless eye for detail.</div>
    <div><strong>Links</strong><br>Instagram<br>Twitter<br>LinkedIn</div>
    <div><strong>Contact</strong><br>hello@example.com</div>
  </div>
  <div class="vf-footer-ed-bottom">Published with VaultFolio</div>
</footer>

${allTags.length > 0 ? renderTagFilterScript() : ""}
${renderViewToggleScript()}
</body>
</html>`;

  return { path: "index.html", content: html };
}

function buildEditorialPage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = note.displayTitle;
  const date = note.frontmatter.date as string | undefined;
  const tags = (Array.isArray(note.frontmatter.tags) ? (note.frontmatter.tags as string[]) : [])
    .map((t) => String(t).toLowerCase());

  const tagHtml = tags.map(t => `<span class="vf-page-ed-tag">${escapeHtml(t)}</span>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteTitle)}</title>
  <style>${EDITORIAL_CSS}${renderGalleryCSS('editorial')}</style>
</head>
<body class="vf-editorial">

<a href="../index.html" class="vf-page-ed-back">&larr; Back to portfolio</a>

<header class="vf-page-ed-header">
  <div class="vf-page-ed-issue">Feature Project</div>
  <h1 class="vf-page-ed-title">${escapeHtml(title)}</h1>
  <div class="vf-page-ed-meta">${date ? escapeHtml(date) : "Recent Work"}</div>
</header>

<main class="vf-page-ed-content">
  ${buildProseWithGallery(note, 'vf-prose-ed')}
  ${tagHtml ? `<div class="vf-page-ed-tags">${tagHtml}</div>` : ""}
</main>

${renderLightboxHtml()}
${renderGalleryScript()}
</body>
</html>`;
  return { path: `pages/${note.slug}.html`, content: html };
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
  max-width: 980px; margin: 0 auto;
}

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
    const coverHtml = coverFilename
      ? `<img class="vf-card-ap-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
      : `<div class="vf-card-ap-cover-placeholder"></div>`;

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
  <h1 class="vf-hero-ap-title">${escapeHtml(settings.heroTitle)}</h1>
  <p class="vf-hero-ap-subtitle">${escapeHtml(settings.heroSubtitle)}</p>
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

<section class="vf-quote-ap">
  <p>${escapeHtml(settings.quoteText)}</p>
</section>

<footer class="vf-footer-ap">
  Copyright &copy; 2026 ${escapeHtml(siteTitle)}. All rights reserved. <br/>
  Published with VaultFolio.
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
  <p class="vf-page-ap-meta">${date ? escapeHtml(date) : "Project Showcase"}</p>
</header>

<main class="vf-page-ap-content">
  ${buildProseWithGallery(note, 'vf-prose-ap')}
</main>

<footer class="vf-footer-ap" style="border-top: none; padding-top: 80px;">
  Copyright &copy; 2026 ${escapeHtml(siteTitle)}. All rights reserved.
</footer>

${renderLightboxHtml()}
${renderGalleryScript()}
</body>
</html>`;
  return { path: `pages/${note.slug}.html`, content: html };
}

// ── MINIMAL SWISS THEME ──────────────────────────────────────────────────────

const SWISS_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body.vf-swiss {
  background: #ffffff;
  color: #000000;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}
.vf-swiss a { color: inherit; text-decoration: none; }
.vf-swiss img { max-width: 100%; height: auto; display: block; border-radius: 0; }

/* Navigation */
.vf-nav-sw {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 40px;
  border-bottom: 1px solid #000;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  font-size: 14px;
}
.vf-nav-sw-logo { }
.vf-nav-sw-right { text-align: right; }

/* Hero */
.vf-hero-sw {
  padding: 160px 40px;
  border-bottom: 1px solid #000;
}
.vf-hero-sw-inner {
  max-width: 1200px;
}
.vf-hero-sw-title {
  font-size: clamp(64px, 12vw, 160px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.85;
  margin-bottom: 40px;
}
.vf-hero-sw-subtitle {
  font-size: clamp(24px, 4vw, 40px);
  font-weight: 400;
  letter-spacing: -0.02em;
  max-width: 800px;
}

/* Projects */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; padding: 0 40px; }
.vf-filter-btn { background: transparent; color: #000; border: none; font-weight: 700; padding: 4px 0; border-bottom: 2px solid transparent; text-transform: uppercase; letter-spacing: -0.02em; font-size: 14px; cursor: pointer; }
.vf-filter-btn:hover { color: #ff0000; border-bottom-color: #ff0000; }
.vf-filter-btn.active { border-bottom-color: #000; }

.vf-projects-sw {
  padding: 0;
}
.vf-card-sw {
  display: grid;
  grid-template-columns: 80px 80px 1fr 200px;
  align-items: center;
  padding: 60px 40px;
  border-bottom: 1px solid #000;
  transition: background 0.2s;
  color: #000;
}
.vf-card-sw:hover {
  background: #f0f0f0;
}
.vf-card-sw-num {
  font-size: 24px;
  font-weight: 700;
  color: #ff0000;
}
.vf-card-sw-title {
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}
.vf-card-sw-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px; text-align: right;
}
.vf-card-sw-tags {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
}
.vf-card-sw-arrow {
  color: #ff0000; font-size: 24px; font-weight: 700; margin-top: 16px;
}
.vf-card-sw-cover {
  width: 80px; height: 45px; object-fit: cover; display: block; align-self: center;
}
.vf-card-sw-cover-placeholder {
  width: 80px; height: 45px; align-self: center;
  background: linear-gradient(135deg, #EDE9FE, #C4B5FD);
}

/* Quote & Footer */
.vf-quote-sw {
  padding: 160px 40px;
  border-bottom: 1px solid #000;
  text-align: left;
}
.vf-quote-sw p {
  font-size: clamp(32px, 5vw, 64px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  max-width: 1000px;
}
.vf-footer-sw {
  padding: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
}
.vf-footer-sw-right { text-align: right; color: #ff0000; }

/* Project Page */
.vf-page-sw-header {
  padding: 120px 40px;
  border-bottom: 1px solid #000;
}
.vf-page-sw-title {
  font-size: clamp(64px, 10vw, 140px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.85;
  margin-bottom: 24px;
}
.vf-page-sw-meta {
  font-size: 24px; font-weight: 400; color: #ff0000;
}
.vf-page-sw-content {
  padding: 80px 40px; max-width: 900px;
}
.vf-prose-sw {
  font-size: 24px; line-height: 1.5; font-weight: 400; letter-spacing: -0.01em;
}
.vf-prose-sw p { margin-bottom: 2rem; }
.vf-prose-sw h2 { font-size: 48px; font-weight: 700; margin: 4rem 0 2rem; line-height: 1; letter-spacing: -0.03em; }
.vf-prose-sw h3 { font-size: 32px; font-weight: 700; margin: 3rem 0 1.5rem; line-height: 1; letter-spacing: -0.02em; }
.vf-prose-sw a { color: #ff0000; border-bottom: 2px solid #ff0000; }
.vf-prose-sw a:hover { color: #000; border-bottom-color: #000; }
.vf-prose-sw img { margin: 0; width: 100%; filter: grayscale(100%); transition: filter 0.3s; }
.vf-prose-sw img:hover { filter: grayscale(0%); }
.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; border: 1px solid #000; margin: 40px 0; border-bottom: none; }
.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }
.vf-gallery img { border-bottom: 1px solid #000; margin: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); transition: filter 0.3s; }
.vf-gallery img:nth-child(even) { border-left: 1px solid #000; }
.vf-gallery img:hover { filter: grayscale(0%); }
.vf-image-single { display: flex; justify-content: center; margin: 4rem 0; }
.vf-prose-sw blockquote { border-left: 8px solid #ff0000; padding-left: 2rem; margin: 3rem 0; font-size: 32px; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
.vf-prose-sw pre { background: #f0f0f0; padding: 2rem; font-size: 16px; margin: 2rem 0; }

.vf-back-sw {
  padding: 20px 40px; border-bottom: 1px solid #000; display: block; font-weight: 700; font-size: 14px; text-transform: uppercase;
}
.vf-back-sw:hover { background: #ff0000; color: #fff; }

/* ── View toggle (swiss) ── */
.vf-section-header-sw { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px 16px; border-bottom: 1px solid #000; }
.view-toggle-container { display: flex; gap: 6px; align-items: center; }
.view-toggle-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 0; cursor: pointer; background: transparent; border: 1px solid #ddd; transition: all 0.15s ease; }
.view-toggle-btn svg { fill: #999; display: block; }
.view-toggle-btn.active { background: #0A0A0A; border-color: #0A0A0A; }
.view-toggle-btn.active svg { fill: #fff; }
.projects-grid { transition: all 0.2s ease; }
/* List view: existing row layout */
#projects-container.view-list { display: block; }
/* Grid view: reflow rows as tiles */
#projects-container.view-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1px; background: #000; border-top: 1px solid #000; }
#projects-container.view-grid .vf-card-sw { display: flex; flex-direction: column; background: #fff; border-bottom: none; padding: 24px; gap: 12px; }
#projects-container.view-grid .vf-card-sw:hover { background: #f0f0f0; }
#projects-container.view-grid .vf-card-sw-cover { width: 100%; height: 120px; }
#projects-container.view-grid .vf-card-sw-cover-placeholder { width: 100%; height: 120px; }
#projects-container.view-grid .vf-card-sw-num { font-size: 16px; }
#projects-container.view-grid .vf-card-sw-title { font-size: clamp(24px, 3vw, 36px); }
#projects-container.view-grid .vf-card-sw-right { flex-direction: row; align-items: center; justify-content: space-between; text-align: left; }
#projects-container.view-grid .vf-card-sw-arrow { margin-top: 0; }
@media (max-width: 768px) {
  .vf-card-sw { grid-template-columns: 1fr; gap: 16px; padding: 40px 24px; }
  .vf-card-sw-right { align-items: flex-start; text-align: left; }
  .vf-card-sw-cover, .vf-card-sw-cover-placeholder { display: none; }
  .vf-nav-sw, .vf-footer-sw { padding: 24px; }
  .vf-hero-sw, .vf-quote-sw, .vf-page-sw-header { padding: 80px 24px; }
  .view-toggle-container { display: none; }
  #projects-container.view-grid { grid-template-columns: 1fr; }
}
${CALLOUT_CSS}
`;

function buildSwissIndex(notes: ParsedNote[], settings: VaultFolioSettings): SiteFile {
  const siteTitle = settings.siteName;
  const rows = notes.map((n, i) => {
    const num = String(i + 1).padStart(2, "0");
    const title = n.displayTitle;
    const tags = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
      .map((t) => String(t).toLowerCase());

    const tagsStr = tags.slice(0, 3).join(" / ");

    const coverFilename = resolveCoverFilename(n.frontmatter.cover);
    const coverHtml = coverFilename
      ? `<img class="vf-card-sw-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
      : `<div class="vf-card-sw-cover-placeholder"></div>`;

    return `
<a href="pages/${n.slug}.html" class="vf-card-sw vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">
  <div class="vf-card-sw-num">${num}</div>
  ${coverHtml}
  <div class="vf-card-sw-title">${escapeHtml(title)}</div>
  <div class="vf-card-sw-right">
    ${tagsStr ? `<div class="vf-card-sw-tags">${escapeHtml(tagsStr)}</div>` : ""}
    <div class="vf-card-sw-arrow">&rarr;</div>
  </div>
</a>`;
  }).join("\n");

  const allTags = Array.from(new Set(notes.flatMap(n => Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]).map(t => String(t).toLowerCase()) : []))).sort();
  const filterHtml = allTags.length > 0 ? `
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all" style="margin-right: 16px;">All</button>
      ${allTags.map((t: string) => `<button class="vf-filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
    </div>
  ` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)} — Swiss</title>
  <style>${SWISS_CSS}</style>
</head>
<body class="vf-swiss">

<nav class="vf-nav-sw">
  <div class="vf-nav-sw-logo">${escapeHtml(siteTitle)}</div>
  <div class="vf-nav-sw-right">Portfolio</div>
</nav>

<header class="vf-hero-sw">
  <div class="vf-hero-sw-inner">
    <h1 class="vf-hero-sw-title">${escapeHtml(siteTitle)}</h1>
    <p class="vf-hero-sw-subtitle">${escapeHtml(settings.heroSubtitle)}</p>
  </div>
</header>

<section class="vf-projects-sw">
  <div class="vf-section-header-sw">
    ${renderViewToggle()}
  </div>
  ${filterHtml}
  <div id="projects-container" class="projects-grid view-grid">
    ${rows}
  </div>
</section>

<section class="vf-quote-sw">
  <p>${escapeHtml(settings.quoteText)}</p>
</section>

<footer class="vf-footer-sw">
  <div>&copy; 2026 ${escapeHtml(siteTitle)}</div>
  <div class="vf-footer-sw-right">Built with VaultFolio</div>
</footer>

${allTags.length > 0 ? renderTagFilterScript() : ""}
${renderViewToggleScript()}
</body>
</html>`;
  return { path: "index.html", content: html };
}

function buildSwissPage(note: ParsedNote, siteTitle: string): SiteFile {
  const title = note.displayTitle;
  const date = note.frontmatter.date as string | undefined;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - ${escapeHtml(siteTitle)}</title>
  <style>${SWISS_CSS}${renderGalleryCSS('swiss')}</style>
</head>
<body class="vf-swiss">

<a href="../index.html" class="vf-back-sw">&larr; Return to Index</a>

<header class="vf-page-sw-header">
  <h1 class="vf-page-sw-title">${escapeHtml(title)}</h1>
  <div class="vf-page-sw-meta">${date ? escapeHtml(date) : "Project"}</div>
</header>

<main class="vf-page-sw-content">
  ${buildProseWithGallery(note, 'vf-prose-sw')}
</main>

<footer class="vf-footer-sw" style="border-top: 1px solid #000;">
  <div>${escapeHtml(title)}</div>
  <div class="vf-footer-sw-right">&copy; 2026</div>
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
.sp-card-body { padding: 24px; min-height: 120px; }
.sp-card-title { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
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
`.trim();

function buildSimpleIndex(notes: ParsedNote[], siteTitle: string): SiteFile {
  const cards = notes
    .map((n, i) => {
      const title = n.displayTitle;
      const desc  = getCardDescription(n);
      const tags  = (Array.isArray(n.frontmatter.tags) ? (n.frontmatter.tags as string[]) : [])
        .map((t) => String(t).toLowerCase());
      const tagHtml = tags
        .map((t) => `<span class="sp-tag">${escapeHtml(t)}</span>`)
        .join("");
      const coverFilename = resolveCoverFilename(n.frontmatter.cover);
      const coverHtml = coverFilename
        ? `<img class="sp-card-cover" src="images/${encodeURIComponent(coverFilename)}" alt="${escapeHtml(title)}" />`
        : `<div class="sp-card-cover-placeholder"></div>`;
      return `<a href="pages/${n.slug}.html" class="sp-card" data-tags="${escapeHtml(tags.join(" "))}">
  ${coverHtml}
  <div class="sp-card-body">
    <div class="sp-card-title">${escapeHtml(title)}</div>
    ${desc ? `<div class="sp-card-desc">${escapeHtml(desc)}</div>` : ""}
    ${tags.length > 0 ? `<div class="sp-card-tags">${tagHtml}</div>` : ""}
  </div>
</a>`;
    })
    .join("\n");

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
</nav>

<section class="sp-hero">
  <h1>${escapeHtml(siteTitle)}</h1>
  <p>A collection of selected work.</p>
</section>

<section class="sp-section">
  <div class="sp-section-header">
    <div class="sp-section-heading">Work</div>
    ${renderViewToggle()}
  </div>
  ${notes.length > 0
    ? `<div id="projects-container" class="sp-cards view-grid">${cards}</div>`
    : `<p class="sp-empty">No published projects yet.</p>`}
</section>

<footer class="sp-footer">
  ${escapeHtml(siteTitle)} &mdash; Built with VaultFolio
</footer>

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
</div>

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
