import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { BookLink } from "@/components/public/book-link";
import { InstagramIcon } from "@/components/public/brand";
import { GENERIC_WA_TEXT, getSettings, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Aavya’s Home.",
  alternates: { canonical: "/contact" },
};

interface Method { icon: LucideIcon | typeof InstagramIcon; label: string; value: string; href: string; external?: boolean }

export default async function ContactPage() {
  const s = await getSettings();
  const wa = whatsappUrl(s?.whatsappNumber, GENERIC_WA_TEXT);
  const methods = [
    s?.phone && { icon: Phone, label: "Call us", value: s.phone, href: `tel:${s.phone.replace(/[^\d+]/g, "")}` },
    s?.contactEmail && { icon: Mail, label: "Email us", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    s?.instagramUrl && { icon: InstagramIcon, label: "Instagram", value: "@" + (s.instagramUrl.replace(/\/$/, "").split("/").pop()?.split("?")[0] ?? "instagram"), href: s.instagramUrl, external: true },
    wa && { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: wa, external: true },
    s?.address && { icon: MapPin, label: "Visit", value: s.address, href: s.mapsUrl ?? "/location", external: !!s.mapsUrl },
  ].filter(Boolean) as Method[];
  const times = [s?.checkInTime && ["Check-in", s.checkInTime], s?.checkOutTime && ["Check-out", s.checkOutTime]].filter(Boolean) as string[][];

  return (
    <>
      <PageHeader eyebrow="CONTACT" title="Let’s plan your stay" photo={{ url: "/photos/img_3388.jpg", position: "50% 38%" }}>
        <p>Ask us anything about the home or your dates. We’re happy to help.</p>
      </PageHeader>

      <div className="mx-auto grid max-w-[80rem] gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-14">
        <div className="min-w-0">
          {methods.length > 0 ? (
            <ul className="divide-y divide-beige overflow-hidden rounded-2xl border border-beige/80 bg-white/80 shadow-[0_14px_34px_-26px_rgba(36,33,31,.4)]">
              {methods.map(({ icon: Icon, label, value, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex min-h-[5rem] items-center gap-4 px-5 py-4 transition-colors hover:bg-cream/60 sm:px-6"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-beige/60 text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-white"><Icon className="h-5 w-5" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-olive-dark">{label}</span>
                      <span className="mt-0.5 block text-[1rem] leading-snug [overflow-wrap:anywhere]">{value}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-terracotta/70 transition-transform group-hover:translate-x-1" aria-hidden />
                    {external && <span className="sr-only"> (opens in a new tab)</span>}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-beige/70 bg-white/75 p-6">Please use the enquiry form and we will get back to you.</p>
          )}

          {times.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[0.9rem]">
              {times.map(([k, v]) => <li key={k} className="flex items-center gap-2"><Clock className="h-4 w-4 text-terracotta" aria-hidden /><span className="font-medium">{k}</span><span className="text-espresso/75">{v}</span></li>)}
            </ul>
          )}

          <div className="mt-8 rounded-2xl bg-cream/70 p-6 sm:p-8">
            <h2 className="text-[1.8rem] leading-tight">Ready to book?</h2>
            <p className="mt-2 max-w-md text-[0.9rem] leading-relaxed text-espresso/75">Send an enquiry with your dates and guest count. It doesn’t reserve the dates — we’ll reply with availability and a quote.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <BookLink airbnbUrl={s?.airbnbUrl} fallback="/booking" className="btn btn-primary">Enquire About Your Stay<ArrowRight className="h-4 w-4" aria-hidden /></BookLink>
              <BookLink airbnbUrl={s?.airbnbUrl} fallback="/pricing" className="btn btn-outline">Check Pricing</BookLink>
            </div>
          </div>
        </div>

        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="absolute inset-0 overflow-hidden mask-wc">
            <Image src="/photos/img_3382.jpg" alt="" fill sizes="40vw" className="object-cover" style={{ objectPosition: "50% 58%" }} />
          </div>
        </div>
      </div>
    </>
  );
}
