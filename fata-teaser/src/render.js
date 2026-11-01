#!/usr/bin/env node
/* Rendu image par image du teaser avec Chromium (Playwright) → ffmpeg.
 *
 *   node src/render.js                 → build/frames.mp4 (vidéo seule)
 *   node src/render.js --stills 1,3.2  → build/still-<t>.png (contrôle)
 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "build");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".ttf": "font/ttf" };

function serve() {
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(0, "127.0.0.1", () => r(srv)));
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/src/teaser.html`;
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on("pageerror", e => { console.error("Erreur page :", e); process.exit(1); });
  await page.goto(url);
  await page.waitForFunction(() => window.ready === true);
  const tl = await page.evaluate(() => window.TL);
  const grab = t => page.evaluate(t => { window.render(t); return document.getElementById("c").toDataURL("image/png"); }, t)
    .then(d => Buffer.from(d.split(",")[1], "base64"));

  const si = process.argv.indexOf("--stills");
  if (si > 0) {
    for (const t of process.argv[si + 1].split(",").map(Number)) {
      fs.writeFileSync(path.join(OUT, `still-${t.toFixed(2)}.png`), await grab(t));
    }
  } else {
    const fps = tl.fps, n = Math.round(tl.duration * fps);
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "png", "-framerate", String(fps), "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-profile:v", "high",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      path.join(OUT, "frames.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const png = await grab(i / fps);
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
      if (i % 30 === 0) process.stdout.write(`\r${i}/${n} images — ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on("close", c => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
    console.log(`\n${n} images rendues.`);
  }
  await browser.close();
  srv.close();
}
main().catch(e => { console.error(e); process.exit(1); });
