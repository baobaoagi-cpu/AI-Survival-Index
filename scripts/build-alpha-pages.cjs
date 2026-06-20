const { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");

const root = process.cwd();
const outDir = join(root, "dist-alpha");
const apiBaseUrl = process.env.AI_SURVIVAL_API_BASE_URL || "https://ai-survivalapi-production.up.railway.app";

const htmlFiles = [
  "AI時代生存指數.dc.html",
  "AI原型探索遊戲.dc.html",
  "AI原型演化結果.dc.html",
  "我的AI朋友圈.dc.html",
  "未來導航.dc.html",
];

const staticFiles = [
  "support.js",
  "alpha-app.css",
  "tracking.js",
  "manifest.webmanifest",
  "sw.js",
  ".thumbnail",
  "data/archetypes.js",
  "assets/pwa/icon.svg",
  "assets/archetypes/.gitkeep",
  "assets/archetypes/archetype-crests-preview.png",
  "assets/archetypes/builder.png",
  "assets/archetypes/craftsman.png",
  "assets/archetypes/explorer.png",
  "assets/archetypes/guardian.png",
  "assets/archetypes/inventor.png",
  "assets/archetypes/manifest.json",
  "assets/archetypes/mentor.png",
  "assets/archetypes/navigator.png",
  "assets/archetypes/README.md",
  "assets/archetypes/strategist.png",
  "assets/archetypes/trader.png",
  "assets/placeholders/.gitkeep",
  "assets/scenes/.gitkeep",
  "assets/share-cards/.gitkeep",
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const file of htmlFiles) {
  const sourcePath = join(root, file);
  const targetPath = join(outDir, file);
  const source = readFileSync(sourcePath, "utf8");
  const withConfig = source.includes("runtime-config.js")
    ? source
    : source.replace(
        '<script src="./data/archetypes.js"></script>',
        '<script src="./runtime-config.js"></script>\n<script src="./tracking.js"></script>\n<script src="./data/archetypes.js"></script>',
      );
  writeFileSync(targetPath, injectPwaTags(withConfig), "utf8");
}

for (const file of staticFiles) {
  const sourcePath = join(root, file);
  if (existsSync(sourcePath)) {
    copyFile(file, file);
  }
}

writeFileSync(
  join(outDir, "runtime-config.js"),
  `window.AI_SURVIVAL_API_BASE_URL = ${JSON.stringify(apiBaseUrl)};\n`,
  "utf8",
);

writeFileSync(
  join(outDir, "index.html"),
  injectPwaTags(`<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI 時代生存指數 Alpha</title>
  <meta http-equiv="refresh" content="0; url=./AI時代生存指數.dc.html">
</head>
<body>
  <a href="./AI時代生存指數.dc.html">進入 AI 時代生存指數 Alpha</a>
</body>
</html>
`),
  "utf8",
);

writeFileSync(
  join(outDir, "_headers"),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`,
  "utf8",
);

console.info("Alpha Pages bundle ready: dist-alpha");
console.info(`API base URL: ${apiBaseUrl}`);

function copyFile(sourceRelative, targetRelative = sourceRelative) {
  const sourcePath = join(root, sourceRelative);
  const targetPath = join(outDir, targetRelative);
  if (!existsSync(sourcePath) || statSync(sourcePath).isDirectory()) return;
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

function injectPwaTags(html) {
  if (html.includes("manifest.webmanifest")) return html;
  return html.replace(
    "</head>",
    [
      '  <meta name="theme-color" content="#070510">',
      '  <link rel="manifest" href="./manifest.webmanifest">',
      '  <link rel="icon" href="./assets/pwa/icon.svg" type="image/svg+xml">',
      '  <link rel="apple-touch-icon" href="./assets/pwa/icon.svg">',
      '  <script>if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));</script>',
      "</head>",
    ].join("\n"),
  );
}
