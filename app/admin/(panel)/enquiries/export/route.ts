import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth/guards";
import { allEnquiries } from "@/lib/enquiry-query";
import { dbDateToISO } from "@/lib/pricing/dates";
import { audit } from "@/lib/audit";

/** Neutralise spreadsheet formula injection and quote fields. */
function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}

export async function GET(req: Request) {
  try {
    const user = await requireUser("enquiries");
    const sp = Object.fromEntries(new URL(req.url).searchParams);
    const rows = await allEnquiries(sp);
    const head = ["Reference", "Status", "Guest", "Email", "Phone", "Check-in", "Check-out", "Nights", "Guests", "Quoted total", "Currency", "Submitted"];
    const lines = [head.map(cell).join(",")];
    for (const e of rows) {
      lines.push([e.reference, e.status, e.guestName, e.email, e.phone, dbDateToISO(e.checkIn), dbDateToISO(e.checkOut), e.nights, e.guests, e.quotedTotal?.toFixed(2) ?? "", e.currency, e.createdAt.toISOString()].map(cell).join(","));
    }
    await audit(user.id, "ENQUIRIES_EXPORTED", "BookingEnquiry", undefined, `${rows.length} rows`);
    return new NextResponse("﻿" + lines.join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="enquiries.csv"', "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof AuthError) return new NextResponse("Unauthorized", { status: 401 });
    console.error(e);
    return new NextResponse("Error", { status: 500 });
  }
}
