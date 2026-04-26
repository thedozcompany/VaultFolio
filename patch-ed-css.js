const fs = require('fs');

let code = fs.readFileSync('src/builder.ts', 'utf8');

const anchor = `.vf-editorial img { max-width: 100%; height: auto; display: block; }`;
const newCss = `.vf-editorial img { max-width: 100%; height: auto; display: block; margin: 0; }\n.vf-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin: 40px 0; }\n.vf-gallery img { margin: 0; aspect-ratio: 3/4; object-fit: cover; border-radius: 0; }\n.vf-image-single { display: flex; justify-content: center; margin: 40px 0; }`;

if (code.includes(anchor) && !code.includes('aspect-ratio: 3/4')) {
    code = code.replace(anchor, newCss);
    fs.writeFileSync('src/builder.ts', code, 'utf8');
    console.log('Patched ED_CSS!');
} else {
    console.log('Anchor missing or already patched for ED_CSS!');
}
