import { expect, test } from "@playwright/test";
import { stay } from "./helpers";

test.describe("public website", () => {
  test("homepage renders with brand content and working navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("A little space to feel at home.");
    await expect(page.getByText("BOUTIQUE HOMESTAY", { exact: true })).toBeVisible();
    for (const [name, url] of [["The Space", "/the-space"], ["Amenities", "/amenities"], ["Gallery", "/gallery"], ["Location", "/location"], ["Contact", "/contact"]] as const) {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test("published spaces and images come from the database", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Explore Our Spaces" })).toBeVisible();
    for (const name of ["Living Room", "Bedroom", "Kitchen", "Balcony", "Washroom"]) {
      await expect(page.getByRole("heading", { name, level: 3 }).first()).toBeVisible();
    }
    await page.goto("/rooms/bedroom");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bedroom");
    await expect(page.locator("[data-testid=gallery-grid] img").first()).toBeVisible();
  });

  test("spaces arrows switch the featured card", async ({ page }) => {
    await page.goto("/");
    const grid = page.getByTestId("spaces-grid");
    await expect(grid.getByRole("heading", { level: 3 }).first()).toHaveText("Living Room");
    await page.getByRole("button", { name: "Next space" }).click();
    await expect(grid.getByRole("heading", { level: 3 }).first()).toHaveText("Bedroom");
  });

  test("hero search opens the Airbnb listing in a new tab", async ({ page, context }) => {
    const s = stay();
    await context.route("https://www.airbnb.co.uk/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>airbnb stub</title>" }));
    await page.goto("/");
    await page.getByRole("button", { name: /Check In/ }).click();
    for (const d of [s.fri, s.mon]) {
      const cell = page.locator(`button[aria-label^="${d}"]`);
      for (let i = 0; i < 3 && !(await cell.count()); i++) await page.getByRole("button", { name: "Next month" }).click();
      await cell.click();
    }
    const [popup] = await Promise.all([context.waitForEvent("page"), page.getByTestId("search-submit").click()]);
    expect(popup.url()).toContain("airbnb.co.uk/rooms/1607833132937556729");
    await expect(page).toHaveURL(/localhost/);
  });

  test("banner buttons and footer contact links work", async ({ page }) => {
    await page.goto("/");
    const banner = page.locator("section", { has: page.locator("#banner-h") });
    await expect(banner.getByRole("heading", { name: "Ready for a Comfortable Stay?" })).toBeVisible();
    const AIRBNB = "https://www.airbnb.co.uk/rooms/1607833132937556729";
    for (const name of ["Check Pricing", /Book Your Stay/]) {
      const link = banner.getByRole("link", { name });
      await expect(link).toHaveAttribute("href", AIRBNB);
      await expect(link).toHaveAttribute("target", "_blank");
    }
    // every booking / pricing call-to-action in the chrome and on other pages points to Airbnb too
    await expect(page.getByRole("banner").getByRole("link", { name: /Book Your Stay/ })).toHaveAttribute("href", AIRBNB);
    for (const path of ["/the-space", "/gallery", "/contact", "/amenities", "/rooms/bedroom"]) {
      await page.goto(path);
      for (const link of await page.getByRole("link", { name: /Book Your Stay|Check Pricing|Enquire About Your Stay/ }).all()) {
        await expect(link, path).toHaveAttribute("href", AIRBNB);
      }
    }
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "+91 92177 48284" })).toHaveAttribute("href", "tel:+919217748284");
    await expect(footer.getByRole("link", { name: "sharmaaavyashikha27@gmail.com" })).toHaveAttribute("href", "mailto:sharmaaavyashikha27@gmail.com");
    await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", /instagram\.com\/aavya\.s_home_rishikesh/);
  });

  test("no fabricated testimonials; invitation shown instead", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("We would love to host you.")).toBeVisible();
  });

  test("gallery filters and lightbox with keyboard", async ({ page }) => {
    await page.goto("/gallery");
    const grid = page.locator("[data-testid=gallery-grid] li");
    const all = await grid.count();
    await page.getByRole("tab", { name: "Bedroom" }).click();
    const bedrooms = await grid.count();
    expect(bedrooms).toBeGreaterThan(0);
    expect(bedrooms).toBeLessThan(all);
    await grid.first().locator("button").click();
    const viewer = page.getByRole("dialog", { name: "Photo viewer" });
    await expect(viewer).toBeVisible();
    const first = await viewer.locator("figure img").getAttribute("alt");
    await page.keyboard.press("ArrowRight");
    await expect(viewer.locator("figure img")).not.toHaveAttribute("alt", first!);
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("booking form rejects invalid data", async ({ page }) => {
    const s = stay();
    await page.goto(`/booking?checkIn=${s.fri}&checkOut=${s.mon}&guests=2`);
    await page.fill("#guestName", "A");
    await page.fill("#email", "not-an-email");
    await page.fill("#phone", "abc");
    await page.getByRole("button", { name: "Send Enquiry" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Enter a valid phone number.")).toBeVisible();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
  });

  test("booking form requires dates", async ({ page }) => {
    await page.goto("/booking");
    await page.fill("#guestName", "Test Guest");
    await page.fill("#email", "guest@example.com");
    await page.fill("#phone", "+919876543210");
    await page.getByRole("button", { name: "Send Enquiry" }).click();
    await expect(page.getByText("Enter a valid date.").first()).toBeVisible();
  });

  test("mobile layout has no horizontal overflow and a working menu", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ["/", "/pricing", "/gallery", "/booking", "/rooms"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows`).toBeLessThanOrEqual(0);
    }
    await page.goto("/");
    await expect(async () => {
      await page.getByRole("button", { name: /menu/i }).click();
      await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Gallery" }).click();
    await expect(page).toHaveURL("/gallery");
  });
});

test.describe("authorization", () => {
  test("admin pages redirect unauthenticated users to login", async ({ page }) => {
    for (const p of ["/admin/dashboard", "/admin/enquiries", "/admin/pricing", "/admin/users"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  test("protected endpoints reject anonymous requests", async ({ request }) => {
    const csv = await request.get("/admin/enquiries/export");
    expect(csv.status()).toBe(401);
    const up = await request.post("/api/admin/gallery", { multipart: { files: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } }, headers: { origin: "http://localhost:3100" } });
    expect([401, 403]).toContain(up.status());
    const crossSite = await request.post("/api/admin/gallery", { multipart: { files: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } }, headers: { origin: "https://evil.example" } });
    expect(crossSite.status()).toBe(403);
  });
});
