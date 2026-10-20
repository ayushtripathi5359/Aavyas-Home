import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Botanical } from "@/components/ui/icons";
import type { ContentValues } from "@/lib/content";
import { Hl } from "../brand";
import { Photo, type PhotoRef } from "./photo";
import { WatercolorOver, WatercolorUnder } from "./watercolor-edge";

/**
 * Compact editorial band. Desktop: the balcony photograph (~52% width) is painted onto the page — watercolour
 * pigment halo, a dry-brush mask with irregular feathered edges and a few washes bleeding past it — while the copy
 * sits vertically centred on the right beside one faint botanical line drawing. Phones: photograph first with a
 * simplified feathered edge, then the copy.
 */
export function AboutSection({ content, image }: { content: ContentValues; image: PhotoRef | null }) {
  return (
    <section className="relative overflow-hidden">
      <Botanical className="pointer-events-none absolute -right-6 top-1/2 hidden h-[19rem] -translate-y-1/2 rotate-[6deg] text-[#c6c7b4] min-[1280px]:block" />
      <div className="relative lg:min-h-[29.5rem]">
        <div className="relative mx-4 mt-6 aspect-[1.4] sm:mx-8 lg:absolute lg:inset-y-0 lg:left-0 lg:mx-0 lg:mt-0 lg:aspect-auto lg:w-[52%]">
          <WatercolorUnder />
          <div className="absolute inset-0 overflow-hidden mask-wc">
            <Photo img={image} sizes="(min-width:1024px) 52vw, 100vw" />
          </div>
          <WatercolorOver />
        </div>
        <div className="relative mx-auto flex max-w-[90rem] items-center px-4 pb-8 pt-7 sm:px-8 lg:min-h-[29.5rem] lg:py-0">
          <div className="lg:ml-[57%] lg:max-w-[27rem]">
            <p className="eyebrow">{content.eyebrow}</p>
            <h2 className="mt-3 text-[2.1rem] leading-[1.06] sm:text-[2.5rem] lg:text-[2.2rem] xl:text-[2.9rem]"><Hl text={content.heading} /></h2>
            <p className="mt-3.5 whitespace-pre-line text-[0.9rem] leading-[1.6] text-espresso/80">{content.body}</p>
            <Link href="/the-space" className="btn btn-primary mt-5 !min-h-12 !rounded-lg !px-6 text-[0.82rem] lg:!min-h-11">{content.cta}<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
