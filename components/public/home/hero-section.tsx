import { Flower2, Leaf, CookingPot, BedDouble, Wifi, Sparkles, type LucideIcon } from "lucide-react";
import { SLOT_DEFAULTS } from "@/lib/photo-config";
import { todayInZone } from "@/lib/pricing/dates";
import type { ContentValues } from "@/lib/content";
import { Botanical } from "@/components/ui/icons";
import { Hl } from "../brand";
import { BookingSearch } from "./booking-search";
import { Photo, type PhotoRef } from "./photo";

function featureIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (/wi-?fi|internet/.test(l)) return Wifi;
  if (/kitchen|cook/.test(l)) return CookingPot;
  if (/balcon|garden/.test(l)) return Flower2;
  if (/interior|cozy|bed|room/.test(l)) return BedDouble;
  if (/peace|quiet|calm|location/.test(l)) return Leaf;
  return Sparkles;
}

/** Small terracotta line icon on a soft beige circle, label beneath. */
export function FeatureHighlights({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <ul className="mt-6 grid grid-cols-5 gap-1 sm:mt-7 sm:flex sm:max-w-[40rem] sm:flex-wrap sm:gap-x-7 sm:gap-y-4" aria-label="Highlights">
      {lines.map((l, idx) => {
        const Icon = featureIcon(l);
        return (
          <li key={l} className="flex flex-col items-center gap-1.5 text-center sm:w-[5.4rem] sm:gap-2">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full text-terracotta sm:h-[3.25rem] sm:w-[3.25rem] ${idx === lines.length - 1 && lines.length > 1 ? "bg-white shadow-[0_6px_16px_-8px_rgba(36,33,31,.45)]" : "bg-beige/55"}`}><Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden /></span>
            <span className="text-[0.62rem] leading-tight text-espresso/85 sm:text-[0.7rem]">{l}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Caption({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`absolute ${className}`}>
      <span className="absolute -inset-x-6 -inset-y-3 -rotate-2 rounded-[45%_55%_50%_50%/60%_55%_45%_40%] bg-ivory/85 blur-[3px]" aria-hidden />
      <p className="relative -rotate-2 font-script text-[1.5rem] leading-[1.1] text-espresso sm:text-[1.8rem]">{text} <span className="text-terracotta">♥</span></p>
    </div>
  );
}

export function HeroSection({ content, image, maxGuests, airbnbUrl }: { content: ContentValues; image: PhotoRef | null; maxGuests: number; airbnbUrl?: string | null }) {
  const highlights = content.highlights.split("\n").map((s) => s.trim()).filter(Boolean);
  const photo = image ?? { url: SLOT_DEFAULTS.heroMain, altText: "Cozy living room with a sofa, coffee table and framed wall art" };
  return (
    <section className="relative overflow-hidden bg-[#f8f2e8] lg:min-h-[38rem]">
      <Botanical className="pointer-events-none absolute -left-8 top-6 hidden h-44 -rotate-12 text-olive/30 xl:block" />
      <div className="mx-auto max-w-[90rem]">
        <div className="relative z-10 px-4 pb-10 pt-10 sm:px-8 lg:w-[56%] lg:pb-10 lg:pl-14 lg:pr-0 lg:pt-12">
          <p className="eyebrow !tracking-[0.28em]">{content.eyebrow}</p>
          <h1 className="mt-5 max-w-[30rem] text-[2.7rem] leading-[1.06] sm:text-[3.3rem] lg:text-[3.7rem]"><Hl text={content.headline} /></h1>
          <p className="mt-5 max-w-[26rem] text-[0.95rem] leading-[1.7] text-espresso/80">{content.description}</p>
          {/* Phones: the photograph sits between the intro and the search card */}
          <div className="relative mt-6 aspect-[1.3] overflow-hidden rounded-2xl lg:hidden">
            <Photo img={photo} sizes="100vw" priority />
            {content.caption && <Caption text={content.caption} className="bottom-5 right-6" />}
          </div>
          <div className="mt-6 max-w-[34rem] lg:mt-8 lg:max-w-[42rem] lg:pr-8"><BookingSearch today={todayInZone()} maxGuests={maxGuests} airbnbUrl={airbnbUrl} /></div>
          <FeatureHighlights lines={highlights} />
        </div>
      </div>
      {/* Photo bleeds to the right edge of the viewport at any screen width */}
      <div className="hidden lg:absolute lg:inset-y-0 lg:right-0 lg:block lg:w-[52%]">
        <div className="absolute inset-0 mask-hero">
          <Photo img={photo} sizes="50vw" priority />
        </div>
        {content.caption && <Caption text={content.caption} className="bottom-8 right-8" />}
      </div>
    </section>
  );
}
