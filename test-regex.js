const str = `<img src="../images/E-Commerce%20App%20Store%20Screens%201%201.png" alt="E-Commerce App Store Screens 1 1.png" />
<img src="../images/E-Commerce%20App%20Store%20Screens%201.png" alt="E-Commerce App Store Screens 1.png" />
`;

let html = str.replace(/((?:<img[^>]+>\\s*)+)/g, (match) => {
    const count = (match.match(/<img/g) || []).length;
    if (count > 1) {
      return \`<div class="vf-gallery">\\n\${match.trim()}\\n</div>\\n\`;
    } else if (count === 1) {
      return \`<div class="vf-image-single">\\n\${match.trim()}\\n</div>\\n\`;
    }
    return match;
  });

console.log("OLD HTML", str);
console.log("NEW HTML:", html);
