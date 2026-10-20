import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { EnquiryControls } from "@/components/admin/enquiry-controls";
import { QuoteSummary } from "@/components/public/quote-summary";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { dbDateToISO } from "@/lib/pricing/dates";
import type { QuoteResult } from "@/lib/pricing/engine";

export const metadata = { title: "Enquiry" };

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("enquiries");
  const { id } = await params;
  const e = await prisma.bookingEnquiry.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true } } } },
    },
  });
  if (!e) notFound();

  const snap = e.quoteSnapshot as (QuoteResult & { quotedAt?: string }) | null;
  const phone = e.phone.replace(/\D/g, "");
  const waText = `Hello ${e.guestName}, thank you for your enquiry (${e.reference}) for ${dbDateToISO(e.checkIn)} to ${dbDateToISO(e.checkOut)}.`;

  return (
    <>
      <PageHeader title={e.reference}><StatusBadge status={e.status} /></PageHeader>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="text-2xl">Guest</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-espresso/60">Name</dt><dd>{e.guestName}</dd></div>
              <div><dt className="text-espresso/60">Email</dt><dd className="break-all">{e.email}</dd></div>
              <div><dt className="text-espresso/60">Phone</dt><dd>{e.phone}</dd></div>
              <div><dt className="text-espresso/60">Submitted</dt><dd>{e.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</dd></div>
              <div><dt className="text-espresso/60">Check-in</dt><dd>{dbDateToISO(e.checkIn)}</dd></div>
              <div><dt className="text-espresso/60">Check-out</dt><dd>{dbDateToISO(e.checkOut)} ({e.nights} night{e.nights === 1 ? "" : "s"})</dd></div>
              <div><dt className="text-espresso/60">Guests</dt><dd>{e.guests}</dd></div>
            </dl>
            {e.specialRequests && <div className="mt-4 text-sm"><p className="text-espresso/60">Special requests</p><p className="whitespace-pre-line">{e.specialRequests}</p></div>}
            <div className="mt-5 flex flex-wrap gap-2">
              <a className="btn btn-outline btn-sm" href={`mailto:${e.email}?subject=${encodeURIComponent(`Your enquiry ${e.reference}`)}`}><Mail className="h-4 w-4" aria-hidden />Email guest</a>
              {phone.length >= 7 && <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`}><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp guest</a>}
            </div>
            <p className="mt-2 text-xs text-espresso/55">WhatsApp needs the number to include a country code.</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl">Quote at time of enquiry</h2>
            {snap ? <QuoteSummary quote={snap} /> : <p className="text-sm text-espresso/70">No quote snapshot stored.</p>}
            {snap?.quotedAt && <p className="mt-2 text-xs text-espresso/55">Quoted {new Date(snap.quotedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}. This snapshot never changes when rates are edited.{snap.quotable ? ` Pricing mode: ${snap.mode}.` : ""}</p>}
          </section>
        </div>

        <div className="space-y-6">
          <EnquiryControls id={e.id} status={e.status} />
          <section className="card p-5">
            <h2 className="text-2xl">Notes</h2>
            {e.notes.length === 0 ? <p className="mt-2 text-sm text-espresso/60">No notes yet.</p> : (
              <ul className="mt-3 space-y-3 text-sm">{e.notes.map((n) => <li key={n.id} className="rounded-xl bg-cream/60 p-3"><p className="whitespace-pre-line">{n.body}</p><p className="mt-1 text-xs text-espresso/55">{n.author?.name ?? "Staff"} · {n.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p></li>)}</ul>
            )}
          </section>
          <section className="card p-5">
            <h2 className="text-2xl">Status history</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {e.statusHistory.map((h) => (
                <li key={h.id}>{h.fromStatus ? <>{h.fromStatus} → <strong>{h.toStatus}</strong></> : <>Created as <strong>{h.toStatus}</strong></>}<span className="block text-xs text-espresso/55">{h.changedBy?.name ?? "Guest submission"} · {h.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span></li>
              ))}
            </ol>
          </section>
          <p className="text-xs text-espresso/55">“Confirmed” records your decision to accept the enquiry. This system does not manage a reservation calendar. <Link href="/admin/pricing" className="underline">Pricing</Link> and availability are separate.</p>
        </div>
      </div>
    </>
  );
}
