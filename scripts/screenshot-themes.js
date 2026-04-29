const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const THEMES = ['dark', 'apple', 'glass', 'simple'];
const OUTPUT = {
  dark:   'theme-dark.png',
  apple:  'theme-apple.png',
  glass:  'theme-glass.png',
  simple: 'theme-simple.png',
};

(async () => {
  const previewPath = path.resolve(__dirname, '..', 'theme-preview.html');
  const assetsDir = path.resolve(__dirname, '..', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });

  // Load preview page once to extract each theme's HTML
  const shell = await browser.newPage();
  await shell.goto(`file:///${previewPath.replace(/\\/g, '/')}`, { waitUntil: 'domcontentloaded' });

  for (const theme of THEMES) {
    // Extract the full HTML string from the theme generator function
    const html = await shell.evaluate((t) => {
      const map = { dark: darkHTML, apple: appleHTML, glass: glassHTML, simple: simpleHTML };
      return map[t]();
    }, theme);

    // Render in a fresh page at 1440px wide
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Give Google Fonts / web fonts a moment to render
    await new Promise(r => setTimeout(r, 800));

    const outPath = path.join(assetsDir, OUTPUT[theme]);
    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: 0, width: 1200, height: 800 },
    });
    await page.close();
    console.log(`Saved: assets/${OUTPUT[theme]}`);
  }

  await browser.close();
  console.log('Done.');
})();
