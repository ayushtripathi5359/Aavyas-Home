import { describe, expect, it } from "vitest";
import { computeQuote, priceForNight, rangesOverlap, type PricingRules } from "@/lib/pricing/engine";
import { weekdayOf, nightsInRange, isValidISODate } from "@/lib/pricing/dates";

// Test-only numbers. Never real property prices.
const base = (over: Partial<PricingRules> = {}): PricingRules => ({
  mode: "WEEKLY",
  currency: "INR",
  weekly: {
    MONDAY: "1000.00",
    TUESDAY: "1100.00",
    WEDNESDAY: "1200.00",
    THURSDAY: "1300.00",
    FRIDAY: "1400.00",
    SATURDAY: "1500.00",
    SUNDAY: "1600.00",
  },
  daily: {},
  overrides: [],
  charges: [],
  includedGuests: 2,
  ...over,
});

// 2030-01-04 is a Friday
describe("dates", () => {
  it("uses Monday-first weekdays", () => {
    expect(weekdayOf("2030-01-04")).toBe("FRIDAY");
    expect(weekdayOf("2030-01-06")).toBe("SUNDAY");
    expect(weekdayOf("2030-01-07")).toBe("MONDAY");
  });
  it("validates real calendar dates", () => {
    expect(isValidISODate("2030-02-30")).toBe(false);
    expect(isValidISODate("2028-02-29")).toBe(true);
    expect(isValidISODate("2030-1-1")).toBe(false);
  });
  it("excludes the checkout date from nights", () => {
    expect(nightsInRange("2030-01-04", "2030-01-07")).toEqual(["2030-01-04", "2030-01-05", "2030-01-06"]);
  });
});

describe("weekly mode", () => {
  it("repeats weekday rates and charges Fri/Sat/Sun for Fri→Mon (checkout excluded)", () => {
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-07", guests: 2 }, base());
    expect(q.quotable).toBe(true);
    if (!q.quotable) return;
    expect(q.nights).toBe(3);
    expect(q.nightly.map((n) => n.price)).toEqual(["1400.00", "1500.00", "1600.00"]);
    expect(q.subtotal).toBe("4500.00");
    expect(q.estimatedTotal).toBe("4500.00");
  });
  it("repeats on later weeks", () => {
    expect(priceForNight("2030-06-03", base()).price).toBe("1000.00"); // a Monday
    expect(priceForNight("2031-06-02", base()).weekday).toBe("MONDAY");
  });
  it("override takes precedence; end date is exclusive", () => {
    const rules = base({
      overrides: [{ id: "o1", name: "Festival", startDate: "2030-01-05", endDate: "2030-01-06", price: "3000.00" }],
    });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-07", guests: 2 }, rules);
    expect(q.quotable && q.nightly.map((n) => n.price)).toEqual(["1400.00", "3000.00", "1600.00"]);
    expect(q.quotable && q.appliedOverrides).toEqual(["Festival"]);
  });
  it("missing weekday rate gives no fabricated total", () => {
    const rules = base({ weekly: { FRIDAY: "1400.00" } });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-06", guests: 2 }, rules);
    expect(q.quotable).toBe(false);
    if (q.quotable) return;
    expect(q.reason).toBe("MISSING_PRICES");
    expect(q.missingDates).toEqual(["2030-01-05"]);
    expect("estimatedTotal" in q).toBe(false);
  });
});

describe("daily mode", () => {
  it("never falls back to weekly rates or overrides", () => {
    const rules = base({
      mode: "DAILY",
      daily: { "2030-01-04": { status: "PRICED", price: "2000.00" } },
      overrides: [{ id: "o1", name: "x", startDate: "2030-01-05", endDate: "2030-01-06", price: "9.00" }],
    });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-06", guests: 1 }, rules);
    expect(q.quotable).toBe(false);
    if (q.quotable) return;
    expect(q.missingDates).toEqual(["2030-01-05"]);
    expect(q.nightly[0].price).toBe("2000.00");
    expect(q.nightly[1].source).toBe("MISSING");
  });
  it("treats explicitly unavailable dates as unquotable", () => {
    const rules = base({
      mode: "DAILY",
      daily: { "2030-01-04": { status: "UNAVAILABLE", price: null } },
    });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-05", guests: 1 }, rules);
    expect(q.quotable).toBe(false);
    expect(!q.quotable && q.nightly[0].source).toBe("UNAVAILABLE");
  });
  it("sums configured daily prices", () => {
    const rules = base({
      mode: "DAILY",
      daily: {
        "2030-01-04": { status: "PRICED", price: "2000.50" },
        "2030-01-05": { status: "PRICED", price: "2500.25" },
      },
    });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-06", guests: 1 }, rules);
    expect(q.quotable && q.subtotal).toBe("4500.75");
  });
});

describe("charges and money", () => {
  it("avoids floating point error", () => {
    const rules = base({ weekly: { FRIDAY: "0.10", SATURDAY: "0.20" } });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-06", guests: 1 }, rules);
    expect(q.quotable && q.subtotal).toBe("0.30");
  });
  it("applies fixed, per-night, extra guest, percent tax and separates deposits", () => {
    const rules = base({
      charges: [
        { id: "c", type: "CLEANING", name: "Cleaning", amount: "500", method: "FIXED", refundable: false },
        { id: "e", type: "EXTRA_GUEST", name: "Extra guest", amount: "300", method: "PER_PERSON_PER_NIGHT", refundable: false },
        { id: "t", type: "TAX", name: "GST", amount: "12", method: "PERCENT_OF_SUBTOTAL", refundable: false },
        { id: "d", type: "SECURITY_DEPOSIT", name: "Deposit", amount: "2000", method: "FIXED", refundable: true },
      ],
    });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-06", guests: 4 }, rules); // 1400+1500 = 2900
    expect(q.quotable).toBe(true);
    if (!q.quotable) return;
    expect(q.subtotal).toBe("2900.00");
    expect(q.feesTotal).toBe("1700.00"); // 500 + 2 extra * 300 * 2 nights
    expect(q.taxesTotal).toBe("552.00"); // 12% of 4600
    expect(q.estimatedTotal).toBe("5152.00");
    expect(q.refundableDeposit).toBe("2000.00");
  });
  it("does not charge extra-guest fee within included guests", () => {
    const rules = base({
      charges: [{ id: "e", type: "EXTRA_GUEST", name: "Extra", amount: "300", method: "FIXED", refundable: false }],
    });
    const q = computeQuote({ checkIn: "2030-01-04", checkOut: "2030-01-05", guests: 2 }, rules);
    expect(q.quotable && q.feesTotal).toBe("0.00");
  });
});

describe("validation", () => {
  it("rejects bad ranges and guests", () => {
    expect(computeQuote({ checkIn: "2030-01-05", checkOut: "2030-01-05", guests: 1 }, base()).quotable).toBe(false);
    expect(computeQuote({ checkIn: "2030-01-05", checkOut: "2030-01-04", guests: 1 }, base()).quotable).toBe(false);
    expect(computeQuote({ checkIn: "2030-01-05", checkOut: "2030-01-06", guests: 0 }, base()).quotable).toBe(false);
  });
  it("detects overlapping ranges with exclusive end", () => {
    expect(rangesOverlap("2030-01-01", "2030-01-05", "2030-01-05", "2030-01-08")).toBe(false);
    expect(rangesOverlap("2030-01-01", "2030-01-06", "2030-01-05", "2030-01-08")).toBe(true);
  });
});
