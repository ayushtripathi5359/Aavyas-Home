/**
 * Property-local calendar dates are represented as "YYYY-MM-DD" strings everywhere in the
 * pricing engine. No time zones are involved, which prevents off-by-one errors.
 * Weekday convention: Monday-first (MONDAY … SUNDAY).
 */
export type ISODate = string;

export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type WeekdayName = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<WeekdayName, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== "string") return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function toUTC(date: ISODate): Date {
  if (!isValidISODate(date)) throw new Error(`Invalid date: ${date}`);
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fromUTC(dt: Date): ISODate {
  return dt.toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  const dt = toUTC(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromUTC(dt);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

export function weekdayOf(date: ISODate): WeekdayName {
  const js = toUTC(date).getUTCDay(); // 0 = Sunday
  return WEEKDAYS[(js + 6) % 7];
}

/** All nights charged for a stay: check-in inclusive, check-out exclusive. */
export function nightsInRange(checkIn: ISODate, checkOut: ISODate): ISODate[] {
  const n = diffDays(checkIn, checkOut);
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(checkIn, i));
}

/** Prisma `@db.Date` values come back as UTC-midnight Dates. */
export function dbDateToISO(value: Date): ISODate {
  return fromUTC(value);
}

/** Convert ISO string to a UTC-midnight Date suitable for `@db.Date` columns. */
export function isoToDbDate(date: ISODate): Date {
  return toUTC(date);
}

/** The current calendar date in the property's time zone. */
export function todayInZone(timeZone = "Asia/Kolkata", now = new Date()): ISODate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function monthKey(date: ISODate): string {
  return date.slice(0, 7);
}
