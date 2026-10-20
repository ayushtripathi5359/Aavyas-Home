import { ArrowRight, MapPin } from "lucide-react";
import type { NearbyPlace, PropertySettings } from "@prisma/client";
import { Hl } from "../brand";

/** Pale-olive band. The map uses the owner's configured coordinates; nothing about the area is invented. */
export function LocationSection({ eyebrow, heading, body, settings, places }: {
  eyebrow: string; heading: string; body: string; settings: PropertySettings | null; places: NearbyPlace[];
}) {
  const lat = settings?.latitude ? Number(settings.latitude) : null;
  const lng = settings?.longitude ? Number(settings.longitude) : null;
  const embed = lat !== null && lng !== null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.006},${lng + 0.012},${lat + 0.006}&layer=mapnik&marker=${lat},${lng}`
    : null;
  if (!embed && !settings?.address && !settings?.mapsUrl && places.length === 0) return null;
  const name = settings?.propertyName ?? "Aavya’s Home";

  return (
    <section className="bg-sage" aria-labelledby="loc-h">
      <div className="mx-auto grid max-w-[80rem] items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:py-8">
        <div>
          <p className="eyebrow flex items-center gap-3 !tracking-[0.28em]">{eyebrow}<span className="h-px w-14 bg-olive/40" aria-hidden /></p>
          <h2 id="loc-h" className="mt-4 text-[1.85rem] leading-[1.12] sm:text-4xl"><Hl text={heading} /></h2>
          <p className="mt-3 max-w-[22rem] text-[0.8rem] leading-relaxed text-espresso/75">{body}</p>
          {settings?.address && <p className="mt-3 flex max-w-[22rem] gap-2 text-[0.8rem] text-espresso/85"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden />{settings.address}</p>}
          {settings?.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-6 !px-7">Get Directions<ArrowRight className="h-4 w-4" aria-hidden /></a>}
        </div>
        <div className="relative h-[18rem] overflow-hidden rounded-2xl bg-white/60 lg:h-[17rem]">
          {embed ? (
            <iframe title="Map showing the property location" src={embed} loading="lazy" className="absolute inset-0 h-full w-full border-0 [filter:grayscale(.6)_contrast(.95)_brightness(1.04)_sepia(.12)]" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e8eadf,#f4f4ee)]" aria-hidden />
          )}
          <div className="pointer-events-none absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-lg">
            <MapPin className="h-5 w-5 text-terracotta" aria-hidden />
            <span><span className="block text-[0.8rem] font-semibold">{name}</span>{settings?.address && <span className="block max-w-[14rem] truncate text-[0.65rem] text-espresso/60">{settings.address}</span>}</span>
          </div>
          {places.length > 0 && (
            <ul className="absolute inset-x-3 bottom-3 grid gap-2 sm:grid-cols-3">
              {places.slice(0, 3).map((p) => (
                <li key={p.id} className="rounded-xl bg-white/95 px-3 py-2.5 shadow-md">
                  <p className="text-[0.74rem] font-semibold">{p.name}</p>
                  {(p.distance || p.description) && <p className="text-[0.66rem] text-espresso/60">{p.distance ?? p.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
