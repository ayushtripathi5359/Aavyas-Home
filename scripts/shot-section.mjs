// Dev helper: screenshot a region of the homepage between two section landmarks at several widths + overflow check.
import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [1280, 800], [768, 1000], [375, 800]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await p.locator("#amen-h").scrollIntoViewIfNeeded();
  await p.waitForTimeout(1200);
  const box = await p.evaluate(() => {
    const a = document.querySelector("#amen-h").closest("section").getBoundingClientRect();
    const l = document.querySelector("#loc-h").closest("section").getBoundingClientRect();
    const rows = new Set([...document.querySelectorAll("#amen-h ~ ul li")].map((li) => Math.round(li.getBoundingClientRect().top)));
    return { top: a.top + scrollY, height: a.height, locHeight: l.height, gapToLocation: l.top - a.bottom, rows: rows.size, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  console.log(w, JSON.stringify(box));
  const y = Math.max(0, box.top - 20);
  await p.screenshot({ path: `.shots/amen-${w}.png`, fullPage: true, clip: { x: 0, y, width: w, height: box.height + box.locHeight + 40 } });
  await p.close();
}
await b.close();
