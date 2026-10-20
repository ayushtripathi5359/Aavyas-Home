import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/public/page-header";
import { GalleryGrid } from "@/components/public/gallery";
import { BookLink } from "@/components/public/book-link";
import { getGalleryImages, getSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photographs of the living room, bedrooms, kitchen, balcony and washroom at Aavya’s Home.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const [images, settings] = await Promise.all([getGalleryImages(), getSettings()]);
  return (
    <>
      <PageHeader eyebrow="GALLERY" title="A look inside" photo={{ url: "/photos/img_3382.jpg", position: "50% 58%" }}>
        <p>{images.length > 0 ? `${images.length} photographs of the home, room by room. Tap any photo to see it larger.` : "Photographs will appear here soon."}</p>
      </PageHeader>
      <div className="mx-auto max-w-[80rem] px-4 pb-14 pt-4 sm:px-8">
        <GalleryGrid images={images.map(({ id, url, altText, caption, category }) => ({ id, url, altText, caption, category }))} />
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-cream/60 px-6 py-5">
          <p className="font-serif text-[1.4rem]">Like what you see?</p>
          <div className="flex flex-wrap gap-3">
            <BookLink airbnbUrl={settings?.airbnbUrl} fallback="/pricing" className="btn btn-outline btn-sm">Check Pricing</BookLink>
            <BookLink airbnbUrl={settings?.airbnbUrl} fallback="/booking" className="btn btn-primary btn-sm">Enquire About Your Stay</BookLink>
          </div>
        </div>
      </div>
    </>
  );
}
