import Image from "next/image";
import { Botanical } from "@/components/ui/icons";

export interface HeaderPhoto { url: string; position?: string; zoom?: number; origin?: string }

/**
 * Shared page header: warm wash, small eyebrow, large serif title, intro text, leaf drawings and (desktop) one real
 * photograph painted softly into the top-right corner.
 */
export function PageHeader({ eyebrow, title, children, photo }: { eyebrow: string; title: string; children?: React.ReactNode; photo?: HeaderPhoto }) {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f6eee2_0%,#faf6ef_100%)]">
      <Botanical className="pointer-events-none absolute -left-6 top-6 hidden h-44 -rotate-6 text-olive/30 min-[1280px]:block" />
      <Botanical className="pointer-events-none absolute -right-6 top-4 hidden h-48 rotate-6 text-[#d9a07e]/40 min-[1280px]:block" />
      {photo && (
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-0 hidden h-[16rem] w-[30%] lg:block">
          <div className="absolute inset-0 overflow-hidden mask-wc opacity-90">
            <Image
              src={photo.url}
              alt=""
              fill
              sizes="30vw"
              className="object-cover"
              style={{ objectPosition: photo.position ?? "50% 50%", transform: `scale(${photo.zoom ?? 1})`, transformOrigin: photo.origin ?? photo.position ?? "50% 50%" }}
            />
          </div>
        </div>
      )}
      <header className="relative mx-auto max-w-[80rem] px-4 pb-10 pt-12 sm:px-8 lg:pt-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 text-[3.2rem] leading-none sm:text-[4.2rem]">{title}</h1>
        {children && <div className="mt-5 max-w-[30rem] text-[1.05rem] leading-relaxed text-espresso/75">{children}</div>}
      </header>
    </div>
  );
}
