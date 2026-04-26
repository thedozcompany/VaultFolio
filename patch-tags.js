const fs = require('fs');

let code = fs.readFileSync('src/builder.ts', 'utf8');

// 1. Script Helper
code = code.replace(
  '// ── Entry point ───────────────────────────────────────────────────────────────',
  `// ── Scripts ───────────────────────────────────────────────────────────────────

function renderTagFilterScript(): string {
  return \`<script>
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
</script>\`;
}

// ── Entry point ───────────────────────────────────────────────────────────────`
);

// 2. Default Theme
code = code.replace(
  '/* ── About ── */',
  `/* ── Filters ── */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; margin-bottom: 32px; }
.vf-filter-btn {
  background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.6);
  padding: 6px 16px; border-radius: 100px; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.vf-filter-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
.vf-filter-btn.active { background: #fff; color: #000; border-color: #fff; font-weight: 500; }

/* ── About ── */`
);

code = code.replace(
  '<a href="pages/${n.slug}.html" class="vf-project-row">',
  '<a href="pages/${n.slug}.html" class="vf-project-row vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">'
);

code = code.replace(
  '// Hero title — make last word italic + accent',
  `// Filter Bar
  const allTagsSorted = Array.from(allTags).sort();
  const filterHtml = allTagsSorted.length > 0 ? \`
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all">All</button>
      \${allTagsSorted.map((t: string) => \`<button class="vf-filter-btn" data-filter="\${escapeHtml(t)}">\${escapeHtml(t)}</button>\`).join("")}
    </div>
  \` : "";

  // Hero title — make last word italic + accent`
);

code = code.replace(
  '<span class="vf-section-label">Selected Work</span>',
  `<span class="vf-section-label">Selected Work</span>
    \${filterHtml}`
);

code = code.replace(
  /\$\{renderFooter\(siteTitle\)\}\n\n<\/body>/,
  `\${renderFooter(siteTitle)}\n\n\${allTagsSorted.length > 0 ? renderTagFilterScript() : ""}\n</body>`
);

// 3. Editorial Theme
code = code.replace(
  '/* Projects */\n.vf-projects-ed',
  `/* Projects */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px; }
.vf-filter-btn { background: transparent; border: 1px solid #0A0A0A; padding: 4px 16px; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s; }
.vf-filter-btn:hover { background: rgba(0,0,0,0.05); }
.vf-filter-btn.active { background: #0A0A0A; color: #FFFFFF; }

.vf-projects-ed`
);

code = code.replace(
  '<a href="pages/${n.slug}.html" class="vf-card-ed${fullClass}">',
  '<a href="pages/${n.slug}.html" class="vf-card-ed${fullClass} vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">'
);

code = code.replace(
  '  const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${escapeHtml(siteTitle)} — Editorial</title>',
  `  const allTags = Array.from(new Set(notes.flatMap(n => Array.isArray(n.frontmatter.tags) ? n.frontmatter.tags as string[] : []))).sort();
  const filterHtml = allTags.length > 0 ? \`
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all">All</button>
      \${allTags.map((t: string) => \`<button class="vf-filter-btn" data-filter="\${escapeHtml(t)}">\${escapeHtml(t)}</button>\`).join("")}
    </div>
  \` : "";

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${escapeHtml(siteTitle)} — Editorial</title>`
);

code = code.replace(
  '<section class="vf-projects-ed">\n  <div class="vf-projects-ed-grid">',
  '<section class="vf-projects-ed">\n  ${filterHtml}\n  <div class="vf-projects-ed-grid">'
);

code = code.replace(
  '</footer>\n\n</body>',
  '</footer>\n\n${allTags.length > 0 ? renderTagFilterScript() : ""}\n</body>'
);

// 4. Apple Theme
code = code.replace(
  '/* Projects */\n.vf-projects-ap',
  `/* Filters */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 32px; }
.vf-filter-btn { background: rgba(0,0,0,0.05); color: #1d1d1f; border: none; padding: 8px 16px; border-radius: 100px; font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit; font-weight: 400; }
.vf-filter-btn:hover { background: rgba(0,0,0,0.1); }
.vf-filter-btn.active { background: #1d1d1f; color: #fff; font-weight: 500; }

/* Projects */
.vf-projects-ap`
);

code = code.replace(
  '<a href="pages/${n.slug}.html" class="vf-card-ap">',
  '<a href="pages/${n.slug}.html" class="vf-card-ap vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">'
);

code = code.replace(
  '  const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${escapeHtml(siteTitle)}</title>\n  <style>${APPLE_CSS}</style>',
  `  const allTags = Array.from(new Set(notes.flatMap(n => Array.isArray(n.frontmatter.tags) ? n.frontmatter.tags as string[] : []))).sort();
  const filterHtml = allTags.length > 0 ? \`
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all">All</button>
      \${allTags.map((t: string) => \`<button class="vf-filter-btn" data-filter="\${escapeHtml(t)}">\${escapeHtml(t)}</button>\`).join("")}
    </div>
  \` : "";

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${escapeHtml(siteTitle)}</title>
  <style>\${APPLE_CSS}</style>`
);

code = code.replace(
  '<section id="work" class="vf-projects-ap">\n  <div class="vf-projects-ap-grid">',
  '<section id="work" class="vf-projects-ap">\n  ${filterHtml}\n  <div class="vf-projects-ap-grid">'
);

code = code.replace(
  '</footer>\n\n</body>',
  '</footer>\n\n${allTags.length > 0 ? renderTagFilterScript() : ""}\n</body>'
);

// 5. Swiss Theme
code = code.replace(
  '/* Projects */\n.vf-projects-sw',
  `/* Projects */
.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; padding: 0 40px; }
.vf-filter-btn { background: transparent; color: #000; border: none; font-weight: 700; padding: 4px 0; border-bottom: 2px solid transparent; text-transform: uppercase; letter-spacing: -0.02em; font-size: 14px; cursor: pointer; }
.vf-filter-btn:hover { color: #ff0000; border-bottom-color: #ff0000; }
.vf-filter-btn.active { border-bottom-color: #000; }

.vf-projects-sw`
);

code = code.replace(
  '<a href="pages/${n.slug}.html" class="vf-card-sw">',
  '<a href="pages/${n.slug}.html" class="vf-card-sw vf-filter-card" data-tags="${escapeHtml(tags.join(" "))}">'
);

code = code.replace(
  '  const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${escapeHtml(siteTitle)} — Swiss</title>',
  `  const allTags = Array.from(new Set(notes.flatMap(n => Array.isArray(n.frontmatter.tags) ? n.frontmatter.tags as string[] : []))).sort();
  const filterHtml = allTags.length > 0 ? \`
    <div class="vf-filter-bar">
      <button class="vf-filter-btn active" data-filter="all" style="margin-right: 16px;">All</button>
      \${allTags.map((t: string) => \`<button class="vf-filter-btn" data-filter="\${escapeHtml(t)}">\${escapeHtml(t)}</button>\`).join("")}
    </div>
  \` : "";

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${escapeHtml(siteTitle)} — Swiss</title>`
);

code = code.replace(
  '<section class="vf-projects-sw">\n  ${rows}',
  '<section class="vf-projects-sw">\n  ${filterHtml}\n  ${rows}'
);

code = code.replace(
  '</footer>\n\n</body>',
  '</footer>\n\n${allTags.length > 0 ? renderTagFilterScript() : ""}\n</body>'
);

fs.writeFileSync('src/builder.ts', code, 'utf8');
console.log("Successfully patched builder.ts!");
