import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const E2E_ADMIN = { email: "e2e-admin@example.test", password: "E2eTestPass123" };
export const E2E_MANAGER = { email: "e2e-manager@example.test", password: "E2eManagerPass123" };

/** Resets mutable test data. Refuses to touch anything that is not a local database. */
export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error("E2E tests only run against a local database.");
  const db = new PrismaClient();
  await db.rateLimitBucket.deleteMany();
  await db.bookingEnquiry.deleteMany();
  await db.weeklyRate.deleteMany();
  await db.dailyRate.deleteMany();
  await db.datePriceOverride.deleteMany();
  await db.pricingCharge.deleteMany();
  await db.pricingSettings.upsert({ where: { id: "singleton" }, update: { activeMode: "WEEKLY" }, create: { id: "singleton" } });
  await db.propertySpace.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  await db.galleryImage.deleteMany({ where: { OR: [{ altText: { startsWith: "E2E " } }, { altText: "Describe this photo" }] } });
  await db.websiteContent.deleteMany({ where: { key: "booking-cta" } });
  for (const [u, role, name] of [[E2E_ADMIN, "SUPER_ADMIN", "E2E Admin"], [E2E_MANAGER, "PROPERTY_MANAGER", "E2E Manager"]] as const) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await db.adminUser.upsert({ where: { email: u.email }, update: { passwordHash, active: true, role }, create: { email: u.email, name, role, passwordHash } });
  }
  await db.$disconnect();
}
