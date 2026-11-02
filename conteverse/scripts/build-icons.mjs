// Génère les icônes PNG de la PWA à partir de public/icons/icon.svg (Chromium/Playwright).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const svg = readFileSync(new URL("../public/icons/icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [["icon-192.png", 192, 0], ["icon-512.png", 512, 0], ["icon-maskable-512.png", 512, 0.12]]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<html><body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${pad ? "#fff8ef" : "transparent"}">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await page.screenshot({ path: new URL(`../public/icons/${name}`, import.meta.url).pathname, omitBackground: !pad });
}
await browser.close();
console.log("Icônes générées.");
