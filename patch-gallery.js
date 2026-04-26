const fs = require('fs');

let code = fs.readFileSync('src/builder.ts', 'utf8');

// 1. Update markdownToHtml
const oldMarkdownFn = `.replace(/\\n{2,}/g, "</p><p>")
    .replace(/^(?!<[h1-6polbui])(.+)$/gm, "<p>$1</p>")
    .trim();
}

// ── Utilities`;

const newMarkdownFn = `.replace(/\\n{2,}/g, "</p><p>")
    .replace(/^(?!<[h1-6polbui])(.+)$/gm, "<p>$1</p>")
    .trim();

  // Post-processing: Cluster consecutive images into galleries
  html = html.replace(/((?:<img[^>]+>\\s*)+)/g, (match) => {
    const count = (match.match(/<img/g) || []).length;
    if (count > 1) {
      return \`<div class="vf-gallery">\\n\${match.trim()}\\n</div>\\n\`;
    } else if (count === 1) {
      return \`<div class="vf-image-single">\\n\${match.trim()}\\n</div>\\n\`;
    }
    return match;
  });
  
  return html;
}

// ── Utilities`;

if (code.includes(oldMarkdownFn) && !code.includes('class="vf-gallery"')) {
  // Wait, I need to make sure I assign to \`html\` variable
  // Let's replace the whole markdownToHtml body
  const regex = /function markdownToHtml\(md: string\): string \{\n\s*return md([^;]+);\n\}/s;
  const match = code.match(regex);
  if (match) {
    const newBody = `function markdownToHtml(md: string): string {\n  let html = md${match[1]};\n  \n  // Post-processing: Cluster consecutive images into galleries\n  html = html.replace(/((?:<img[^>]+>\\s*)+)/g, (match) => {\n    const count = (match.match(/<img/g) || []).length;\n    if (count > 1) {\n      return \`<div class="vf-gallery">\\n\${match.trim()}\\n</div>\\n\`;\n    } else if (count === 1) {\n      return \`<div class="vf-image-single">\\n\${match.trim()}\\n</div>\\n\`;\n    }\n    return match;\n  });\n\n  return html;\n}`;
    code = code.replace(regex, newBody);
  }
}

// 2. Inject DEFAULT_CSS gallery styling
const defaultAnchor = `.vf-prose img { border-radius: 8px; margin: 2rem 0; }`;
const defaultCss = `.vf-prose img { border-radius: 8px; margin: 0; }\n.vf-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin: 3rem 0; }\n.vf-gallery img { margin: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }\n.vf-image-single { display: flex; justify-content: center; margin: 3rem 0; }`;
if (code.includes(defaultAnchor) && !code.includes('.vf-gallery { display: grid')) {
  code = code.replace(defaultAnchor, defaultCss);
}

// 3. Inject ED_CSS gallery styling
const edAnchor = `.vf-prose-ed img { max-width: 100%; border-radius: 4px; margin: 32px 0; }`;
const edCss = `.vf-prose-ed img { max-width: 100%; border-radius: 4px; margin: 0; }\n.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin: 40px 0; }\n.vf-gallery img { margin: 0; aspect-ratio: 3/4; object-fit: cover; border-radius: 0; }\n.vf-image-single { display: flex; justify-content: center; margin: 40px 0; }`;
if (code.includes(edAnchor) && !code.includes('aspect-ratio: 3/4')) {
  code = code.replace(edAnchor, edCss);
}

// 4. Inject APPLE_CSS gallery styling
const apAnchor = `.vf-prose-ap code { padding: 3px 6px; font-size: 0.9em; }`;
const apCss = `.vf-prose-ap code { padding: 3px 6px; font-size: 0.9em; }\n.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin: 60px 0; }\n.vf-gallery img { margin: 0; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); width: 100%; height: 100%; object-fit: cover; }\n.vf-image-single { display: flex; justify-content: center; margin: 60px 0; }`;
if (code.includes(apAnchor) && !code.includes('grid-template-columns: repeat(2, 1fr); gap: 24px; margin: 60px 0')) {
  code = code.replace(apAnchor, apCss);
}

// 5. Inject SWISS_CSS gallery styling
const swAnchor = `.vf-prose-sw img { margin: 4rem 0; width: 100%; filter: grayscale(100%); transition: filter 0.3s; }\n.vf-prose-sw img:hover { filter: grayscale(0%); }`;
const swCss = `.vf-prose-sw img { margin: 0; width: 100%; filter: grayscale(100%); transition: filter 0.3s; }\n.vf-prose-sw img:hover { filter: grayscale(0%); }\n.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; border: 1px solid #000; margin: 40px 0; border-bottom: none; }\n.vf-gallery img { border-bottom: 1px solid #000; margin: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); transition: filter 0.3s; }\n.vf-gallery img:nth-child(even) { border-left: 1px solid #000; }\n.vf-gallery img:hover { filter: grayscale(0%); }\n.vf-image-single { display: flex; justify-content: center; margin: 4rem 0; }`;
if (code.includes('.vf-prose-sw img:hover { filter: grayscale(0%); }') && !code.includes('grid-template-columns: repeat(2, 1fr); gap: 0;')) {
  code = code.replace(swAnchor, swCss);
}

fs.writeFileSync('src/builder.ts', code, 'utf8');
console.log('Successfully injected gallery logic and CSS into builder.ts');
