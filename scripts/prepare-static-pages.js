import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(".output/public");
const assetsDir = path.join(publicDir, "assets");

if (!fs.existsSync(assetsDir)) {
  console.error("Assets directory not found:", assetsDir);
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const clientJs = files.find((f) => f.startsWith("client-") && f.endsWith(".js"));
const stylesCss = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

console.log("Found client entry:", clientJs, "styles:", stylesCss);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>24HOURNEWS — Ghana 24-Hour Digital Newsroom</title>
  <link rel="icon" type="image/png" href="./favicon.png" />
  ${stylesCss ? `<link rel="stylesheet" href="./assets/${stylesCss}" />` : ""}
</head>
<body class="bg-background text-foreground antialiased min-h-screen">
  <div id="root"></div>
  ${clientJs ? `<script type="module" src="./assets/${clientJs}"></script>` : ""}
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "index.html"), html, "utf-8");
fs.writeFileSync(path.join(publicDir, "404.html"), html, "utf-8");
fs.writeFileSync(path.join(publicDir, ".nojekyll"), "", "utf-8");

console.log("Successfully prepared GitHub Pages static bundle (.nojekyll, index.html, 404.html)");

