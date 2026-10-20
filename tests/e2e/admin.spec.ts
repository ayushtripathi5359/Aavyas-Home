import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { E2E_ADMIN, E2E_MANAGER } from "./global-setup";
import { login, pickAdminDate, pickPublicDate, stay } from "./helpers";

test.describe.configure({ mode: "serial" });

const s = stay();
const WEEK = { Monday: "1000", Tuesday: "1100", Wednesday: "1200", Thursday: "1300", Friday: "1400", Saturday: "1500", Sunday: "1600" };
const PHOTO = path.resolve("public/photos/img_3378.jpg");

async function publicQuote(page: Page, checkIn = s.fri, checkOut = s.mon) {
  await page.goto("/pricing");
  await pickPublicDate(page, checkIn);
  await pickPublicDate(page, checkOut);
}

test.describe("admin authentication", () => {
  test("wrong password is rejected; correct login works; logout ends the session", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#email", E2E_ADMIN.email);
    await page.fill("#password", "wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form [role=alert]")).toContainText("Incorrect email or password");
    await login(page, E2E_ADMIN);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("property manager cannot reach super-admin areas", async ({ page }) => {
    await login(page, E2E_MANAGER);
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    for (const p of ["/admin/users", "/admin/audit-logs", "/admin/settings"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    }
  });
});

test.describe("pricing", () => {
  test.beforeEach(async ({ page }) => { await login(page, E2E_ADMIN); });

  test("configure weekly rates; they appear publicly and repeat on the right weekdays", async ({ page }) => {
    await page.goto("/admin/pricing");
    for (const [day, price] of Object.entries(WEEK)) await page.getByLabel(`${day} price`, { exact: true }).fill(price);
    await page.getByTestId("save-weekly").click();
    await expect(page.getByText("Weekly rates saved.")).toBeVisible();

    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Nightly rates" })).toBeVisible();
    await expect(page.getByText("₹1,400").first()).toBeVisible();

    // Friday → Monday charges Fri, Sat, Sun nights only (checkout excluded): 1400 + 1500 + 1600
    await publicQuote(page);
    await expect(page.getByTestId("quote-total")).toHaveText("₹4,500");
    await expect(page.getByTestId("quote").getByText("Monday")).toHaveCount(0);
  });

  test("date override takes precedence in weekly mode", async ({ page }) => {
    await page.goto("/admin/pricing");
    await page.getByRole("tab", { name: "Date overrides" }).click();
    await page.fill("#o-name", "Festival night");
    await page.fill("#o-price", "3000");
    await page.fill("#o-start", s.sat);
    await page.fill("#o-end", s.sun);
    await page.getByTestId("save-override").click();
    await expect(page.getByText("Override saved.")).toBeVisible();

    // overlapping active override is rejected
    await page.fill("#o-name", "Clash");
    await page.fill("#o-price", "10");
    await page.fill("#o-start", s.fri);
    await page.fill("#o-end", s.mon);
    await page.getByTestId("save-override").click();
    await expect(page.getByText(/Overlaps with the active override/)).toBeVisible();

    await publicQuote(page);
    await expect(page.getByTestId("quote-total")).toHaveText("₹6,000"); // 1400 + 3000 + 1600
  });

  test("historical enquiry quotes are not rewritten when rates change", async ({ page }) => {
    await page.goto(`/booking?checkIn=${s.fri}&checkOut=${s.mon}&guests=2`);
    await page.fill("#guestName", "History Guest");
    await page.fill("#email", "history@example.com");
    await page.fill("#phone", "+919876543210");
    await expect(page.getByTestId("quote-total")).toHaveText("₹6,000");
    await page.getByRole("button", { name: "Send Enquiry" }).click();
    await expect(page.getByTestId("enquiry-success")).toContainText("not reserved or confirmed");
    const ref = await page.getByTestId("enquiry-ref").innerText();
    expect(ref).toMatch(/^AH-\d{6}-[A-Z0-9]{5}$/);

    // Change Friday's rate afterwards
    await page.goto("/admin/pricing");
    await page.getByLabel("Friday price", { exact: true }).fill("9999");
    await page.getByTestId("save-weekly").click();
    await expect(page.getByText("Weekly rates saved.")).toBeVisible();
    await publicQuote(page);
    await expect(page.getByTestId("quote-total")).toHaveText("₹14,599"); // new rate applies to new quotes

    // …but the stored snapshot still shows the original total
    await page.goto(`/admin/enquiries?q=${ref}`);
    await page.getByRole("link", { name: ref }).click();
    await expect(page.getByTestId("quote-total")).toHaveText("₹6,000");

    await page.goto("/admin/pricing");
    await page.getByLabel("Friday price", { exact: true }).fill("1400");
    await page.getByTestId("save-weekly").click();
    await expect(page.getByText("Weekly rates saved.")).toBeVisible();
  });

  test("daily mode never falls back to weekly; switching keeps both configurations", async ({ page }) => {
    await page.goto("/admin/pricing");
    await page.getByTestId("switch-DAILY").click();
    await expect(page.getByText(/cannot be quoted/)).toBeVisible();
    await page.getByRole("button", { name: "Switch mode" }).click();
    await expect(page.getByText("Daily manual pricing is now active.")).toBeVisible();
    await expect(page.getByTestId("active-mode-label")).toContainText("Daily manual pricing");

    // No daily prices yet → no fabricated total
    await publicQuote(page);
    await expect(page.getByText("Custom quote needed")).toBeVisible();
    await expect(page.getByTestId("quote-total")).toHaveCount(0);

    // Configure the three nights individually
    await page.goto("/admin/pricing");
    await page.getByRole("tab", { name: "Daily rates" }).click();
    for (const d of [s.fri, s.sat, s.sun]) await pickAdminDate(page, d);
    await page.getByTestId("daily-price").fill("2000");
    await page.getByTestId("apply-daily").click();
    await expect(page.getByText("Updated 3 date(s).")).toBeVisible();

    // Overwrite requires confirmation
    for (const d of [s.fri]) await pickAdminDate(page, d);
    await page.getByTestId("daily-price").fill("2500");
    await page.getByTestId("apply-daily").click();
    await expect(page.getByRole("dialog", { name: "Overwrite existing prices?" })).toBeVisible();
    await page.getByRole("button", { name: "Overwrite" }).click();
    await expect(page.getByText("Updated 1 date(s).")).toBeVisible();

    await publicQuote(page);
    await expect(page.getByTestId("quote-total")).toHaveText("₹6,500"); // 2500 + 2000 + 2000, overrides ignored

    // Switch back: weekly rates were preserved
    await page.goto("/admin/pricing");
    await page.getByTestId("switch-WEEKLY").click();
    await expect(page.getByText("Monday: ₹1,000")).toBeVisible();
    await page.getByRole("button", { name: "Switch mode" }).click();
    await expect(page.getByText("Weekly pricing is now active.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Monday price", { exact: true })).toHaveValue("1000.00");
    await publicQuote(page);
    await expect(page.getByTestId("quote-total")).toHaveText("₹6,000");
  });

  test("daily dates can be marked unavailable and cleared", async ({ page }) => {
    await page.goto("/admin/pricing");
    await page.getByRole("tab", { name: "Daily rates" }).click();
    await pickAdminDate(page, s.mon);
    await page.getByRole("button", { name: "Mark unavailable" }).click();
    await expect(page.getByText("Updated 1 date(s).")).toBeVisible();
    await expect(page.locator(`button[data-date="${s.mon}"]`)).toContainText("N/A");
    await pickAdminDate(page, s.mon);
    await page.getByRole("button", { name: "Clear price" }).click();
    await expect(page.getByText("Cleared 1 date(s).")).toBeVisible();
  });
});

test.describe("enquiries", () => {
  test("admin can manage an enquiry: status, notes, history, CSV", async ({ page }) => {
    await page.goto(`/booking?checkIn=${s.fri}&checkOut=${s.mon}&guests=3`);
    await page.fill("#guestName", "Manage Guest");
    await page.fill("#email", "manage@example.com");
    await page.fill("#phone", "+91 98765 43210");
    await page.getByRole("button", { name: "Send Enquiry" }).click();
    const ref = await page.getByTestId("enquiry-ref").innerText();

    await login(page, E2E_ADMIN);
    await page.goto(`/admin/enquiries?q=${ref}`);
    await page.getByRole("link", { name: ref }).click();
    await expect(async () => {
      await page.getByLabel("Status", { exact: true }).selectOption("CONTACTED");
      await expect(page.getByText("Status updated.")).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });
    await page.fill("#note", "Called the guest, awaiting reply.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Note added.")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Called the guest, awaiting reply.")).toBeVisible();
    await expect(page.getByText("NEW → CONTACTED")).toBeVisible();

    const res = await page.request.get(`/admin/enquiries/export?q=${ref}`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain(ref);
  });
});

test.describe("content management", () => {
  test.beforeEach(async ({ page }) => { await login(page, E2E_ADMIN); });
  // Leave the shared dev database as we found it: drop CMS edits made by these tests.
  test.afterAll(async () => {
    const db = new PrismaClient();
    await db.websiteContent.deleteMany({ where: { key: "booking-cta" } });
    await db.$disconnect();
  });

  test("create, publish and edit a space", async ({ page }) => {
    await page.goto("/admin/rooms");
    await page.getByTestId("new-space").click();
    await page.fill("#s-name", "E2E Terrace");
    await expect(page.locator("#s-slug")).toHaveValue("e2e-terrace");
    await page.fill("#s-sum", "A sunny test terrace.");
    await page.getByLabel("Published", { exact: true }).check();
    await page.getByTestId("save-space").click();
    await expect(page.getByText("Space saved.")).toBeVisible();

    await page.goto("/rooms");
    await expect(page.getByRole("heading", { name: "E2E Terrace" })).toBeVisible();

    await page.goto("/admin/rooms");
    await page.getByRole("button", { name: "Edit" }).last().click();
    await page.fill("#s-sum", "An edited summary.");
    await page.getByTestId("save-space").click();
    await expect(page.getByText("Space saved.")).toBeVisible();
    await page.goto("/rooms/e2e-terrace");
    await expect(page.getByText("An edited summary.")).toBeVisible();

    await page.goto("/admin/rooms");
    await page.getByRole("button", { name: "Unpublish" }).last().click();
    await expect(page.getByText("Space saved.")).toBeVisible();
    expect((await page.request.get("/rooms/e2e-terrace")).status()).toBe(404);
  });

  test("upload, describe and publish an image; invalid files are rejected", async ({ page }) => {
    await page.goto("/admin/gallery");
    await expect(async () => {
      await page.getByTestId("upload-input").setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
      await expect(page.getByText("Only JPEG, PNG or WebP images are allowed.")).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });

    const before = await page.getByTestId("gallery-item").count();
    await page.getByTestId("upload-input").setInputFiles(PHOTO);
    await expect(page.getByText(/Uploaded\./)).toBeVisible();
    // The new upload is appended last; wait for the refreshed list so we never edit a seeded photo.
    await expect(page.getByTestId("gallery-item")).toHaveCount(before + 1);
    const card = page.getByTestId("gallery-item").nth(before);
    await expect(card.getByLabel("Alt text (required)")).toHaveValue("Describe this photo");
    await card.getByLabel("Alt text (required)").fill("E2E kitchen test photo");
    await card.getByLabel("Category").selectOption("KITCHEN");
    await card.getByTestId("published").check();
    await card.getByTestId("save-image").click();
    await expect(card.getByText("Image saved.")).toBeVisible();

    await page.goto("/gallery");
    await expect(page.getByRole("img", { name: "E2E kitchen test photo" })).toBeVisible();

    // delete leaves no broken reference
    await page.goto("/admin/gallery");
    const last = page.getByTestId("gallery-item").last();
    await expect(last.getByLabel("Alt text (required)")).toHaveValue("E2E kitchen test photo");
    await last.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByTestId("gallery-item")).toHaveCount(before);
    await page.goto("/gallery");
    await expect(page.getByRole("img", { name: "E2E kitchen test photo" })).toHaveCount(0);
  });

  test("edit and publish website content; public site updates", async ({ page }) => {
    await page.goto("/admin/website-content");
    await page.getByRole("button", { name: /Booking call-to-action/ }).click();
    await page.fill("#booking-cta-heading", "Ready for a Perfect Stay?");
    await page.getByTestId("save-booking-cta").click();
    await expect(page.getByText("Draft saved.")).toBeVisible();
    // draft is not public yet
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ready for a Comfortable Stay?" })).toBeVisible();
    await page.goto("/admin/website-content");
    await page.getByRole("button", { name: /Booking call-to-action/ }).click();
    await page.getByTestId("publish-booking-cta").click();
    await expect(page.getByText("Published. Changes are live.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ready for a Perfect Stay?" })).toBeVisible();

    // Restore the original heading through the admin (which also refreshes the public cache), like a person would.
    await page.goto("/admin/website-content");
    await page.getByRole("button", { name: /Booking call-to-action/ }).click();
    await page.fill("#booking-cta-heading", "Ready for a Comfortable Stay?");
    await page.getByTestId("publish-booking-cta").click();
    await expect(page.getByText("Published. Changes are live.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ready for a Comfortable Stay?" })).toBeVisible();
  });

  test("testimonials appear only once approved", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await page.fill("#t-name", "E2E Guest");
    await page.fill("#t-body", "A genuine e2e testimonial text.");
    await page.getByRole("button", { name: "Add testimonial" }).click();
    await expect(page.getByText("Testimonial saved.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByText("A genuine e2e testimonial text.")).toHaveCount(0);
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: "Approve" }).first().click();
    await expect(page.getByText("Testimonial saved.")).toBeVisible();
    await page.goto("/");
    await expect(page.getByText("A genuine e2e testimonial text.")).toBeVisible();
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: "Remove" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove" }).click();
    await page.goto("/");
    await expect(page.getByText("We would love to host you.")).toBeVisible();
  });
});

test.describe("failure handling", () => {
  test("enquiry is saved even when email is not configured; audit log records pricing changes", async ({ page }) => {
    const db = new PrismaClient();
    expect(process.env.RESEND_API_KEY ?? "").toBe("");
    await page.goto(`/booking?checkIn=${s.fri}&checkOut=${s.mon}&guests=2`);
    await page.fill("#guestName", "No Email Guest");
    await page.fill("#email", "noemail@example.com");
    await page.fill("#phone", "+919876543210");
    await page.getByRole("button", { name: "Send Enquiry" }).click();
    await expect(page.getByTestId("enquiry-success")).toBeVisible();
    expect(await db.bookingEnquiry.count({ where: { email: "noemail@example.com" } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "PRICING_MODE_CHANGED" } })).toBeGreaterThan(0);
    await db.$disconnect();
  });
});
