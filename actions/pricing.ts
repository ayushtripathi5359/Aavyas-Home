"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit";
import { fail, guarded, ok } from "@/lib/action";
import { isoToDbDate, dbDateToISO, daysInMonth, addDays } from "@/lib/pricing/dates";
import { rangesOverlap } from "@/lib/pricing/engine";
import { getMonthPrices } from "@/lib/pricing/service";
import {
  chargeSchema,
  dailyRatesSchema,
  faqSchema,
  overrideSchema,
  pricingPolicySchema,
  weeklyRatesSchema,
} from "@/lib/validation/schemas";

const refresh = () => {
  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
};

const modeSchema = z.object({ mode: z.enum(["WEEKLY", "DAILY"]), confirmed: z.literal(true, "Please confirm the change.") });

/** Atomically switches the active mode. Neither mode's saved data is touched. */
export async function setPricingMode(input: unknown) {
  return guarded("pricing", modeSchema, input, async ({ mode }, user) => {
    const prev = await prisma.pricingSettings.findUnique({ where: { id: "singleton" } });
    if (prev?.activeMode === mode) return ok("That mode is already active.");
    await prisma.$transaction([
      prisma.pricingSettings.upsert({
        where: { id: "singleton" },
        update: { activeMode: mode, updatedById: user.id },
        create: { id: "singleton", activeMode: mode, updatedById: user.id },
      }),
      prisma.auditLog.create({
        data: { actorId: user.id, action: "PRICING_MODE_CHANGED", entity: "PricingSettings", entityId: "singleton", detail: `${prev?.activeMode ?? "WEEKLY"} → ${mode}` },
      }),
    ]);
    refresh();
    return ok(`${mode === "WEEKLY" ? "Weekly" : "Daily manual"} pricing is now active.`);
  });
}

export async function saveWeeklyRates(input: unknown) {
  return guarded("pricing", weeklyRatesSchema, input, async ({ rates }, user) => {
    for (const r of rates) if (r.active && r.price === undefined) return fail(`Enter a price for ${r.weekday.toLowerCase()} or deactivate it.`);
    await prisma.$transaction(async (tx) => {
      for (const r of rates) {
        if (r.price === undefined) await tx.weeklyRate.deleteMany({ where: { weekday: r.weekday } });
        else
          await tx.weeklyRate.upsert({
            where: { weekday: r.weekday },
            update: { price: r.price, active: r.active },
            create: { weekday: r.weekday, price: r.price, active: r.active },
          });
      }
    });
    await audit(user.id, "WEEKLY_RATES_SAVED", "WeeklyRate", undefined, rates.map((r) => `${r.weekday}:${r.price ?? "-"}${r.active ? "" : "(off)"}`).join(", "));
    refresh();
    return ok("Weekly rates saved.");
  });
}

/** Bulk operations touch only the selected dates. Overwriting existing prices requires `overwrite: true`. */
export async function saveDailyRates(input: unknown) {
  return guarded("pricing", dailyRatesSchema, input, async ({ dates, action, price, overwrite }, user) => {
    if (action === "SET" && price === undefined) return fail("Enter a price.");
    const unique = [...new Set(dates)];
    const dbDates = unique.map(isoToDbDate);
    const existing = await prisma.dailyRate.findMany({ where: { date: { in: dbDates } } });

    if (action !== "CLEAR" && existing.length > 0 && !overwrite) {
      return fail(`${existing.length} selected date(s) already have a rate or status. Confirm to overwrite them.`, "CONFIRM_OVERWRITE");
    }

    if (action === "CLEAR") {
      await prisma.dailyRate.deleteMany({ where: { date: { in: dbDates } } });
    } else {
      await prisma.$transaction(
        dbDates.map((date) =>
          prisma.dailyRate.upsert({
            where: { date },
            update: action === "SET" ? { price, status: "PRICED" } : { price: null, status: "UNAVAILABLE" },
            create: action === "SET" ? { date, price, status: "PRICED" } : { date, price: null, status: "UNAVAILABLE" },
          }),
        ),
      );
    }
    await audit(user.id, `DAILY_RATES_${action}`, "DailyRate", undefined, `${unique.length} date(s), ${unique[0]}…${unique[unique.length - 1]}`);
    refresh();
    return ok(action === "CLEAR" ? `Cleared ${unique.length} date(s).` : `Updated ${unique.length} date(s).`);
  });
}

async function findOverlap(start: string, end: string, excludeId?: string) {
  const active = await prisma.datePriceOverride.findMany({ where: { active: true, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  return active.find((o) => rangesOverlap(start, end, dbDateToISO(o.startDate), dbDateToISO(o.endDate)));
}

export async function saveOverride(input: unknown) {
  return guarded("pricing", overrideSchema, input, async (d, user) => {
    if (d.endDate <= d.startDate) return fail("End date must be after the start date (end date is exclusive).");
    if (d.active) {
      const clash = await findOverlap(d.startDate, d.endDate, d.id);
      if (clash) return fail(`Overlaps with the active override "${clash.name}". Adjust the dates or deactivate one.`);
    }
    const data = { name: d.name, startDate: isoToDbDate(d.startDate), endDate: isoToDbDate(d.endDate), price: d.price, active: d.active, notes: d.notes ?? null };
    try {
      const row = d.id
        ? await prisma.datePriceOverride.update({ where: { id: d.id }, data })
        : await prisma.datePriceOverride.create({ data });
      await audit(user.id, d.id ? "OVERRIDE_UPDATED" : "OVERRIDE_CREATED", "DatePriceOverride", row.id, `${d.name} ${d.startDate}→${d.endDate}`);
    } catch (e) {
      if (String((e as Error).message).includes("no_overlap")) return fail("That range overlaps another active override.");
      throw e;
    }
    refresh();
    return ok("Override saved.");
  });
}

const idSchema = z.object({ id: z.string().min(5).max(40) });

export async function deleteOverride(input: unknown) {
  return guarded("pricing", idSchema, input, async ({ id }, user) => {
    await prisma.datePriceOverride.delete({ where: { id } });
    await audit(user.id, "OVERRIDE_DELETED", "DatePriceOverride", id);
    refresh();
    return ok("Override deleted.");
  });
}

export async function saveCharge(input: unknown) {
  return guarded("pricing", chargeSchema, input, async (d, user) => {
    const data = { type: d.type, name: d.name, amount: d.amount, method: d.method, active: d.active, refundable: d.refundable };
    const row = d.id ? await prisma.pricingCharge.update({ where: { id: d.id }, data }) : await prisma.pricingCharge.create({ data });
    await audit(user.id, d.id ? "CHARGE_UPDATED" : "CHARGE_CREATED", "PricingCharge", row.id, d.name);
    refresh();
    return ok("Charge saved.");
  });
}

export async function deleteCharge(input: unknown) {
  return guarded("pricing", idSchema, input, async ({ id }, user) => {
    await prisma.pricingCharge.delete({ where: { id } });
    await audit(user.id, "CHARGE_DELETED", "PricingCharge", id);
    refresh();
    return ok("Charge deleted.");
  });
}

export async function savePricingPolicy(input: unknown) {
  return guarded("pricing", pricingPolicySchema, input, async (d, user) => {
    const data = { includedGuests: d.includedGuests, advancePolicy: d.advancePolicy ?? null, cancellationPolicy: d.cancellationPolicy ?? null, updatedById: user.id };
    await prisma.pricingSettings.upsert({ where: { id: "singleton" }, update: data, create: { id: "singleton", ...data } });
    await audit(user.id, "PRICING_POLICY_SAVED", "PricingSettings", "singleton");
    refresh();
    return ok("Policies saved.");
  });
}

export async function saveFaq(input: unknown) {
  return guarded("pricing", faqSchema, input, async (d, user) => {
    const data = { question: d.question, answer: d.answer, published: d.published };
    const row = d.id
      ? await prisma.pricingFAQ.update({ where: { id: d.id }, data })
      : await prisma.pricingFAQ.create({ data: { ...data, sortOrder: await prisma.pricingFAQ.count() } });
    await audit(user.id, d.id ? "FAQ_UPDATED" : "FAQ_CREATED", "PricingFAQ", row.id);
    refresh();
    return ok("FAQ saved.");
  });
}

export async function deleteFaq(input: unknown) {
  return guarded("pricing", idSchema, input, async ({ id }, user) => {
    await prisma.pricingFAQ.delete({ where: { id } });
    await audit(user.id, "FAQ_DELETED", "PricingFAQ", id);
    refresh();
    return ok("FAQ deleted.");
  });
}

const monthSchema = z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) });

/** Admin calendar data: effective price per date, plus raw daily status for the daily-mode editor. */
export async function getAdminMonth(input: unknown) {
  return guarded("pricing", monthSchema, input, async ({ year, month }) => {
    const [effective, daily, settings] = await Promise.all([
      getMonthPrices(year, month),
      prisma.dailyRate.findMany({
        where: { date: { gte: isoToDbDate(`${year}-${String(month).padStart(2, "0")}-01`), lt: isoToDbDate(addDays(`${year}-${String(month).padStart(2, "0")}-01`, daysInMonth(year, month))) } },
      }),
      prisma.pricingSettings.findUnique({ where: { id: "singleton" } }),
    ]);
    const dailyMap = new Map(daily.map((d) => [dbDateToISO(d.date), { status: d.status, price: d.price?.toFixed(2) ?? null }]));
    return ok(undefined, {
      mode: settings?.activeMode ?? "WEEKLY",
      days: effective.map((e) => ({ ...e, daily: dailyMap.get(e.date) ?? null })),
    });
  });
}

