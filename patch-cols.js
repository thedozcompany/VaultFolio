const fs = require('fs');

let code = fs.readFileSync('src/builder.ts', 'utf8');

const regexMap = [
  // Editorial
  {
    find: '.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin: 40px 0; }',
    replace: '.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin: 40px 0; }\n.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }'
  },
  // Apple
  {
    find: '.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin: 60px 0; }',
    replace: '.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin: 60px 0; }\n.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }'
  },
  // Swiss
  {
    find: '.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; border: 1px solid #000; margin: 40px 0; border-bottom: none; }',
    replace: '.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; border: 1px solid #000; margin: 40px 0; border-bottom: none; }\n.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }'
  },
  // Default (already auto-fit, but we can override it if cols-4 is present)
  {
    find: '.vf-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin: 3rem 0; }',
    replace: '.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 3rem 0; }\n.vf-gallery.cols-4 { grid-template-columns: repeat(4, 1fr); }'
  }
];

let changed = false;
regexMap.forEach(r => {
  if (code.includes(r.find)) {
    code = code.replace(r.find, r.replace);
    changed = true;
  }
});

if(changed) {
  fs.writeFileSync('src/builder.ts', code, 'utf8');
  console.log("Patched CSS columns to support cols-4!");
} else {
  console.log("Nothing patched!");
}
