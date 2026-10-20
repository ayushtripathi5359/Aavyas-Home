"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { EXTRA_NAV, NAV } from "@/lib/nav";
import { BrandLogo } from "./brand";
import { BookLink } from "./book-link";

export function Header({ name, airbnbUrl }: { name: string; airbnbUrl?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const mobileLinks = [...NAV.slice(0, 2), ...EXTRA_NAV, ...NAV.slice(2)];

  return (
    <header className="sticky top-0 z-40 border-b border-beige/70 bg-ivory/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-8 lg:h-16 lg:px-14">
        <Link href="/" aria-label={`${name} — home`} className="shrink-0 max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2"><BrandLogo name={name} className="h-10 w-auto lg:h-[3.4rem]" /></Link>
        <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={`relative py-1.5 text-[0.82rem] transition-colors hover:text-terracotta ${isActive(n.href) ? "font-medium text-terracotta after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-terracotta" : "text-espresso/80"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <BookLink airbnbUrl={airbnbUrl} fallback="/booking" className="btn btn-primary hidden !min-h-9 !px-5 !text-[0.78rem] lg:inline-flex">Book Your Stay <ArrowRight className="h-4 w-4" aria-hidden /></BookLink>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-espresso hover:bg-beige/50 max-lg:ml-auto lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="absolute inset-x-0 top-full border-t border-beige bg-ivory shadow-lg lg:hidden">
          <ul className="container-page flex flex-col gap-0.5 py-3">
            {mobileLinks.map((n) => (
              <li key={n.href}>
                {n.href === "/pricing" ? (
                  <BookLink airbnbUrl={airbnbUrl} fallback="/pricing" className="block rounded-md px-3 py-2.5 text-[0.95rem]">{n.label}</BookLink>
                ) : (
                  <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`block rounded-md px-3 py-2.5 text-[0.95rem] ${isActive(n.href) ? "bg-beige/60 text-terracotta" : ""}`}>{n.label}</Link>
                )}
              </li>
            ))}
            <li className="pb-3 pt-2"><BookLink airbnbUrl={airbnbUrl} fallback="/booking" className="btn btn-primary w-full">Book Your Stay</BookLink></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
