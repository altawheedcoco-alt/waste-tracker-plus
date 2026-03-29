import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const episodes = [
  "ep16-light",
  "ep17-light",
  "ep18-light",
  "ep19-dark", "ep19-light",
  "ep20-dark", "ep20-light",
  "ep21-dark", "ep21-light",
];

const MUSIC = path.resolve(__dirname, "../public/audio/SOLAR.mp3");

console.log(`📦 Bundling...`);
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

const results = [];

for (const ep of episodes) {
  const start = Date.now();
  try {
    console.log(`\n🎬 Rendering ${ep}...`);
    const composition = await selectComposition({ serveUrl: bundled, id: ep, puppeteerInstance: browser });
    
    const mutedPath = `/tmp/${ep}-muted.mp4`;
    const finalPath = `/mnt/documents/${ep}.mp4`;
    
    await renderMedia({
      composition, serveUrl: bundled, codec: "h264",
      outputLocation: mutedPath,
      puppeteerInstance: browser, muted: true, concurrency: 1,
    });
    
    // Merge music
    const durationSec = (composition.durationInFrames / composition.fps).toFixed(2);
    execSync(`ffmpeg -y -i "${mutedPath}" -i "${MUSIC}" -t ${durationSec} -filter_complex "[1:a]atrim=0:${durationSec},asetpts=PTS-STARTPTS,volume=0.3[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest "${finalPath}" 2>/dev/null`);
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const size = execSync(`stat -c%s "${finalPath}"`).toString().trim();
    const sizeMB = (parseInt(size) / 1048576).toFixed(1);
    results.push({ ep, status: "✅", time: `${elapsed}s`, size: `${sizeMB}MB` });
    console.log(`✅ ${ep} done (${elapsed}s, ${sizeMB}MB)`);
    
    // cleanup muted
    execSync(`rm -f "${mutedPath}"`);
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    results.push({ ep, status: "❌", time: `${elapsed}s`, size: "N/A", error: e.message });
    console.error(`❌ ${ep} failed: ${e.message}`);
  }
}

await browser.close({ silent: false });

console.log("\n\n📊 === RENDER REPORT ===");
console.log("Episode          | Status | Time    | Size");
console.log("-".repeat(55));
for (const r of results) {
  console.log(`${r.ep.padEnd(17)}| ${r.status}     | ${r.time.padEnd(8)}| ${r.size}`);
}
console.log("\n🏁 All done!");
