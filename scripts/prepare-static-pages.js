import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(".output/public");

if (!fs.existsSync(publicDir)) {
  console.error("Public directory not found:", publicDir);
  process.exit(1);
}

// 1. Create .nojekyll so GitHub Pages serves files whose names start with _
fs.writeFileSync(path.join(publicDir, ".nojekyll"), "", "utf-8");
console.log("Created .nojekyll");

// 2. Copy root index.html → 404.html so the SPA can handle unknown paths
//    (GitHub Pages serves 404.html for any URL that doesn't match a file)
const indexHtml = path.join(publicDir, "index.html");
const notFoundHtml = path.join(publicDir, "404.html");

if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, notFoundHtml);
  console.log("Copied index.html → 404.html");
} else {
  console.error("index.html not found in .output/public — build may have failed");
  process.exit(1);
}

// NOTE: No HTML asset-path patching is needed here.
// vite.base = '/24hournews/' in vite.config.ts makes Vite automatically prefix
// ALL asset references (CSS, JS chunks, images) with /24hournews/ during the build.
console.log("Successfully prepared static pages for GitHub Pages (/24hournews/)");
