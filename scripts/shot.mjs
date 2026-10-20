// Dev helper: full-page screenshot of the homepage (scrolls first so lazy images/iframes load). Usage: node scripts/shot.mjs [width] [out] [path]
import { chromium } from "@playwright/test";
const [w = "1440", out = "shot.png", path = "/"] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: 900 } });
await p.goto(`http://localhost:3100${path}`, { waitUntil: "networkidle" });
const h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 600) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(150); }
await p.waitForTimeout(1500);
await p.evaluate(() => scrollTo(0, 0));
await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true });
console.log("height", await p.evaluate(() => document.documentElement.scrollHeight), "overflow", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
await b.close();
