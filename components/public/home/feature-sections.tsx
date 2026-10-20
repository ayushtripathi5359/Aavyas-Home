import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hl } from "../brand";
import { Photo, type PhotoRef } from "./photo";

/** Warm band: copy on the left, a real bedroom photograph bleeding off the right edge with a torn-paper edge. */
export function BedroomFeature({ eyebrow, heading, body, cta, image, details }: {
  eyebrow: string; heading: string; body: string; cta: string; image: PhotoRef | null; details?: string[];
}) {
  const button = (cls: string) => <Link href="/rooms/bedroom" className={`btn btn-primary !px-6 ${cls}`}>{cta}<ArrowRight className="h-4 w-4" aria-hidden /></Link>;
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#f3e8da] via-[#f6eee2] to-ivory">
      <div className="relative lg:min-h-[24.5rem]">
        <div className="relative mx-auto flex max-w-[90rem] items-center px-4 pb-5 pt-8 sm:px-8 lg:min-h-[24.5rem] lg:py-0 lg:pl-16">
          <div className="lg:max-w-[24rem]">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-4 text-[2.2rem] leading-[1.08] sm:text-[2.9rem]"><Hl text={heading} /></h2>
            <p className="mt-4 text-[0.85rem] leading-[1.75] text-espresso/80">{body}</p>
            {details && details.length > 0 && <ul className="mt-3 space-y-1 text-[0.8rem] text-espresso/80">{details.map((d) => <li key={d}>{d}</li>)}</ul>}
            {button("mt-6 hidden lg:inline-flex")}
          </div>
        </div>
        <div className="relative mx-4 aspect-[1.3] overflow-hidden rounded-2xl sm:mx-8 lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:aspect-auto lg:w-[57%] lg:rounded-none mask-brush-l">
          <Photo img={image} sizes="(min-width:1024px) 57vw, 100vw" />
        </div>
        <div className="relative px-4 pb-8 pt-5 sm:px-8 lg:hidden">{button("")}</div>
      </div>
    </section>
  );
}
