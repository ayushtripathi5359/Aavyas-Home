"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/action";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { enquirySchema, quoteInputSchema } from "@/lib/validation/schemas";
import { getMonthPrices, getQuote, type MonthDay } from "@/lib/pricing/service";
import type { QuoteResult } from "@/lib/pricing/engine";
import { isoToDbDate, todayInZone } from "@/lib/pricing/dates";
import { sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/pricing/engine";
import { siteUrl } from "@/lib/env";

const TZ = "Asia/Kolkata";

export async function quoteAction(input: unknown): Promise<ActionResult<QuoteResult>> {
  const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid dates.");
  const rl = await rateLimit(`quote:${await clientIp()}`, 60, 600);
  if (!rl.ok) return fail("Too many requests. Please wait a moment.");
  if (parsed.data.checkIn < todayInZone(TZ)) return fail("Check-in cannot be in the past.");
  const settings = await prisma.propertySettings.findUnique({ where: { id: "singleton" } });
  if (settings && parsed.data.guests > settings.maxGuests) {
    return fail(`This property hosts up to ${settings.maxGuests} guests.`);
  }
  return ok(undefined, await getQuote(parsed.data));
}

const monthSchema = z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) });

export async function publicMonthPrices(input: unknown): Promise<ActionResult<MonthDay[]>> {
  const parsed = monthSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid month.");
  return ok(undefined, await getMonthPrices(parsed.data.year, parsed.data.month));
}

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeReference(): string {
  const d = todayInZone(TZ).replaceAll("-", "").slice(2);
  const rand = Array.from({ length: 5 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join("");
  return `AH-${d}-${rand}`;
}

export type EnquiryOutcome = { reference: string; quote: QuoteResult; emailSent: boolean };

export async function submitEnquiry(input: unknown): Promise<ActionResult<EnquiryOutcome>> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;
  // Honeypot filled → pretend success without storing anything.
  if (d.website) return ok("Thanks!", { reference: "AH-PENDING", quote: { quotable: false, reason: "MISSING_PRICES", message: "", nights: 0, nightly: [], missingDates: [] }, emailSent: false });

  const ip = await clientIp();
  const [perIp, perEmail] = await Promise.all([
    rateLimit(`enquiry:ip:${ip}`, 5, 3600),
    rateLimit(`enquiry:email:${d.email}`, 3, 3600),
  ]);
  if (!perIp.ok || !perEmail.ok) return fail("You have sent several enquiries recently. Please try again later or contact us directly.");

  if (d.checkIn < todayInZone(TZ)) return { ok: false, error: "Check-in cannot be in the past.", fieldErrors: { checkIn: ["Check-in cannot be in the past."] } };
  if (d.checkOut <= d.checkIn) return { ok: false, error: "Check-out must be after check-in.", fieldErrors: { checkOut: ["Check-out must be after check-in."] } };
  const settings = await prisma.propertySettings.findUnique({ where: { id: "singleton" } });
  if (settings && d.guests > settings.maxGuests) {
    return { ok: false, error: `This property hosts up to ${settings.maxGuests} guests.`, fieldErrors: { guests: [`Maximum ${settings.maxGuests} guests.`] } };
  }

  // Authoritative server-side quote, frozen into the enquiry as an immutable snapshot.
  const quote = await getQuote({ checkIn: d.checkIn, checkOut: d.checkOut, guests: d.guests });
  const nights = quote.quotable ? quote.nights : Math.round((Date.parse(d.checkOut) - Date.parse(d.checkIn)) / 86_400_000);
  const snapshot = { ...quote, quotedAt: new Date().toISOString() };

  let reference = "";
  let enquiryId = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    reference = makeReference();
    try {
      const row = await prisma.bookingEnquiry.create({
        data: {
          reference,
          guestName: d.guestName,
          email: d.email,
          phone: d.phone,
          checkIn: isoToDbDate(d.checkIn),
          checkOut: isoToDbDate(d.checkOut),
          guests: d.guests,
          nights,
          specialRequests: d.specialRequests,
          quoteSnapshot: snapshot as object,
          quotedTotal: quote.quotable ? quote.estimatedTotal : null,
          currency: quote.quotable ? quote.currency : "INR",
          statusHistory: { create: { toStatus: "NEW" } },
        },
      });
      enquiryId = row.id;
      break;
    } catch (e) {
      if ((e as { code?: string }).code === "P2002" && attempt < 4) continue; // reference collision
      console.error("enquiry save failed", e);
      return fail("We could not save your enquiry. Please try again or contact us directly.");
    }
  }

  // Email is best-effort; the enquiry is already safely stored.
  const totalLine = quote.quotable
    ? `Estimated total: ${formatMoney(quote.estimatedTotal, quote.currency)} (indicative, not a confirmed booking)`
    : "Custom quote required for these dates.";
  let emailSent = false;
  const notify = settings?.notifyEmail || settings?.contactEmail;
  if (notify) {
    await sendEmail({
      to: notify,
      replyTo: d.email,
      subject: `New enquiry ${reference}`,
      text: `New booking enquiry ${reference}\n\n${d.guestName}\n${d.email} · ${d.phone}\n${d.checkIn} → ${d.checkOut} (${nights} night${nights === 1 ? "" : "s"}), ${d.guests} guest(s)\n${totalLine}\n\n${d.specialRequests ?? ""}\n\nManage: ${siteUrl}/admin/enquiries/${enquiryId}`,
    });
  }
  const guestMail = await sendEmail({
    to: d.email,
    subject: `We received your enquiry ${reference}`,
    text: `Hello ${d.guestName},\n\nThank you for your interest in ${settings?.propertyName ?? "Aavya's Home"}. We have received your enquiry (${reference}) for ${d.checkIn} to ${d.checkOut}, ${d.guests} guest(s).\n\n${totalLine}\n\nThis is an enquiry only — your dates are not reserved or confirmed until we get back to you.\n`,
  });
  emailSent = guestMail.sent;

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/dashboard");
  return ok("Enquiry received.", { reference, quote, emailSent });
}
