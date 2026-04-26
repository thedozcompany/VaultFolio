function escapeHtml(str) { return str; }

function markdownToHtml(md) {
  return md
    .replace(/^#{6}\s+(.+)$/gm, "<h6>$1</h6>")
    .replace(/^#{5}\s+(.+)$/gm, "<h5>$1</h5>")
    .replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#{1}\s+(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/!\[\[([^\]]+)\]\]/g, (_, ref) => {
      const name = ref.split("|")[0].trim().split("/").pop() ?? ref;
      return `<img src="../images/${encodeURIComponent(name)}" alt="${escapeHtml(name)}" />`;
    })
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, rawSrc) => {
      const src = rawSrc.trim().replace(/\s+["'][^"']*["']\s*$/, "");
      if (/^https?:\/\//.test(src)) {
        return `<img src="${src}" alt="${escapeHtml(alt)}" />`;
      }
      const name = src.split("/").pop() ?? src;
      return `<img src="../images/${encodeURIComponent(name)}" alt="${escapeHtml(alt)}" />`;
    })
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gm, "<hr>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[h1-6polbui])(.+)$/gm, "<p>$1</p>")
    .trim();
}

console.log(markdownToHtml('![[test1.png]]\n![[test2.png]]'));
