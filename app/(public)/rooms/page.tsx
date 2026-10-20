import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { BookLink } from "@/components/public/book-link";
import { AmenityIcon } from "@/components/ui/icons";
import { objectPosition } from "@/lib/photo-config";
import { getGalleryImages, getPublishedSpaces, getSettings } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = {
  title: "Rooms & Spaces",
  description: "Accommodation and spaces at Aavya’s Home.",
  alternates: { canonical: "/rooms" },
};

export default async function RoomsPage() {
  const [spaces, images, settings] = await Promise.all([getPublishedSpaces(), getGalleryImages(), getSettings()]);
  const [lead, ...rest] = spaces;
  const coverOf = (s: (typeof spaces)[number]) => images.find((im) => im.id === s.coverImageId) ?? s.images[0];
  const leadCover = lead && coverOf(lead);

  return (
    <>
      <PageHeader eyebrow="ACCOMMODATION" title="Rooms & spaces" photo={{ url: "/photos/img_3382.jpg", position: "50% 58%" }}>
        <p>Every space in the home, room by room. Open any one for photographs, details and what’s included.</p>
      </PageHeader>

      <div className="mx-auto max-w-[80rem] space-y-6 px-4 py-10 sm:px-8 lg:space-y-8 lg:py-14">
        {lead && (
          <Link href={`/rooms/${lead.slug}`} className="group grid overflow-hidden rounded-2xl border border-beige/70 bg-white/80 shadow-[0_14px_34px_-26px_rgba(36,33,31,.45)] lg:grid-cols-[1.3fr_1fr]">
            <div className="relative aspect-[4/3] bg-cream lg:aspect-auto lg:min-h-[24rem]">
              {leadCover && <Image src={leadCover.url} alt={leadCover.altText} fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ objectPosition: objectPosition(leadCover.url) }} />}
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-9">
              <p className="eyebrow">{CATEGORY_LABELS[lead.category as keyof typeof CATEGORY_LABELS]} · 01</p>
              <h2 className="mt-3 text-[2.2rem] leading-[1.08] sm:text-[2.6rem]">{lead.name}</h2>
              {lead.summary && <p className="mt-3 text-[0.95rem] leading-relaxed text-espresso/80">{lead.summary}</p>}
              {lead.amenities.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.76rem] text-espresso/75">
                  {lead.amenities.slice(0, 5).map(({ amenity }) => <li key={amenity.id} className="flex items-center gap-1.5"><AmenityIcon name={amenity.icon} className="h-3.5 w-3.5 text-terracotta" />{amenity.name}</li>)}
                </ul>
              )}
              <span className="mt-6 inline-flex items-center gap-2 border-b border-terracotta pb-0.5 text-[0.85rem] font-medium text-terracotta transition-all group-hover:gap-3 self-start">View {lead.name} <ArrowRight className="h-4 w-4" aria-hidden /></span>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((s, i) => {
              const cover = coverOf(s);
              return (
                <li key={s.id} className={i % 2 === 1 ? "lg:mt-8" : ""}>
                  <Link href={`/rooms/${s.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream shadow-[0_14px_30px_-24px_rgba(36,33,31,.5)]">
                      {cover && <Image src={cover.url} alt={cover.altText} fill sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ objectPosition: objectPosition(cover.url) }} />}
                    </div>
                    <p className="eyebrow mt-4">{String(i + 2).padStart(2, "0")} · {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}</p>
                    <h2 className="mt-1.5 flex items-center justify-between gap-2 text-[1.6rem] leading-tight">{s.name}<ArrowRight className="h-4 w-4 shrink-0 text-terracotta opacity-0 transition-opacity group-hover:opacity-100" aria-hidden /></h2>
                    {s.summary && <p className="mt-1 text-[0.82rem] leading-snug text-espresso/70">{s.summary}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {spaces.length === 0 && <p>No spaces published yet.</p>}
      </div>

      <section className="bg-cream/60">
        <div className="mx-auto flex max-w-[80rem] flex-col items-start justify-between gap-5 px-4 py-10 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-[2rem] leading-tight">Plan your stay</h2>
            <p className="mt-1 text-[0.9rem] text-espresso/75">See nightly rates and book your dates.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BookLink airbnbUrl={settings?.airbnbUrl} fallback="/pricing" className="btn btn-outline">Check Pricing</BookLink>
            <BookLink airbnbUrl={settings?.airbnbUrl} fallback="/booking" className="btn btn-primary">Book Your Stay<ArrowRight className="h-4 w-4" aria-hidden /></BookLink>
          </div>
        </div>
      </section>
    </>
  );
}
