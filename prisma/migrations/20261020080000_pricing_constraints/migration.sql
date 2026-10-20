-- Data-integrity guards that Prisma's schema language cannot express.
ALTER TABLE "WeeklyRate" ADD CONSTRAINT "WeeklyRate_price_nonneg" CHECK ("price" >= 0);
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_price_nonneg" CHECK ("price" IS NULL OR "price" >= 0);
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_status_price" CHECK (
  ("status" = 'PRICED' AND "price" IS NOT NULL) OR ("status" = 'UNAVAILABLE' AND "price" IS NULL)
);
ALTER TABLE "DatePriceOverride" ADD CONSTRAINT "DatePriceOverride_price_nonneg" CHECK ("price" >= 0);
ALTER TABLE "DatePriceOverride" ADD CONSTRAINT "DatePriceOverride_range" CHECK ("endDate" > "startDate");
-- Active overrides may not overlap ([start, end) semantics).
ALTER TABLE "DatePriceOverride" ADD CONSTRAINT "DatePriceOverride_no_overlap"
  EXCLUDE USING gist (daterange("startDate", "endDate", '[)') WITH &&) WHERE ("active");
ALTER TABLE "BookingEnquiry" ADD CONSTRAINT "BookingEnquiry_dates" CHECK ("checkOut" > "checkIn");
ALTER TABLE "BookingEnquiry" ADD CONSTRAINT "BookingEnquiry_guests" CHECK ("guests" BETWEEN 1 AND 50);
