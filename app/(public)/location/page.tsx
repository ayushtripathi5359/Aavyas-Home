import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Navigation } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { getNearbyPlaces, getSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Location",
  description: "Where to find Aavya’s Home and what is nearby.",
  alternates: { canonical: "/location" },
};

export default async function LocationPage() {
  const [s, places] = await Promise.all([getSettings(), getNearbyPlaces()]);
  const lat = s?.latitude ? Number(s.latitude) : null;
  const lng = s?.longitude ? Number(s.longitude) : null;
  const hasCoords = lat !== null && lng !== null;
  const embed = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.006},${lng + 0.012},${lat + 0.006}&layer=mapnik&marker=${lat},${lng}`
    : null;
  const directions = hasCoords ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : s?.mapsUrl ?? null;
  const name = s?.propertyName ?? "Aavya’s Home";
  const times = [s?.checkInTime && ["Check-in", s.checkInTime], s?.checkOutTime && ["Check-out", s.checkOutTime]].filter(Boolean) as string[][];

  return (
    <>
      <PageHeader eyebrow="LOCATION" title="Find us" photo={{ url: "/photos/img_3392.jpg", position: "0% 40%", zoom: 1.35 }}>
        <p>Find your way to {name}. Directions open in Google Maps.</p>
      </PageHeader>

      <div className="mx-auto grid max-w-[80rem] gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:py-14">
        <div className="space-y-6">
          <section className="rounded-2xl border border-beige/70 bg-white/75 p-6 shadow-[0_10px_28px_-22px_rgba(36,33,31,.35)]">
            <h2 className="text-[1.6rem]">Address</h2>
            {s?.address ? (
              <p className="mt-3 flex gap-3 text-[0.95rem] leading-relaxed"><MapPin className="mt-1 h-5 w-5 shrink-0 text-terracotta" aria-hidden />{s.address}</p>
            ) : (
              <p className="mt-3 text-[0.9rem] text-espresso/75">The full address is shared with your enquiry confirmation. You can still open the pin below in Google Maps.</p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><Navigation className="h-4 w-4" aria-hidden />Get Directions</a>}
              {s?.mapsUrl && <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Open in Maps</a>}
            </div>
          </section>

          {times.length > 0 && (
            <section className="rounded-2xl border border-beige/70 bg-white/75 p-6">
              <h2 className="text-[1.6rem]">Arrival &amp; departure</h2>
              <ul className="mt-3 space-y-2 text-[0.92rem]">
                {times.map(([k, v]) => <li key={k} className="flex items-center gap-3"><Clock className="h-4 w-4 text-terracotta" aria-hidden /><span className="font-medium">{k}</span><span className="text-espresso/75">{v}</span></li>)}
              </ul>
            </section>
          )}

          <p className="text-[0.85rem] text-espresso/70">Questions about getting here? <Link href="/contact" className="font-medium text-terracotta hover:underline">Contact us <ArrowRight className="inline h-3.5 w-3.5" aria-hidden /></Link></p>
        </div>

        <div className="relative h-[22rem] overflow-hidden rounded-2xl bg-sage shadow-[0_18px_40px_-28px_rgba(36,33,31,.5)] sm:h-[28rem] lg:h-auto lg:min-h-[30rem]">
          {embed ? (
            <iframe title="Map showing the property location" src={embed} loading="lazy" className="absolute inset-0 h-full w-full border-0 [filter:grayscale(.6)_contrast(.95)_brightness(1.04)_sepia(.12)]" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e8eadf,#f4f4ee)]" aria-hidden />
          )}
          <div className="pointer-events-none absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-lg">
            <MapPin className="h-5 w-5 text-terracotta" aria-hidden />
            <span className="text-[0.85rem] font-semibold">{name}</span>
          </div>
        </div>
      </div>

      <section className="bg-sage/70">
        <div className="mx-auto max-w-[80rem] px-4 py-10 sm:px-8">
          <p className="eyebrow">NEARBY</p>
          <h2 className="mt-3 text-[2rem] leading-tight">What’s around</h2>
          {places.length === 0 ? (
            <p className="mt-4 max-w-md text-[0.9rem] text-espresso/75">We’ll share nearby places and travel times when you enquire.</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white/80 px-5 py-4">
                  <div><p className="font-serif text-[1.15rem]">{p.name}</p>{p.description && <p className="mt-0.5 text-[0.8rem] text-espresso/70">{p.description}</p>}</div>
                  {p.distance && <span className="shrink-0 rounded-full bg-beige/60 px-3 py-1 text-[0.72rem] text-olive-dark">{p.distance}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
