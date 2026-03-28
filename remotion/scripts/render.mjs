import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compositionId = process.argv[2] || "ep6-dark";
const outputFile = process.argv[3] || "/mnt/documents/ep6-dark.mp4";

console.log(`Rendering ${compositionId} → ${outputFile}`);

const bundled = await bundle({ entryPoint: path.resolve(__dirname, "../src/index.ts"), webpackOverride: c => c });
const browser = await openBrowser("chrome", {
  browserExecutable: "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});
const composition = await selectComposition({ serveUrl: bundled, id: compositionId, puppeteerInstance: browser });
await renderMedia({
  composition, serveUrl: bundled, codec: "h264",
  outputLocation: outputFile, puppeteerInstance: browser,
  muted: true, concurrency: 1,
});
console.log(`✅ Done: ${outputFile}`);
await browser.close({ silent: false });
