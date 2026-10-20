import Link from "next/link";
import { ArrowRight, MessageSquareQuote, Star, User } from "lucide-react";
import type { Testimonial } from "@prisma/client";
import { BookLink } from "../book-link";

/**
 * Only approved, genuine testimonials are shown: up to three in an equal-height grid
 * (3 columns desktop, 2 tablet, 1 mobile). With none yet, a compact empty state invites an enquiry instead.
 */
export function TestimonialsSection({ eyebrow, heading, empty, testimonials, airbnbUrl }: { eyebrow: string; heading: string; empty: string; testimonials: Testimonial[]; airbnbUrl?: string | null }) {
  return (
    <section className="mx-auto max-w-[80rem] px-4 py-8 sm:px-8 lg:py-10" aria-labelledby="guests-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">{eyebrow}</p><h2 id="guests-h" className="mt-3 text-[2rem] leading-none sm:text-[2.3rem]">{heading}</h2></div>
        <BookLink airbnbUrl={airbnbUrl} fallback="/booking" className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-terracotta hover:underline">Enquire About Your Stay <ArrowRight className="h-3.5 w-3.5" aria-hidden /></BookLink>
      </div>
      {testimonials.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((t) => (
            <li key={t.id} className="flex h-full gap-4 rounded-xl border border-beige/80 bg-white p-5">
              <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-cream text-terracotta ring-1 ring-beige">
                  {t.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={t.photoUrl} alt="" className="h-12 w-12 object-cover" /> : <User className="h-5 w-5" aria-hidden />}
                </span>
                <span className="text-[0.68rem] leading-tight text-espresso/70">{t.guestName}</span>
              </div>
              <div className="min-w-0">
                {t.rating && <p className="flex gap-0.5 text-[#e0a23a]" aria-label={`${t.rating} out of 5 stars`}>{Array.from({ length: t.rating }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden />)}</p>}
                <p className="mt-1.5 text-[0.78rem] leading-relaxed text-espresso/80">“{t.body}”</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 flex items-center gap-4 rounded-xl border border-beige/80 bg-white px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-terracotta ring-1 ring-beige"><MessageSquareQuote className="h-5 w-5" aria-hidden /></span>
          <div>
            <p className="font-serif text-[1.15rem] leading-snug">{empty}</p>
            <p className="mt-0.5 text-[0.72rem] text-espresso/55">Guest reviews will appear here once they are shared and approved.</p>
          </div>
        </div>
      )}
    </section>
  );
}
