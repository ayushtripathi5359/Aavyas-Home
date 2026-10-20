import Decimal from "decimal.js";
import {
  type ISODate,
  type WeekdayName,
  addDays,
  diffDays,
  isValidISODate,
  nightsInRange,
  weekdayOf,
} from "./dates";

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export type PricingModeName = "WEEKLY" | "DAILY";
export type ChargeTypeName = "EXTRA_GUEST" | "CLEANING" | "SECURITY_DEPOSIT" | "TAX" | "OTHER";
export type ChargeMethodName =
  | "FIXED"
  | "PER_NIGHT"
  | "PER_PERSON"
  | "PER_PERSON_PER_NIGHT"
  | "PERCENT_OF_SUBTOTAL";

export const MAX_STAY_NIGHTS = 60;

export interface OverrideRule {
  id: string;
  name: string;
  /** inclusive */
  startDate: ISODate;
  /** exclusive */
  endDate: ISODate;
  price: string;
}

export interface ChargeRule {
  id: string;
  type: ChargeTypeName;
  name: string;
  amount: string;
  method: ChargeMethodName;
  refundable: boolean;
}

export interface DailyRule {
  status: "PRICED" | "UNAVAILABLE";
  price: string | null;
}

/** Everything the engine needs. Only ACTIVE records are passed in. Money is always a decimal string. */
export interface PricingRules {
  mode: PricingModeName;
  currency: string;
  /** Active weekly rates only; a missing weekday means no recurring price. */
  weekly: Partial<Record<WeekdayName, string>>;
  /** Daily manual rates keyed by date. Only consulted in DAILY mode. */
  daily: Record<ISODate, DailyRule>;
  /** Active date overrides. Only consulted in WEEKLY mode. */
  overrides: OverrideRule[];
  charges: ChargeRule[];
  includedGuests: number;
}

export type NightSource = "WEEKLY" | "OVERRIDE" | "DAILY" | "MISSING" | "UNAVAILABLE";

export interface NightPrice {
  date: ISODate;
  weekday: WeekdayName;
  price: string | null;
  source: NightSource;
  overrideName?: string;
}

export interface AppliedCharge {
  id: string;
  type: ChargeTypeName;
  name: string;
  method: ChargeMethodName;
  rate: string;
  amount: string;
  refundable: boolean;
}

export type QuoteResult =
  | {
      quotable: true;
      mode: PricingModeName;
      currency: string;
      checkIn: ISODate;
      checkOut: ISODate;
      guests: number;
      nights: number;
      nightly: NightPrice[];
      subtotal: string;
      fees: AppliedCharge[];
      taxes: AppliedCharge[];
      feesTotal: string;
      taxesTotal: string;
      estimatedTotal: string;
      /** Refundable deposit, shown separately and not included in estimatedTotal. */
      refundableDeposit: string | null;
      appliedOverrides: string[];
    }
  | {
      quotable: false;
      reason: "INVALID_DATES" | "INVALID_GUESTS" | "STAY_TOO_LONG" | "MISSING_PRICES";
      message: string;
      nights: number;
      nightly: NightPrice[];
      missingDates: ISODate[];
    };

const money = (d: Decimal.Value) => new Decimal(d).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

/** Resolve the nightly price for one date according to the ACTIVE mode only. */
export function priceForNight(date: ISODate, rules: PricingRules): NightPrice {
  const weekday = weekdayOf(date);

  if (rules.mode === "DAILY") {
    // Daily manual mode never falls back to weekly rates or overrides.
    const rule = rules.daily[date];
    if (!rule) return { date, weekday, price: null, source: "MISSING" };
    if (rule.status === "UNAVAILABLE") return { date, weekday, price: null, source: "UNAVAILABLE" };
    if (rule.price == null) return { date, weekday, price: null, source: "MISSING" };
    return { date, weekday, price: money(rule.price).toFixed(2), source: "DAILY" };
  }

  // WEEKLY: a date override beats the recurring weekday rate.
  const override = findOverride(date, rules.overrides);
  if (override) {
    return {
      date,
      weekday,
      price: money(override.price).toFixed(2),
      source: "OVERRIDE",
      overrideName: override.name,
    };
  }
  const weekly = rules.weekly[weekday];
  if (weekly == null) return { date, weekday, price: null, source: "MISSING" };
  return { date, weekday, price: money(weekly).toFixed(2), source: "WEEKLY" };
}

function findOverride(date: ISODate, overrides: OverrideRule[]): OverrideRule | undefined {
  // Overlaps are rejected on write; if one slips through, the later-starting override wins deterministically.
  return overrides
    .filter((o) => o.startDate <= date && date < o.endDate)
    .sort((a, b) => (a.startDate === b.startDate ? a.id.localeCompare(b.id) : a.startDate < b.startDate ? 1 : -1))[0];
}

/** True if [aStart,aEnd) and [bStart,bEnd) overlap. */
export function rangesOverlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export interface QuoteInput {
  checkIn: ISODate;
  checkOut: ISODate;
  guests: number;
}

export function computeQuote(input: QuoteInput, rules: PricingRules): QuoteResult {
  const { checkIn, checkOut, guests } = input;
  const fail = (
    reason: Extract<QuoteResult, { quotable: false }>["reason"],
    message: string,
    extra: Partial<Extract<QuoteResult, { quotable: false }>> = {},
  ): QuoteResult => ({ quotable: false, reason, message, nights: 0, nightly: [], missingDates: [], ...extra });

  if (!isValidISODate(checkIn) || !isValidISODate(checkOut) || diffDays(checkIn, checkOut) < 1) {
    return fail("INVALID_DATES", "Check-out must be after check-in.");
  }
  if (!Number.isInteger(guests) || guests < 1) {
    return fail("INVALID_GUESTS", "At least one guest is required.");
  }
  const nights = diffDays(checkIn, checkOut);
  if (nights > MAX_STAY_NIGHTS) {
    return fail("STAY_TOO_LONG", `Stays longer than ${MAX_STAY_NIGHTS} nights need a custom quote.`, { nights });
  }

  const nightly = nightsInRange(checkIn, checkOut).map((d) => priceForNight(d, rules));
  const missing = nightly.filter((n) => n.price === null).map((n) => n.date);
  if (missing.length > 0) {
    return fail(
      "MISSING_PRICES",
      "Some of the selected nights have no published price, so these dates need a custom quote.",
      { nights, nightly, missingDates: missing },
    );
  }

  const subtotal = nightly.reduce((sum, n) => sum.plus(n.price!), new Decimal(0));
  const extraGuests = Math.max(0, guests - rules.includedGuests);

  const amountFor = (c: ChargeRule, base: Decimal): Decimal => {
    const rate = new Decimal(c.amount);
    const people = c.type === "EXTRA_GUEST" ? extraGuests : guests;
    switch (c.method) {
      case "FIXED":
        return c.type === "EXTRA_GUEST" && extraGuests === 0 ? new Decimal(0) : rate;
      case "PER_NIGHT":
        return c.type === "EXTRA_GUEST" && extraGuests === 0 ? new Decimal(0) : rate.times(nights);
      case "PER_PERSON":
        return rate.times(people);
      case "PER_PERSON_PER_NIGHT":
        return rate.times(people).times(nights);
      case "PERCENT_OF_SUBTOTAL":
        return base.times(rate).dividedBy(100);
    }
  };
  const apply = (c: ChargeRule, base: Decimal): AppliedCharge => ({
    id: c.id,
    type: c.type,
    name: c.name,
    method: c.method,
    rate: money(c.amount).toFixed(2),
    amount: money(amountFor(c, base)).toFixed(2),
    refundable: c.refundable,
  });

  const nonTax = rules.charges.filter((c) => c.type !== "TAX" && !c.refundable);
  const fees = nonTax.map((c) => apply(c, subtotal));
  const feesTotal = fees.reduce((s, f) => s.plus(f.amount), new Decimal(0));

  // Taxes apply to accommodation + fees. The base is stated in the snapshot via the charge rate/method.
  const taxBase = subtotal.plus(feesTotal);
  const taxes = rules.charges.filter((c) => c.type === "TAX").map((c) => apply(c, taxBase));
  const taxesTotal = taxes.reduce((s, t) => s.plus(t.amount), new Decimal(0));

  const deposits = rules.charges
    .filter((c) => c.type !== "TAX" && c.refundable)
    .map((c) => apply(c, subtotal));
  const depositTotal = deposits.reduce((s, d) => s.plus(d.amount), new Decimal(0));

  const overrides = [...new Set(nightly.filter((n) => n.source === "OVERRIDE").map((n) => n.overrideName!))];

  return {
    quotable: true,
    mode: rules.mode,
    currency: rules.currency,
    checkIn,
    checkOut,
    guests,
    nights,
    nightly,
    subtotal: money(subtotal).toFixed(2),
    fees,
    taxes,
    feesTotal: money(feesTotal).toFixed(2),
    taxesTotal: money(taxesTotal).toFixed(2),
    estimatedTotal: money(subtotal.plus(feesTotal).plus(taxesTotal)).toFixed(2),
    refundableDeposit: deposits.length ? money(depositTotal).toFixed(2) : null,
    appliedOverrides: overrides,
  };
}

/** Format an authoritative decimal string for display. */
export function formatMoney(value: string | number, currency = "INR"): string {
  const n = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

export { addDays };
