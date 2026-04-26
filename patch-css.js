const fs = require('fs');

let code = fs.readFileSync('src/builder.ts', 'utf8');

// Normalize newlines
code = code.replace(/\r\n/g, '\n');

// Editorial CSS
if (!code.includes('.vf-projects-ed {') && code.includes('/* Projects */\n.vf-projects-ed')) {
  // It shouldn't get here unless the class was entirely missing. But it's not.
}

if (!code.includes('gap: 8px; justify-content: center; margin-bottom: 24px;', code.indexOf('ED_CSS'))) {
  code = code.replace(
    '/* Projects */\n.vf-projects-ed',
    `/* Projects */\n.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px; }\n.vf-filter-btn { background: transparent; border: 1px solid #0A0A0A; padding: 4px 16px; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s; }\n.vf-filter-btn:hover { background: rgba(0,0,0,0.05); }\n.vf-filter-btn.active { background: #0A0A0A; color: #FFFFFF; }\n\n.vf-projects-ed`
  );
}

// Apple CSS
if (!code.includes('margin-bottom: 32px;', code.indexOf('APPLE_CSS'))) {
  code = code.replace(
    '/* Projects */\n.vf-projects-ap',
    `/* Projects */\n.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 32px; }\n.vf-filter-btn { background: rgba(0,0,0,0.05); color: #1d1d1f; border: none; padding: 8px 16px; border-radius: 100px; font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit; font-weight: 400; }\n.vf-filter-btn:hover { background: rgba(0,0,0,0.1); }\n.vf-filter-btn.active { background: #1d1d1f; color: #fff; font-weight: 500; }\n\n.vf-projects-ap`
  );
}

// Swiss CSS
if (!code.includes('gap: 8px; margin-bottom: 40px; padding: 0 40px;', code.indexOf('SWISS_CSS'))) {
  code = code.replace(
    '/* Projects */\n.vf-projects-sw',
    `/* Projects */\n.vf-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; padding: 0 40px; }\n.vf-filter-btn { background: transparent; color: #000; border: none; font-weight: 700; padding: 4px 0; border-bottom: 2px solid transparent; text-transform: uppercase; letter-spacing: -0.02em; font-size: 14px; cursor: pointer; }\n.vf-filter-btn:hover { color: #ff0000; border-bottom-color: #ff0000; }\n.vf-filter-btn.active { border-bottom-color: #000; }\n\n.vf-projects-sw`
  );
}

fs.writeFileSync('src/builder.ts', code, 'utf8');
console.log("Patched CSS!");
