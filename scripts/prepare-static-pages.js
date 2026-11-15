import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(".output/public");

if (!fs.existsSync(publicDir)) {
  console.error("Public directory not found:", publicDir);
  process.exit(1);
}

// 1. Create .nojekyll so GitHub Pages does not ignore underscore files
fs.writeFileSync(path.join(publicDir, ".nojekyll"), "", "utf-8");

// 2. Ensure 404.html exists from root index.html
if (fs.existsSync(path.join(publicDir, "index.html"))) {
  fs.copyFileSync(path.join(publicDir, "index.html"), path.join(publicDir, "404.html"));
}

// 3. Recursively find all HTML files and patch root-relative paths for GitHub Pages subpath (/24hournews/)
function patchHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      patchHtmlFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      // Replace "/assets/" with "/24hournews/assets/"
      content = content.replace(/href="\/assets\//g, 'href="/24hournews/assets/');
      content = content.replace(/src="\/assets\//g, 'src="/24hournews/assets/');
      content = content.replace(/"\/assets\//g, '"/24hournews/assets/');
      content = content.replace(/'\/assets\//g, "'/24hournews/assets/");
      // Replace "/favicon.png" with "/24hournews/favicon.png"
      content = content.replace(/href="\/favicon\.png"/g, 'href="/24hournews/favicon.png"');
      fs.writeFileSync(fullPath, content, "utf-8");
    }
  }
}

patchHtmlFiles(publicDir);
console.log("Successfully prepared all static pages for GitHub Pages (/24hournews/)");
