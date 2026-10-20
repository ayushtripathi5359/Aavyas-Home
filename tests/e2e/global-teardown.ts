import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/** Remove everything the tests created so test prices/enquiries never linger in the shared dev database. */
export default async function globalTeardown() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) return;
  const db = new PrismaClient();
  await db.bookingEnquiry.deleteMany();
  await db.weeklyRate.deleteMany();
  await db.dailyRate.deleteMany();
  await db.datePriceOverride.deleteMany();
  await db.pricingCharge.deleteMany();
  await db.pricingSettings.update({ where: { id: "singleton" }, data: { activeMode: "WEEKLY" } }).catch(() => {});
  await db.websiteContent.deleteMany({ where: { key: "booking-cta" } });
  await db.propertySpace.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  await db.testimonial.deleteMany({ where: { guestName: "E2E Guest" } });
  await db.session.deleteMany({ where: { user: { email: { endsWith: "@example.test" } } } });
  await db.adminUser.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.rateLimitBucket.deleteMany();
  await db.$disconnect();
}
