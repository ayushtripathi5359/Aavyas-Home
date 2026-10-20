import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { PropertySettings } from "@prisma/client";
import { EXTRA_NAV, NAV } from "@/lib/nav";
import { GENERIC_WA_TEXT, whatsappUrl } from "@/lib/site";
import { BrandLogo, FacebookIcon, InstagramIcon } from "./brand";
import { BookLink } from "./book-link";

export function Footer({ settings, description, airbnbUrl }: { settings: PropertySettings | null; description: string; airbnbUrl?: string | null }) {
  const name = settings?.propertyName ?? "Aavya’s Home";
  const wa = whatsappUrl(settings?.whatsappNumber, GENERIC_WA_TEXT);
  const social = [
    settings?.instagramUrl && { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    settings?.facebookUrl && { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    wa && { href: wa, label: "WhatsApp", Icon: MessageCircle },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof InstagramIcon }[];
  const hasContact = settings?.phone || settings?.contactEmail || settings?.address;

  return (
    <footer className="border-t border-beige bg-ivory">
      <div className="mx-auto grid max-w-[80rem] gap-8 px-4 pb-8 pt-10 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1.3fr_0.8fr]">
        <div>
          <Link href="/" aria-label={`${name} — home`}><BrandLogo name={name} /></Link>
          <p className="mt-4 max-w-xs text-[0.8rem] leading-relaxed text-espresso/70">{description}</p>
        </div>
        <nav aria-label="Footer">
          <p className="text-[0.8rem] font-semibold">Quick Links</p>
          <ul className="mt-3 columns-2 gap-6 space-y-1.5 text-[0.78rem] text-espresso/75">
            {[...NAV, ...EXTRA_NAV].map((n) => <li key={n.href}>{n.href === "/pricing" ? <BookLink airbnbUrl={airbnbUrl} fallback="/pricing" className="hover:text-terracotta">{n.label}</BookLink> : <Link href={n.href} className="hover:text-terracotta">{n.label}</Link>}</li>)}
          </ul>
        </nav>
        <div>
          <p className="text-[0.8rem] font-semibold">Contact</p>
          <ul className="mt-3 space-y-2 text-[0.78rem] text-espresso/75">
            {settings?.phone && <li className="flex gap-2"><Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" aria-hidden /><a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a></li>}
            {settings?.contactEmail && <li className="flex gap-2"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" aria-hidden /><a href={`mailto:${settings.contactEmail}`} className="break-all">{settings.contactEmail}</a></li>}
            {settings?.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta" aria-hidden /><span>{settings.address}</span></li>}
            {!hasContact && <li>Contact details coming soon — use the <BookLink airbnbUrl={airbnbUrl} fallback="/booking" className="underline">booking page</BookLink>.</li>}
          </ul>
        </div>
        <div>
          <p className="text-[0.8rem] font-semibold">Follow Us</p>
          <ul className="mt-3 flex gap-2">
            {social.map(({ href, label, Icon }) => (
              <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full border border-espresso/60 transition-colors hover:border-terracotta hover:text-terracotta"><Icon className="h-4 w-4" /></a></li>
            ))}
            {social.length === 0 && <li className="text-[0.78rem] text-espresso/50">—</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-beige">
        <div className="mx-auto flex max-w-[80rem] flex-col gap-2 px-4 py-3.5 text-[0.7rem] text-espresso/60 sm:flex-row sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <p><Link href="/privacy-policy" className="hover:text-terracotta">Privacy</Link> · <Link href="/terms" className="hover:text-terracotta">Terms</Link></p>
        </div>
      </div>
    </footer>
  );
}
