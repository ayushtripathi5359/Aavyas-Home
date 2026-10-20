"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Photo, type PhotoRef } from "./photo";

export interface SpaceCard {
  slug: string;
  name: string;
  summary: string | null;
  image: PhotoRef | null;
}

/** One large feature card plus four equal cards. The arrows rotate which space is featured. */
export function SpacesGallery({ eyebrow, heading, spaces }: { eyebrow: string; heading: string; spaces: SpaceCard[] }) {
  const [active, setActive] = useState(0);
  if (spaces.length === 0) return null;
  const main = spaces[active] ?? spaces[0];
  const others = spaces.filter((_, i) => i !== active).slice(0, 4);
  const step = (d: number) => setActive((i) => (i + d + spaces.length) % spaces.length);

  return (
    <section className="mx-auto max-w-[80rem] px-4 py-8 sm:px-8 lg:py-10" aria-labelledby="spaces-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="spaces-h" className="mt-3 text-[2.2rem] leading-none sm:text-[2.6rem]">{heading}</h2>
        </div>
        <div className="hidden items-center gap-3 text-[0.78rem] lg:flex">
          <Link href="/gallery" className="mr-2 inline-flex items-center gap-1.5 font-medium text-espresso hover:text-terracotta">View Full Gallery <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
          <button type="button" onClick={() => step(-1)} aria-label="Previous space" className="flex h-10 w-10 items-center justify-center rounded-full bg-beige/70 text-espresso/70 hover:bg-beige"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => step(1)} aria-label="Next space" className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta-dark"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Phones: category pills choose the featured space */}
      <div role="tablist" aria-label="Spaces" className="mt-4 flex flex-wrap gap-2 lg:hidden">
        {spaces.map((sp, i) => (
          <button key={sp.slug} role="tab" aria-selected={i === active} onClick={() => setActive(i)}
            className={`rounded-full border px-4 py-1.5 text-[0.78rem] ${i === active ? "border-terracotta bg-terracotta text-white" : "border-beige bg-ivory"}`}>{sp.name}</button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_1fr] lg:gap-5" data-testid="spaces-grid">
        <Link href={`/rooms/${main.slug}`} className="group relative block min-h-[19rem] overflow-hidden rounded-2xl bg-cream lg:min-h-[28.5rem]">
          <Photo img={main.image} sizes="(min-width:1024px) 45vw, 100vw" className="transition-transform duration-700 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white">
            <div><h3 className="font-serif text-[1.7rem]">{main.name}</h3>{main.summary && <p className="mt-1 max-w-[17rem] text-[0.78rem] text-white/90">{main.summary}</p>}</div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-espresso"><ArrowRight className="h-4 w-4" aria-hidden /></span>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-4 lg:gap-5">
          {others.map((s) => (
            <Link key={s.slug} href={`/rooms/${s.slug}`} className="group relative block min-h-[10.5rem] overflow-hidden rounded-2xl bg-cream">
              <Photo img={s.image} sizes="(min-width:1024px) 22vw, 50vw" className="transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4 text-white">
                <h3 className="font-sans text-[1.05rem] font-semibold leading-tight">{s.name}</h3>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-espresso"><ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Link href="/gallery" className="btn btn-outline mt-5 w-full !border-beige !text-terracotta hover:!bg-beige/40 lg:hidden">View Full Gallery <ArrowRight className="h-4 w-4" aria-hidden /></Link>
    </section>
  );
}
