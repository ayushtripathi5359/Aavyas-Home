"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { quoteAction } from "@/actions/public";
import type { QuoteResult } from "@/lib/pricing/engine";
import { DateRangePicker } from "./date-range-picker";
import { QuoteSummary } from "./quote-summary";

export function PricingCalculator({ today, maxGuests, whatsapp, propertyName, initial }: { today: string; maxGuests: number; whatsapp: string | null; propertyName: string; initial?: { checkIn?: string; checkOut?: string; guests?: number } }) {
  const [range, setRange] = useState({ checkIn: initial?.checkIn ?? "", checkOut: initial?.checkOut ?? "" });
  const [guests, setGuests] = useState(Math.min(initial?.guests ?? 2, maxGuests));
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuote(null);
    setError(null);
    if (!range.checkIn || !range.checkOut) return;
    let alive = true;
    setLoading(true);
    quoteAction({ ...range, guests }).then((r) => {
      if (!alive) return;
      setLoading(false);
      if (r.ok && r.data) setQuote(r.data);
      else if (!r.ok) setError(r.error);
    });
    return () => { alive = false; };
  }, [range, guests]);

  const qs = new URLSearchParams({ ...(range.checkIn && { checkIn: range.checkIn }), ...(range.checkOut && { checkOut: range.checkOut }), guests: String(guests) }).toString();
  const enquiryHref = `/booking?${qs}`;
  const waText = quote?.quotable
    ? `Hello! I'd like to enquire about ${propertyName} from ${range.checkIn} to ${range.checkOut} for ${guests} guest(s). Estimated total shown on the website: ₹${Number(quote.estimatedTotal).toLocaleString("en-IN")}. Is this available?`
    : `Hello! I'd like to enquire about ${propertyName}${range.checkIn && range.checkOut ? ` from ${range.checkIn} to ${range.checkOut}` : ""} for ${guests} guest(s). Could you share a quote?`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
      <div className="space-y-4">
        <DateRangePicker today={today} checkIn={range.checkIn} checkOut={range.checkOut} onChange={setRange} />
        <div className="flex items-center justify-between gap-4 rounded-xl border border-beige bg-white px-4 py-3">
          <label htmlFor="guests" className="text-[0.85rem] font-medium">Guests</label>
          <select id="guests" className="input !min-h-10 max-w-40" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-live="polite">
        {!range.checkIn && <p className="rounded-2xl border border-dashed border-beige bg-cream/50 p-5 text-[0.9rem]"><span className="font-serif text-[1.2rem]">1.</span> Select your check-in date on the calendar.</p>}
        {range.checkIn && !range.checkOut && <p className="rounded-2xl border border-dashed border-beige bg-cream/50 p-5 text-[0.9rem]"><span className="font-serif text-[1.2rem]">2.</span> Now select your check-out date.</p>}
        {loading && <div className="skeleton h-56" aria-label="Calculating" />}
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {quote && !loading && <QuoteSummary quote={quote} enquiryHref={enquiryHref} />}
        {range.checkIn && range.checkOut && (
          <div className="flex flex-wrap gap-3">
            <Link href={enquiryHref} className="btn btn-primary">Enquire About Your Stay</Link>
            {whatsapp && <a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waText)}`}><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp Us</a>}
          </div>
        )}
      </div>
    </div>
  );
}
