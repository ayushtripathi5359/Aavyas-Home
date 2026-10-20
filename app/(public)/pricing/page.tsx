import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ChevronDown, ListChecks, MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { PricingCalculator } from "@/components/public/pricing-calculator";
import { getContent } from "@/lib/content";
import { getActiveCharges, getActiveWeeklyRates, getPricingSettings, getPublishedFaqs, getSettings } from "@/lib/site";
import { WEEKDAYS, WEEKDAY_LABELS, isValidISODate, todayInZone } from "@/lib/pricing/dates";
import { formatMoney } from "@/lib/pricing/engine";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Check nightly rates and get an estimate for your stay at Aavya’s Home.",
  alternates: { canonical: "/pricing" },
};

const METHOD_TEXT = { FIXED: "per stay", PER_NIGHT: "per night", PER_PERSON: "per person", PER_PERSON_PER_NIGHT: "per person, per night", PERCENT_OF_SUBTOTAL: "of the subtotal" } as const;

const STEPS = [
  { icon: CalendarCheck, title: "Choose your dates", text: "Pick check-in and check-out on the calendar." },
  { icon: ListChecks, title: "See the estimate", text: "A night-by-night breakdown, calculated for you." },
  { icon: MessageSquareText, title: "Send an enquiry", text: "We confirm availability and get back to you." },
];

export default async function PricingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [c, settings, pricing, weekly, charges, faqs] = await Promise.all([
    getContent("page-pricing"),
    getSettings(),
    getPricingSettings(),
    getActiveWeeklyRates(),
    getActiveCharges(),
    getPublishedFaqs(),
  ]);
  const mode = pricing?.activeMode ?? "WEEKLY";
  const currency = pricing?.currency ?? "INR";
  const wa = settings?.whatsappNumber?.replace(/\D/g, "") || null;
  const showRates = mode === "WEEKLY" && weekly.length > 0;
  const hasPolicies = charges.length > 0 || c.notes || pricing?.advancePolicy || pricing?.cancellationPolicy || settings?.checkInTime || settings?.checkOutTime || settings?.houseRules;
  const guestsParam = Number(sp.guests);

  return (
    <>
      <PageHeader eyebrow="RATES" title={c.heading} photo={{ url: "/photos/img_3387.jpg", position: "50% 38%", zoom: 1.5, origin: "50% 30%" }}>
        <p>{c.body}</p>
      </PageHeader>

      <div className="mx-auto max-w-[80rem] space-y-16 px-4 py-10 sm:px-8 lg:space-y-20 lg:py-14">
        <ol className="grid gap-4 sm:grid-cols-3" aria-label="How it works">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-beige/60 text-terracotta"><Icon className="h-5 w-5" aria-hidden /></span>
              <span><span className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-olive-dark">Step {i + 1}</span><span className="block font-serif text-[1.15rem] leading-tight">{title}</span><span className="mt-0.5 block text-[0.8rem] text-espresso/70">{text}</span></span>
            </li>
          ))}
        </ol>

        <section aria-labelledby="calc">
          <h2 id="calc" className="mb-6 text-[2.2rem] leading-none sm:text-[2.6rem]">Plan your dates</h2>
          <PricingCalculator
            today={todayInZone()}
            maxGuests={settings?.maxGuests ?? 6}
            whatsapp={wa}
            propertyName={settings?.propertyName ?? "Aavya's Home"}
            initial={{ checkIn: isValidISODate(sp.checkIn) ? sp.checkIn : undefined, checkOut: isValidISODate(sp.checkOut) ? sp.checkOut : undefined, guests: Number.isInteger(guestsParam) && guestsParam > 0 ? guestsParam : undefined }}
          />
        </section>

        {showRates && (
          <section aria-labelledby="rates">
            <p className="eyebrow">WEEKLY RATES</p>
            <h2 id="rates" className="mt-3 text-[2rem] leading-none sm:text-[2.4rem]">Nightly rates</h2>
            <p className="mt-2 text-[0.85rem] text-espresso/70">Standard rates repeat every week. Special dates may differ and are shown in your estimate.</p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAYS.map((d) => {
                const r = weekly.find((w) => w.weekday === d);
                return r ? (
                  <li key={d} className="rounded-xl border border-beige/80 bg-white/80 px-4 py-4 text-center">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-olive-dark">{WEEKDAY_LABELS[d].slice(0, 3)}</p>
                    <p className="mt-1 font-serif text-[1.35rem]">{formatMoney(Number(r.price).toFixed(2), currency)}</p>
                  </li>
                ) : null;
              })}
            </ul>
          </section>
        )}
        {mode === "DAILY" && <p className="rounded-xl bg-cream/60 px-5 py-4 text-[0.88rem] text-espresso/75">Rates are set date by date. Select dates above to see the price for each night; dates without a published price need a custom quote.</p>}

        {hasPolicies && (
          <section className="grid gap-10 lg:grid-cols-2" aria-labelledby="fees">
            <div>
              <p className="eyebrow">GOOD TO KNOW</p>
              <h2 id="fees" className="mt-3 text-[2rem] leading-none sm:text-[2.4rem]">Fees &amp; policies</h2>
              {charges.length > 0 && (
                <ul className="mt-6 divide-y divide-beige border-y border-beige text-[0.9rem]">
                  {charges.map((ch) => (
                    <li key={ch.id} className="flex items-baseline justify-between gap-4 py-3">
                      <span>{ch.name}{ch.refundable ? <span className="ml-2 text-[0.72rem] text-olive-dark">refundable</span> : null}</span>
                      <span className="shrink-0 font-medium">{ch.method === "PERCENT_OF_SUBTOTAL" ? `${Number(ch.amount)}%` : formatMoney(Number(ch.amount).toFixed(2), currency)} <span className="text-[0.75rem] font-normal text-espresso/60">{METHOD_TEXT[ch.method]}</span></span>
                    </li>
                  ))}
                </ul>
              )}
              {c.notes && <p className="mt-4 whitespace-pre-line text-[0.85rem] text-espresso/80">{c.notes}</p>}
            </div>
            <div className="space-y-6 text-[0.9rem] leading-relaxed text-espresso/85">
              {pricing?.advancePolicy && <div><h3 className="text-[1.5rem]">Advance payment</h3><p className="mt-1.5 whitespace-pre-line">{pricing.advancePolicy}</p></div>}
              {pricing?.cancellationPolicy && <div><h3 className="text-[1.5rem]">Cancellation &amp; refunds</h3><p className="mt-1.5 whitespace-pre-line">{pricing.cancellationPolicy}</p></div>}
              {(settings?.checkInTime || settings?.checkOutTime) && <div><h3 className="text-[1.5rem]">Arrival &amp; departure</h3><p className="mt-1.5">Check-in: {settings?.checkInTime ?? "—"} · Check-out: {settings?.checkOutTime ?? "—"}</p></div>}
              {settings?.houseRules && <div><h3 className="text-[1.5rem]">House rules</h3><p className="mt-1.5 whitespace-pre-line">{settings.houseRules}</p></div>}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section aria-labelledby="faq" className="max-w-3xl">
            <p className="eyebrow">QUESTIONS</p>
            <h2 id="faq" className="mt-3 text-[2rem] leading-none sm:text-[2.4rem]">Frequently asked</h2>
            <div className="mt-6 divide-y divide-beige border-y border-beige">
              {faqs.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden"><span>{f.question}</span><ChevronDown className="h-4 w-4 shrink-0 text-terracotta transition-transform group-open:rotate-180" aria-hidden /></summary>
                  <p className="mt-2 whitespace-pre-line text-[0.88rem] leading-relaxed text-espresso/80">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="bg-cream/60">
        <div className="mx-auto flex max-w-[80rem] flex-col items-start justify-between gap-5 px-4 py-10 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-[2rem] leading-tight">Have questions about your stay?</h2>
            <p className="mt-1 text-[0.9rem] text-espresso/75">Send an enquiry or message us. Enquiries do not reserve dates.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/booking" className="btn btn-primary">Enquire About Your Stay<ArrowRight className="h-4 w-4" aria-hidden /></Link>
            {wa && <a className="btn btn-outline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${encodeURIComponent("Hello! I'd like to enquire about a stay at Aavya's Home.")}`}>WhatsApp Us</a>}
          </div>
        </div>
      </section>
    </>
  );
}
