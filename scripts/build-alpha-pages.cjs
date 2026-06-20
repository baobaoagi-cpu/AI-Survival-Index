const { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const root = process.cwd();
const outDir = join(root, 'dist-alpha');
const apiBaseUrl = process.env.AI_SURVIVAL_API_BASE_URL || 'https://ai-survivalapi-production.up.railway.app';
const htmlFiles = readdirSync(root)
  .filter((file) => file.endsWith('.dc.html'))
  .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
const pageAliases = new Map([
  ['AI\u6642\u4ee3\u751f\u5b58\u6307\u6578.dc.html', 'index.html'],
  ['AI\u539f\u578b\u63a2\u7d22\u904a\u6232.dc.html', 'quiz.html'],
  ['AI\u539f\u578b\u6f14\u5316\u7d50\u679c.dc.html', 'result.html'],
  ['\u6211\u7684AI\u670b\u53cb\u5708.dc.html', 'friends.html'],
  ['\u672a\u4f86\u5c0e\u822a.dc.html', 'navigation.html'],
]);
const staticFiles = ['support.js','alpha-app.css','tracking.js','line-liff.js','manifest.webmanifest','sw.js','.thumbnail','data/archetypes.js','data/state-modifiers.js','data/zodiac-modifiers.js','assets/pwa/icon.svg','assets/archetypes/.gitkeep','assets/archetypes/archetype-crests-preview.png','assets/archetypes/builder.png','assets/archetypes/craftsman.png','assets/archetypes/explorer.png','assets/archetypes/guardian.png','assets/archetypes/inventor.png','assets/archetypes/manifest.json','assets/archetypes/mentor.png','assets/archetypes/navigator.png','assets/archetypes/README.md','assets/archetypes/strategist.png','assets/archetypes/trader.png','assets/placeholders/.gitkeep','assets/scenes/.gitkeep','assets/scenes/options/manifest.json','assets/scenes/options/scene-01-a.png','assets/scenes/options/scene-01-b.png','assets/scenes/options/scene-01-c.png','assets/scenes/options/scene-02-a.png','assets/scenes/options/scene-02-b.png','assets/scenes/options/scene-02-c.png','assets/scenes/options/scene-03-a.png','assets/scenes/options/scene-03-b.png','assets/scenes/options/scene-03-c.png','assets/scenes/options/scene-04-a.png','assets/scenes/options/scene-04-b.png','assets/scenes/options/scene-04-c.png','assets/scenes/options/scene-05-a.png','assets/scenes/options/scene-05-b.png','assets/scenes/options/scene-05-c.png','assets/scenes/options/scene-06-a.png','assets/scenes/options/scene-06-b.png','assets/scenes/options/scene-06-c.png','assets/share-cards/.gitkeep'];
const liffId = process.env.AI_SURVIVAL_LIFF_ID || '';
const requireLineLogin = process.env.AI_SURVIVAL_REQUIRE_LINE_LOGIN === 'true';

mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}

for (const file of htmlFiles) {
  const source = readFileSync(join(root, file), 'utf8');
  const withConfig = source.includes('runtime-config.js')
    ? source
    : source.replace(
        '<script src="./data/archetypes.js"></script>',
        '<script src="./runtime-config.js"></script>\n<script src="./line-liff.js"></script>\n<script src="./tracking.js"></script>\n<script src="./data/archetypes.js"></script>',
      );
  writeFileSync(join(outDir, file), normalizeRoutes(injectPwaTags(withConfig)), 'utf8');
}

for (const [file, alias] of pageAliases) {
  const sourcePath = join(outDir, file);
  if (!existsSync(sourcePath) || alias === 'index.html') continue;
  writeFileSync(join(outDir, alias), normalizeRoutes(readFileSync(sourcePath, 'utf8')), 'utf8');
}

for (const file of staticFiles) {
  copyFile(file);
}

writeFileSync(
  join(outDir, 'runtime-config.js'),
  [
    `window.AI_SURVIVAL_API_BASE_URL = ${JSON.stringify(apiBaseUrl)};`,
    `window.AI_SURVIVAL_LIFF_ID = ${JSON.stringify(liffId)};`,
    `window.AI_SURVIVAL_REQUIRE_LINE_LOGIN = ${JSON.stringify(requireLineLogin)};`,
    '',
  ].join('\n'),
  'utf8',
);
writeFileSync(
  join(outDir, 'index.html'),
  injectPwaTags(`<!doctype html>\n<html lang="zh-Hant">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>AI Survival Index Alpha</title>\n  <meta http-equiv="refresh" content="0; url=./AI%E6%99%82%E4%BB%A3%E7%94%9F%E5%AD%98%E6%8C%87%E6%95%B8.dc.html">\n</head>\n<body>\n  <a href="./AI%E6%99%82%E4%BB%A3%E7%94%9F%E5%AD%98%E6%8C%87%E6%95%B8.dc.html">Enter AI Survival Index Alpha</a>\n</body>\n</html>\n`),
  'utf8',
);
const entryFile = htmlFiles.find((file) => file.includes('\u751f\u5b58\u6307\u6578')) || htmlFiles[0];
writeFileSync(join(outDir, 'index.html'), normalizeRoutes(readFileSync(join(outDir, entryFile), 'utf8')), 'utf8');
writeFileSync(join(outDir, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`, 'utf8');

console.info('Alpha Pages bundle ready: dist-alpha');
console.info(`API base URL: ${apiBaseUrl}`);

function copyFile(sourceRelative, targetRelative = sourceRelative) {
  const sourcePath = join(root, sourceRelative);
  const targetPath = join(outDir, targetRelative);
  if (!existsSync(sourcePath) || statSync(sourcePath).isDirectory()) return;
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

function normalizeRoutes(html) {
  let output = html;
  for (const [file, alias] of pageAliases) {
    const target = alias === 'index.html' ? './' : `./${alias.replace(/\.html$/, '')}`;
    output = output.split(`./${file}`).join(target);
    output = output.split(file).join(alias);
  }
  return output;
}

function injectPwaTags(html) {
  if (html.includes('manifest.webmanifest')) return html;
  return html.replace(
    '</head>',
    [
      '  <meta name="theme-color" content="#070510">',
      '  <link rel="manifest" href="./manifest.webmanifest">',
      '  <link rel="icon" href="./assets/pwa/icon.svg" type="image/svg+xml">',
      '  <link rel="apple-touch-icon" href="./assets/pwa/icon.svg">',
      '  <script>if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));</script>',
      '</head>',
    ].join('\n'),
  );
}
