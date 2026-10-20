import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { AmenityIcon } from "@/components/ui/icons";
import { getContent } from "@/lib/content";
import { objectPosition } from "@/lib/photo-config";
import { BookLink } from "@/components/public/book-link";
import { getGalleryImages, getPublishedSpaces, getSettings } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/validation/schemas";

export const metadata: Metadata = {
  title: "The Space",
  description: "Explore the living room, bedrooms, kitchen, balcony and washroom at Aavya’s Home.",
  alternates: { canonical: "/the-space" },
};

export default async function TheSpacePage() {
  const [c, spaces, images, settings] = await Promise.all([getContent("page-space"), getPublishedSpaces(), getGalleryImages(), getSettings()]);
  return (
    <>
      <PageHeader eyebrow="THE SPACE" title={c.heading} photo={{ url: "/photos/img_3390.jpg", position: "50% 50%" }}>
        <p className="whitespace-pre-line">{c.body}</p>
      </PageHeader>

      <div className="mx-auto max-w-[80rem] space-y-14 px-4 py-10 sm:px-8 lg:space-y-20 lg:py-14">
        {spaces.map((s, i) => {
          const cover = images.find((im) => im.id === s.coverImageId) ?? s.images[0];
          const second = s.images.find((im) => im.id !== cover?.id);
          const flip = i % 2 === 1;
          const details = [s.occupancy && ["Occupancy", s.occupancy], s.bedDetails && ["Beds", s.bedDetails]].filter(Boolean) as string[][];
          return (
            <article key={s.id} className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
              <div className={`relative ${flip ? "lg:order-2" : ""}`}>
                <div className={`relative overflow-hidden rounded-2xl bg-cream shadow-[0_18px_40px_-28px_rgba(36,33,31,.5)] ${i % 3 === 0 ? "aspect-[4/3]" : i % 3 === 1 ? "aspect-[5/4]" : "aspect-[3/2]"}`}>
                  {cover && <Image src={cover.url} alt={cover.altText} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" style={{ objectPosition: objectPosition(cover.url) }} />}
                </div>
                {second && (
                  <div className={`absolute -bottom-5 hidden w-28 border-[5px] border-ivory shadow-[0_10px_24px_-12px_rgba(36,33,31,.45)] sm:block lg:w-36 ${flip ? "-left-5 -rotate-2" : "-right-5 rotate-2"}`}>
                    <div className="relative aspect-[4/5]"><Image src={second.url} alt={second.altText} fill sizes="150px" className="object-cover" style={{ objectPosition: objectPosition(second.url) }} /></div>
                  </div>
                )}
              </div>
              <div className={flip ? "lg:order-1" : ""}>
                <p className="eyebrow">{String(i + 1).padStart(2, "0")} · {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}</p>
                <h2 className="mt-3 text-[2.2rem] leading-[1.08] sm:text-[2.6rem]">{s.name}</h2>
                {s.summary && <p className="mt-3 text-[1rem] leading-relaxed text-espresso/80">{s.summary}</p>}
                {s.description && <p className="mt-3 whitespace-pre-line text-[0.9rem] leading-[1.75] text-espresso/75">{s.description}</p>}
                {details.length > 0 && (
                  <dl className="mt-4 space-y-1 text-[0.85rem]">
                    {details.map(([k, v]) => <div key={k}><dt className="inline font-medium">{k}: </dt><dd className="inline text-espresso/75">{v}</dd></div>)}
                  </dl>
                )}
                {s.amenities.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.78rem] text-espresso/80" aria-label={`${s.name} amenities`}>
                    {s.amenities.map(({ amenity }) => <li key={amenity.id} className="flex items-center gap-1.5"><AmenityIcon name={amenity.icon} className="h-3.5 w-3.5 text-terracotta" />{amenity.name}</li>)}
                  </ul>
                )}
                <Link href={`/rooms/${s.slug}`} className="mt-6 inline-flex items-center gap-2 border-b border-terracotta pb-0.5 text-[0.85rem] font-medium text-terracotta transition-all hover:gap-3">
                  View {s.name} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </article>
          );
        })}
        {spaces.length === 0 && <p>Spaces will be listed here soon.</p>}
      </div>

      <section className="bg-cream/60">
        <div className="mx-auto flex max-w-[80rem] flex-col items-start justify-between gap-5 px-4 py-10 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-[2rem] leading-tight">Plan your stay</h2>
            <p className="mt-1 text-[0.9rem] text-espresso/75">Pick your dates to see a night-by-night estimate, or send us an enquiry.</p>
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
