import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ep = process.argv[2] || "ep20-light";
const MUSIC = path.resolve(__dirname, "../public/audio/SOLAR.mp3");
console.log(`📦 Bundling...`);
const bundled = await bundle({ entryPoint: path.resolve(__dirname, "../src/index.ts"), webpackOverride: c => c });
const browser = await openBrowser("chrome", {
  browserExecutable: "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "headless-shell",
});
const t0 = Date.now();
console.log(`🎬 ${ep}...`);
const comp = await selectComposition({ serveUrl: bundled, id: ep, puppeteerInstance: browser });
const tmp = `/tmp/${ep}-m.mp4`;
await renderMedia({ composition: comp, serveUrl: bundled, codec: "h264", outputLocation: tmp, puppeteerInstance: browser, muted: true, concurrency: 1 });
const dur = (comp.durationInFrames / comp.fps).toFixed(2);
execSync(`ffmpeg -y -i "${tmp}" -i "${MUSIC}" -t ${dur} -filter_complex "[1:a]atrim=0:${dur},asetpts=PTS-STARTPTS,volume=0.3[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest "/mnt/documents/${ep}.mp4" 2>/dev/null`);
execSync(`rm -f "${tmp}"`);
const sz = (parseInt(execSync(`stat -c%s "/mnt/documents/${ep}.mp4"`).toString()) / 1048576).toFixed(1);
console.log(`✅ ${ep} (${((Date.now()-t0)/1000).toFixed(0)}s, ${sz}MB)`);
await browser.close({ silent: false });
