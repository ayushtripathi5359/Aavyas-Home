import { expect, type Page } from "@playwright/test";

export const iso = (d: Date) => d.toISOString().slice(0, 10);

/** A Friday at least 10 days ahead, plus the Monday 3 nights later (Fri, Sat, Sun nights). */
export function stay() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 10);
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  const fri = iso(d);
  const sat = iso(new Date(d.getTime() + 86_400_000));
  const sun = iso(new Date(d.getTime() + 2 * 86_400_000));
  const mon = iso(new Date(d.getTime() + 3 * 86_400_000));
  return { fri, sat, sun, mon };
}

export async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.fill("#email", creds.email);
  await page.fill("#password", creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

/** Click a date in the public calendar, paging forward until it is visible. */
export async function pickPublicDate(page: Page, date: string) {
  const cell = page.locator(`button[aria-label^="${date}"]`);
  for (let i = 0; i < 4 && !(await cell.count()); i++) await page.getByRole("button", { name: "Next month" }).click();
  await cell.click();
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Click a date in an admin calendar, paging in either direction until it is visible. */
export async function pickAdminDate(page: Page, date: string) {
  const cell = page.locator(`button[data-date="${date}"]`);
  const [y, m] = date.split("-").map(Number);
  for (let i = 0; i < 24 && !(await cell.count()); i++) {
    const label = (await page.locator("p[aria-live=polite]").filter({ hasText: /\d{4}$/ }).last().innerText()).trim();
    const [name, year] = label.split(" ");
    const shown = Number(year) * 12 + MONTHS.indexOf(name);
    await page.getByRole("button", { name: shown < y * 12 + (m - 1) ? "Next month" : "Previous month" }).last().click();
    await page.waitForTimeout(300);
  }
  await cell.click();
}
