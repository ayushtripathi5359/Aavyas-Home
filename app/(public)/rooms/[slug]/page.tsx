import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BedDouble, Users } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { GalleryGrid } from "@/components/public/gallery";
import { BookLink } from "@/components/public/book-link";
import { AmenityIcon } from "@/components/ui/icons";
import { getPublishedSpaces, getSettings, getSpaceBySlug } from "@/lib/site";
import { CATEGORY_LABELS } from "@/lib/validation/schemas";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const space = await getSpaceBySlug((await params).slug);
  if (!space) return {};
  return {
    title: space.name,
    description: space.summary ?? undefined,
    alternates: { canonical: `/rooms/${space.slug}` },
    openGraph: { title: space.name, description: space.summary ?? undefined, images: space.images[0] ? [space.images[0].url] : undefined },
  };
}

export default async function SpacePage({ params }: Props) {
  const slug = (await params).slug;
  const [space, all, settings] = await Promise.all([getSpaceBySlug(slug), getPublishedSpaces(), getSettings()]);
  if (!space) notFound();

  const idx = all.findIndex((s) => s.slug === space.slug);
  const prev = all.length > 1 ? all[(idx - 1 + all.length) % all.length] : null;
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null;
  const cover = space.images.find((im) => im.id === space.coverImageId) ?? space.images[0];
  const facts = [
    space.occupancy && { icon: Users, label: "Occupancy", value: space.occupancy },
    space.bedDetails && { icon: BedDouble, label: "Beds", value: space.bedDetails },
  ].filter(Boolean) as { icon: typeof Users; label: string; value: string }[];

  return (
    <>
      <PageHeader eyebrow={CATEGORY_LABELS[space.category as keyof typeof CATEGORY_LABELS].toUpperCase()} title={space.name} photo={cover ? { url: cover.url, position: "50% 50%" } : undefined}>
        {space.summary && <p>{space.summary}</p>}
      </PageHeader>

      <div className="mx-auto grid max-w-[80rem] gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[1.6fr_1fr] lg:gap-14 lg:py-12">
        <div>
          {space.images.length > 0 ? (
            <GalleryGrid filters={false} images={space.images.map(({ id, url, altText, caption, category }) => ({ id, url, altText, caption, category }))} />
          ) : (
            <p className="rounded-2xl bg-cream/60 p-6 text-[0.9rem]">Photographs of this space will be added soon.</p>
          )}
        </div>

        <aside className="space-y-7 lg:sticky lg:top-24 lg:self-start">
          {space.description && <p className="whitespace-pre-line text-[0.95rem] leading-[1.75] text-espresso/80">{space.description}</p>}

          {facts.length > 0 && (
            <dl className="space-y-3 border-y border-beige py-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beige/60 text-terracotta"><Icon className="h-4 w-4" aria-hidden /></span>
                  <div><dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-olive-dark">{label}</dt><dd className="text-[0.9rem]">{value}</dd></div>
                </div>
              ))}
            </dl>
          )}

          {space.amenities.length > 0 && (
            <div>
              <h2 className="text-[1.5rem]">In this space</h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.82rem]">
                {space.amenities.map(({ amenity }) => <li key={amenity.id} className="flex items-center gap-2"><AmenityIcon name={amenity.icon} className="h-4 w-4 shrink-0 text-terracotta" />{amenity.name}</li>)}
              </ul>
            </div>
          )}

          {space.houseRules && <div><h2 className="text-[1.5rem]">House rules</h2><p className="mt-2 whitespace-pre-line text-[0.85rem] leading-relaxed text-espresso/80">{space.houseRules}</p></div>}

          <div className="flex flex-col gap-3 pt-1">
            <BookLink airbnbUrl={settings?.airbnbUrl} fallback="/booking" className="btn btn-primary w-full">Book Your Stay<ArrowRight className="h-4 w-4" aria-hidden /></BookLink>
            <Link href="/rooms" className="btn btn-outline w-full">All rooms &amp; spaces</Link>
          </div>
        </aside>
      </div>

      {prev && next && (
        <nav aria-label="More spaces" className="border-t border-beige bg-cream/50">
          <div className="mx-auto grid max-w-[80rem] sm:grid-cols-2">
            <Link href={`/rooms/${prev.slug}`} className="group flex items-center gap-4 px-4 py-6 transition-colors hover:bg-cream sm:px-8">
              <ArrowLeft className="h-5 w-5 shrink-0 text-terracotta transition-transform group-hover:-translate-x-1" aria-hidden />
              <span><span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-olive-dark">Previous</span><span className="font-serif text-[1.5rem]">{prev.name}</span></span>
            </Link>
            <Link href={`/rooms/${next.slug}`} className="group flex items-center justify-end gap-4 px-4 py-6 text-right transition-colors hover:bg-cream sm:border-l sm:border-beige sm:px-8">
              <span><span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-olive-dark">Next</span><span className="font-serif text-[1.5rem]">{next.name}</span></span>
              <ArrowRight className="h-5 w-5 shrink-0 text-terracotta transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
