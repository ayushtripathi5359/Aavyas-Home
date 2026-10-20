import Link from "next/link";
import { formatMoney, type QuoteResult } from "@/lib/pricing/engine";
import { WEEKDAY_LABELS } from "@/lib/pricing/dates";

/** Renders a server-computed quote. Never computes money itself. */
export function QuoteSummary({ quote, enquiryHref }: { quote: QuoteResult; enquiryHref?: string }) {
  if (!quote.quotable) {
    return (
      <div className="rounded-2xl border border-terracotta/40 bg-terracotta/5 p-5" role="status">
        <p className="font-serif text-xl">Custom quote needed</p>
        <p className="mt-2 text-sm text-espresso/80">{quote.message}</p>
        {quote.missingDates.length > 0 && (
          <p className="mt-2 text-xs text-espresso/60">Dates without a published price: {quote.missingDates.slice(0, 6).join(", ")}{quote.missingDates.length > 6 ? "…" : ""}</p>
        )}
        {enquiryHref && <Link href={enquiryHref} className="btn btn-primary btn-sm mt-4">Send an enquiry for these dates</Link>}
      </div>
    );
  }
  const f = (v: string) => formatMoney(v, quote.currency);
  return (
    <div className="card p-5" data-testid="quote">
      <p className="font-serif text-xl">{quote.nights} night{quote.nights === 1 ? "" : "s"} · {quote.guests} guest{quote.guests === 1 ? "" : "s"}</p>
      <ul className="mt-3 divide-y divide-beige text-sm">
        {quote.nightly.map((n) => (
          <li key={n.date} className="flex justify-between py-1.5">
            <span>{n.date} <span className="text-espresso/55">· {WEEKDAY_LABELS[n.weekday]}{n.overrideName ? ` · ${n.overrideName}` : ""}</span></span>
            <span>{f(n.price!)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between"><dt>Accommodation subtotal</dt><dd>{f(quote.subtotal)}</dd></div>
        {quote.fees.map((c) => <div key={c.id} className="flex justify-between"><dt>{c.name}</dt><dd>{f(c.amount)}</dd></div>)}
        {quote.taxes.map((c) => <div key={c.id} className="flex justify-between"><dt>{c.name}</dt><dd>{f(c.amount)}</dd></div>)}
        <div className="flex justify-between border-t border-beige pt-2 text-base font-semibold"><dt>Estimated total</dt><dd data-testid="quote-total">{f(quote.estimatedTotal)}</dd></div>
        {quote.refundableDeposit && <div className="flex justify-between text-espresso/75"><dt>Refundable deposit (separate)</dt><dd>{f(quote.refundableDeposit)}</dd></div>}
      </dl>
      <p className="mt-3 text-xs text-espresso/60">This is an estimate for enquiry purposes. It does not reserve or confirm your dates.</p>
    </div>
  );
}
