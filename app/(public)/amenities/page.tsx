import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AmenityIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/public/page-header";
import { amenityPhoto, amenityThumbStyle } from "@/lib/photo-config";
import { BookLink } from "@/components/public/book-link";
import { getEnabledAmenities, getSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Amenities",
  description: "Facilities available at Aavya’s Home.",
  alternates: { canonical: "/amenities" },
};

export default async function AmenitiesPage() {
  const [amenities, settings] = await Promise.all([getEnabledAmenities(), getSettings()]);
  return (
    <>
      <PageHeader eyebrow="FACILITIES" title="Amenities" photo={{ url: "/photos/img_3387.jpg", position: "50% 38%", zoom: 1.5, origin: "50% 30%" }}>
        <p>Enjoy a comfortable and hassle-free stay with essential amenities for your convenience.</p>
      </PageHeader>

      <div className="relative mx-auto max-w-[84rem] px-4 pb-16 pt-2 sm:px-8">
        {amenities.length === 0 ? (
          <p className="rounded-2xl border border-beige bg-white/70 p-6">Facility details are being updated. Please <BookLink airbnbUrl={settings?.airbnbUrl} fallback="/booking" className="text-terracotta underline">enquire</BookLink> for specifics.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="amenities-grid">
            {amenities.map((a) => {
              const photo = amenityPhoto(a.name);
              return (
                <li key={a.id} className="relative flex min-h-[7.5rem] items-center gap-4 overflow-hidden rounded-2xl border border-beige/70 bg-white/75 py-4 pl-5 pr-4 shadow-[0_10px_28px_-22px_rgba(36,33,31,.35)]">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-beige/60 text-terracotta">
                    <AmenityIcon name={a.icon} className="h-6 w-6" />
                  </span>
                  <div className={`min-w-0 flex-1 ${photo ? "pr-[34%]" : ""}`}>
                    <h2 className="text-[1.2rem] leading-tight">{a.name}</h2>
                    {a.description && <p className="mt-1.5 text-[0.82rem] leading-snug text-espresso/70">{a.description}</p>}
                  </div>
                  {photo && (
                    <div aria-hidden="true" className="absolute inset-y-2 right-2 w-[34%] overflow-hidden rounded-xl [mask-image:linear-gradient(to_right,transparent_0,#000_28%)]">
                      <Image src={photo.url} alt="" fill sizes="(min-width:1024px) 12vw, 30vw" className="object-cover" style={amenityThumbStyle(photo)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-10 text-center">
          <BookLink airbnbUrl={settings?.airbnbUrl} fallback="/booking" className="btn btn-primary">Enquire About Your Stay</BookLink>
        </div>
      </div>
    </>
  );
}
