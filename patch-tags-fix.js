const fs = require('fs');

let code = fs.readFileSync('src/builder.ts', 'utf8');

// Normalize newlines to make patching reliable
code = code.replace(/\r\n/g, '\n');

// 3. Editorial Theme - inject filter logic
if (!code.includes('const filterHtml = allTags.length > 0') && code.includes('function buildEditorialIndex')) {
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

  // We want to replace the FIRST matching footer that doesn't already have script
  // It's safer to just replace it within buildEditorialIndex
  let indexStart = code.indexOf('function buildEditorialIndex');
  let indexEnd = code.indexOf('function buildEditorialPage');
  let indexBody = code.substring(indexStart, indexEnd);
  indexBody = indexBody.replace(
    '</footer>\n\n</body>',
    '</footer>\n\n${allTags.length > 0 ? renderTagFilterScript() : ""}\n</body>'
  );
  code = code.substring(0, indexStart) + indexBody + code.substring(indexEnd);
}

// 4. Apple Theme - inject filter logic
if (!code.includes('const filterHtml = allTags.length > 0', code.indexOf('function buildAppleIndex'))) {
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
  
  let indexStart = code.indexOf('function buildAppleIndex');
  let indexEnd = code.indexOf('function buildApplePage');
  let indexBody = code.substring(indexStart, indexEnd);
  indexBody = indexBody.replace(
    '</footer>\n\n</body>',
    '</footer>\n\n${allTags.length > 0 ? renderTagFilterScript() : ""}\n</body>'
  );
  code = code.substring(0, indexStart) + indexBody + code.substring(indexEnd);
}


// 5. Swiss Theme - inject filter logic
if (!code.includes('const filterHtml = allTags.length > 0', code.indexOf('function buildSwissIndex'))) {
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
  
  let indexStart = code.indexOf('function buildSwissIndex');
  let indexEnd = code.indexOf('function buildSwissPage');
  let indexBody = code.substring(indexStart, indexEnd);
  indexBody = indexBody.replace(
    '</footer>\n\n</body>',
    '</footer>\n\n${allTags.length > 0 ? renderTagFilterScript() : ""}\n</body>'
  );
  code = code.substring(0, indexStart) + indexBody + code.substring(indexEnd);
}

fs.writeFileSync('src/builder.ts', code, 'utf8');
console.log("Successfully ran final patch over \r\n vs \n issues");
