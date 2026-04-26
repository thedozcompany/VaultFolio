const yamlStr = `title: Test project
published: true
tags:
  - portfolio
aliases:`;

const result = {};
const lines = yamlStr.split(/\r?\n/);
let currentKey = null;
let inArray = false;

for (const line of lines) {
  const arrayItem = line.match(/^\s+-\s+(.+)/);
  if (arrayItem && currentKey && inArray) {
    const arr = result[currentKey];
    if (Array.isArray(arr)) arr.push(arrayItem[1].trim());
    continue;
  }

  const kvMatch = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)/);
  if (kvMatch) {
    currentKey = kvMatch[1];
    const value = kvMatch[2].trim();

    if (value === "") {
      result[currentKey] = [];
      inArray = true;
    } else if (value.startsWith("[")) {
      result[currentKey] = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
      inArray = false;
    } else {
      result[currentKey] = value.replace(/^["']|["']$/g, "");
      inArray = false;
    }
  }
}

console.log(JSON.stringify(result, null, 2));
