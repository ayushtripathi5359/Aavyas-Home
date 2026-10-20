import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "../brand";
import { BookLink } from "../book-link";
import { Photo, type PhotoRef } from "./photo";

/** Phones: tall, centred and stacked over the photograph. Desktop: compact brand · message · actions bar. */
export function BookingBanner({ name, heading, body, image, airbnbUrl }: { name: string; heading: string; body: string; image: PhotoRef | null; airbnbUrl?: string | null }) {
  return (
    <section className="relative isolate flex min-h-[27rem] items-end overflow-hidden bg-espresso text-ivory lg:min-h-0 lg:items-center" aria-labelledby="banner-h">
      <Photo img={image} sizes="100vw" className="-z-20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#24211f]/90 via-[#24211f]/55 to-[#24211f]/20 lg:bg-[#24211f]/55 lg:bg-none" aria-hidden />
      <div className="mx-auto grid w-full max-w-[80rem] items-center gap-5 px-5 pb-8 pt-10 text-center sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:gap-12 lg:py-12 lg:text-left">
        <Link href="/" aria-label={`${name} — home`} className="justify-self-center lg:justify-self-start"><BrandLogo name={name} light tagline={false} /></Link>
        <div className="lg:text-center">
          <h2 id="banner-h" className="text-[1.8rem] leading-tight [text-shadow:0_1px_10px_rgba(0,0,0,.35)] sm:text-[1.9rem]">{heading}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[0.85rem] leading-relaxed text-ivory/90 lg:max-w-lg lg:text-[0.8rem]">{body}</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <BookLink airbnbUrl={airbnbUrl} fallback="/booking" className="btn bg-ivory !px-6 text-espresso hover:bg-white">Book Your Stay<ArrowRight className="h-4 w-4" aria-hidden /></BookLink>
          <BookLink airbnbUrl={airbnbUrl} fallback="/pricing" className="btn border border-ivory/60 bg-white/10 !px-6 text-ivory backdrop-blur-[2px] hover:bg-white/20">Check Pricing</BookLink>
        </div>
      </div>
    </section>
  );
}
