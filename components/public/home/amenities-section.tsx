import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Amenity } from "@prisma/client";
import { AmenityIcon, Botanical } from "@/components/ui/icons";
import { Hl } from "../brand";

const FEATURED = 10;

/**
 * Up to 10 featured amenities in one evenly spaced row on wide desktops (equal columns), 5 columns on tablets,
 * 3 on phones. Leaves are absolutely positioned decoration only.
 */
export function AmenitiesSection({ eyebrow, heading, subtitle, amenities }: { eyebrow: string; heading: string; subtitle: string; amenities: Amenity[] }) {
  if (amenities.length === 0) return null;
  const shown = amenities.slice(0, FEATURED);
  return (
    <section className="relative overflow-hidden py-9 lg:py-10" aria-labelledby="amen-h">
      <Botanical className="pointer-events-none absolute -left-8 top-3 hidden h-40 -rotate-6 text-olive/35 min-[1440px]:block" />
      <Botanical className="pointer-events-none absolute -right-8 top-0 hidden h-44 rotate-12 text-olive/35 min-[1440px]:block" />
      <div className="relative mx-auto max-w-[80rem] px-4 sm:px-8">
        <div className="grid gap-3 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="amen-h" className="mt-3 text-[2rem] leading-[1.12] sm:text-[2.3rem]"><Hl text={heading} /></h2>
          </div>
          <p className="max-w-[20rem] text-[0.78rem] leading-relaxed text-espresso/75 lg:pb-1">{subtitle}</p>
        </div>
        <ul
          className="mt-7 grid grid-cols-3 gap-x-2 gap-y-6 max-md:[&>li:last-child:nth-child(3n+1)]:col-start-2 md:grid-cols-5 md:gap-x-3 md:gap-y-7 xl:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
          style={{ "--cols": shown.length } as React.CSSProperties}
        >
          {shown.map((a) => (
            <li key={a.id} className="flex flex-col items-center gap-2.5 text-center">
              <span className="flex h-[3.6rem] w-[3.6rem] shrink-0 items-center justify-center rounded-full bg-beige/60 text-terracotta">
                <AmenityIcon name={a.icon} className="h-[1.35rem] w-[1.35rem]" />
              </span>
              <span className="max-w-[7.5rem] text-balance text-[0.72rem] font-medium leading-snug text-espresso/85">{a.name}</span>
            </li>
          ))}
        </ul>
        {amenities.length > FEATURED && (
          <p className="mt-6 text-center">
            <Link href="/amenities" className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-terracotta hover:underline">
              View all amenities <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
