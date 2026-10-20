// Dev helper: screenshot from the Location section to the page end at several widths + overflow check.
import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [768, 1000], [375, 800]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await p.locator("#loc-h").scrollIntoViewIfNeeded();
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => {
    const top = document.querySelector("#loc-h").closest("section").getBoundingClientRect().top + scrollY;
    const q = (s) => document.querySelector(s).closest("section,footer").getBoundingClientRect().height;
    return { top, total: document.documentElement.scrollHeight, guests: q("#guests-h"), banner: q("#banner-h"), footer: document.querySelector("footer").getBoundingClientRect().height, overflow: document.documentElement.scrollWidth - innerWidth };
  });
  console.log(w, JSON.stringify(info));
  await p.screenshot({ path: `.shots/bottom-${w}.png`, fullPage: true, clip: { x: 0, y: info.top, width: w, height: info.total - info.top } });
  await p.close();
}
await b.close();
