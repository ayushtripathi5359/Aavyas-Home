import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  type ISODate,
  type WeekdayName,
  WEEKDAYS,
  dbDateToISO,
  isoToDbDate,
  addDays,
  daysInMonth,
} from "./dates";
import { computeQuote, priceForNight, type PricingRules, type QuoteInput, type QuoteResult } from "./engine";

/** Loads the pricing configuration from PostgreSQL. Only the active mode's data is consulted by the engine. */
export async function loadRules(range?: { from: ISODate; to: ISODate }): Promise<PricingRules> {
  const [settings, weekly, overrides, charges, daily] = await Promise.all([
    prisma.pricingSettings.findUnique({ where: { id: "singleton" } }),
    prisma.weeklyRate.findMany({ where: { active: true } }),
    prisma.datePriceOverride.findMany({ where: { active: true } }),
    prisma.pricingCharge.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    range
      ? prisma.dailyRate.findMany({ where: { date: { gte: isoToDbDate(range.from), lt: isoToDbDate(range.to) } } })
      : Promise.resolve([]),
  ]);

  return {
    mode: settings?.activeMode ?? "WEEKLY",
    currency: settings?.currency ?? "INR",
    includedGuests: settings?.includedGuests ?? 2,
    weekly: Object.fromEntries(weekly.map((w) => [w.weekday, w.price.toFixed(2)])) as Partial<Record<WeekdayName, string>>,
    daily: Object.fromEntries(
      daily.map((d) => [dbDateToISO(d.date), { status: d.status, price: d.price ? d.price.toFixed(2) : null }]),
    ),
    overrides: overrides.map((o) => ({
      id: o.id,
      name: o.name,
      startDate: dbDateToISO(o.startDate),
      endDate: dbDateToISO(o.endDate),
      price: o.price.toFixed(2),
    })),
    charges: charges.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      amount: c.amount.toFixed(2),
      method: c.method,
      refundable: c.refundable,
    })),
  };
}

/** The single entry point for authoritative quotes. */
export async function getQuote(input: QuoteInput): Promise<QuoteResult> {
  const rules = await loadRules({ from: input.checkIn, to: input.checkOut });
  return computeQuote(input, rules);
}

export interface MonthDay {
  date: ISODate;
  price: string | null;
  source: ReturnType<typeof priceForNight>["source"];
  overrideName?: string;
}

/** Effective nightly price for every date of a month under the active mode. */
export async function getMonthPrices(year: number, month1: number): Promise<MonthDay[]> {
  const n = daysInMonth(year, month1);
  const first = `${year}-${String(month1).padStart(2, "0")}-01`;
  const rules = await loadRules({ from: first, to: addDays(first, n) });
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(first, i);
    const p = priceForNight(date, rules);
    return { date, price: p.price, source: p.source, overrideName: p.overrideName };
  });
}

export async function getWeeklyRatesForAdmin() {
  const rows = await prisma.weeklyRate.findMany();
  return WEEKDAYS.map((weekday) => {
    const r = rows.find((x) => x.weekday === weekday);
    return { weekday, price: r ? r.price.toFixed(2) : "", active: r?.active ?? true, exists: !!r };
  });
}
