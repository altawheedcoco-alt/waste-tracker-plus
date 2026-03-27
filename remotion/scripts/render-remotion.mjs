import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compositionId = process.argv[2] || "main";
const outputName = process.argv[3] || "irecycle-promo.mp4";

console.log(`📦 Bundling for composition "${compositionId}"...`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("🌐 Opening browser...");
const browser = await openBrowser("chrome", {
  browserExecutable: "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "headless-shell",
});

const composition = await selectComposition({ serveUrl: bundled, id: compositionId, puppeteerInstance: browser });
console.log(`🎥 Rendering ${composition.durationInFrames} frames (${compositionId})...`);

await renderMedia({
  composition, serveUrl: bundled, codec: "h264",
  outputLocation: `/mnt/documents/${outputName}`,
  puppeteerInstance: browser, muted: true, concurrency: 1,
});

console.log(`✅ Done! /mnt/documents/${outputName}`);
await browser.close({ silent: false });
